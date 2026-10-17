#!/usr/bin/env bash
# Testi skupnih funkcij lokalno/lib.sh (najnovejsi_arhiv, preveri_docker, preveri_vrata) in bin/lokalno.sh.
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck source=../lokalno/lib.sh
source lokalno/lib.sh

napaka() { echo "NEUSPEH: $1" >&2; exit 1; }

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

touch "$tmp/star arhiv.tar.gz" "$tmp/nov.tar.gz"
touch -t 202601010000 "$tmp/star arhiv.tar.gz"
izpis="$(najnovejsi_arhiv "$tmp")"
[ "$izpis" = "$tmp/nov.tar.gz" ] || napaka "najnovejsi_arhiv: dobil '$izpis'"
echo "OK: najnovejsi_arhiv izbere najnovejši arhiv"

# Presledek v imenu najnovejšega
touch -t 202602020000 "$tmp/star arhiv.tar.gz"
touch -t 202601010000 "$tmp/nov.tar.gz"
izpis="$(najnovejsi_arhiv "$tmp")"
[ "$izpis" = "$tmp/star arhiv.tar.gz" ] || napaka "najnovejsi_arhiv s presledkom: dobil '$izpis'"
echo "OK: najnovejsi_arhiv prenese presledek v imenu"

prazna="$(mktemp -d "$tmp/prazna.XXXXXX")"
if najnovejsi_arhiv "$prazna" >/dev/null; then napaka "najnovejsi_arhiv v prazni mapi bi moral vrniti 1"; fi
echo "OK: najnovejsi_arhiv v prazni mapi vrne 1"

docker() { return 1; }
if izpis="$(preveri_docker 2>&1)"; then napaka "preveri_docker bi moral vrniti 1"; fi
case "$izpis" in *"Docker ne teče"*) ;; *) napaka "preveri_docker: sporočilo '$izpis'";; esac
echo "OK: preveri_docker javi, da Docker ne teče"

# preveri_pripravljenost: dc je navidezen (izhod 2 = ni stanja, 3 = neveljaven JSON, sicer izpiše arhiv).
arhivi="$(mktemp -d "$tmp/arhivi.XXXXXX")"
dc() { return 2; }
if izpis="$(preveri_pripravljenost "$arhivi" 2>&1)"; then napaka "preveri_pripravljenost brez stanja bi moral vrniti 1"; fi
case "$izpis" in *"Najprej poženi bin/lokalno.sh obnovi"*) ;; *) napaka "preveri_pripravljenost brez stanja: '$izpis'";; esac
echo "OK: preveri_pripravljenost brez stanja vrne 1"

dc() { return 3; }
if izpis="$(preveri_pripravljenost "$arhivi" 2>&1)"; then napaka "preveri_pripravljenost z neveljavnim JSON bi moral vrniti 1"; fi
case "$izpis" in *"ni veljaven JSON"*"bin/lokalno.sh obnovi"*) ;; *) napaka "preveri_pripravljenost z neveljavnim JSON: '$izpis'";; esac
echo "OK: preveri_pripravljenost z neveljavnim JSON vrne 1"

touch -t 202601010000 "$arhivi/backup star.tar.gz"
touch -t 202602020000 "$arhivi/backup nov.tar.gz"
dc() { echo "backup star.tar.gz"; }
izpis="$(preveri_pripravljenost "$arhivi" 2>&1)" || napaka "preveri_pripravljenost z novejšim arhivom bi moral nadaljevati"
case "$izpis" in *"Opozorilo"*"backup nov.tar.gz"*) ;; *) napaka "preveri_pripravljenost z novejšim arhivom: '$izpis'";; esac
echo "OK: preveri_pripravljenost opozori na novejši arhiv in nadaljuje"

dc() { echo "backup nov.tar.gz"; }
izpis="$(preveri_pripravljenost "$arhivi" 2>&1)" || napaka "preveri_pripravljenost z najnovejšim arhivom bi moral vrniti 0"
[ -z "$izpis" ] || napaka "preveri_pripravljenost z najnovejšim arhivom ne izpiše nič: '$izpis'"
echo "OK: preveri_pripravljenost z najnovejšim arhivom je tiho"

# preveri_vrata: zaseden port je napaka le, če ga ne drži naš vsebnik vrata.
docker() { return 0; }
port_zaseden() { return 0; }
dc() { [ "$*" = "ps -q vrata" ] || napaka "preveri_vrata: nepričakovan klic dc $*"; }
if izpis="$(preveri_vrata 2>&1)"; then napaka "preveri_vrata z zasedenim portom bi moral vrniti 1"; fi
case "$izpis" in *"Port ${S59DGO_VRATA} je zaseden"*) ;; *) napaka "preveri_vrata: sporočilo '$izpis'";; esac
echo "OK: preveri_vrata javi zaseden port"

dc() { echo "abc123"; }
preveri_vrata || napaka "preveri_vrata: port drži naš vsebnik vrata, bi moral vrniti 0"
echo "OK: preveri_vrata sprejme port, ki ga drži vrata"

dc() { :; }
port_zaseden() { return 1; }
preveri_vrata || napaka "preveri_vrata s prostim portom bi moral vrniti 0"
echo "OK: preveri_vrata s prostim portom vrne 0"

port_zaseden() { return 0; }
preveri_docker || napaka "preveri_docker ne sme preverjati porta (dol, pobrisi)"
echo "OK: preveri_docker ne preverja porta"

# Celoten bin/lokalno.sh z navideznim docker in resnično zasedenim portom (BusyBox nc).
if command -v nc >/dev/null 2>&1; then
  dnevnik="$tmp/docker.log"
  docker() { echo "$*" >> "$S59DGO_DNEVNIK"; return 0; }
  export -f docker
  export S59DGO_DNEVNIK="$dnevnik"
  nc -lk -s 127.0.0.1 -p "$S59DGO_VRATA" -e true >/dev/null 2>&1 &
  nc_pid=$!
  trap 'kill "$nc_pid" 2>/dev/null || true; rm -rf "$tmp"' EXIT
  for _ in $(seq 1 50); do
    (exec 3<>"/dev/tcp/127.0.0.1/${S59DGO_VRATA}") 2>/dev/null && break
    sleep 0.1
  done
  izpis="$(bash bin/lokalno.sh dol 2>&1)" || napaka "bin/lokalno.sh dol z zasedenim portom: '$izpis'"
  grep -q 'compose .* --profile preverjanje down$' "$dnevnik" || napaka "bin/lokalno.sh dol ni poklical down: $(cat "$dnevnik")"
  echo "OK: bin/lokalno.sh dol ni blokiran, ko je port zaseden"
  if izpis="$(bash bin/lokalno.sh gor 2>&1)"; then napaka "bin/lokalno.sh gor z zasedenim portom bi moral vrniti 1"; fi
  case "$izpis" in *"je zaseden"*) ;; *) napaka "bin/lokalno.sh gor: sporočilo '$izpis'";; esac
  ! grep -q ' up ' "$dnevnik" || napaka "bin/lokalno.sh gor je kljub zasedenemu portu klical up"
  echo "OK: bin/lokalno.sh gor z zasedenim portom vrne 1"
  kill "$nc_pid" 2>/dev/null || true
fi
