---
name: s59dgo-generator-promptov
description: Spreminjanje in ponovna objava generatorja AI promptov za grafiko s59dgo (docs/orodja/s59dgo-prompti.html, artefakt na claude.ai) in usklajevanje z docs/ai-prompti-grafika.md. Uporabi vedno, ko uporabnik želi novo predlogo, format, element, orodje (Midjourney, ChatGPT, Ideogram, Flux …), popravek prompta ali predogleda, posodobitev artefakta generatorja, ali ko se spremeni dokument s predlogami promptov ali razmerja slik v temi – tudi če ne omeni besede »generator«.
---

# Generator promptov s59dgo

Ena HTML datoteka brez build koraka, ki deluje z dvoklikom in je objavljena kot zasebni artefakt **https://claude.ai/artifact/UMSHX2i8n54uMS5ALpKT2B** (zmožnost `downloads`). Vir predlog je `docs/ai-prompti-grafika.md`; orodje mora ostati z njim usklajeno.

## Zgradba datoteke

| Del | Vloga |
|---|---|
| `/* PISAVE:ZAČETEK */ … /* PISAVE:KONEC */` | base64 woff2 teme; nikoli ne urejaj ročno, regenerira `bin/prompti-pisave.sh` |
| `<script type="application/json" id="podatki">` | `bloki` (SLOG, SLOG_SVETLO, TIPO, NE, TEMNO), `elementi` (sonce, greben), `motivi`, `vrhovi`, `orodja`, `predloge` |
| `<script id="jedro">` | čiste funkcije brez DOM (`globalThis.S59DGO_JEDRO`: `privzeto`, `primer`, `sestavi`, `preveriUvoz` …) |
| `<script id="predogled-js">` | SVG shema iz `predloga.shema.elementi` |
| `<script id="vmesnik">` | obrazec, izhod, localStorage `s59dgo-prompti-v1`, izvoz/uvoz |

Predloga ima `besedilo.{en,sl}` z režami `{{id}}`. Reže: id polja, `{{N}}` (število vrstic), `{{<seznam>_N}}`, `{{<seznam>_mreza}}`, `{{motiv}}`, `{{dodatno}}`, `{{sonce}}`, `{{greben}}`, `{{format}}`, `{{ozadje}}`, `{{p:<poudarek>}}`. EN in SL morata uporabljati iste reže. Format ima `id, ime, ar` (Midjourney `--ar`), `w, h` (razmerje predogleda), `en, sl` in po želji `varno: [{x,y,w,h}]` v odstotkih (črtkani pasovi v predogledu).

## Kako urejati

- **Podatke** spreminjaj s kratko Python skripto, ki prebere JSON iz bloka `#podatki`, ga spremeni in zapiše nazaj (`json.dumps(…, ensure_ascii=False, indent=4)`) – ročno urejanje 2000 vrstic JSON-a v HTML-ju zlahka pokvari narekovaje.
- **Bloki §2 in motivi §3.2** morajo biti v orodju dobesedno enaki dokumentu; če spremeniš dokument, spremeni oboje.
- **Razmerja naslovnih slik** sledijo temi: kartice so vedno 20:13 (800×520), posamezna objava pokaže celo sliko, deljenje 1200×630. Ob spremembi `add_image_size` ali CSS kartic v temi posodobi format »Kartica 20:13«/»16:9« in §3 dokumenta.
- Novo vedenje jedra najprej pokrij s testom v `tests/prompti.test.mjs` (nad vrstico `// TESTI-NAPREJ`), ga glej pasti, nato popravi.

## Preverjanje

1. `node tests/prompti.test.mjs` (hitro lokalno) in nato `bin/test.sh` (Docker; vključuje `tests/test-prompti.php`, ki primerja podatke z dokumentom in pokritost rež).
2. V brskalniku: `cd docs/orodja && python3 -m http.server 8765`, odpri `http://localhost:8765/s59dgo-prompti.html`, preveri spremenjeno predlogo (»Izpolni s primerom«), predogled in konzolo. Po pregledu ustavi strežnik.

## Ponovna objava artefakta

```bash
bin/prompti-artefakt.sh <scratchpad>/s59dgo-prompti.html
```
Nato `Artifact` publish z `file_path` te kopije in `url: https://claude.ai/artifact/UMSHX2i8n54uMS5ALpKT2B` (iz druge seje najprej `action: read` tega URL-ja). Brez `capabilities`, da ostane `downloads`; brez `icon`. Datoteka v repozitoriju ostane popoln dokument z ovojem `<!doctype>…<body>` – kopija ga nima, ker ga doda artefakt.

## Znane odložene manjše napake (ponudi, če se uporabnik vrne)

Uvoz preverja tipe, ne dovoljenih vrednosti (prazen izbirnik po slabem uvozu); po uvozu je lahko vrstic manj od minimuma; besedilo `{{stolpec}}` v celici se zamenja; zgodnji klik »Izvozi« v artefaktu lahko javi »ni na voljo« (počakaj na `claude.use`); »with 1 rows«.
