#!/usr/bin/env bash
# Vstopna točka vsebnika brskalnik: http://localhost:8059 vodi v wp:80, nato zažene ukaz.
set -euo pipefail
socat TCP-LISTEN:8059,bind=127.0.0.1,fork,reuseaddr TCP:wp:80 &
exec "$@"
