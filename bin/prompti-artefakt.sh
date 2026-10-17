#!/usr/bin/env bash
# Pripravi kopijo docs/orodja/s59dgo-prompti.html za objavo kot artefakt na claude.ai.
# Artefakt sam doda ovoj <!doctype>/<html>/<head>/<body>, zato ga kopija nima; začne se pri <title>.
# Uporaba: bin/prompti-artefakt.sh <ciljna-datoteka.html>
set -euo pipefail
cd "$(dirname "$0")/.."
cilj="${1:?Uporaba: bin/prompti-artefakt.sh <ciljna-datoteka.html>}"
python3 - "$cilj" <<'PY'
import re, sys
h = open('docs/orodja/s59dgo-prompti.html', encoding='utf-8').read()
h = h[h.index('<title>'):]
h = h.replace('</style>\n</head>\n<body>\n', '</style>\n', 1)
h = re.sub(r'\n</body>\n</html>\n?$', '\n', h)
if re.search(r'<head>|<body>|<html|</body>|</html>', h):
    sys.exit('Ovoja ni bilo mogoče odstraniti – preveri začetek in konec datoteke.')
open(sys.argv[1], 'w', encoding='utf-8').write(h)
print(f'{sys.argv[1]}: {len(h)} znakov')
PY
