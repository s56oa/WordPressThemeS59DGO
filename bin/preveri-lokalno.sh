#!/usr/bin/env bash
# Preveri temo na lokalni kopiji produkcije (kontrole v lokalno/preverjanje/), poročilo v dist/preverjanje/.
set -euo pipefail
cd "$(dirname "$0")/.."
source lokalno/lib.sh

# Staro poročilo ne sme ostati, če preverjanje pade, preden zapiše novo.
rm -f dist/preverjanje/porocilo.html dist/preverjanje/najdbe.json

preveri_docker || exit 1
preveri_pripravljenost || exit 1
preveri_vrata || exit 1

dc up -d db wp vrata
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

# Vsi klici WP-CLI pred praznjenjem debug.log, da njihove vrstice ne pridejo v kontrolo 2.
echo "Pripravljam izdano verzijo teme za primerjavo …"
lokalno/pripravi-izdano.sh || { echo "Priprava teme s59dgo-izdana ni uspela." >&2; exit 1; }

# Kontrola 1: slike, ki jim je na produkciji manjkal izrez (posnetek stanja), lokalno regeneriraj,
# da se pokaže, ali kartica v mreži po »Regenerate Thumbnails« dobi izrez 800×520.
echo "Regeneriram manjkajoče izreze naslovnih slik …"
dc run --rm -T --user 33:33 -e HOME=/tmp cli sh -c '
  set -e
  kartica="$(php /lokalno-wp/brez-izrezov.php kartica)"
  deljenje="$(php /lokalno-wp/brez-izrezov.php deljenje)"
  [ -z "$kartica" ] || wp media regenerate $kartica --image_size=s59dgo-kartica --only-missing --yes --path=/var/www/html
  [ -z "$deljenje" ] || wp media regenerate $deljenje --image_size=s59dgo-deljenje --only-missing --yes --path=/var/www/html
' || { echo "Regeneracija izrezov ni uspela (wp media regenerate)." >&2; exit 1; }

echo "Odkrivam reprezentativne naslove …"
dc run --rm -T --user 33:33 -e HOME=/tmp cli sh -c '
  wp eval-file /lokalno-wp/naslovi.php --path=/var/www/html > /stanje/naslovi.json.tmp \
    && php -r "json_decode( (string) file_get_contents( \$argv[1] ), true, 512, JSON_THROW_ON_ERROR );" /stanje/naslovi.json.tmp \
    && mv /stanje/naslovi.json.tmp /stanje/naslovi.json' \
  || { echo "Odkrivanje naslovov ni uspelo (naslovi.php)." >&2; exit 1; }

dc exec -T --user 33:33 wp sh -c ': > /stanje/debug.log'

mkdir -p dist/preverjanje
dc --profile preverjanje up -d validator
# Gradnja je v predpomnilniku; spremembe Dockerfile ali vstop.sh se tako vedno uporabijo.
dc --profile preverjanje build brskalnik
izhod=0
dc --profile preverjanje run --rm -T brskalnik node /opt/preverjanje/src/preveri.mjs || izhod=$?
exit "$izhod"
