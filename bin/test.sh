#!/usr/bin/env bash
# Požene vse tests/test-*.php v Dockerju.
set -euo pipefail
cd "$(dirname "$0")/.."
docker run --rm -v "$PWD:/app:ro" -w /app php:8.3-cli sh -c '
  status=0
  for t in tests/test-*.php; do
    echo "== $t"
    php "$t" || status=1
  done
  exit $status'
