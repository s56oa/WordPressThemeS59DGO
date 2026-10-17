#!/usr/bin/env bash
# Generira Wordove predloge društva v dokumenti/predloge in primere v dokumenti/primeri.
#   bin/dokumenti.sh          generiraj predloge in primere
#   bin/dokumenti.sh --test   poženi pytest
#   bin/dokumenti.sh --viri   upodobi dokumenti/viri/greben.png iz greben.svg
#   bin/dokumenti.sh --pdf    pretvori vse primere in predloge v PDF predoglede (dist/dokumenti-pdf)
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p dist/.pip dokumenti/predloge dokumenti/primeri

python_v_dockerju() {
  docker run --rm \
    -v "$PWD:/delo" -v "$PWD/dist/.pip:/root/.cache/pip" \
    -w /delo/bin/dokumenti python:3.12-slim \
    sh -c "pip install -q -r zahteve.txt && $1"
}

case "${1:-}" in
  --test)
    python_v_dockerju "python -m pytest -q"
    ;;
  --viri)
    docker run --rm -v "$PWD/dokumenti/viri:/viri" -w /viri alpine:3.20 sh -c '
      apk add --no-cache rsvg-convert >/dev/null &&
      for svg in *.svg; do rsvg-convert -w 1600 "$svg" -o "${svg%.svg}.png"; done'
    ;;
  --pdf)
    mkdir -p dist/dokumenti-pdf
    docker run --rm -v "$PWD:/delo" -w /delo debian:bookworm-slim sh -c '
      apt-get update -qq >/dev/null &&
      apt-get install -y -qq libreoffice-writer fonts-liberation >/dev/null &&
      soffice --headless --convert-to pdf --outdir dist/dokumenti-pdf dokumenti/primeri/*.docx dokumenti/predloge/*.dotx >/dev/null'
    ls -1 dist/dokumenti-pdf
    ;;
  "")
    python_v_dockerju "python generiraj.py"
    ;;
  *)
    echo "Neznana zastavica: $1" >&2
    exit 2
    ;;
esac
