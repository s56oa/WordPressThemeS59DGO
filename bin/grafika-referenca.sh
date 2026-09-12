#!/usr/bin/env bash
# Upodobi vse docs/grafika-referenca/*.svg v PNG (rsvg-convert v Dockerju, s pisavama teme).
# Pango ne bere woff2, zato jih razpakiramo v ttf; Space Grotesk se prijavi kot »Space Grotesk Light«, zato alias.
set -euo pipefail
cd "$(dirname "$0")/.."
docker run --rm -v "$PWD/docs/grafika-referenca:/g" -v "$PWD/s59dgo/assets/fonts:/usr/share/fonts/s59dgo:ro" -w /g alpine:3.20 sh -c '
  apk add --no-cache rsvg-convert font-dejavu fontconfig woff2 >/dev/null &&
  mkdir -p /usr/share/fonts/ttf && for w in /usr/share/fonts/s59dgo/*.woff2; do woff2_decompress "$w" /usr/share/fonts/ttf/$(basename "${w%.woff2}").ttf >/dev/null 2>&1 || true; done &&
  mkdir -p /etc/fonts/conf.d && cat > /etc/fonts/conf.d/99-s59dgo.conf <<XML
<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig><alias binding="strong"><family>Space Grotesk</family><prefer><family>Space Grotesk Light</family></prefer></alias></fontconfig>
XML
  fc-cache -f >/dev/null &&
  for f in *.svg; do rsvg-convert "$f" -o "${f%.svg}.png"; done'
ls docs/grafika-referenca/*.png
