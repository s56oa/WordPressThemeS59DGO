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
    dc up -d db wp vrata
    echo "Lokalni WordPress: http://localhost:${S59DGO_VRATA}"
    ;;
  dol)
    dc down
    ;;
  odpri)
    open http://localhost:${S59DGO_VRATA}
    ;;
  pobrisi)
    read -r -p "Pobrišem vse lokalne podatke produkcije? [d/N] " odgovor
    if [ "$odgovor" = "d" ] || [ "$odgovor" = "D" ]; then
      dc down -v
    else
      echo "Preklicano."
    fi
    ;;
  obnovi)
    echo "Ukaz »obnovi« še ni izveden." >&2
    exit 1
    ;;
esac
