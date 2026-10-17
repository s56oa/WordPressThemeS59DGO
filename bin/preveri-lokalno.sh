#!/usr/bin/env bash
# Preveri temo na lokalni kopiji produkcije (kontrole v lokalno/preverjanje/), poročilo v dist/preverjanje/.
set -euo pipefail
cd "$(dirname "$0")/.."
source lokalno/lib.sh

preveri_docker || exit 1
preveri_pripravljenost || exit 1

dc up -d db wp
# WordPress mora odgovarjati, preden WP-CLI in kontrole začnejo.
pripravljen=""
for _ in $(seq 1 60); do
  if dc exec -T wp php -r 'exit( @file_get_contents( "http://localhost/wp-login.php" ) === false ? 1 : 0 );' >/dev/null 2>&1; then
    pripravljen=1
    break
  fi
  sleep 1
done
[ -n "$pripravljen" ] || { echo "WordPress se v 60 s ni odzval (dc logs wp)." >&2; exit 1; }

echo "Odkrivam reprezentativne naslove …"
# Vsi klici WP-CLI pred praznjenjem debug.log, da njihove vrstice ne pridejo v kontrolo 2.
dc run --rm -T --user 33:33 -e HOME=/tmp cli sh -c '
  wp eval-file /lokalno-wp/naslovi.php --path=/var/www/html > /stanje/naslovi.json.tmp \
    && php -r "json_decode( (string) file_get_contents( \$argv[1] ), true, 512, JSON_THROW_ON_ERROR );" /stanje/naslovi.json.tmp \
    && mv /stanje/naslovi.json.tmp /stanje/naslovi.json' \
  || { echo "Odkrivanje naslovov ni uspelo (naslovi.php)." >&2; exit 1; }

dc exec -T --user 33:33 wp sh -c ': > /stanje/debug.log'

mkdir -p dist/preverjanje
dc --profile preverjanje up -d validator
izhod=0
dc --profile preverjanje run --rm -T brskalnik node /opt/preverjanje/src/preveri.mjs || izhod=$?
exit "$izhod"
