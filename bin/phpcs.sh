#!/usr/bin/env bash
# PHP_CodeSniffer z WordPress Coding Standards v Dockerju (brez lokalne namestitve).
# Uporaba: bin/phpcs.sh [dodatni argumenti phpcs]   |   bin/phpcs.sh --fix  (phpcbf, popravi samodejno)
# Prvi zagon prenese pakete v imenovani volumen s59dgo-composer; naslednji so hitri.
set -euo pipefail
cd "$(dirname "$0")/.."
orodje=phpcs; nacin=ro
if [ "${1:-}" = "--fix" ]; then orodje=phpcbf; nacin=rw; shift; fi
docker run --rm \
  -v "$PWD:/app:$nacin" -w /app \
  -v s59dgo-composer:/tmp \
  -e COMPOSER_HOME=/tmp \
  composer:2 sh -c '
    if [ ! -x /tmp/vendor/bin/phpcs ]; then
      composer global config --no-plugins allow-plugins.dealerdirect/phpcodesniffer-composer-installer true -q &&
      composer global require --no-interaction -q wp-coding-standards/wpcs:3.4.1 phpcompatibility/phpcompatibility-wp:2.1.8
    fi
    /tmp/vendor/bin/'"$orodje"' --standard=phpcs.xml.dist "$@"' -- "$@"
