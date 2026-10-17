#!/usr/bin/env bash
# Vdela pisave teme kot base64 v docs/orodja/s59dgo-prompti.html (med /* PISAVE:ZAČETEK */ in /* PISAVE:KONEC */).
set -euo pipefail
cd "$(dirname "$0")/.."
docker run --rm -v "$PWD:/app" -w /app alpine:3.20 sh -c '
  set -e
  f=docs/orodja/s59dgo-prompti.html
  d=s59dgo/assets/fonts
  latin="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"
  ext="U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF"
  blok=$(mktemp)
  for spec in "Space Grotesk:space-grotesk:500" "Space Grotesk:space-grotesk:700" "IBM Plex Sans:ibm-plex-sans:400" "IBM Plex Sans:ibm-plex-sans:600"; do
    ime=${spec%%:*}; ostalo=${spec#*:}; dat=${ostalo%%:*}; rez=${ostalo#*:}
    for pod in latin latin-ext; do
      if [ "$pod" = latin ]; then obseg=$latin; else obseg=$ext; fi
      printf "@font-face{font-family:\"%s\";font-style:normal;font-weight:%s;font-display:swap;src:url(data:font/woff2;base64,%s) format(\"woff2\");unicode-range:%s}\n" \
        "$ime" "$rez" "$(base64 -w 0 "$d/$dat-$pod-$rez-normal.woff2")" "$obseg" >> "$blok"
    done
  done
  awk -v blok="$blok" "
    index(\$0, \"/* PISAVE:ZAČETEK */\") { print; while ((getline l < blok) > 0) print l; preskoci=1; next }
    index(\$0, \"/* PISAVE:KONEC */\") { preskoci=0 }
    !preskoci { print }
  " "$f" > "$f.novo"
  mv "$f.novo" "$f"
'
grep -c "src:url(data:font/woff2;base64," docs/orodja/s59dgo-prompti.html
