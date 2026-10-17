# Skupne funkcije za bin/lokalno.sh in bin/preveri-lokalno.sh (vključi z source).
# Predpostavlja, da je trenutna mapa koren repozitorija.

# Vrata na gostitelju, prek katerih je lokalni WordPress dosegljiv.
S59DGO_VRATA=8059

# Izpiše pot najnovejšega *.tar.gz v mapi (po času spremembe) ali vrne 1.
najnovejsi_arhiv() {
  local mapa="$1" f najnovejsi=""
  for f in "$mapa"/*.tar.gz; do
    [ -e "$f" ] || continue
    if [ -z "$najnovejsi" ] || [ "$f" -nt "$najnovejsi" ]; then
      najnovejsi="$f"
    fi
  done
  [ -n "$najnovejsi" ] || return 1
  printf '%s\n' "$najnovejsi"
}

# Vrne 1 s slovenskim sporočilom, če Docker ne teče ali je port 8059 zaseden.
preveri_docker() {
  if ! docker info >/dev/null 2>&1; then
    echo "Docker ne teče – zaženi Docker Desktop." >&2
    return 1
  fi
  # Zaseden port je napaka le, če ga ne drži že naš wp.
  if [ -z "$(dc ps -q wp 2>/dev/null)" ] && port_zaseden "$S59DGO_VRATA"; then
    echo "Port ${S59DGO_VRATA} je zaseden." >&2
    return 1
  fi
}

port_zaseden() {
  (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null
}

dc() {
  docker compose -p s59dgo-lokalno -f lokalno/docker-compose.yml "$@"
}

wpcli() {
  dc run --rm --user 33:33 cli wp "$@"
}

# Pred preverjanjem: obstaja veljaven /stanje/stanje-produkcije.json? Vrne 1 s
# sporočilom, če ga ni ali ni veljaven JSON; opozori, če je v mapi arhivov
# (privzeto prod_backups) novejši arhiv od obnovljenega, in nadaljuje.
preveri_pripravljenost() {
  local mapa="${1:-prod_backups}" arhiv koda=0 najnovejsi
  arhiv="$(dc run --rm -T --no-deps cli php -r '
    $pot = "/stanje/stanje-produkcije.json";
    if ( ! is_file( $pot ) ) { exit( 2 ); }
    try {
      $s = json_decode( (string) file_get_contents( $pot ), true, 512, JSON_THROW_ON_ERROR );
    } catch ( JsonException $e ) { exit( 3 ); }
    if ( ! is_array( $s ) ) { exit( 3 ); }
    echo isset( $s["arhiv"] ) ? $s["arhiv"] : "", "\n";' 2>/dev/null)" || koda=$?
  case "$koda" in
    0) ;;
    2) echo "Lokalna kopija še ni obnovljena. Najprej poženi bin/lokalno.sh obnovi" >&2; return 1 ;;
    3) echo "stanje-produkcije.json ni veljaven JSON (obnova ni uspela?). Najprej poženi bin/lokalno.sh obnovi" >&2; return 1 ;;
    *) echo "Stanja lokalne kopije ni mogoče prebrati (izhod ${koda}). Najprej poženi bin/lokalno.sh obnovi" >&2; return 1 ;;
  esac
  if najnovejsi="$(najnovejsi_arhiv "$mapa")" && [ "$(basename "$najnovejsi")" != "$arhiv" ]; then
    if [ ! -e "$mapa/$arhiv" ] || [ "$najnovejsi" -nt "$mapa/$arhiv" ]; then
      echo "Opozorilo: v ${mapa}/ je novejši arhiv $(basename "$najnovejsi") (lokalna kopija je iz ${arhiv:-neznanega arhiva}); za svežo kopijo poženi bin/lokalno.sh obnovi." >&2
    fi
  fi
  return 0
}
