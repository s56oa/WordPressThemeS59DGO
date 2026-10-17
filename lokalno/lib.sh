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
