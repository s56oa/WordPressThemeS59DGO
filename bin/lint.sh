#!/usr/bin/env bash
# Preveri sintakso vseh PHP datotek teme v Dockerju (lokalno ni PHP).
set -euo pipefail
cd "$(dirname "$0")/.."
if command -v node >/dev/null 2>&1; then
  node --check s59dgo/assets/js/navigation.js && echo "JS sintaksa v redu"
fi
docker run --rm -v "$PWD/s59dgo:/app:ro" -w /app php:8.3-cli sh -c '
  status=0
  out=$(find . -name "*.php" -print0 | sort -z | xargs -0 -n1 php -l 2>&1) || status=1
  [ "$status" -ne 0 ] && echo "$out" | grep -v "No syntax errors"
  [ "$status" -eq 0 ] && echo "PHP sintaksa v redu"
  exit $status'
