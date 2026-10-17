#!/usr/bin/env bash
# Vstopna točka vsebnika brskalnik: http://localhost:8059 vodi v wp:80, nato zažene ukaz.
set -euo pipefail
socat TCP-LISTEN:8059,bind=127.0.0.1,fork,reuseaddr TCP:wp:80 &
pid=$!
# Počakaj (do ~5 s), da socat posluša; če umre ali ne zasliši, javi napako.
for _ in $(seq 1 50); do
  if ! kill -0 "$pid" 2>/dev/null; then
    echo "Posredovanje localhost:8059 → wp:80 se ni zagnalo (socat se je ustavil)." >&2
    exit 1
  fi
  if (exec 3<>/dev/tcp/127.0.0.1/8059) 2>/dev/null; then
    exec "$@"
  fi
  sleep 0.1
done
echo "Posredovanje localhost:8059 → wp:80 se ni zagnalo (vrata ne poslušajo)." >&2
exit 1
