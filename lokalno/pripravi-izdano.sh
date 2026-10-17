#!/usr/bin/env bash
# Namesti zadnjo izdano verzijo teme (zadnji git tag) kot temo s59dgo-izdana v lokalni WordPress za primerjavo.
set -euo pipefail
cd "$(dirname "$0")/.."
source lokalno/lib.sh

tag="$(git describe --tags --abbrev=0)" || { echo "Ni git taga za izdano verzijo teme." >&2; exit 1; }
cilj=/var/www/html/wp-content/themes/s59dgo-izdana

zacasna="$(mktemp -d)"
trap 'rm -rf "$zacasna"' EXIT
git archive "$tag" s59dgo | tar -x -C "$zacasna"
mv "$zacasna/s59dgo" "$zacasna/s59dgo-izdana"

# Vsakič na novo: stara kopija se pobriše, nova dobi lastnika www-data.
dc exec -T wp rm -rf "$cilj"
dc cp "$zacasna/s59dgo-izdana" "wp:$cilj"
dc exec -T wp chown -R 33:33 "$cilj"

# Meni, logotip in Customizer naj veljajo tudi za izdano temo.
dc run --rm -T --user 33:33 -e HOME=/tmp cli sh -c '
  set -e
  mods="$(wp option get theme_mods_s59dgo --format=json --path=/var/www/html)"
  printf "%s" "$mods" | wp option update theme_mods_s59dgo-izdana --format=json --path=/var/www/html >/dev/null'
echo "Izdana verzija ${tag} je nameščena kot tema s59dgo-izdana."
