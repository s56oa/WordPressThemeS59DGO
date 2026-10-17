#!/usr/bin/env bash
# Požene vse tests/test-*.php in test jedra generatorja promptov v Dockerju.
set -euo pipefail
cd "$(dirname "$0")/.."
docker run --rm -v "$PWD:/app:ro" -w /app php:8.3-cli sh -c '
  status=0
  for t in tests/test-*.php; do
    echo "== $t"
    php "$t" || status=1
  done
  exit $status'
echo "== tests/prompti.test.mjs"
docker run --rm -v "$PWD:/app:ro" -w /app node:22-alpine node tests/prompti.test.mjs
echo "== tests/lokalno.test.sh"
docker run --rm -v "$PWD:/app:ro" -w /app bash:5.2 bash tests/lokalno.test.sh
