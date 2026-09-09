#!/usr/bin/env bash
# Lint + zip teme za nalaganje v WP administracijo.
set -euo pipefail
cd "$(dirname "$0")/.."
bin/lint.sh
bin/test.sh
bin/phpcs.sh -q
mkdir -p dist
rm -f dist/s59dgo.zip
zip -rq dist/s59dgo.zip s59dgo -x '*/.DS_Store' '*/.*'
echo "Ustvarjeno dist/s59dgo.zip ($(du -h dist/s59dgo.zip | cut -f1))"
