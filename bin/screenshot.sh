#!/usr/bin/env bash
# Upodobi bin/screenshot.svg v s59dgo/screenshot.png (1200×900) z rsvg-convert v Dockerju.
set -euo pipefail
cd "$(dirname "$0")/.."
docker run --rm -v "$PWD/bin:/in:ro" -v "$PWD/s59dgo:/out" -w /in alpine:3.20 sh -c '
  apk add --no-cache rsvg-convert font-dejavu >/dev/null &&
  rsvg-convert -w 1200 -h 900 screenshot.svg -o /out/screenshot.png'
sips -g pixelWidth -g pixelHeight s59dgo/screenshot.png
