#!/usr/bin/env bash
# Upravlja lokalno kopijo produkcije (Docker Compose): gor, dol, odpri, pobrisi.
set -euo pipefail
cd "$(dirname "$0")/.."
source lokalno/lib.sh

uporaba() {
  echo "Uporaba: bin/lokalno.sh <gor|dol|odpri|pobrisi|obnovi>" >&2
  exit 1
}

[ $# -ge 1 ] || uporaba
ukaz="$1"
case "$ukaz" in
  gor|dol|odpri|pobrisi|obnovi) ;;
  *) uporaba ;;
esac

preveri_docker || exit 1

case "$ukaz" in
  gor)
    preveri_vrata || exit 1
    dc up -d db wp vrata
    echo "Lokalni WordPress: http://localhost:${S59DGO_VRATA}"
    ;;
  dol)
    dc --profile preverjanje down
    ;;
  odpri)
    preveri_vrata || exit 1
    dc up -d db wp vrata
    open http://localhost:${S59DGO_VRATA}
    ;;
  pobrisi)
    read -r -p "Pobrišem vse lokalne podatke produkcije? [d/N] " odgovor
    if [ "$odgovor" = "d" ] || [ "$odgovor" = "D" ]; then
      dc --profile preverjanje down -v
    else
      echo "Preklicano."
    fi
    ;;
  obnovi)
    preveri_vrata || exit 1
    if [ $# -ge 2 ]; then
      arhiv="$2"
    else
      arhiv="$(najnovejsi_arhiv prod_backups)" || { echo "V prod_backups/ ni arhiva *.tar.gz." >&2; exit 1; }
    fi
    [ -f "$arhiv" ] || { echo "Arhiv ne obstaja: $arhiv" >&2; exit 1; }
    case "$(cd "$(dirname "$arhiv")" && pwd)" in
      "$PWD/prod_backups") ;;
      *) echo "Arhiv mora biti v prod_backups/: $arhiv" >&2; exit 1 ;;
    esac
    ime="$(basename "$arhiv")"

    verzija="$(dc run --rm -T --no-deps cli tar -xzOf "/backup/$ime" wp-includes/version.php \
      | sed -n "s/^\$wp_version = '\([^']*\)';.*/\1/p")"
    [ -n "$verzija" ] || { echo "V arhivu ni verzije jedra (wp-includes/version.php)." >&2; exit 1; }
    echo "Jedro WordPressa na produkciji: ${verzija}"

    # Med obnovo strani ne strežemo; baza mora biti pripravljena.
    dc stop wp vrata >/dev/null 2>&1 || true
    dc up -d db
    pripravljena=""
    for _ in $(seq 1 60); do
      if dc exec -T db healthcheck.sh --connect --innodb_initialized >/dev/null 2>&1; then
        pripravljena=1
        break
      fi
      sleep 1
    done
    [ -n "$pripravljena" ] || { echo "Baza se v 60 s ni zagnala (dc logs db)." >&2; exit 1; }

    # Volumna lahko začneta v lasti root; jedro iz prejšnje obnove pobrišemo.
    dc run --rm -T --no-deps --user 0:0 cli sh -c '
      find /var/www/html -mindepth 1 -maxdepth 1 ! -name wp-content -exec rm -rf {} +
      mkdir -p /var/www/html/wp-content/themes /var/www/html/wp-content/mu-plugins
      chown 33:33 /var/www/html /var/www/html/wp-content /var/www/html/wp-content/themes /var/www/html/wp-content/mu-plugins /stanje'

    dc run --rm -T --user 33:33 -e HOME=/tmp prenos wp core download --version="$verzija" --locale=sl_SI --force --skip-content --path=/var/www/html

    geslo="$(openssl rand -base64 24 | tr -d '/+=\n' | cut -c1-24)"
    dc run --rm -T --user 33:33 -e S59DGO_GESLO="$geslo" cli sh /lokalno/obnovi.sh "/backup/$ime"
    dc up -d wp vrata

    echo
    echo "Lokalni WordPress: http://localhost:${S59DGO_VRATA}/wp-admin"
    echo "Uporabnik: lokalni"
    echo "Geslo:     ${geslo}"
    ;;
esac
