# Načrt implementacije: Generator AI promptov za grafiko S59DGO

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ena HTML datoteka `docs/orodja/s59dgo-prompti.html`, ki iz 15 predlog v `docs/ai-prompti-grafika.md`, vpisanega besedila in izbranih elementov sestavi končen AI prompt (EN/SL, po orodjih), pokaže shematski predogled in shranjuje nastavitve; deluje brez povezave in je objavljena kot artefakt.

**Architecture:** Datoteka ima štiri dele: (1) `<script type="application/json" id="podatki">` z bloki, motivi in predlogami, (2) `<script id="jedro">` s čistimi funkcijami brez DOM-a (sestavljanje prompta, privzete vrednosti, primer, preverjanje uvoza), izpostavljenimi kot `globalThis.S59DGO_JEDRO`, (3) `<script id="predogled-js">` z izrisom SVG sheme (`window.S59DGO_PREDOGLED`), (4) `<script id="vmesnik">` z obrazcem, izhodom in shranjevanjem. Pisave so vdelane kot base64 med označevalcema, ki ju polni `bin/prompti-pisave.sh`. PHP test preverja usklajenost podatkov z dokumentom, Node test (v Dockerju) preverja jedro.

**Tech Stack:** HTML, CSS, vanilla JS (ES2020), brez knjižnic. Docker: `php:8.3-cli` (obstoječi testi), `node:22-alpine` (test jedra), `alpine:3.20` (vdelava pisav).

**Spec:** `docs/superpowers/specs/2026-10-17-s59dgo-prompt-generator-design.md`

## Global Constraints

- Vmesnik v slovenščini; prompt v EN ali SL; besedilo v sliki vedno tako, kot ga vpiše uporabnik (slovensko).
- Ena datoteka, brez zunanjih klicev, brez knjižnic, brez build koraka. Pisave le kot `data:font/woff2;base64,` med `/* PISAVE:ZAČETEK */` in `/* PISAVE:KONEC */`.
- Bloki `slog`, `tipo`, `ne` (EN in SL) so dobesedna kopija kodnih blokov §2.1–§2.4 dokumenta; motivi (ime, EN, SL) dobesedno iz tabele §3.2.
- Uporabnikovo besedilo nikoli prek `innerHTML`; v DOM samo `textContent` / `setAttribute`.
- `localStorage` ključ `s59dgo-prompti-v1`; vsak dostop v `try/catch`. Izvoz: `s59dgo-prompt-{id-predloge}-{YYYY-MM-DD}.json` z `"verzija": 1`.
- Barve vmesnika kot CSS spremenljivke na `:root`; temni način pod `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {…} }` in `:root[data-theme="dark"]`; `body` z izrecnim ozadjem. Na 375 px brez vodoravnega drsenja, 16 px stranski rob.
- `<title>Generator promptov S59DGO</title>`.
- Razredi CSS slovenski, BEM-podobni (`.obrazec__korak`, `.izhod__blok`, modifikator `--kopirano`).
- Commit sporočila v slovenščini, končajo se z `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Nič se ne potisne na GitHub brez odobritve.

**Odstopanji od speca (potrjeno v specu, popravljeno ob tem načrtu):** samopreverjanje vseh kombinacij teče kot Node test `tests/prompti.test.mjs` v `bin/test.sh` namesto ročnega `?test` v brskalniku; opozorilo o oranžni se sproži, ko je izbranih več kot en poudarek predloge (sonce se ne šteje).

## Review Focus

1. **Uvoz tuje ali poškodovane JSON datoteke** (napačni tipi, `"plasti": 7`, neznana predloga, vrstice kot nizi) – orodje ne sme pasti, neveljavne vrednosti nadomesti s privzetimi. Test v Task 4.
2. **Prazna ali izbrisana polja** (vse vrstice prazne, prazen naslov, prazen seznam ikon) – v promptu ne sme ostati `{{…}}`, `""` ali `()`; namesto besedila »an empty solid text bar« in opozorilo. Test v Task 4.
3. **Posebni znaki v besedilu** (`"`, `<b>`, `&`, šumniki) – v promptu dobesedno (narekovaji kot »«), v predogledu kot besedilo, ne HTML. Test v Task 4 (prompt) in ročni pregled v Task 6 (predogled).
4. **Shranjevanje nedosegljivo** (zasebno okno, `file://`, peskovnik artefakta) – orodje dela normalno, le brez spomina. Ročni pregled v Task 7.
5. **Prenos in odložišče v peskovniku artefakta** – »Kopiraj« ima nadomestno ročno označevanje; če prenos izvoza v artefaktu ne deluje, se naloži skill `artifact-capabilities` za zmožnost shranjevanja datotek. Ročni pregled v Task 8.

---

### Task 1: Ogrodje datoteke, vdelava pisav in osnovni testi

**Files:**
- Create: `docs/orodja/s59dgo-prompti.html`
- Create: `bin/prompti-pisave.sh`
- Create: `tests/test-prompti.php`
- Create: `tests/prompti.test.mjs`
- Modify: `bin/test.sh`
- Modify: `docs/superpowers/specs/2026-10-17-s59dgo-prompt-generator-design.md` (že popravljeno ob načrtu; preveri le, da je v commitu načrta)

**Interfaces:**
- Produces: element ID-ji, ki jih uporabljajo kasnejše naloge: `#predloga` (select), `#opis-predloge`, `#gumb-primer`, `#korak-besedilo`, `#polja`, `#korak-elementi`, `#elementi`, `input[name=jezik]` (radio `en`/`sl`), `#orodje` (select), `#tipo`, `#polje-tipo`, `#ne`, `#predogled` (svg), `#bloki-izhoda`, `#stevec`, `#opozorila`, `#gumb-izvozi`, `#gumb-ponastavi`, `#datoteka-uvoz`, `#stanje-datoteke`; skripte `#podatki`, `#jedro`, `#predogled-js`, `#vmesnik`.

- [ ] **Step 1: Zaženi Docker Desktop** (`open -a Docker`, počakaj, da `docker info` uspe).

- [ ] **Step 2: Napiši PHP test (pade, ker datoteke ni)**

`tests/test-prompti.php`:

```php
<?php
require __DIR__ . '/preveri.php';
$pot  = __DIR__ . '/../docs/orodja/s59dgo-prompti.html';
preveri( file_exists( $pot ), 'orodje docs/orodja/s59dgo-prompti.html obstaja' );
$html = file_get_contents( $pot );
preveri( false !== strpos( $html, '<title>Generator promptov S59DGO</title>' ), 'naslov strani' );
preveri( 1 === substr_count( $html, '/* PISAVE:ZAČETEK */' ) && 1 === substr_count( $html, '/* PISAVE:KONEC */' ), 'označevalca pisav' );
preveri( 8 === substr_count( $html, 'src:url(data:font/woff2;base64,' ), '8 vdelanih pisav' );
preveri( 1 === preg_match( '#<script type="application/json" id="podatki">(.*?)</script>#s', $html, $m ), 'blok podatkov' );
$p = json_decode( $m[1], true );
preveri( is_array( $p ) && 1 === $p['verzija'], 'podatki so veljaven JSON z verzijo 1' );
foreach ( array( 'jedro', 'predogled-js', 'vmesnik' ) as $id ) {
	preveri( false !== strpos( $html, '<script id="' . $id . '">' ), "skripta #{$id}" );
}
preveri( 0 === preg_match( '#(src|href)="https?://#', $html ), 'brez zunanjih virov' );
```

- [ ] **Step 3: Poženi in preveri, da pade**

Run: `docker run --rm -v "$PWD:/app:ro" -w /app php:8.3-cli php tests/test-prompti.php`
Expected: `NEUSPEH: orodje docs/orodja/s59dgo-prompti.html obstaja`

- [ ] **Step 4: Ustvari ogrodje HTML**

`docs/orodja/s59dgo-prompti.html`:

```html
<!doctype html>
<html lang="sl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Generator promptov S59DGO</title>
<style>
/* PISAVE:ZAČETEK */
/* PISAVE:KONEC */
:root{
  --ozadje:#eef3f8;--povrsina:#ffffff;--besedilo:#172433;--besedilo-2:#46586c;--tiha:#5f7590;
  --glava:#15304f;--glava-2:#1f4470;--glava-3:#2a5687;--glava-tiha:#b9d0e6;
  --poudarek:#d9702a;--poudarek-besedilo:#b0561a;--crta:#d3dfeb;--koda:#f7f9fc;--opozorilo:#fdf1e7;
  --naslovi:'Space Grotesk','Trebuchet MS',Arial,sans-serif;
  --telo:'IBM Plex Sans','Helvetica Neue',Arial,sans-serif;
  --mono:ui-monospace,Menlo,Consolas,monospace;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --ozadje:#0f1c2b;--povrsina:#152638;--besedilo:#dbe6f1;--besedilo-2:#b7c9db;--tiha:#8fa9c4;
    --glava:#0a1420;--glava-2:#152638;--glava-3:#1f4470;--glava-tiha:#8fa9c4;
    --poudarek:#f0955a;--poudarek-besedilo:#f0955a;--crta:#27405a;--koda:#0f1c2b;--opozorilo:#2a2218;
  }
}
:root[data-theme="dark"]{
  --ozadje:#0f1c2b;--povrsina:#152638;--besedilo:#dbe6f1;--besedilo-2:#b7c9db;--tiha:#8fa9c4;
  --glava:#0a1420;--glava-2:#152638;--glava-3:#1f4470;--glava-tiha:#8fa9c4;
  --poudarek:#f0955a;--poudarek-besedilo:#f0955a;--crta:#27405a;--koda:#0f1c2b;--opozorilo:#2a2218;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--ozadje);color:var(--besedilo);font-family:var(--telo);font-size:16px;line-height:1.55}
h1,h2,h3{font-family:var(--naslovi);line-height:1.15;letter-spacing:-0.01em;margin:0}
button,input,select,textarea{font:inherit;color:inherit}
[hidden]{display:none!important}
.ovoj{max-width:1240px;margin:0 auto;padding-inline:16px}
.trak{position:relative;background:var(--glava);color:#fff;padding:28px 0 76px;overflow:hidden}
.trak__oznaka{font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--glava-tiha);margin-bottom:8px}
.trak h1{font-size:clamp(28px,5vw,44px);font-weight:700}
.trak p{max-width:640px;color:var(--glava-tiha);margin:10px 0 0}
.trak__sonce{position:absolute;right:8%;top:30px;width:44px;height:44px;border-radius:50%;background:#d9702a}
.trak__greben{position:absolute;left:0;bottom:-1px;width:100%;height:60px;display:block;color:var(--ozadje)}
.postavitev{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px;padding-block:24px}
.obrazec{display:grid;gap:16px;align-content:start;min-width:0}
.obrazec__korak{background:var(--povrsina);border:1px solid var(--crta);border-radius:6px;padding:16px 18px}
.obrazec__korak h2{font-size:19px;font-weight:700;margin-bottom:12px;display:flex;gap:10px;align-items:center}
.obrazec__korak h2 span{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;background:var(--glava);color:#fff;font-size:14px}
.obrazec__glava{display:flex;gap:12px;align-items:end;flex-wrap:wrap}
.obrazec__glava .polje{flex:1 1 240px}
.opis{font-size:14px;color:var(--besedilo-2);margin:8px 0 0}
.polje{display:grid;gap:4px;margin-bottom:12px;min-width:0}
.polje:last-child{margin-bottom:0}
.polje label,legend,.oznaka{font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--tiha)}
input[type=text],select,textarea{width:100%;min-width:0;padding:8px 10px;border:1px solid var(--crta);border-radius:4px;background:var(--koda)}
textarea{resize:vertical}
input:focus-visible,select:focus-visible,textarea:focus-visible,button:focus-visible{outline:2px solid var(--poudarek);outline-offset:1px}
fieldset{border:0;padding:0;margin:0 0 12px;min-width:0}
legend{padding:0;margin-bottom:6px}
.vrstica{display:grid;grid-template-columns:repeat(var(--stolpcev),minmax(0,1fr)) auto;gap:6px;margin-bottom:6px}
.gumbi{display:flex;flex-wrap:wrap;gap:6px}
.gumbi legend{width:100%}
.gumbi label{cursor:pointer}
.gumbi input{position:absolute;opacity:0;pointer-events:none}
.gumbi span{display:inline-block;padding:6px 12px;border:1px solid var(--crta);border-radius:4px;font-size:14px;background:var(--koda)}
.gumbi input:checked+span{background:var(--glava);border-color:var(--glava);color:#fff}
.gumbi input:focus-visible+span{outline:2px solid var(--poudarek);outline-offset:1px}
.kljukice{display:flex;flex-wrap:wrap;gap:6px 16px}
.kljukice label{display:inline-flex;gap:6px;align-items:center;font-size:15px;cursor:pointer}
.kljukice input{accent-color:var(--poudarek);width:17px;height:17px}
.gumb{border:0;border-radius:4px;padding:7px 12px;background:var(--glava);color:#fff;font-family:var(--naslovi);font-weight:700;font-size:14px;cursor:pointer}
.gumb:hover{background:var(--poudarek-besedilo)}
.gumb--tih{background:transparent;color:var(--besedilo-2);border:1px solid var(--crta);font-family:var(--telo);font-weight:600}
.gumb--tih:hover{background:var(--koda);color:var(--besedilo)}
.gumb--kopirano{background:var(--poudarek-besedilo)}
.gumb:disabled{opacity:.45;cursor:not-allowed}
.izhod{position:sticky;top:16px;align-self:start;display:grid;gap:14px;min-width:0}
.predogled{margin:0;background:var(--povrsina);border:1px solid var(--crta);border-radius:6px;padding:12px}
.predogled svg{display:block;width:100%;height:auto;max-height:46vh;border-radius:3px}
.predogled figcaption{font-size:12px;color:var(--tiha);margin-top:6px}
.izhod__blok{background:var(--povrsina);border:1px solid var(--crta);border-radius:6px;overflow:hidden}
.izhod__glava{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 10px 8px 14px;border-bottom:1px solid var(--crta)}
.izhod__glava h3{font-size:15px}
.izhod pre{margin:0;padding:12px 14px;font-family:var(--mono);font-size:13px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere;max-height:40vh;overflow:auto;background:var(--koda)}
.stevec{font-size:12px;color:var(--tiha);margin:0;font-variant-numeric:tabular-nums}
.opozorila{margin:0;padding:10px 14px 10px 32px;background:var(--opozorilo);border-left:3px solid var(--poudarek);border-radius:4px;font-size:14px}
.noga{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;padding-block:8px 32px;font-size:13px;color:var(--tiha)}
.noga__besedilo{flex:1 1 320px}
.noga code{font-family:var(--mono)}
.uvoz{position:relative;overflow:hidden}
.uvoz input{position:absolute;inset:0;opacity:0;cursor:pointer}
@media (max-width:860px){
  .postavitev{grid-template-columns:minmax(0,1fr)}
  .izhod{position:static}
}
@media (prefers-reduced-motion:no-preference){.gumb{transition:background .15s}}
</style>
</head>
<body>
<header class="trak">
  <div class="ovoj">
    <div class="trak__oznaka">Radio klub Snežnik · S59DGO</div>
    <h1>Generator promptov za grafiko</h1>
    <p>Izberi vrsto grafike, vpiši besedilo in izberi elemente. Orodje sestavi prompt v slogu spletne strani s59dgo.org.</p>
  </div>
  <span class="trak__sonce" aria-hidden="true"></span>
  <svg class="trak__greben" viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60 L0 40 L100 32 L190 39 L280 21 L350 29 L440 15 L510 27 L590 7 L670 23 L740 15 L830 31 L910 19 L990 32 L1080 24 L1160 35 L1200 28 L1200 60 Z" fill="currentColor"/></svg>
</header>

<main class="ovoj postavitev">
  <form class="obrazec" id="obrazec" novalidate onsubmit="return false">
    <section class="obrazec__korak">
      <h2><span>1</span>Vrsta grafike</h2>
      <div class="obrazec__glava">
        <div class="polje"><label for="predloga">Predloga</label><select id="predloga"></select></div>
        <button type="button" class="gumb gumb--tih" id="gumb-primer">Izpolni s primerom</button>
      </div>
      <p class="opis" id="opis-predloge"></p>
    </section>
    <section class="obrazec__korak" id="korak-besedilo">
      <h2><span>2</span>Besedilo</h2>
      <div id="polja"></div>
    </section>
    <section class="obrazec__korak" id="korak-elementi">
      <h2><span>3</span>Elementi</h2>
      <div id="elementi"></div>
    </section>
    <section class="obrazec__korak">
      <h2><span>4</span>Izhod</h2>
      <fieldset class="gumbi">
        <legend>Jezik prompta</legend>
        <label><input type="radio" name="jezik" value="en" checked><span>Angleščina</span></label>
        <label><input type="radio" name="jezik" value="sl"><span>Slovenščina</span></label>
      </fieldset>
      <div class="polje"><label for="orodje">Ciljno orodje</label><select id="orodje"></select></div>
      <div class="kljukice">
        <label id="polje-tipo"><input type="checkbox" id="tipo" checked> Dodaj tipografski blok</label>
        <label><input type="checkbox" id="ne" checked> Dodaj seznam »izogibaj se«</label>
      </div>
    </section>
  </form>

  <aside class="izhod" aria-label="Rezultat">
    <figure class="predogled">
      <svg id="predogled" role="img" aria-label="Shema postavitve grafike" viewBox="0 0 1000 667"></svg>
      <figcaption>Shema postavitve, ne končna slika.</figcaption>
    </figure>
    <div id="bloki-izhoda"></div>
    <p class="stevec" id="stevec"></p>
    <ul class="opozorila" id="opozorila" hidden></ul>
  </aside>
</main>

<footer class="ovoj noga">
  <span class="noga__besedilo">Predloge iz <code>docs/ai-prompti-grafika.md</code> · tema s59dgo · nastavitve se shranijo v tem brskalniku.</span>
  <button type="button" class="gumb gumb--tih" id="gumb-izvozi">Izvozi nastavitve</button>
  <label class="gumb gumb--tih uvoz">Uvozi nastavitve<input type="file" id="datoteka-uvoz" accept=".json,application/json"></label>
  <button type="button" class="gumb gumb--tih" id="gumb-ponastavi">Ponastavi predlogo</button>
  <span id="stanje-datoteke" role="status"></span>
</footer>

<script type="application/json" id="podatki">
{"verzija": 1, "bloki": {}, "elementi": {}, "motivi": [], "vrhovi": [], "orodja": {}, "predloge": []}
</script>
<script id="jedro">
(function (koren) {
  'use strict';
  koren.S59DGO_JEDRO = {};
})(globalThis);
</script>
<script id="predogled-js">
(function () {
  'use strict';
  window.S59DGO_PREDOGLED = { izrisi: function () {} };
})();
</script>
<script id="vmesnik">
(function () {
  'use strict';
})();
</script>
</body>
</html>
```

- [ ] **Step 5: Napiši skripto za pisave**

`bin/prompti-pisave.sh`:

```bash
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
```

Run: `chmod +x bin/prompti-pisave.sh && bin/prompti-pisave.sh`
Expected: zadnja vrstica `8`. Ponovni zagon spet izpiše `8` (idempotentno).

- [ ] **Step 6: Napiši Node test jedra (za zdaj le nalaganje)**

`tests/prompti.test.mjs`:

```js
// Test jedra generatorja promptov: naloži #podatki in #jedro iz HTML in preveri sestavljanje.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../docs/orodja/s59dgo-prompti.html', import.meta.url), 'utf8');
const P = JSON.parse(html.match(/<script type="application\/json" id="podatki">([\s\S]*?)<\/script>/)[1]);
const ctx = {};
vm.createContext(ctx);
vm.runInContext(html.match(/<script id="jedro">([\s\S]*?)<\/script>/)[1], ctx);
const J = ctx.S59DGO_JEDRO;

let stevilo = 0;
function ok(pogoj, sporocilo) { assert.ok(pogoj, sporocilo); stevilo++; }
ok(J && typeof J === 'object', 'jedro je naloženo');

// TESTI-NAPREJ (naslednje naloge dodajo teste nad to vrstico)
console.log('OK: prompti.test.mjs, ' + stevilo + ' preverjanj');
```

- [ ] **Step 7: Dodaj Node test v `bin/test.sh`**

Na konec `bin/test.sh` dodaj:

```bash
echo "== tests/prompti.test.mjs"
docker run --rm -v "$PWD:/app:ro" -w /app node:22-alpine node tests/prompti.test.mjs
```

- [ ] **Step 8: Poženi vse teste**

Run: `bin/test.sh`
Expected: vsi obstoječi PHP testi `OK`, `tests/test-prompti.php` vse `OK`, zadnja vrstica `OK: prompti.test.mjs, 1 preverjanj`.

- [ ] **Step 9: Commit**

```bash
git add docs/orodja/s59dgo-prompti.html bin/prompti-pisave.sh bin/test.sh tests/test-prompti.php tests/prompti.test.mjs
git commit -m "Generator promptov: ogrodje, vdelane pisave in testi

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Skupni podatki – bloki, elementi, motivi, vrhovi, orodja

**Files:**
- Modify: `docs/orodja/s59dgo-prompti.html` (blok `#podatki`)
- Test: `tests/test-prompti.php`

**Interfaces:**
- Produces (oblika `P` = razčlenjen `#podatki`):
  - `P.bloki.{slog,slog_svetlo,tipo,ne,temno}.{en,sl}`: string
  - `P.elementi.sonce.{desno,levo,brez}.{ime,en,sl}`; `P.elementi.greben["2-temno"|"3-temno"|"2-svetlo"|"3-svetlo"].{en,sl}`
  - `P.motivi[]`: `{id, ime, motiv:{en,sl}, dodatno:{en,sl}}`, id-ji `dogodki, izobrazevanje, contests, vhf, zbori, clanarina, kamere, splosno`
  - `P.vrhovi[]`: `{id, ime, en, sl}`, id-ji `antena, jambor, stolp, kamera`
  - `P.orodja.{univerzalno,midjourney,chatgpt,ideogram,sd}`: `{ime, besedilo?:false, zakljucek?:{en,sl}, predpona?:string, negativ?:string[]}`

- [ ] **Step 1: Dodaj teste usklajenosti z dokumentom**

Na konec `tests/test-prompti.php` dodaj:

```php
$md = file_get_contents( __DIR__ . '/../docs/ai-prompti-grafika.md' );

/** Besedilo razdelka od »### {$st} « do naslednjega naslova ## ali ###. */
function prompti_razdelek( $md, $st ) {
	$z = strpos( $md, "\n### {$st} " );
	if ( false === $z ) {
		return '';
	}
	$k = preg_match( '/\n#{2,3} /', $md, $n, PREG_OFFSET_CAPTURE, $z + 5 ) ? $n[0][1] : strlen( $md );
	return substr( $md, $z, $k - $z );
}

/** Vsebine kodnih blokov ``` v besedilu. */
function prompti_kode( $besedilo ) {
	preg_match_all( '/```\n(.*?)\n```/s', $besedilo, $n );
	return $n[1];
}

$slog_en = prompti_kode( prompti_razdelek( $md, '2.1' ) );
$slog_sl = prompti_kode( prompti_razdelek( $md, '2.2' ) );
$tipo    = prompti_kode( prompti_razdelek( $md, '2.3' ) );
$ne      = prompti_kode( prompti_razdelek( $md, '2.4' ) );
preveri( $p['bloki']['slog']['en'] === $slog_en[0], 'blok SLOG EN = dokument §2.1' );
preveri( $p['bloki']['slog']['sl'] === $slog_sl[0], 'blok SLOG SL = dokument §2.2' );
preveri( $p['bloki']['tipo']['en'] === $tipo[0] && $p['bloki']['tipo']['sl'] === $tipo[1], 'blok TIPO = dokument §2.3' );
preveri( $p['bloki']['ne']['en'] === $ne[0] && $p['bloki']['ne']['sl'] === $ne[1], 'blok NE = dokument §2.4' );
$temno = prompti_kode( prompti_razdelek( $md, '2.5' ) );
preveri( $p['bloki']['temno']['en'] === $temno[0], 'blok TEMNO EN = dokument §2.5' );
preveri( '' !== $p['bloki']['temno']['sl'] && '' !== $p['bloki']['slog_svetlo']['en'] && '' !== $p['bloki']['slog_svetlo']['sl'], 'bloka TEMNO SL in SLOG_SVETLO nista prazna' );

$vrstice = array_values( array_filter( explode( "\n", prompti_razdelek( $md, '3.2' ) ), function ( $v ) {
	return 0 === strpos( $v, '| ' ) && false === strpos( $v, 'Kategorija' );
} ) );
preveri( 8 === count( $vrstice ) && 8 === count( $p['motivi'] ), '8 motivov v dokumentu in v orodju' );
foreach ( $vrstice as $i => $v ) {
	$c = array_map( 'trim', explode( '|', trim( $v, " |\n" ) ) );
	$m = $p['motivi'][ $i ];
	preveri( $m['ime'] === $c[0] && $m['motiv']['en'] === $c[1] && $m['motiv']['sl'] === $c[2], "motiv {$c[0]} = dokument §3.2" );
	preveri( '' !== $m['dodatno']['en'] && '' !== $m['dodatno']['sl'], "motiv {$c[0]} ima dodatni element EN in SL" );
}
foreach ( array( 'desno', 'levo', 'brez' ) as $k ) {
	preveri( isset( $p['elementi']['sonce'][ $k ]['en'], $p['elementi']['sonce'][ $k ]['sl'] ), "sonce {$k}" );
}
foreach ( array( '2-temno', '3-temno', '2-svetlo', '3-svetlo' ) as $k ) {
	preveri( isset( $p['elementi']['greben'][ $k ]['en'], $p['elementi']['greben'][ $k ]['sl'] ), "greben {$k}" );
}
preveri( array( 'univerzalno', 'midjourney', 'chatgpt', 'ideogram', 'sd' ) === array_keys( $p['orodja'] ), '5 orodij v pravem vrstnem redu' );
preveri( 4 === count( $p['vrhovi'] ), '4 motivi za vrh grebena' );
```

- [ ] **Step 2: Poženi in preveri, da pade**

Run: `docker run --rm -v "$PWD:/app:ro" -w /app php:8.3-cli php tests/test-prompti.php`
Expected: `NEUSPEH: blok SLOG EN = dokument §2.1`

- [ ] **Step 3: Napolni skupne podatke**

Podatke vstavi s skripto v scratchpadu (`$S` = scratchpad seje), ne ročno, da so bloki dobesedni.

1. Shrani JSON spodaj v `$S/podatki-osnova.json` (bloke izpolni skripta, predloge Task 3).
2. Shrani skripto `$S/vstavi-podatke.php`:

```php
<?php
// Uporaba: php vstavi-podatke.php <osnova.json> [predloge.json]
// Bloke vzame iz docs/ai-prompti-grafika.md, rezultat zapiše v blok #podatki orodja.
$md = file_get_contents( 'docs/ai-prompti-grafika.md' );
function r( $md, $s ) {
	$z = strpos( $md, "\n### $s " );
	$k = preg_match( '/\n#{2,3} /', $md, $n, PREG_OFFSET_CAPTURE, $z + 5 ) ? $n[0][1] : strlen( $md );
	return substr( $md, $z, $k - $z );
}
function k( $t ) {
	preg_match_all( '/```\n(.*?)\n```/s', $t, $n );
	return $n[1];
}
$p          = json_decode( file_get_contents( $argv[1] ), true );
$p['bloki'] = array(
	'slog'        => array( 'en' => k( r( $md, '2.1' ) )[0], 'sl' => k( r( $md, '2.2' ) )[0] ),
	'slog_svetlo' => array(
		'en' => 'Light variant: use off-white #eef3f8 as the sky/background instead of navy; ridge layers in ice blue #b9d0e6 (back), #2a5687 (middle) and deep navy #15304f (front); subjects in navy #15304f.',
		'sl' => 'Svetla različica: namesto temno modre uporabi umazano belo #eef3f8 kot nebo/ozadje; plasti grebena v ledeno modri #b9d0e6 (zadaj), #2a5687 (sredina) in temno modri #15304f (spredaj); predmeti v temno modri #15304f.',
	),
	'tipo'        => array( 'en' => k( r( $md, '2.3' ) )[0], 'sl' => k( r( $md, '2.3' ) )[1] ),
	'ne'          => array( 'en' => k( r( $md, '2.4' ) )[0], 'sl' => k( r( $md, '2.4' ) )[1] ),
	'temno'       => array(
		'en' => k( r( $md, '2.5' ) )[0],
		'sl' => 'Slika mora delovati na svetli podlagi #eef3f8 in na temni podlagi #0f1c2b. Uporabi samo srednje tone (#2a5687, #5f7590, #d9702a) in se izogibaj čisto beli ali zelo temno modri barvi polnil. Prosojno ozadje.',
	),
);
if ( isset( $argv[2] ) ) {
	$p['predloge'] = json_decode( file_get_contents( $argv[2] ), true );
	if ( ! is_array( $p['predloge'] ) ) {
		fwrite( STDERR, "predloge.json ni veljaven JSON\n" );
		exit( 1 );
	}
}
$json = json_encode( $p, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT );
$pot  = 'docs/orodja/s59dgo-prompti.html';
$html = file_get_contents( $pot );
$html = preg_replace_callback(
	'#(<script type="application/json" id="podatki">\n).*?(\n</script>)#s',
	function ( $m ) use ( $json ) {
		return $m[1] . $json . $m[2];
	},
	$html,
	1
);
file_put_contents( $pot, $html );
echo "podatki vstavljeni\n";
```

3. Poženi: `docker run --rm -v "$PWD:/app" -v "$S:/s:ro" -w /app php:8.3-cli php /s/vstavi-podatke.php /s/podatki-osnova.json` → `podatki vstavljeni`.

Vsebina `$S/podatki-osnova.json`:

```json
{
"verzija": 1,
"bloki": {},
"elementi": {
  "sonce": {
    "desno": {"ime": "Desno zgoraj", "en": "a small solid orange #d9702a sun disc top right", "sl": "majhen poln oranžen #d9702a sončni disk desno zgoraj"},
    "levo": {"ime": "Levo zgoraj", "en": "a small solid orange #d9702a sun disc top left", "sl": "majhen poln oranžen #d9702a sončni disk levo zgoraj"},
    "brez": {"ime": "Brez", "en": "no sun", "sl": "brez sonca"}
  },
  "greben": {
    "2-temno": {"en": "two layered angular low-poly ridge silhouettes of Snežnik in #1f4470 (back) and #2a5687 (front)", "sl": "dve plasti kotnih (low-poly) silhuet grebena Snežnika v #1f4470 (zadaj) in #2a5687 (spredaj)"},
    "3-temno": {"en": "three layered angular low-poly ridge silhouettes of Snežnik in ice blue #b9d0e6 (distant snowy ridge), #1f4470 (middle) and #2a5687 (front)", "sl": "tri plasti kotnih (low-poly) silhuet grebena Snežnika v ledeno modri #b9d0e6 (oddaljen zasnežen greben), #1f4470 (sredina) in #2a5687 (spredaj)"},
    "2-svetlo": {"en": "two layered angular low-poly ridge silhouettes of Snežnik in ice blue #b9d0e6 (back) and #2a5687 (front)", "sl": "dve plasti kotnih (low-poly) silhuet grebena Snežnika v ledeno modri #b9d0e6 (zadaj) in #2a5687 (spredaj)"},
    "3-svetlo": {"en": "three layered angular low-poly ridge silhouettes of Snežnik in ice blue #b9d0e6 (back), #2a5687 (middle) and deep navy #15304f (front)", "sl": "tri plasti kotnih (low-poly) silhuet grebena Snežnika v ledeno modri #b9d0e6 (zadaj), #2a5687 (sredina) in temno modri #15304f (spredaj)"}
  }
},
"motivi": [
  {"id": "dogodki", "ime": "Dogodki", "motiv": {"en": "a group of three simplified tents and a portable telescopic mast with a small Yagi antenna on a mountain meadow", "sl": "tri poenostavljeni šotori in prenosni teleskopski jambor z majhno Yagi anteno na gorskem travniku"}, "dodatno": {"en": "thin concentric radio-wave arcs in ice blue leaving the antenna", "sl": "tanki koncentrični loki radijskih valov v ledeno modri, ki izhajajo iz antene"}},
  {"id": "izobrazevanje", "ime": "Dogodki – izobraževanje", "motiv": {"en": "an open notebook, a morse key and a handheld transceiver laid flat, top-down view", "sl": "odprt zvezek, Morsejev ključ in ročna radijska postaja, pogled od zgoraj"}, "dodatno": {"en": "a row of morse dots and dashes in ice blue along the bottom", "sl": "vrsta Morsejevih pik in črt v ledeno modri ob dnu"}},
  {"id": "contests", "ime": "Contests", "motiv": {"en": "a tall lattice tower with stacked Yagi antennas, wave arcs spreading to both sides", "sl": "visok mrežasti stolp z zloženimi Yagi antenami, loki valov na obe strani"}, "dodatno": {"en": "a faint Maidenhead grid of thin lines in #1f4470 behind the tower", "sl": "rahla lokatorska mreža tankih črt v #1f4470 za stolpom"}},
  {"id": "vhf", "ime": "Contests – VHF/UHF", "motiv": {"en": "a mountain summit with a portable mast and a long directional antenna pointing to the horizon", "sl": "gorski vrh s prenosnim jamborom in dolgo usmerjeno anteno, obrnjeno proti obzorju"}, "dodatno": {"en": "a distant second ridge in #b9d0e6 as a snow line", "sl": "oddaljen drugi greben v #b9d0e6 kot snežna črta"}},
  {"id": "zbori", "ime": "Občni zbori", "motiv": {"en": "a long table seen from above with simplified chairs around it and a single microphone", "sl": "dolga miza od zgoraj s poenostavljenimi stoli okoli nje in enim mikrofonom"}, "dodatno": {"en": "a small calendar page icon in ice blue in the top left", "sl": "majhna ikona koledarskega lista v ledeno modri levo zgoraj"}},
  {"id": "clanarina", "ime": "Članarina", "motiv": {"en": "a stylized membership card with a rounded 6 px corner radius and a round emblem placeholder, floating over the ridge", "sl": "stilizirana članska kartica z zaobljenimi vogali (6 px) in okroglim praznim emblemom, ki lebdi nad grebenom"}, "dodatno": {"en": "three ice-blue dashes suggesting text lines on the card, no letters", "sl": "tri ledeno modre črtice kot vrstice besedila na kartici, brez črk"}},
  {"id": "kamere", "ime": "Spletne kamere / vreme", "motiv": {"en": "a weather camera on a short pole on a snowy summit, a wide view over layered ridges", "sl": "vremenska kamera na kratkem drogu na zasneženem vrhu, širok pogled čez plasti grebenov"}, "dodatno": {"en": "thin horizontal snow line in #eef3f8 at the summit", "sl": "tanka vodoravna snežna črta v #eef3f8 na vrhu"}},
  {"id": "splosno", "ime": "Splošno / novice", "motiv": {"en": "a single vertical antenna on the highest ridge peak with three wave arcs", "sl": "ena navpična antena na najvišjem vrhu grebena s tremi loki valov"}, "dodatno": {"en": "no additional elements", "sl": "brez dodatnih elementov"}}
],
"vrhovi": [
  {"id": "antena", "ime": "Navpična antena z loki valov", "en": "a single vertical antenna with three thin concentric wave arcs in ice blue #b9d0e6", "sl": "ena navpična antena s tremi tankimi koncentričnimi loki valov v ledeno modri #b9d0e6"},
  {"id": "jambor", "ime": "Prenosni jambor z Yagi anteno", "en": "a portable telescopic mast with a small Yagi antenna in ice blue #b9d0e6", "sl": "prenosni teleskopski jambor z majhno Yagi anteno v ledeno modri #b9d0e6"},
  {"id": "stolp", "ime": "Mrežasti stolp z Yagi antenami", "en": "a lattice tower with stacked Yagi antennas in ice blue #b9d0e6", "sl": "mrežasti stolp z zloženimi Yagi antenami v ledeno modri #b9d0e6"},
  {"id": "kamera", "ime": "Vremenska kamera na drogu", "en": "a weather camera on a short pole in ice blue #b9d0e6", "sl": "vremenska kamera na kratkem drogu v ledeno modri #b9d0e6"}
],
"orodja": {
  "univerzalno": {"ime": "Univerzalno"},
  "midjourney": {"ime": "Midjourney", "besedilo": false},
  "chatgpt": {"ime": "ChatGPT / Gemini", "zakljucek": {"en": "If a reference image is attached, follow its style (colors, flat shapes, ridge).", "sl": "Če je priložena referenčna slika, upoštevaj njen slog (barve, ploskovnost, greben)."}},
  "ideogram": {"ime": "Ideogram", "zakljucek": {"en": "Style: Design. Custom palette: #15304f #2a5687 #b9d0e6 #eef3f8 #d9702a", "sl": "Slog: Design. Paleta po meri: #15304f #2a5687 #b9d0e6 #eef3f8 #d9702a"}},
  "sd": {"ime": "Stable Diffusion / Flux", "besedilo": false, "predpona": "flat vector illustration, minimalist, solid colors, (no gradient:1.3)", "negativ": ["text", "watermark", "signature", "blurry", "noise", "jpeg artifacts", "photo", "realistic"]}
},
"predloge": []
}
```

`#podatki` mora biti po vstavitvi veljaven JSON (preveri test v Step 4).

- [ ] **Step 4: Poženi in preveri, da gre skozi**

Run: `docker run --rm -v "$PWD:/app:ro" -w /app php:8.3-cli php tests/test-prompti.php`
Expected: vse vrstice `OK`, tudi `motiv Članarina = dokument §3.2`.

- [ ] **Step 5: Commit**

```bash
git add docs/orodja/s59dgo-prompti.html tests/test-prompti.php
git commit -m "Generator promptov: skupni bloki, motivi in orodja iz dokumenta

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Podatki 15 predlog

**Files:**
- Modify: `docs/orodja/s59dgo-prompti.html` (`"predloge": []` v `#podatki`)
- Test: `tests/test-prompti.php`

**Interfaces:**
- Produces: `P.predloge[]` z obliko:
  - `id, razdelek, skupina, ime, opis` (string), `slog, tipo, sonce, greben` (bool)
  - `ozadja?: [{id, ime, en, sl, blok: null|"slog_svetlo"|"temno"}]` (prvi je privzet)
  - `formati: [{id, ime, ar, w, h, en, sl, varno?: [{x,y,w,h}]}]` (odstotki slike)
  - `polja: [Polje]`, kjer je `Polje.vrsta` ena od:
    - `besedilo` / `datum`: `{id, oznaka, vSliki, max, vrstic?, znakov?, namig?, privzeto?:{en,sl}}`
    - `vrstice`: `{id, oznaka, min, max, stolpci:[{id, oznaka, max}], vrstica:{en,sl}}` – vrstica uporablja `{{#}}` in `{{<id stolpca>}}`
    - `poudarek`: `{id, oznaka, vir, stolpec}`
    - `izbira`: `{id, oznaka, moznosti: "vrhovi" | [{id, ime, en, sl}], svoj: bool}`
    - `seznam`: `{id, oznaka, moznosti:[{id, ime, en, sl}], privzete:[id]}`
    - `motiv`: `{id:"motiv", oznaka}`
  - `poudarki?: [{id, ime, privzeto, da:{en,sl}, ne:{en,sl}}]`
  - `besedilo: {en, sl}` z režami `{{id polja}}`, `{{N}}`, `{{<seznam>_N}}`, `{{<seznam>_mreza}}`, `{{motiv}}`, `{{dodatno}}`, `{{sonce}}`, `{{greben}}`, `{{format}}`, `{{ozadje}}`, `{{p:<id poudarka>}}`
  - `shema: {ozadje?: barva, ozadja?: {<id ozadja>: barva}, elementi: [Element]}` – Element `t`: `pas, besedilo, staticno, znacka, vrstice, ploscice, koraki, motiv, pokal, krog, celice, greben, sonce` (pomen v Task 6)
  - `primer: {<id polja>: string | {en,sl} | string[][] | number | string[]}`

- [ ] **Step 1: Dodaj teste predlog**

Na konec `tests/test-prompti.php` dodaj:

```php
preg_match_all( '/^### ([3-6]\.\d) /m', $md, $n );
$razdelki = array_values( array_diff( array_unique( $n[1] ), array( '3.2', '3.3' ) ) );
$v_orodju = array_column( $p['predloge'], 'razdelek' );
sort( $razdelki );
sort( $v_orodju );
preveri( 15 === count( $razdelki ) && $razdelki === $v_orodju, 'vsak razdelek §3–§6 ima natanko eno predlogo (15)' );
preveri( count( $p['predloge'] ) === count( array_unique( array_column( $p['predloge'], 'id' ) ) ), 'id-ji predlog so enolični' );

foreach ( $p['predloge'] as $t ) {
	$id = $t['id'];
	preveri( ! empty( $t['formati'] ), "{$id}: ima vsaj en format" );
	foreach ( $t['formati'] as $f ) {
		preveri( isset( $f['id'], $f['ime'], $f['ar'], $f['w'], $f['h'], $f['en'], $f['sl'] ), "{$id}: format {$f['id']} je popoln" );
	}
	$dovoljene = array( 'format' );
	$obvezne   = array( 'format' );
	foreach ( array( 'sonce', 'greben' ) as $e ) {
		if ( ! empty( $t[ $e ] ) ) {
			$dovoljene[] = $e;
			$obvezne[]   = $e;
		}
	}
	if ( ! empty( $t['ozadja'] ) ) {
		$dovoljene[] = 'ozadje';
		$obvezne[]   = 'ozadje';
	}
	foreach ( isset( $t['poudarki'] ) ? $t['poudarki'] : array() as $x ) {
		$dovoljene[] = 'p:' . $x['id'];
		$obvezne[]   = 'p:' . $x['id'];
	}
	foreach ( $t['polja'] as $f ) {
		if ( 'motiv' === $f['vrsta'] ) {
			array_push( $dovoljene, 'motiv', 'dodatno' );
			array_push( $obvezne, 'motiv', 'dodatno' );
			continue;
		}
		$dovoljene[] = $f['id'];
		$obvezne[]   = $f['id'];
		if ( 'vrstice' === $f['vrsta'] ) {
			$dovoljene[] = 'N';
			$stolpci     = array_merge( array( '#' ), array_column( $f['stolpci'], 'id' ) );
			foreach ( array( 'en', 'sl' ) as $j ) {
				preg_match_all( '/\{\{([^}]+)\}\}/', $f['vrstica'][ $j ], $r );
				preveri( ! array_diff( $r[1], $stolpci ), "{$id}: vrstica {$j} uporablja le stolpce" );
			}
		}
		if ( 'seznam' === $f['vrsta'] ) {
			array_push( $dovoljene, $f['id'] . '_N', $f['id'] . '_mreza' );
		}
		if ( 'poudarek' === $f['vrsta'] ) {
			preveri( in_array( $f['vir'], array_column( $t['polja'], 'id' ), true ), "{$id}: poudarek kaže na obstoječe polje" );
		}
	}
	$po_jezikih = array();
	foreach ( array( 'en', 'sl' ) as $j ) {
		preveri( isset( $t['besedilo'][ $j ] ) && '' !== $t['besedilo'][ $j ], "{$id}: besedilo {$j}" );
		preg_match_all( '/\{\{([^}]+)\}\}/', $t['besedilo'][ $j ], $r );
		$rabljene         = array_values( array_unique( $r[1] ) );
		$po_jezikih[ $j ] = $rabljene;
		preveri( ! array_diff( $rabljene, $dovoljene ), "{$id} {$j}: vse reže imajo vir (" . implode( ',', array_diff( $rabljene, $dovoljene ) ) . ')' );
		preveri( ! array_diff( $obvezne, $rabljene ), "{$id} {$j}: vsa polja in elementi so uporabljeni (" . implode( ',', array_diff( $obvezne, $rabljene ) ) . ')' );
		preveri( false === strpos( preg_replace( '/\{\{[^}]+\}\}/', '', $t['besedilo'][ $j ] ), '{' ), "{$id} {$j}: brez starih {placeholderjev}" );
	}
	sort( $po_jezikih['en'] );
	sort( $po_jezikih['sl'] );
	preveri( $po_jezikih['en'] === $po_jezikih['sl'], "{$id}: EN in SL uporabljata iste reže" );
	preveri( isset( $t['shema']['elementi'] ) && is_array( $t['shema']['elementi'] ), "{$id}: ima shemo predogleda" );
}
```

- [ ] **Step 2: Poženi in preveri, da pade**

Run: `docker run --rm -v "$PWD:/app:ro" -w /app php:8.3-cli php tests/test-prompti.php`
Expected: `NEUSPEH: vsak razdelek §3–§6 ima natanko eno predlogo (15)`

- [ ] **Step 3: Vstavi predloge**

Shrani spodnji seznam kot `$S/predloge.json` (vrstni red = vrstni red v izbirniku) in ga vstavi s skripto iz Task 2:
`docker run --rm -v "$PWD:/app" -v "$S:/s:ro" -w /app php:8.3-cli php /s/vstavi-podatke.php /s/podatki-osnova.json /s/predloge.json` → `podatki vstavljeni`.

Vsebina `$S/predloge.json`:

```json
[
{"id": "naslovna", "razdelek": "3.1", "skupina": "Naslovne slike", "ime": "Naslovna slika objave",
 "opis": "Generiraj 3:2, nato obreži na 1600×1040. Motiv na sredini, ker WordPress reže z obeh strani. Brez besedila – naslov izpiše tema.",
 "slog": true, "tipo": false, "sonce": true, "greben": true,
 "ozadja": [
  {"id": "temno", "ime": "Temno", "en": "plenty of empty navy sky", "sl": "veliko praznega temno modrega neba", "blok": null},
  {"id": "svetlo", "ime": "Svetlo", "en": "plenty of empty light sky #eef3f8", "sl": "veliko praznega svetlega neba #eef3f8", "blok": "slog_svetlo"}],
 "formati": [{"id": "3:2", "ime": "3:2", "ar": "3:2", "w": 3, "h": 2, "en": "Landscape 3:2 aspect ratio", "sl": "Ležeče razmerje 3:2"}],
 "polja": [
  {"id": "tema", "vrsta": "besedilo", "oznaka": "Tema objave", "vSliki": false, "max": 120, "namig": "npr. rezultati tekmovanja IARU VHF", "privzeto": {"en": "the club's activities", "sl": "dejavnostih kluba"}},
  {"id": "motiv", "vrsta": "motiv", "oznaka": "Motiv"}],
 "besedilo": {
  "en": "Featured image for a blog post about {{tema}}. Composition: {{motiv}} as the central subject in the middle third of the image, {{greben}} across the bottom quarter, {{sonce}}, {{dodatno}}. {{format}}, subject centered so the image survives cropping on both sides, {{ozadje}}.",
  "sl": "Naslovna slika za objavo o {{tema}}. Kompozicija: {{motiv}} kot osrednji predmet v srednji tretjini slike, {{greben}} čez spodnjo četrtino, {{sonce}}, {{dodatno}}. {{format}}, motiv na sredini, da slika prenese rez na obeh straneh, {{ozadje}}."},
 "shema": {"elementi": [{"t": "sonce", "y": 16}, {"t": "greben", "od": 72, "do": 100}, {"t": "motiv", "x": 42, "y": 24, "w": 16, "h": 50, "barva": "auto"}]},
 "primer": {"tema": {"en": "the results of the IARU VHF contest", "sl": "rezultatih tekmovanja IARU VHF"}, "motiv": "contests"}},

{"id": "lestvica", "razdelek": "4.1", "skupina": "Infografike", "ime": "Lestvica rezultatov",
 "opis": "Pokončno 4:5, širina 2200 px za poravnavo »Široko«. Prvo mesto oranžno, ostali stolpci modri.",
 "slog": true, "tipo": true, "sonce": false, "greben": false,
 "formati": [{"id": "4:5", "ime": "4:5", "ar": "4:5", "w": 4, "h": 5, "en": "Portrait, aspect ratio 4:5", "sl": "Pokončno, razmerje 4:5"}],
 "polja": [
  {"id": "naslov", "vrsta": "besedilo", "oznaka": "Naslov", "vSliki": true, "max": 70, "vrstic": 2, "znakov": 30},
  {"id": "kategorija", "vrsta": "besedilo", "oznaka": "Kategorija (oznaka)", "vSliki": true, "max": 30},
  {"id": "vrstice", "vrsta": "vrstice", "oznaka": "Uvrstitve", "min": 2, "max": 10,
   "stolpci": [{"id": "klic", "oznaka": "Klicni znak", "max": 12}, {"id": "rezultat", "oznaka": "Rezultat", "max": 14}],
   "vrstica": {"en": "{{#}}. \"{{klic}}\" \"{{rezultat}}\"", "sl": "{{#}}. \"{{klic}}\" \"{{rezultat}}\""}}],
 "poudarki": [{"id": "prvo", "ime": "Prvo mesto oranžno", "privzeto": true,
  "da": {"en": "First place bar in sunset orange #d9702a, all other bars in #2a5687", "sl": "Stolpec prvega mesta v oranžni #d9702a, vsi ostali v #2a5687"},
  "ne": {"en": "All bars in #2a5687", "sl": "Vsi stolpci v #2a5687"}}],
 "besedilo": {
  "en": "Infographic: results leaderboard. Layout: a navy #15304f title band across the top with the text \"{{naslov}}\" in white bold and a small uppercase label \"{{kategorija}}\" in ice blue; a low angular ridge silhouette in #1f4470 along the bottom edge of the band. Below, a white #ffffff panel with {{N}} rows, each row a horizontal bar with the rank number in bold, the callsign in a geometric sans-serif and the score right-aligned, bar lengths proportional to the scores. Rows in order: {{vrstice}}. {{p:prvo}}, thin separators in #d3dfeb. Off-white #eef3f8 page background around the panel, 6 px rounded corners. {{format}}, wide margins.",
  "sl": "Infografika: lestvica rezultatov. Postavitev: temno modri #15304f naslovni trak čez vrh z besedilom \"{{naslov}}\" v beli krepki pisavi in majhno oznako v verzalkah \"{{kategorija}}\" v ledeno modri; nizka kotna silhueta grebena v #1f4470 ob spodnjem robu traku. Pod njim bela #ffffff plošča z {{N}} vrsticami, vsaka vrstica je vodoravni stolpec z uvrstitvijo v krepki pisavi, klicnim znakom v geometrijski pisavi brez serifov in desno poravnanim rezultatom, dolžine stolpcev sorazmerne z rezultati. Vrstice po vrsti: {{vrstice}}. {{p:prvo}}, tanke ločnice v #d3dfeb. Umazano belo #eef3f8 ozadje strani okoli plošče, vogali zaobljeni 6 px. {{format}}, široki robovi."},
 "shema": {"ozadje": "#eef3f8", "elementi": [
  {"t": "pas", "x": 0, "y": 0, "w": 100, "h": 22, "barva": "#15304f"},
  {"t": "greben", "od": 17, "do": 22, "barve": ["#1f4470"]},
  {"t": "besedilo", "polje": "kategorija", "x": 8, "y": 6, "v": 2.2, "barva": "#b9d0e6", "verzalke": true, "sirina": 84},
  {"t": "besedilo", "polje": "naslov", "x": 8, "y": 12, "v": 4.6, "barva": "#ffffff", "krepko": true, "pisava": "n", "sirina": 84, "vrstic": 2},
  {"t": "pas", "x": 6, "y": 26, "w": 88, "h": 68, "barva": "#ffffff", "r": 0.8},
  {"t": "vrstice", "polje": "vrstice", "x": 9, "y": 30, "w": 82, "h": 60, "palice": true, "poudarek": "prvo"}]},
 "primer": {"naslov": "Rezultati – Marconi Memorial VHF 2026", "kategorija": "SINGLE OP 144 MHz", "vrstice": [["S59DGO", "128 400"], ["S50C", "95 200"], ["S57O", "71 850"]]}},

{"id": "urnik", "razdelek": "4.2", "skupina": "Infografike", "ime": "Urnik dogodka / koledar tekmovanj",
 "opis": "Pokončno 4:5. Časovnica za en dogodek ali tabela za mesečni koledar tekmovanj; ključna postavka je oranžna.",
 "slog": true, "tipo": true, "sonce": false, "greben": false,
 "formati": [{"id": "4:5", "ime": "4:5", "ar": "4:5", "w": 4, "h": 5, "en": "Portrait 4:5", "sl": "Pokončno 4:5"}],
 "polja": [
  {"id": "naslov", "vrsta": "besedilo", "oznaka": "Naslov", "vSliki": true, "max": 70, "vrstic": 2, "znakov": 30},
  {"id": "datum", "vrsta": "datum", "oznaka": "Datum (oznaka)", "vSliki": true, "max": 40, "namig": "npr. SOB, 20. 6. 2026"},
  {"id": "oblika", "vrsta": "izbira", "oznaka": "Oblika", "svoj": false, "moznosti": [
   {"id": "casovnica", "ime": "Časovnica", "en": "a vertical timeline on a white panel: a thin vertical line in #d3dfeb on the left, one solid circle per item; each item has the time in bold navy on the left, the event name in dark navy #172433 and a one-line note in muted blue #5f7590", "sl": "navpična časovnica na beli plošči: tanka navpična črta v #d3dfeb na levi, en poln krog na postavko; vsaka postavka ima uro v krepki temno modri na levi, ime dogodka v temno modri #172433 in enovrstično opombo v tihi modri #5f7590"},
   {"id": "koledar", "ime": "Mesečni koledar", "en": "a table on a white panel, one row per item, the month or date as an uppercase label on the left, contest names as navy #15304f rounded pills with white text, notes as small muted labels in #5f7590", "sl": "tabela na beli plošči, ena vrstica na postavko, mesec ali datum kot oznaka v verzalkah na levi, imena tekmovanj kot temno modre #15304f zaobljene značke z belim besedilom, opombe kot majhne tihe oznake v #5f7590"}]},
  {"id": "vrstice", "vrsta": "vrstice", "oznaka": "Postavke", "min": 2, "max": 12,
   "stolpci": [{"id": "ura", "oznaka": "Ura / datum", "max": 16}, {"id": "dogodek", "oznaka": "Dogodek", "max": 40}, {"id": "opomba", "oznaka": "Opomba", "max": 50}],
   "vrstica": {"en": "\"{{ura}}\" \"{{dogodek}}\" (\"{{opomba}}\")", "sl": "\"{{ura}}\" \"{{dogodek}}\" (\"{{opomba}}\")"}},
  {"id": "kljucna", "vrsta": "poudarek", "oznaka": "Ključna postavka (oranžna)", "vir": "vrstice", "stolpec": "dogodek"}],
 "besedilo": {
  "en": "Infographic: event schedule. Layout: navy #15304f title band at the top with \"{{naslov}}\" in white bold and the date \"{{datum}}\" as a small uppercase ice-blue label. Below, {{oblika}}. Items ({{N}}) in order: {{vrstice}}. The key item \"{{kljucna}}\" is highlighted in orange #d9702a, all other markers in #2a5687. Small flat single-color icons in #2a5687 next to items where fitting: antenna, coffee cup, microphone, trophy. A low ridge silhouette in #d3dfeb at the very bottom. {{format}}, generous spacing.",
  "sl": "Infografika: urnik dogodka. Postavitev: temno modri #15304f naslovni trak zgoraj z \"{{naslov}}\" v beli krepki pisavi in datumom \"{{datum}}\" kot majhno ledeno modro oznako v verzalkah. Pod njim {{oblika}}. Postavke ({{N}}) po vrsti: {{vrstice}}. Ključna postavka \"{{kljucna}}\" je poudarjena v oranžni #d9702a, vse ostale oznake v #2a5687. Ob postavkah, kjer se ujema, majhne ploskovne enobarvne ikone v #2a5687: antena, skodelica kave, mikrofon, pokal. Nizka silhueta grebena v #d3dfeb čisto spodaj. {{format}}, zračen razmik."},
 "shema": {"ozadje": "#eef3f8", "elementi": [
  {"t": "pas", "x": 0, "y": 0, "w": 100, "h": 20, "barva": "#15304f"},
  {"t": "besedilo", "polje": "datum", "x": 8, "y": 6, "v": 2.2, "barva": "#b9d0e6", "verzalke": true, "sirina": 84},
  {"t": "besedilo", "polje": "naslov", "x": 8, "y": 12, "v": 4.6, "barva": "#ffffff", "krepko": true, "pisava": "n", "sirina": 84, "vrstic": 2},
  {"t": "pas", "x": 6, "y": 24, "w": 88, "h": 66, "barva": "#ffffff", "r": 0.8},
  {"t": "vrstice", "polje": "vrstice", "x": 9, "y": 28, "w": 82, "h": 58, "krogi": true, "poudarek": "kljucna"},
  {"t": "greben", "od": 93, "do": 100, "barve": ["#d3dfeb"]}]},
 "primer": {"naslov": "Field day na Sviščakih", "datum": "SOB, 20. 6. 2026", "vrstice": [["9:00", "Postavitev anten", ""], ["11:00", "Začetek dela", "144 in 432 MHz"], ["13:00", "Kosilo", ""], ["17:00", "Konec in pospravljanje", ""]], "kljucna": 1}},

{"id": "tehnicna", "razdelek": "4.3", "skupina": "Infografike", "ime": "Tehnična kartica (repetitor, frekvence)",
 "opis": "Ležeče 3:2. Ena bela kartica na temno modrem ozadju, seznam ključ–vrednost, ena vrednost oranžna.",
 "slog": true, "tipo": true, "sonce": true, "greben": false,
 "formati": [{"id": "3:2", "ime": "3:2", "ar": "3:2", "w": 3, "h": 2, "en": "Landscape 3:2", "sl": "Ležeče 3:2"}],
 "polja": [
  {"id": "naslov", "vrsta": "besedilo", "oznaka": "Naslov kartice", "vSliki": true, "max": 50, "vrstic": 1, "znakov": 28},
  {"id": "podnaslov", "vrsta": "besedilo", "oznaka": "Podnaslov (oznaka)", "vSliki": true, "max": 40},
  {"id": "vrstice", "vrsta": "vrstice", "oznaka": "Podatki", "min": 1, "max": 8,
   "stolpci": [{"id": "kljuc", "oznaka": "Ključ (npr. FREKVENCA)", "max": 16}, {"id": "vrednost", "oznaka": "Vrednost", "max": 24}],
   "vrstica": {"en": "\"{{kljuc}}\": \"{{vrednost}}\"", "sl": "\"{{kljuc}}\": \"{{vrednost}}\""}},
  {"id": "poudarek", "vrsta": "poudarek", "oznaka": "Poudarjena vrednost (oranžna)", "vir": "vrstice", "stolpec": "vrednost"}],
 "besedilo": {
  "en": "Technical info card. Layout: full navy #15304f background, a single white #ffffff card with 6 px rounded corners centered with wide margins. Card header: \"{{naslov}}\" in bold dark navy, under it an uppercase label \"{{podnaslov}}\" in muted blue #5f7590. Body: a two-column key–value list with {{N}} rows, keys as small uppercase labels, values in bold dark navy: {{vrstice}}. The value \"{{poudarek}}\" is highlighted in orange #b0561a. Right side of the card: a flat icon of a mast with a vertical antenna and three concentric wave arcs in #2a5687. Behind the card, low ridge silhouettes in #1f4470 and #2a5687 across the bottom of the navy background, {{sonce}}. {{format}}.",
  "sl": "Tehnična kartica. Postavitev: polno temno modro #15304f ozadje, ena bela #ffffff kartica z vogali 6 px na sredini s širokimi robovi. Glava kartice: \"{{naslov}}\" v krepki temno modri, pod njim oznaka v verzalkah \"{{podnaslov}}\" v tihi modri #5f7590. Telo: dvostolpčni seznam ključ–vrednost z {{N}} vrsticami, ključi kot majhne oznake v verzalkah, vrednosti v krepki temno modri: {{vrstice}}. Vrednost \"{{poudarek}}\" je poudarjena v oranžni #b0561a. Desna stran kartice: ploskovna ikona jambora z navpično anteno in tremi koncentričnimi loki valov v #2a5687. Za kartico nizke silhuete grebena v #1f4470 in #2a5687 čez spodnji del temno modrega ozadja, {{sonce}}. {{format}}."},
 "shema": {"ozadje": "#15304f", "elementi": [
  {"t": "sonce", "y": 12},
  {"t": "greben", "od": 76, "do": 100, "barve": ["#1f4470", "#2a5687"]},
  {"t": "pas", "x": 14, "y": 14, "w": 72, "h": 70, "barva": "#ffffff", "r": 0.8},
  {"t": "besedilo", "polje": "naslov", "x": 19, "y": 25, "v": 3.6, "barva": "#172433", "krepko": true, "pisava": "n", "sirina": 46},
  {"t": "besedilo", "polje": "podnaslov", "x": 19, "y": 31, "v": 1.8, "barva": "#5f7590", "verzalke": true, "sirina": 46},
  {"t": "vrstice", "polje": "vrstice", "x": 19, "y": 36, "w": 46, "h": 44, "kljucVrednost": true, "poudarek": "poudarek"},
  {"t": "motiv", "x": 68, "y": 30, "w": 12, "h": 40, "barva": "#2a5687"}]},
 "primer": {"naslov": "Klubski repetitor", "podnaslov": "PRIMER · 2 M", "vrstice": [["FREKVENCA", "145,6125 MHz"], ["ODMIK", "−600 kHz"], ["CTCSS", "123,0 Hz"], ["LOKATOR", "JN75FO"], ["NADM. VIŠINA", "1796 m"]], "poudarek": 0}},

{"id": "koraki", "razdelek": "4.4", "skupina": "Infografike", "ime": "Koraki (licenca, včlanitev)",
 "opis": "Ploščice s številkami, povezane s tanko črto. Vodoravno 3:2 ali navpično 4:5.",
 "slog": true, "tipo": true, "sonce": false, "greben": false,
 "formati": [
  {"id": "vodoravno", "ime": "Vodoravno 3:2", "ar": "3:2", "w": 3, "h": 2, "en": "Steps arranged horizontally in a row, landscape 3:2 aspect ratio", "sl": "Koraki razporejeni vodoravno v vrsti, ležeče razmerje 3:2"},
  {"id": "navpicno", "ime": "Navpično 4:5", "ar": "4:5", "w": 4, "h": 5, "en": "Steps arranged vertically, portrait 4:5 aspect ratio", "sl": "Koraki razporejeni navpično, pokončno razmerje 4:5"}],
 "polja": [
  {"id": "naslov", "vrsta": "besedilo", "oznaka": "Naslov", "vSliki": true, "max": 60, "vrstic": 2, "znakov": 32},
  {"id": "podnaslov", "vrsta": "besedilo", "oznaka": "Podnaslov", "vSliki": true, "max": 60},
  {"id": "vrstice", "vrsta": "vrstice", "oznaka": "Koraki", "min": 2, "max": 6,
   "stolpci": [{"id": "korak", "oznaka": "Naslov koraka", "max": 24}, {"id": "opis", "oznaka": "Opis", "max": 50}, {"id": "ikona", "oznaka": "Ikona (npr. knjiga)", "max": 24}],
   "vrstica": {"en": "step {{#}} \"{{korak}}\" – \"{{opis}}\" (icon: {{ikona}})", "sl": "korak {{#}} \"{{korak}}\" – \"{{opis}}\" (ikona: {{ikona}})"}}],
 "poudarki": [
  {"id": "puscice", "ime": "Oranžne puščice", "privzeto": true,
   "da": {"en": "Steps connected by a thin line in #d3dfeb with small orange #d9702a arrow heads", "sl": "Koraki povezani s tanko črto v #d3dfeb z majhnimi oranžnimi #d9702a puščicami"},
   "ne": {"en": "Steps connected by a thin line in #d3dfeb with small #2a5687 arrow heads", "sl": "Koraki povezani s tanko črto v #d3dfeb z majhnimi puščicami v #2a5687"}},
  {"id": "zadnja", "ime": "Zadnji korak z oranžnim robom", "privzeto": false,
   "da": {"en": "The final step tile has an orange #d9702a top border", "sl": "Zadnja ploščica ima oranžen #d9702a zgornji rob"},
   "ne": {"en": "All step tiles look the same", "sl": "Vse ploščice so enake"}}],
 "besedilo": {
  "en": "Step-by-step infographic: \"{{naslov}}\" in {{N}} steps. Layout: off-white #eef3f8 background, the title in bold dark navy #172433 at the top left with the subtitle \"{{podnaslov}}\" in muted blue #5f7590. {{format}}. Each step is a white #ffffff tile with 6 px rounded corners: a large step number in bold navy #15304f, a single-color flat icon in #2a5687, a short step title in bold and one line of description in dark navy. Steps: {{vrstice}}. {{p:puscice}}. {{p:zadnja}}. Layered ridge silhouettes in #b9d0e6 and #2a5687 along the bottom edge, wide margins.",
  "sl": "Infografika po korakih: \"{{naslov}}\" v {{N}} korakih. Postavitev: umazano belo #eef3f8 ozadje, naslov v krepki temno modri #172433 zgoraj levo s podnaslovom \"{{podnaslov}}\" v tihi modri #5f7590. {{format}}. Vsak korak je bela #ffffff ploščica z vogali 6 px: velika številka koraka v krepki temno modri #15304f, enobarvna ploskovna ikona v #2a5687, kratek naslov koraka v krepki pisavi in ena vrstica opisa v temno modri. Koraki: {{vrstice}}. {{p:puscice}}. {{p:zadnja}}. Plasti silhuet grebena v #b9d0e6 in #2a5687 ob spodnjem robu, široki robovi."},
 "shema": {"ozadje": "#eef3f8", "elementi": [
  {"t": "besedilo", "polje": "naslov", "x": 6, "y": 11, "v": 3.8, "barva": "#172433", "krepko": true, "pisava": "n", "sirina": 86, "vrstic": 2},
  {"t": "besedilo", "polje": "podnaslov", "x": 6, "y": 18, "v": 2, "barva": "#5f7590", "sirina": 86},
  {"t": "greben", "od": 86, "do": 100, "barve": ["#b9d0e6", "#2a5687"]},
  {"t": "koraki", "polje": "vrstice", "x": 6, "y": 23, "w": 88, "h": 58, "puscice": "puscice", "zadnja": "zadnja"}]},
 "primer": {"naslov": "Kako do radioamaterske licence", "podnaslov": "V štirih korakih", "vrstice": [["Tečaj", "Prijavi se na klubski tečaj", "knjiga"], ["Učenje", "Predpisi, tehnika, operaterstvo", "svinčnik"], ["Izpit", "Izpit pri AKOS", "diploma"], ["V eter", "Prva zveza s klubsko postajo", "radijska postaja"]]}},

{"id": "statistika", "razdelek": "4.5", "skupina": "Infografike", "ime": "Statistika kluba v ploščicah",
 "opis": "Mreža ploščic s številkami na temno modrem ozadju; natanko ena številka oranžna.",
 "slog": true, "tipo": true, "sonce": true, "greben": true,
 "formati": [
  {"id": "3:2", "ime": "Ležeče 3:2", "ar": "3:2", "w": 3, "h": 2, "en": "Landscape 3:2", "sl": "Ležeče 3:2"},
  {"id": "1:1", "ime": "Kvadrat 1:1", "ar": "1:1", "w": 1, "h": 1, "en": "Square 1:1", "sl": "Kvadrat 1:1"}],
 "polja": [
  {"id": "naslov", "vrsta": "besedilo", "oznaka": "Naslov", "vSliki": true, "max": 50, "vrstic": 1, "znakov": 30},
  {"id": "podnaslov", "vrsta": "besedilo", "oznaka": "Podnaslov", "vSliki": true, "max": 50},
  {"id": "vrstice", "vrsta": "vrstice", "oznaka": "Ploščice", "min": 2, "max": 8,
   "stolpci": [{"id": "stevilka", "oznaka": "Številka", "max": 10}, {"id": "oznaka", "oznaka": "Oznaka", "max": 28}],
   "vrstica": {"en": "\"{{stevilka}}\" \"{{oznaka}}\"", "sl": "\"{{stevilka}}\" \"{{oznaka}}\""}},
  {"id": "poudarek", "vrsta": "poudarek", "oznaka": "Oranžna ploščica", "vir": "vrstice", "stolpec": "oznaka"}],
 "besedilo": {
  "en": "Stat tiles infographic: \"{{naslov}}\". Layout: navy #15304f background with {{greben}} across the bottom third and {{sonce}}. Title in white bold at the top left, subtitle \"{{podnaslov}}\" in ice blue #b9d0e6. A grid of {{N}} tiles in 2 columns, each tile a slightly lighter navy #1f4470 rectangle with 6 px rounded corners: a large bold number in white, an uppercase label in ice blue below it, a tiny single-color icon in #b9d0e6 in the corner. Tiles: {{vrstice}}. Exactly one tile, \"{{poudarek}}\", has its number in orange #f0955a. {{format}}.",
  "sl": "Infografika s številkami v ploščicah: \"{{naslov}}\". Postavitev: temno modro #15304f ozadje, {{greben}} čez spodnjo tretjino in {{sonce}}. Naslov v beli krepki pisavi zgoraj levo, podnaslov \"{{podnaslov}}\" v ledeno modri #b9d0e6. Mreža {{N}} ploščic v 2 stolpcih, vsaka ploščica malce svetlejši temno modri #1f4470 pravokotnik z vogali 6 px: velika krepka številka v beli, pod njo oznaka v verzalkah v ledeno modri, drobna enobarvna ikona v #b9d0e6 v kotu. Ploščice: {{vrstice}}. Natanko ena ploščica, \"{{poudarek}}\", ima številko v oranžni #f0955a. {{format}}."},
 "shema": {"ozadje": "#15304f", "elementi": [
  {"t": "sonce", "y": 12},
  {"t": "greben", "od": 66, "do": 100},
  {"t": "besedilo", "polje": "naslov", "x": 6, "y": 12, "v": 4.2, "barva": "#ffffff", "krepko": true, "pisava": "n", "sirina": 70},
  {"t": "besedilo", "polje": "podnaslov", "x": 6, "y": 18, "v": 2.1, "barva": "#b9d0e6", "sirina": 70},
  {"t": "ploscice", "polje": "vrstice", "x": 6, "y": 23, "w": 62, "h": 52, "stolpcev": 2, "poudarek": "poudarek"}]},
 "primer": {"naslov": "Klub v številkah", "podnaslov": "Leto 2026", "vrstice": [["62", "članov"], ["1964", "leto ustanovitve"], ["18", "tekmovanj na leto"], ["4", "repetitorji"]], "poudarek": 0}},

{"id": "napoved", "razdelek": "5.1", "skupina": "Omrežja in plakati", "ime": "Napoved dogodka (kvadrat 1:1)",
 "opis": "Facebook/Instagram 1080×1080. Trak z grebenom v kvadratu: značka, naslov, datum, kraj, greben spodaj.",
 "slog": true, "tipo": true, "sonce": true, "greben": true,
 "formati": [{"id": "1:1", "ime": "1:1", "ar": "1:1", "w": 1, "h": 1, "en": "Square 1:1 (1080×1080)", "sl": "Kvadrat 1:1 (1080×1080)"}],
 "polja": [
  {"id": "znacka", "vrsta": "besedilo", "oznaka": "Značka", "vSliki": true, "max": 20, "namig": "npr. DOGODEK"},
  {"id": "naslov", "vrsta": "besedilo", "oznaka": "Naslov", "vSliki": true, "max": 60, "vrstic": 3, "znakov": 18},
  {"id": "datum", "vrsta": "datum", "oznaka": "Datum", "vSliki": true, "max": 30, "namig": "npr. SOB, 20. 6. 2026"},
  {"id": "kraj", "vrsta": "besedilo", "oznaka": "Kraj", "vSliki": true, "max": 40},
  {"id": "podrobnost", "vrsta": "besedilo", "oznaka": "Podrobnost (ena vrstica)", "vSliki": true, "max": 80},
  {"id": "vrh", "vrsta": "izbira", "oznaka": "Na vrhu grebena", "moznosti": "vrhovi", "svoj": true}],
 "poudarki": [{"id": "znacka", "ime": "Oranžna značka", "privzeto": true,
  "da": {"en": "a small orange #d9702a rounded pill with white uppercase text", "sl": "majhna oranžna #d9702a zaobljena značka z belim besedilom v verzalkah"},
  "ne": {"en": "a small ice-blue #b9d0e6 rounded pill with navy uppercase text", "sl": "majhna ledeno modra #b9d0e6 zaobljena značka s temno modrim besedilom v verzalkah"}}],
 "besedilo": {
  "en": "Social media post announcing an event. {{format}}. Layout: full navy #15304f background; top left {{p:znacka}} \"{{znacka}}\"; below it the headline \"{{naslov}}\" in large white bold geometric sans-serif, max three lines; under it the date and place \"{{datum}}\" · \"{{kraj}}\" in ice blue #b9d0e6 uppercase with wide letter spacing; one line of detail \"{{podrobnost}}\" in ice blue. Bottom third: {{greben}} with {{vrh}} on the highest peak, {{sonce}}. Bottom left corner: the callsign \"S59DGO\" as a small white uppercase label. Wide margins of at least 8 % of the width.",
  "sl": "Objava za družbena omrežja z napovedjo dogodka. {{format}}. Postavitev: polno temno modro #15304f ozadje; zgoraj levo {{p:znacka}} \"{{znacka}}\"; pod njo naslov \"{{naslov}}\" v veliki beli krepki geometrijski pisavi brez serifov, največ tri vrstice; pod njim datum in kraj \"{{datum}}\" · \"{{kraj}}\" v ledeno modri #b9d0e6 v verzalkah s širokim razmikom; ena vrstica podrobnosti \"{{podrobnost}}\" v ledeno modri. Spodnja tretjina: {{greben}} z {{vrh}} na najvišjem vrhu, {{sonce}}. Spodnji levi kot: klicni znak \"S59DGO\" kot majhna bela oznaka v verzalkah. Široki robovi vsaj 8 % širine."},
 "shema": {"ozadje": "#15304f", "elementi": [
  {"t": "sonce", "y": 14},
  {"t": "greben", "od": 66, "do": 100},
  {"t": "motiv", "x": 78, "y": 46, "w": 10, "h": 24, "barva": "#b9d0e6"},
  {"t": "znacka", "polje": "znacka", "x": 8, "y": 9, "v": 2.2, "poudarek": "znacka"},
  {"t": "besedilo", "polje": "naslov", "x": 8, "y": 23, "v": 7.4, "barva": "#ffffff", "krepko": true, "pisava": "n", "sirina": 84, "vrstic": 3},
  {"t": "besedilo", "polja": ["datum", "kraj"], "x": 8, "y": 50, "v": 2.1, "barva": "#b9d0e6", "verzalke": true, "sirina": 84},
  {"t": "besedilo", "polje": "podrobnost", "x": 8, "y": 55, "v": 2.3, "barva": "#b9d0e6", "sirina": 84, "vrstic": 2},
  {"t": "staticno", "besedilo": "S59DGO", "x": 8, "y": 94, "v": 1.9, "barva": "#ffffff", "verzalke": true}]},
 "primer": {"znacka": "DOGODEK", "naslov": "Field day na Sviščakih", "datum": "SOB, 20. 6. 2026", "kraj": "SVIŠČAKI, 1240 M", "podrobnost": "Postavitev anten od 9. ure, delo na 144 in 432 MHz.", "vrh": "jambor"}},

{"id": "napoved-pokoncno", "razdelek": "5.2", "skupina": "Omrežja in plakati", "ime": "Napoved: pokončno 4:5 / zgodba 9:16",
 "opis": "Pokončna objava 1080×1350 ali zgodba 1080×1920. Pri zgodbi zgornjih in spodnjih 13 % ostane brez besedila (črtkano).",
 "slog": true, "tipo": true, "sonce": true, "greben": true,
 "formati": [
  {"id": "4:5", "ime": "Objava 4:5", "ar": "4:5", "w": 4, "h": 5, "en": "Portrait 4:5 (1080×1350). The ridge takes the bottom 40 %, the headline may be four lines", "sl": "Pokončno 4:5 (1080×1350). Greben zavzame spodnjih 40 %, naslov ima lahko štiri vrstice"},
  {"id": "9:16", "ime": "Zgodba 9:16", "ar": "9:16", "w": 9, "h": 16, "en": "Vertical story 9:16 (1080×1920). Keep the top 13 % and bottom 13 % free of text (only navy sky and ridge). Headline in the vertical center, ridge in the bottom 30 %, larger sun", "sl": "Pokončna zgodba 9:16 (1080×1920). Zgornjih 13 % in spodnjih 13 % brez besedila (samo temno modro nebo in greben). Naslov na navpični sredini, greben v spodnjih 30 %, večje sonce",
   "varno": [{"x": 0, "y": 0, "w": 100, "h": 13}, {"x": 0, "y": 87, "w": 100, "h": 13}]}],
 "polja": [
  {"id": "znacka", "vrsta": "besedilo", "oznaka": "Značka", "vSliki": true, "max": 20, "namig": "npr. DOGODEK"},
  {"id": "naslov", "vrsta": "besedilo", "oznaka": "Naslov", "vSliki": true, "max": 70, "vrstic": 4, "znakov": 18},
  {"id": "datum", "vrsta": "datum", "oznaka": "Datum", "vSliki": true, "max": 30},
  {"id": "kraj", "vrsta": "besedilo", "oznaka": "Kraj", "vSliki": true, "max": 40},
  {"id": "podrobnost", "vrsta": "besedilo", "oznaka": "Podrobnost (ena vrstica)", "vSliki": true, "max": 80},
  {"id": "vrh", "vrsta": "izbira", "oznaka": "Na vrhu grebena", "moznosti": "vrhovi", "svoj": true}],
 "poudarki": [{"id": "znacka", "ime": "Oranžna značka", "privzeto": true,
  "da": {"en": "a small orange #d9702a rounded pill with white uppercase text", "sl": "majhna oranžna #d9702a zaobljena značka z belim besedilom v verzalkah"},
  "ne": {"en": "a small ice-blue #b9d0e6 rounded pill with navy uppercase text", "sl": "majhna ledeno modra #b9d0e6 zaobljena značka s temno modrim besedilom v verzalkah"}}],
 "besedilo": {
  "en": "Social media post announcing an event. {{format}}. Layout: full navy #15304f background; {{p:znacka}} \"{{znacka}}\"; below it the headline \"{{naslov}}\" in large white bold geometric sans-serif; under it the date and place \"{{datum}}\" · \"{{kraj}}\" in ice blue #b9d0e6 uppercase with wide letter spacing; one line of detail \"{{podrobnost}}\" in ice blue. Lower part: {{greben}} with {{vrh}} on the highest peak, {{sonce}}. The callsign \"S59DGO\" as a small white uppercase label above the ridge on the left. Wide margins of at least 8 % of the width.",
  "sl": "Objava za družbena omrežja z napovedjo dogodka. {{format}}. Postavitev: polno temno modro #15304f ozadje; {{p:znacka}} \"{{znacka}}\"; pod njo naslov \"{{naslov}}\" v veliki beli krepki geometrijski pisavi brez serifov; pod njim datum in kraj \"{{datum}}\" · \"{{kraj}}\" v ledeno modri #b9d0e6 v verzalkah s širokim razmikom; ena vrstica podrobnosti \"{{podrobnost}}\" v ledeno modri. Spodnji del: {{greben}} z {{vrh}} na najvišjem vrhu, {{sonce}}. Klicni znak \"S59DGO\" kot majhna bela oznaka v verzalkah levo nad grebenom. Široki robovi vsaj 8 % širine."},
 "shema": {"ozadje": "#15304f", "elementi": [
  {"t": "sonce", "y": 20},
  {"t": "greben", "od": 66, "do": 100},
  {"t": "motiv", "x": 78, "y": 50, "w": 10, "h": 20, "barva": "#b9d0e6"},
  {"t": "znacka", "polje": "znacka", "x": 8, "y": 18, "v": 2.4, "poudarek": "znacka"},
  {"t": "besedilo", "polje": "naslov", "x": 8, "y": 29, "v": 7.6, "barva": "#ffffff", "krepko": true, "pisava": "n", "sirina": 84, "vrstic": 4},
  {"t": "besedilo", "polja": ["datum", "kraj"], "x": 8, "y": 52, "v": 2.4, "barva": "#b9d0e6", "verzalke": true, "sirina": 84},
  {"t": "besedilo", "polje": "podrobnost", "x": 8, "y": 57, "v": 2.6, "barva": "#b9d0e6", "sirina": 84, "vrstic": 2},
  {"t": "staticno", "besedilo": "S59DGO", "x": 8, "y": 64, "v": 2, "barva": "#ffffff", "verzalke": true}]},
 "primer": {"znacka": "DOGODEK", "naslov": "Field day na Sviščakih", "datum": "SOB, 20. 6. 2026", "kraj": "SVIŠČAKI, 1240 M", "podrobnost": "Postavitev anten od 9. ure, delo na 144 in 432 MHz.", "vrh": "jambor"}},

{"id": "cestitka", "razdelek": "5.3", "skupina": "Omrežja in plakati", "ime": "Čestitka ob rezultatu (1:1)",
 "opis": "Velika številka uvrstitve, klicni znak, ikona pokala in stolp na grebenu.",
 "slog": true, "tipo": true, "sonce": false, "greben": false,
 "formati": [{"id": "1:1", "ime": "1:1", "ar": "1:1", "w": 1, "h": 1, "en": "Square 1:1 (1080×1080)", "sl": "Kvadrat 1:1 (1080×1080)"}],
 "polja": [
  {"id": "naslov", "vrsta": "besedilo", "oznaka": "O čem je čestitka", "vSliki": false, "max": 100, "namig": "npr. 1. mesto v kategoriji SO 144 MHz", "privzeto": {"en": "a contest result", "sl": "rezultat na tekmovanju"}},
  {"id": "znacka", "vrsta": "besedilo", "oznaka": "Značka", "vSliki": true, "max": 20, "namig": "npr. CONTEST"},
  {"id": "stevilka", "vrsta": "besedilo", "oznaka": "Številka / uvrstitev", "vSliki": true, "max": 6},
  {"id": "klic", "vrsta": "besedilo", "oznaka": "Klicni znak", "vSliki": true, "max": 12},
  {"id": "tekmovanje", "vrsta": "besedilo", "oznaka": "Tekmovanje", "vSliki": true, "max": 50}],
 "poudarki": [
  {"id": "pokal", "ime": "Oranžen pokal", "privzeto": true,
   "da": {"en": "A simple flat trophy icon in orange #d9702a", "sl": "Preprosta ploskovna ikona pokala v oranžni #d9702a"},
   "ne": {"en": "A simple flat trophy icon in ice blue #b9d0e6", "sl": "Preprosta ploskovna ikona pokala v ledeno modri #b9d0e6"}},
  {"id": "znacka", "ime": "Oranžna značka", "privzeto": false,
   "da": {"en": "a small orange #d9702a rounded pill with white uppercase text", "sl": "majhna oranžna #d9702a zaobljena značka z belim besedilom v verzalkah"},
   "ne": {"en": "a small ice-blue #b9d0e6 rounded pill with navy uppercase text", "sl": "majhna ledeno modra #b9d0e6 zaobljena značka s temno modrim besedilom v verzalkah"}}],
 "besedilo": {
  "en": "Social media post celebrating a result: {{naslov}}. {{format}}. Navy #15304f background. Top: {{p:znacka}} \"{{znacka}}\". Center: a very large white bold number or rank \"{{stevilka}}\" (half the image height), next to it the callsign \"{{klic}}\" and the contest name \"{{tekmovanje}}\" in ice blue #b9d0e6. {{p:pokal}} next to the number, no gradients. Bottom third: ridge silhouettes in #1f4470 and #2a5687 and one lattice tower with stacked Yagi antennas in #2a5687. \"S59DGO\" as a small white label bottom left.",
  "sl": "Objava za družbena omrežja ob rezultatu: {{naslov}}. {{format}}. Temno modro #15304f ozadje. Zgoraj: {{p:znacka}} \"{{znacka}}\". Sredina: zelo velika bela krepka številka ali uvrstitev \"{{stevilka}}\" (polovica višine slike), ob njej klicni znak \"{{klic}}\" in ime tekmovanja \"{{tekmovanje}}\" v ledeno modri #b9d0e6. {{p:pokal}} ob številki, brez gradientov. Spodnja tretjina: silhuete grebena v #1f4470 in #2a5687 in en mrežasti stolp z zloženimi Yagi antenami v #2a5687. \"S59DGO\" kot majhna bela oznaka spodaj levo."},
 "shema": {"ozadje": "#15304f", "elementi": [
  {"t": "greben", "od": 68, "do": 100, "barve": ["#1f4470", "#2a5687"]},
  {"t": "motiv", "x": 76, "y": 50, "w": 10, "h": 26, "barva": "#2a5687"},
  {"t": "znacka", "polje": "znacka", "x": 8, "y": 9, "v": 2.2, "poudarek": "znacka"},
  {"t": "besedilo", "polje": "stevilka", "x": 8, "y": 50, "v": 24, "barva": "#ffffff", "krepko": true, "pisava": "n", "sirina": 60},
  {"t": "pokal", "x": 46, "y": 22, "w": 12, "h": 20, "poudarek": "pokal"},
  {"t": "besedilo", "polje": "klic", "x": 62, "y": 30, "v": 4.4, "barva": "#ffffff", "krepko": true, "pisava": "n", "sirina": 34},
  {"t": "besedilo", "polje": "tekmovanje", "x": 62, "y": 37, "v": 2.4, "barva": "#b9d0e6", "sirina": 34, "vrstic": 2},
  {"t": "staticno", "besedilo": "S59DGO", "x": 8, "y": 94, "v": 1.9, "barva": "#ffffff", "verzalke": true}]},
 "primer": {"naslov": {"en": "first place in the SO 144 MHz category", "sl": "1. mesto v kategoriji SO 144 MHz"}, "znacka": "CONTEST", "stevilka": "1.", "klic": "S59DGO", "tekmovanje": "Marconi Memorial VHF 2026"}},

{"id": "plakat", "razdelek": "5.4", "skupina": "Omrežja in plakati", "ime": "Plakat A4/A3 (vabilo)",
 "opis": "Trije pasovi: temno modri z naslovom in grebenom, svetli s podrobnostmi, beli s klicnim znakom in gumbom. Generiraj v največji ločljivosti.",
 "slog": true, "tipo": true, "sonce": true, "greben": true,
 "formati": [
  {"id": "a4", "ime": "A4", "ar": "2:3", "w": 1000, "h": 1414, "en": "Printable poster, portrait A4 aspect ratio (1:1.414), 300 dpi, for print", "sl": "Plakat za tisk, pokončno razmerje A4 (1:1,414), 300 dpi"},
  {"id": "a3", "ime": "A3", "ar": "2:3", "w": 1000, "h": 1414, "en": "Printable poster, portrait A3 aspect ratio (1:1.414), 300 dpi, for print", "sl": "Plakat za tisk, pokončno razmerje A3 (1:1,414), 300 dpi"}],
 "polja": [
  {"id": "znacka", "vrsta": "besedilo", "oznaka": "Oznaka nad naslovom", "vSliki": true, "max": 24, "namig": "npr. VABILO"},
  {"id": "naslov", "vrsta": "besedilo", "oznaka": "Naslov", "vSliki": true, "max": 60, "vrstic": 3, "znakov": 20},
  {"id": "datum", "vrsta": "datum", "oznaka": "Kdaj", "vSliki": true, "max": 40},
  {"id": "kraj", "vrsta": "besedilo", "oznaka": "Kje", "vSliki": true, "max": 50},
  {"id": "organizator", "vrsta": "besedilo", "oznaka": "Kdo", "vSliki": true, "max": 50},
  {"id": "opis", "vrsta": "besedilo", "oznaka": "Opis (dve vrstici)", "vSliki": true, "max": 160, "vrstic": 2, "znakov": 70},
  {"id": "poziv", "vrsta": "besedilo", "oznaka": "Besedilo gumba", "vSliki": true, "max": 24, "namig": "npr. Vabljeni!"},
  {"id": "vrh", "vrsta": "izbira", "oznaka": "Na vrhu grebena", "moznosti": "vrhovi", "svoj": true}],
 "poudarki": [{"id": "gumb", "ime": "Oranžen gumb", "privzeto": true,
  "da": {"en": "a small orange #d9702a rounded button shape with white text", "sl": "majhen oranžen #d9702a zaobljen gumb z belim besedilom"},
  "ne": {"en": "a small navy #15304f rounded button shape with white text", "sl": "majhen temno moder #15304f zaobljen gumb z belim besedilom"}}],
 "besedilo": {
  "en": "{{format}}. Layout in three bands. Top band (55 % of height): navy #15304f with a large headline \"{{naslov}}\" in white bold geometric sans-serif, an uppercase ice-blue label \"{{znacka}}\" above it, and {{greben}} at the bottom of the band with {{vrh}} on the peak and {{sonce}}; the band ends with the angular ridge edge cutting into the light area below (no straight line). Middle band: off-white #eef3f8 with three columns of details, each with a single-color icon in #2a5687 and an uppercase label in muted blue #5f7590: \"KDAJ\" \"{{datum}}\", \"KJE\" \"{{kraj}}\", \"KDO\" \"{{organizator}}\"; below them two lines of description \"{{opis}}\" in dark navy #172433. Bottom band (12 %): white #ffffff with the callsign \"S59DGO\", the website \"www.s59dgo.org\" and {{p:gumb}} \"{{poziv}}\". Leave 10 mm safe margins. Vector-clean, print-ready, CMYK-safe colors.",
  "sl": "{{format}}. Postavitev v treh pasovih. Zgornji pas (55 % višine): temno modra #15304f z velikim naslovom \"{{naslov}}\" v beli krepki geometrijski pisavi brez serifov, nad njim ledeno modra oznaka v verzalkah \"{{znacka}}\", ob dnu pasu {{greben}} z {{vrh}} na vrhu in {{sonce}}; pas se konča s kotnim robom grebena, ki reže v svetlo območje spodaj (brez ravne črte). Srednji pas: umazano bela #eef3f8 s tremi stolpci podrobnosti, vsak z enobarvno ikono v #2a5687 in oznako v verzalkah v tihi modri #5f7590: \"KDAJ\" \"{{datum}}\", \"KJE\" \"{{kraj}}\", \"KDO\" \"{{organizator}}\"; pod njimi dve vrstici opisa \"{{opis}}\" v temno modri #172433. Spodnji pas (12 %): bela #ffffff s klicnim znakom \"S59DGO\", spletnim naslovom \"www.s59dgo.org\" in {{p:gumb}} \"{{poziv}}\". Pusti 10 mm varnega roba. Vektorsko čisto, pripravljeno za tisk, barve varne za CMYK."},
 "shema": {"ozadje": "#ffffff", "elementi": [
  {"t": "pas", "x": 0, "y": 0, "w": 100, "h": 55, "barva": "#15304f"},
  {"t": "sonce", "y": 9},
  {"t": "pas", "x": 0, "y": 52, "w": 100, "h": 36, "barva": "#eef3f8"},
  {"t": "greben", "od": 38, "do": 55},
  {"t": "motiv", "x": 64, "y": 27, "w": 8, "h": 16, "barva": "#b9d0e6"},
  {"t": "besedilo", "polje": "znacka", "x": 8, "y": 9, "v": 2.2, "barva": "#b9d0e6", "verzalke": true, "sirina": 70},
  {"t": "besedilo", "polje": "naslov", "x": 8, "y": 16, "v": 7, "barva": "#ffffff", "krepko": true, "pisava": "n", "sirina": 84, "vrstic": 3},
  {"t": "staticno", "besedilo": "KDAJ", "x": 8, "y": 61, "v": 1.7, "barva": "#5f7590", "verzalke": true},
  {"t": "besedilo", "polje": "datum", "x": 8, "y": 65, "v": 2.2, "barva": "#172433", "krepko": true, "sirina": 26, "vrstic": 2},
  {"t": "staticno", "besedilo": "KJE", "x": 38, "y": 61, "v": 1.7, "barva": "#5f7590", "verzalke": true},
  {"t": "besedilo", "polje": "kraj", "x": 38, "y": 65, "v": 2.2, "barva": "#172433", "krepko": true, "sirina": 26, "vrstic": 2},
  {"t": "staticno", "besedilo": "KDO", "x": 68, "y": 61, "v": 1.7, "barva": "#5f7590", "verzalke": true},
  {"t": "besedilo", "polje": "organizator", "x": 68, "y": 65, "v": 2.2, "barva": "#172433", "krepko": true, "sirina": 26, "vrstic": 2},
  {"t": "besedilo", "polje": "opis", "x": 8, "y": 77, "v": 2.2, "barva": "#172433", "sirina": 84, "vrstic": 2},
  {"t": "staticno", "besedilo": "S59DGO · www.s59dgo.org", "x": 8, "y": 95, "v": 1.8, "barva": "#172433"},
  {"t": "znacka", "polje": "poziv", "x": 72, "y": 92.5, "v": 2, "poudarek": "gumb", "barvaNe": "#15304f", "besediloNe": "#ffffff"}]},
 "primer": {"znacka": "VABILO", "naslov": "Redni letni občni zbor", "datum": "PET, 6. 3. 2026 ob 18. uri", "kraj": "Klubski prostori, Ilirska Bistrica", "organizator": "Radio klub Snežnik", "opis": "Poročila o delu, načrt za leto 2026 in volitve. Po zboru druženje.", "poziv": "Vabljeni!", "vrh": "antena"}},

{"id": "pasica", "razdelek": "5.5", "skupina": "Omrežja in plakati", "ime": "Facebook naslovnica (1640×624)",
 "opis": "Srednjih 40 % širine ostane prazno, ker ju prekrijeta profilna slika in ime strani (črtkano).",
 "slog": true, "tipo": false, "sonce": true, "greben": true,
 "formati": [{"id": "pasica", "ime": "1640×624", "ar": "21:8", "w": 1640, "h": 624, "en": "aspect ratio 2.63:1 (1640×624)", "sl": "razmerje 2,63:1 (1640×624)", "varno": [{"x": 30, "y": 0, "w": 40, "h": 100}]}],
 "polja": [{"id": "vrh", "vrsta": "izbira", "oznaka": "Na vrhu grebena", "moznosti": "vrhovi", "svoj": true}],
 "besedilo": {
  "en": "Wide banner, {{format}}. Full navy #15304f background, {{greben}} across the bottom 45 %, {{vrh}} on the highest peak, {{sonce}}. Keep the center 40 % of the width empty (the profile picture and page name overlay it). No text.",
  "sl": "Široka pasica, {{format}}. Polno temno modro #15304f ozadje, {{greben}} čez spodnjih 45 %, {{vrh}} na najvišjem vrhu, {{sonce}}. Srednjih 40 % širine pusti prazno (čez njih se prikažeta profilna slika in ime strani). Brez besedila."},
 "shema": {"ozadje": "#15304f", "elementi": [
  {"t": "sonce", "y": 22},
  {"t": "greben", "od": 55, "do": 100},
  {"t": "motiv", "x": 80, "y": 26, "w": 6, "h": 36, "barva": "#b9d0e6"}]},
 "primer": {"vrh": "antena"}},

{"id": "ikone", "razdelek": "6.1", "skupina": "Ikone in dekor", "ime": "Set ikon (za prerisovanje v SVG)",
 "opis": "Črno na belem za prerisovanje; barvo nato določiš v SVG s currentColor. Prosojna različica deluje v obeh načinih.",
 "slog": false, "tipo": false, "sonce": false, "greben": false,
 "ozadja": [
  {"id": "bela", "ime": "Belo (za prerisovanje)", "en": "solid black #000000 shapes on a pure white background", "sl": "polne črne #000000 oblike na čisto belem ozadju", "blok": null},
  {"id": "prosojno", "ime": "Prosojno, za oba načina", "en": "solid mid-tone #2a5687 shapes on a transparent background", "sl": "polne oblike v srednjem tonu #2a5687 na prosojnem ozadju", "blok": "temno"}],
 "formati": [{"id": "1:1", "ime": "1:1", "ar": "1:1", "w": 1, "h": 1, "en": "Square 1:1 image", "sl": "Kvadratna slika 1:1"}],
 "polja": [{"id": "ikone", "vrsta": "seznam", "oznaka": "Ikone v setu",
  "privzete": ["antena", "pokal", "miza", "kartica", "kamera", "koledar", "postaja", "kljuc", "greben", "val", "lokator", "ovojnica"],
  "moznosti": [
   {"id": "antena", "ime": "Yagi antena na jamboru", "en": "a Yagi antenna on a mast", "sl": "Yagi antena na jamboru"},
   {"id": "pokal", "ime": "Pokal", "en": "a trophy cup", "sl": "pokal"},
   {"id": "miza", "ime": "Miza s stoli", "en": "a group meeting table with three chairs", "sl": "miza za sestanek s tremi stoli"},
   {"id": "kartica", "ime": "Članska kartica", "en": "a membership card with a small circle", "sl": "članska kartica z majhnim krogom"},
   {"id": "kamera", "ime": "Vremenska kamera", "en": "a weather camera on a pole", "sl": "vremenska kamera na drogu"},
   {"id": "koledar", "ime": "Koledarski list", "en": "a calendar page", "sl": "koledarski list"},
   {"id": "postaja", "ime": "Ročna postaja", "en": "a handheld transceiver", "sl": "ročna radijska postaja"},
   {"id": "kljuc", "ime": "Morsejev ključ", "en": "a morse key", "sl": "Morsejev ključ"},
   {"id": "greben", "ime": "Greben s soncem", "en": "a mountain ridge with a sun", "sl": "gorski greben s soncem"},
   {"id": "val", "ime": "Radijski val", "en": "a radio wave with three arcs", "sl": "radijski val s tremi loki"},
   {"id": "lokator", "ime": "Bucika nad mrežo", "en": "a map pin over a grid square", "sl": "zemljevidna bucika nad kvadratom mreže"},
   {"id": "ovojnica", "ime": "Ovojnica", "en": "an envelope", "sl": "ovojnica"},
   {"id": "sotor", "ime": "Šotor z jamborom", "en": "a tent with a small mast", "sl": "šotor z majhnim jamborom"},
   {"id": "zaslon", "ime": "Zaslon z valom", "en": "a screen with a radio-wave arc", "sl": "zaslon z lokom radijskega vala"},
   {"id": "lupa", "ime": "Lupa", "en": "a magnifying glass", "sl": "lupa"},
   {"id": "srce", "ime": "Srce v krogu", "en": "a heart in a circle", "sl": "srce v krogu"}]}],
 "besedilo": {
  "en": "Flat single-color icon set in one consistent style: {{ozadje}}, geometric, built on a 24 px grid with 2 px stroke weight and rounded line ends, minimal detail, no outlines around fills, no gradients, no shadows, no text. Each icon centered in its own square cell with equal padding, arranged in a {{ikone_mreza}} grid. Icons: {{ikone}}. Vector-like, crisp edges, suitable for tracing to SVG. {{format}}.",
  "sl": "Set ploskovnih enobarvnih ikon v enotnem slogu: {{ozadje}}, geometrijske, na mreži 24 px z debelino črte 2 px in zaobljenimi konci, minimalno podrobnosti, brez obrob okoli polnil, brez gradientov, senc in besedila. Vsaka ikona na sredini svoje kvadratne celice z enakim odmikom, razporejene v mrežo {{ikone_mreza}}. Ikone: {{ikone}}. Vektorski videz, ostri robovi, primerno za prerisovanje v SVG. {{format}}."},
 "shema": {"ozadja": {"bela": "#ffffff", "prosojno": "#ffffff"}, "elementi": [
  {"t": "celice", "polje": "ikone", "x": 6, "y": 6, "w": 88, "h": 88, "barve": {"bela": "#000000", "prosojno": "#2a5687"}}]},
 "primer": {"ikone": ["sotor", "pokal", "miza", "kartica", "kamera", "zaslon", "lupa", "ovojnica", "srce"]}},

{"id": "ikona-app", "razdelek": "6.2", "skupina": "Ikone in dekor", "ime": "Ikona spletne aplikacije",
 "opis": "Temno modro ozadje, bel simbol na sredini, en majhen oranžen element. Doda še različico s prosojnim ozadjem.",
 "slog": true, "tipo": false, "sonce": false, "greben": false,
 "formati": [{"id": "1:1", "ime": "1:1", "ar": "1:1", "w": 1, "h": 1, "en": "square 1:1 (1024×1024)", "sl": "kvadrat 1:1 (1024×1024)"}],
 "polja": [{"id": "aplikacija", "vrsta": "izbira", "oznaka": "Aplikacija", "svoj": true, "moznosti": [
  {"id": "analitika", "ime": "EDI Log Analitika", "en": "for EDI Log Analitika: a bar chart with three bars over a wave arc", "sl": "za EDI Log Analitika: stolpčni graf s tremi stolpci nad lokom valov"},
  {"id": "adif", "ime": "EDI to ADIF", "en": "for EDI to ADIF: two document sheets with an arrow between them", "sl": "za EDI to ADIF: dva lista dokumenta s puščico med njima"},
  {"id": "crosscheck", "ime": "Crosscheck", "en": "for Crosscheck: two overlapping document sheets with a check mark", "sl": "za Crosscheck: dva prekrivajoča se lista s kljukico"},
  {"id": "logger", "ime": "Contest Logger", "en": "for Contest Logger: a notebook page with a small antenna", "sl": "za Contest Logger: stran zvezka z majhno anteno"}]}],
 "besedilo": {
  "en": "App icon, {{format}} with rounded corners (about 12 % radius), solid navy #15304f background, a single flat symbol in white #ffffff centered at 60 % of the width, one small orange #d9702a accent element. Symbol {{aplikacija}}. No text, no gradients, no shadows, no bevel. Deliver also a version with transparent background.",
  "sl": "Ikona aplikacije, {{format}} z zaobljenimi vogali (približno 12 % polmera), polno temno modro #15304f ozadje, en ploskovni simbol v beli #ffffff na sredini v 60 % širine, en majhen oranžen #d9702a poudarni element. Simbol {{aplikacija}}. Brez besedila, gradientov, senc in reliefa. Dodaj še različico s prosojnim ozadjem."},
 "shema": {"ozadje": "#ffffff", "elementi": [
  {"t": "pas", "x": 6, "y": 6, "w": 88, "h": 88, "barva": "#15304f", "r": 10},
  {"t": "motiv", "x": 38, "y": 22, "w": 24, "h": 56, "barva": "#ffffff"},
  {"t": "krog", "x": 70, "y": 30, "r": 4, "barva": "#d9702a"}]},
 "primer": {"aplikacija": "analitika"}},

{"id": "vzorec", "razdelek": "6.3", "skupina": "Ikone in dekor", "ime": "Vzorec grebena (brezšiven trak 4:1)",
 "opis": "Levi in desni rob se ujemata, trak se lahko ponavlja vodoravno. Svetla različica je nežen dekor na beli podlagi.",
 "slog": false, "tipo": false, "sonce": false, "greben": false,
 "ozadja": [
  {"id": "temno", "ime": "Temno", "en": "back layer #1f4470, middle #2a5687, front #15304f, on a flat navy #0f1c2b sky", "sl": "zadnja plast #1f4470, srednja #2a5687, sprednja #15304f, na ravnem temno modrem #0f1c2b nebu", "blok": null},
  {"id": "svetlo", "ime": "Svetlo", "en": "back layer #b9d0e6, middle #d3dfeb, front #eef3f8, on a white #ffffff sky", "sl": "zadnja plast #b9d0e6, srednja #d3dfeb, sprednja #eef3f8, na belem #ffffff nebu", "blok": null}],
 "formati": [{"id": "4:1", "ime": "4:1", "ar": "4:1", "w": 4, "h": 1, "en": "Wide aspect ratio 4:1", "sl": "Široko razmerje 4:1"}],
 "polja": [],
 "besedilo": {
  "en": "Seamless horizontally tileable pattern strip: angular low-poly mountain ridge silhouettes in three layers, {{ozadje}}, no sun, no gradients, no texture, no stars. The left and right edges must match exactly so the strip tiles seamlessly. {{format}}. Peaks of varied height between 30 % and 70 % of the strip height, calm rhythm, no sharp needles.",
  "sl": "Brezšiven vodoravno ponovljiv vzorčni trak: kotne (low-poly) silhuete gorskega grebena v treh plasteh, {{ozadje}}, brez sonca, gradientov, tekstur in zvezd. Levi in desni rob se morata natanko ujemati, da se trak brezšivno ponavlja. {{format}}. Vrhovi različnih višin med 30 % in 70 % višine traku, umirjen ritem, brez ostrih igel."},
 "shema": {"ozadja": {"temno": "#0f1c2b", "svetlo": "#ffffff"}, "elementi": [
  {"t": "greben", "od": 30, "do": 100, "barvePo": {"temno": ["#1f4470", "#2a5687", "#15304f"], "svetlo": ["#b9d0e6", "#d3dfeb", "#eef3f8"]}}]},
 "primer": {}},

{"id": "locila", "razdelek": "6.4", "skupina": "Ikone in dekor", "ime": "Ločila in drobni dekor",
 "opis": "Majhni elementi za ločila razdelkov in okras, vsak v svoji celici, za prerisovanje v SVG.",
 "slog": false, "tipo": false, "sonce": false, "greben": false,
 "ozadja": [
  {"id": "bela", "ime": "Belo (za prerisovanje)", "en": "on a pure white background, in solid navy #15304f", "sl": "na čisto belem ozadju, v polni temno modri #15304f", "blok": null},
  {"id": "prosojno", "ime": "Prosojno, za oba načina", "en": "on a transparent background, in mid-tone #2a5687", "sl": "na prosojnem ozadju, v srednjem tonu #2a5687", "blok": "temno"}],
 "formati": [{"id": "1:1", "ime": "1:1", "ar": "1:1", "w": 1, "h": 1, "en": "Square 1:1 image", "sl": "Kvadratna slika 1:1"}],
 "polja": [{"id": "dekor", "vrsta": "seznam", "oznaka": "Elementi",
  "privzete": ["locilo", "vzhod", "valovi", "morse", "kompas", "dipol"],
  "moznosti": [
   {"id": "locilo", "ime": "Greben s tremi vrhovi", "en": "a short three-peak ridge as a section divider", "sl": "kratek greben s tremi vrhovi kot ločilo razdelkov"},
   {"id": "vzhod", "ime": "Sonce za vrhovoma", "en": "a sun disc rising behind two peaks", "sl": "sončni disk, ki vzhaja za dvema vrhovoma"},
   {"id": "valovi", "ime": "Loki valov", "en": "three concentric radio-wave arcs", "sl": "trije koncentrični loki radijskih valov"},
   {"id": "morse", "ime": "Morsejeve pike in črte", "en": "a horizontal row of morse dots and dashes", "sl": "vodoravna vrsta Morsejevih pik in črt"},
   {"id": "kompas", "ime": "Kompasna roža", "en": "a simple compass rose with an orange north needle", "sl": "preprosta kompasna roža z oranžno severno iglo"},
   {"id": "dipol", "ime": "Dipol med jamboroma", "en": "a small dipole antenna between two masts", "sl": "majhen dipol med dvema jamboroma"}]}],
 "besedilo": {
  "en": "Set of {{dekor_N}} small flat decorative elements in the visual identity of an alpine amateur radio club, each centered in its own square cell {{ozadje}}, with a single orange #d9702a accent, no gradients, no outlines, no text: {{dekor}}. Vector-like, crisp, suitable for tracing to SVG. {{format}}.",
  "sl": "Set {{dekor_N}} majhnih ploskovnih dekorativnih elementov v vizualni podobi alpskega radioamaterskega kluba, vsak na sredini svoje kvadratne celice {{ozadje}}, z enim oranžnim #d9702a poudarkom, brez gradientov, obrob in besedila: {{dekor}}. Vektorski videz, ostro, primerno za prerisovanje v SVG. {{format}}."},
 "shema": {"ozadja": {"bela": "#ffffff", "prosojno": "#ffffff"}, "elementi": [
  {"t": "celice", "polje": "dekor", "x": 6, "y": 6, "w": 88, "h": 88, "barve": {"bela": "#15304f", "prosojno": "#2a5687"}, "poudarek": true}]},
 "primer": {"dekor": ["locilo", "vzhod", "valovi", "morse", "kompas", "dipol"]}}
]
```

- [ ] **Step 4: Poženi in preveri, da gre skozi**

Run: `docker run --rm -v "$PWD:/app:ro" -w /app php:8.3-cli php tests/test-prompti.php`
Expected: vse `OK`, med njimi `vsak razdelek §3–§6 ima natanko eno predlogo (15)` in za vsako predlogo `EN in SL uporabljata iste reže`.

- [ ] **Step 5: Commit**

```bash
git add docs/orodja/s59dgo-prompti.html tests/test-prompti.php
git commit -m "Generator promptov: podatki 15 predlog z režami, primeri in shemami

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Jedro – sestavljanje prompta, privzete vrednosti, primer, uvoz

**Files:**
- Modify: `docs/orodja/s59dgo-prompti.html` (`<script id="jedro">`)
- Test: `tests/prompti.test.mjs`

**Interfaces:**
- Consumes: oblika `P` iz Task 2 in 3.
- Produces `globalThis.S59DGO_JEDRO` z:
  - `poId(seznam, id) → element | null`
  - `predloga(P, id) → Predloga` (neznan id → prva predloga)
  - `moznosti(P, polje) → [{id, ime, en, sl}]` (razreši `"vrhovi"`)
  - `privzeto(P, predloga) → Vrednosti`, kjer je `Vrednosti = {polja: {…}, elementi: {ozadje, sonce, plasti, format, poudarki: string[]}}`; vrednost polja po vrsti: `besedilo/datum` string; `vrstice` `[{<stolpec>: string}]`; `poudarek` number; `izbira` `{izbrana, svoj}`; `seznam` `{izbrane: string[], svoj}`; `motiv` `{izbran, svoj, dodatno: "privzeto"|"brez"|"svoj", dodatnoSvoj}`
  - `primer(P, predloga, jezik) → Vrednosti`
  - `sestavi(P, idPredloge, vrednosti, {jezik, orodje, tipo, ne}) → {pozitivni: string, negativni: string|null, opozorila: string[]}`
  - `zacetno(P) → Stanje` = `{verzija: 1, predloga, jezik: "en", orodje: "univerzalno", tipo: true, ne: true, vrednosti: {}}`
  - `preveriUvoz(P, obj) → {ok: true, stanje} | {ok: false, napaka: string}`
  - `citati(s) → string` (`"a"` → `»a«`)

- [ ] **Step 1: Napiši teste jedra**

V `tests/prompti.test.mjs` nad vrstico `// TESTI-NAPREJ` dodaj:

```js
const nast = (jezik, orodje, dodatno = {}) => Object.assign({ jezik, orodje, tipo: true, ne: true }, dodatno);
const ORODJA = Object.keys(P.orodja);
const nezamenjano = s => /\{\{|\}\}|\[SLOG\]|\[TIPO\]|\[NE\]|undefined|null|\[object|NaN/.test(s);

// 1. Vse kombinacije predloga × jezik × orodje × (privzeto, primer): brez ostankov rež.
for (const p of P.predloge) {
  for (const jezik of ['en', 'sl']) {
    for (const orodje of ORODJA) {
      for (const [ime, v] of [['privzeto', J.privzeto(P, p)], ['primer', J.primer(P, p, jezik)]]) {
        const r = J.sestavi(P, p.id, v, nast(jezik, orodje));
        ok(!nezamenjano(r.pozitivni), `${p.id}/${jezik}/${orodje}/${ime}: brez nezamenjanih rež: ${r.pozitivni.match(/\{\{[^}]*\}\}/)}`);
        ok(!/""|\(\s*\)/.test(r.pozitivni), `${p.id}/${jezik}/${orodje}/${ime}: brez praznih narekovajev ali oklepajev`);
        ok(!/[{}]/.test(r.pozitivni), `${p.id}/${jezik}/${orodje}/${ime}: brez zavitih oklepajev`);
        ok(Array.isArray(r.opozorila), `${p.id}: opozorila so seznam`);
        if (orodje === 'sd') ok(typeof r.negativni === 'string' && r.negativni.includes('watermark'), `${p.id}/sd: negativni prompt`);
        else ok(r.negativni === null, `${p.id}/${orodje}: brez negativnega prompta`);
      }
    }
  }
}

// 2. Bloki in orodja.
const napoved = J.predloga(P, 'napoved');
const vNapoved = J.primer(P, napoved, 'en');
let r = J.sestavi(P, 'napoved', vNapoved, nast('en', 'univerzalno'));
ok(r.pozitivni.startsWith(P.bloki.slog.en), 'univerzalno: začne s SLOG');
ok(r.pozitivni.includes(P.bloki.tipo.en), 'predloga z besedilom: vsebuje TIPO');
ok(r.pozitivni.includes(P.bloki.ne.en), 'univerzalno: vsebuje NE');
ok(r.pozitivni.includes('"Field day na Sviščakih"'), 'besedilo uporabnika v narekovajih');
ok(r.opozorila.length === 0, 'primer napovedi brez opozoril: ' + r.opozorila.join(' | '));
r = J.sestavi(P, 'napoved', vNapoved, nast('en', 'univerzalno', { tipo: false, ne: false }));
ok(!r.pozitivni.includes(P.bloki.tipo.en) && !r.pozitivni.includes(P.bloki.ne.en), 'stikali TIPO in NE izklopita bloka');
r = J.sestavi(P, 'napoved', vNapoved, nast('en', 'midjourney'));
ok(/ --ar 1:1 --style raw --stylize 50$/.test(r.pozitivni), 'Midjourney: parametri na koncu');
const mjNo = r.pozitivni.split(' --no ')[1] || '';
ok(mjNo.startsWith('gradient') && !/\btext\b|\bletters\b/.test(mjNo) && !r.pozitivni.includes(P.bloki.ne.en), 'Midjourney: --no brez text/letters pri predlogi z besedilom, brez stavka NE');
ok(!r.pozitivni.includes('\n'), 'Midjourney: ena vrstica');
ok(r.opozorila.some(t => t.includes('Midjourney')), 'Midjourney: opozorilo o besedilu');
r = J.sestavi(P, 'pasica', J.privzeto(P, J.predloga(P, 'pasica')), nast('en', 'midjourney'));
ok(r.pozitivni.includes('--no gradient, shadow, glow, neon, photo, text, letters'), 'Midjourney: --no s text, letters pri predlogi brez besedila');
ok(r.pozitivni.includes('--ar 21:8'), 'Midjourney: --ar iz formata');
r = J.sestavi(P, 'napoved', vNapoved, nast('en', 'sd'));
ok(r.pozitivni.startsWith(P.orodja.sd.predpona), 'SD: predpona');
ok(r.negativni.startsWith(P.bloki.ne.en) && !/(^|, )text(,|$)/.test(r.negativni.slice(P.bloki.ne.en.length)), 'SD: negativni = NE + seznam brez "text" pri predlogi z besedilom');
r = J.sestavi(P, 'napoved', vNapoved, nast('sl', 'ideogram'));
ok(r.pozitivni.endsWith(P.orodja.ideogram.zakljucek.sl), 'Ideogram: zaključek s paleto');
r = J.sestavi(P, 'napoved', vNapoved, nast('sl', 'chatgpt'));
ok(r.pozitivni.endsWith(P.orodja.chatgpt.zakljucek.sl) && r.pozitivni.startsWith(P.bloki.slog.sl), 'ChatGPT SL: slovenski bloki in zaključek');

// 3. Elementi.
const naslovna = J.predloga(P, 'naslovna');
const vN = J.privzeto(P, naslovna);
vN.elementi.ozadje = 'svetlo'; vN.elementi.plasti = 3; vN.elementi.sonce = 'levo';
r = J.sestavi(P, 'naslovna', vN, nast('en', 'univerzalno'));
ok(r.pozitivni.includes(P.bloki.slog_svetlo.en), 'svetlo ozadje doda SLOG_SVETLO');
ok(r.pozitivni.includes(P.elementi.greben['3-svetlo'].en), 'greben: 3 plasti, svetlo');
ok(r.pozitivni.includes(P.elementi.sonce.levo.en), 'sonce levo');
ok(!r.pozitivni.includes(P.bloki.tipo.en), 'naslovna brez TIPO');
vN.elementi.sonce = 'brez';
ok(J.sestavi(P, 'naslovna', vN, nast('en', 'univerzalno')).pozitivni.includes('no sun'), 'sonce brez');
const ikone = J.predloga(P, 'ikone');
const vI = J.privzeto(P, ikone); vI.elementi.ozadje = 'prosojno';
r = J.sestavi(P, 'ikone', vI, nast('en', 'univerzalno'));
ok(r.pozitivni.includes(P.bloki.temno.en) && !r.pozitivni.includes(P.bloki.slog.en), 'ikone prosojno: TEMNO brez SLOG');
ok(r.pozitivni.includes('arranged in a 4×3 grid'), 'mreža 12 ikon = 4×3');
vI.polja.ikone = { izbrane: [], svoj: 'a satellite dish; a QSL card' };
r = J.sestavi(P, 'ikone', vI, nast('en', 'univerzalno'));
ok(r.pozitivni.includes('Icons: a satellite dish; a QSL card.') && r.pozitivni.includes('2×1 grid'), 'svoje ikone, ločene s podpičjem');
vI.polja.ikone = { izbrane: [], svoj: '' };
r = J.sestavi(P, 'ikone', vI, nast('en', 'univerzalno'));
ok(r.opozorila.some(t => t.includes('prazen')) && !nezamenjano(r.pozitivni), 'prazen seznam: opozorilo, prompt brez rež');
const koraki = J.predloga(P, 'koraki');
const vK = J.primer(P, koraki, 'en'); vK.elementi.format = 'navpicno';
r = J.sestavi(P, 'koraki', vK, nast('en', 'midjourney'));
ok(r.pozitivni.includes('arranged vertically') && r.pozitivni.endsWith('--ar 4:5 --style raw --stylize 50'), 'format koraki navpično');
ok(J.sestavi(P, 'koraki', vK, nast('en', 'univerzalno')).pozitivni.includes('in 4 steps'), 'N = število vrstic');
vK.elementi.poudarki = ['puscice', 'zadnja'];
ok(J.sestavi(P, 'koraki', vK, nast('en', 'univerzalno')).opozorila.some(t => t.includes('oranžn')), 'dva poudarka: opozorilo o oranžni');
const cestitka = J.predloga(P, 'cestitka');
ok(J.sestavi(P, 'cestitka', J.primer(P, cestitka, 'en'), nast('en', 'univerzalno')).opozorila.length === 0, 'privzeti poudarki čestitke brez opozorila');

// 4. Prazna polja in posebni znaki.
const vP = J.privzeto(P, napoved);
r = J.sestavi(P, 'napoved', vP, nast('en', 'univerzalno'));
ok(r.pozitivni.includes('an empty solid text bar') && r.pozitivni.includes('Leave every empty text bar'), 'prazna polja: prazen trak in stavek');
ok(r.opozorila.some(t => t.includes('»Naslov«')), 'opozorilo za prazen naslov');
const vD = J.primer(P, napoved, 'en');
vD.polja.naslov = 'Zelo dolg naslov dogodka, ki gotovo ne gre v tri vrstice na kvadratni sliki';
ok(J.sestavi(P, 'napoved', vD, nast('en', 'univerzalno')).opozorila.some(t => t.includes('predolg')), 'opozorilo za predolg naslov');
vD.polja.naslov = 'Tečaj "CW" <b>&</b> čšž';
r = J.sestavi(P, 'napoved', vD, nast('en', 'univerzalno'));
ok(r.pozitivni.includes('"Tečaj »CW« <b>&</b> čšž"'), 'narekovaji v »«, HTML in šumniki dobesedno');
ok(J.citati('a "b" c "d') === 'a »b« c »d', 'citati: pari in osamljen narekovaj');
const lestvica = J.predloga(P, 'lestvica');
const vL = J.primer(P, lestvica, 'en');
vL.polja.vrstice = [{ klic: '', rezultat: '' }, { klic: 'S50C', rezultat: '' }];
r = J.sestavi(P, 'lestvica', vL, nast('en', 'univerzalno'));
ok(r.pozitivni.includes('Rows in order: 1. "S50C".') && r.pozitivni.includes('with 1 rows'), 'prazne vrstice se izpustijo, prazne celice brez ""');
vL.polja.vrstice = [];
r = J.sestavi(P, 'lestvica', vL, nast('en', 'univerzalno'));
ok(!nezamenjano(r.pozitivni) && r.pozitivni.includes('Rows in order: an empty solid text bar'), 'brez vrstic: prazen trak');
const urnik = J.predloga(P, 'urnik');
const vU = J.primer(P, urnik, 'sl'); vU.polja.kljucna = 99;
ok(J.sestavi(P, 'urnik', vU, nast('sl', 'univerzalno')).pozitivni.includes('Ključna postavka "Postavitev anten"'), 'poudarek izven obsega → prva vrstica');
const motivSvoj = J.privzeto(P, naslovna);
motivSvoj.polja.motiv = { izbran: 'svoj', svoj: 'a satellite dish', dodatno: 'brez', dodatnoSvoj: '' };
r = J.sestavi(P, 'naslovna', motivSvoj, nast('en', 'univerzalno'));
ok(r.pozitivni.includes('Composition: a satellite dish as') && r.pozitivni.includes('no additional elements'), 'svoj motiv in brez dodatnega');

// 5. Uvoz.
ok(J.preveriUvoz(P, null).ok === false && J.preveriUvoz(P, { verzija: 2 }).ok === false, 'uvoz: zavrne napačno verzijo');
let u = J.preveriUvoz(P, { verzija: 1, predloga: 'neznana', jezik: 'de', orodje: 'toString', tipo: 'da' });
ok(u.ok && u.stanje.predloga === P.predloge[0].id && u.stanje.jezik === 'en' && u.stanje.orodje === 'univerzalno' && u.stanje.tipo === true, 'uvoz: neveljavne vrednosti → privzete');
u = J.preveriUvoz(P, { verzija: 1, predloga: 'lestvica', vrednosti: { lestvica: { polja: { naslov: 5, vrstice: ['x', { klic: 'S59DGO', rezultat: 7, tuje: 1 }] }, elementi: { plasti: 7, format: 'xx', poudarki: [1, 'prvo'] } } } });
ok(u.ok, 'uvoz: poškodovane vrednosti sprejete');
const vu = u.stanje.vrednosti.lestvica;
ok(vu.polja.naslov === '' && vu.polja.vrstice.length === 1 && vu.polja.vrstice[0].klic === 'S59DGO' && vu.polja.vrstice[0].rezultat === '' && !('tuje' in vu.polja.vrstice[0]), 'uvoz: tipi polj očiščeni');
ok(JSON.stringify(vu.elementi.poudarki) === '["prvo"]', 'uvoz: poudarki le nizi');
r = J.sestavi(P, 'lestvica', vu, nast('en', 'midjourney'));
ok(!nezamenjano(r.pozitivni) && r.pozitivni.includes('--ar 4:5'), 'uvoz: neveljaven format in plasti ne podreta sestavljanja');
const vNaslovna = J.privzeto(P, naslovna); vNaslovna.elementi.plasti = 7; vNaslovna.elementi.sonce = 'x'; vNaslovna.elementi.ozadje = 'x';
ok(!nezamenjano(J.sestavi(P, 'naslovna', vNaslovna, nast('sl', 'univerzalno')).pozitivni), 'neveljavni elementi → privzeti');
```

- [ ] **Step 2: Poženi in preveri, da pade**

Run: `docker run --rm -v "$PWD:/app:ro" -w /app node:22-alpine node tests/prompti.test.mjs`
Expected: `AssertionError` / `TypeError: J.privzeto is not a function`.

- [ ] **Step 3: Napiši jedro**

Zamenjaj vsebino `<script id="jedro">` z:

```js
(function (koren) {
  'use strict';
  const PRAZNO = { en: 'an empty solid text bar', sl: 'prazen enobarven besedilni trak' };
  const PRAZNO_STAVEK = { en: 'Leave every empty text bar as a plain solid bar without letters.', sl: 'Vsak prazen besedilni trak pusti kot enobarven trak brez črk.' };
  const BREZ_DODATNO = { en: 'no additional elements', sl: 'brez dodatnih elementov' };
  const MJ_NO = ['gradient', 'shadow', 'glow', 'neon', 'photo', 'text', 'letters', 'watermark', 'face', 'frame'];

  const lastno = (o, k) => o != null && typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);

  function poId(seznam, id) {
    return (seznam || []).find(x => x.id === id) || null;
  }
  function predloga(P, id) {
    return poId(P.predloge, id) || P.predloge[0];
  }
  function moznosti(P, polje) {
    return typeof polje.moznosti === 'string' ? P[polje.moznosti] : polje.moznosti;
  }
  function vJeziku(v, jezik) {
    return v && typeof v === 'object' ? (v[jezik] || '') : (v || '');
  }
  function citati(s) {
    return String(s).replace(/"([^"]*)"/g, '»$1«').replace(/"/g, '»');
  }
  function praznaVrstica(f) {
    const r = {};
    f.stolpci.forEach(s => { r[s.id] = ''; });
    return r;
  }

  function privzeto(P, p) {
    const polja = {};
    (p.polja || []).forEach(f => {
      if (f.vrsta === 'vrstice') polja[f.id] = Array.from({ length: f.min }, () => praznaVrstica(f));
      else if (f.vrsta === 'poudarek') polja[f.id] = 0;
      else if (f.vrsta === 'izbira') polja[f.id] = { izbrana: moznosti(P, f)[0].id, svoj: '' };
      else if (f.vrsta === 'seznam') polja[f.id] = { izbrane: (f.privzete || []).slice(), svoj: '' };
      else if (f.vrsta === 'motiv') polja[f.id] = { izbran: P.motivi[0].id, svoj: '', dodatno: 'privzeto', dodatnoSvoj: '' };
      else polja[f.id] = '';
    });
    return {
      polja,
      elementi: {
        ozadje: p.ozadja ? p.ozadja[0].id : '',
        sonce: p.sonce ? 'desno' : '',
        plasti: p.greben ? 2 : 0,
        format: p.formati[0].id,
        poudarki: (p.poudarki || []).filter(x => x.privzeto).map(x => x.id)
      }
    };
  }

  function primer(P, p, jezik) {
    const v = privzeto(P, p), pr = p.primer || {};
    (p.polja || []).forEach(f => {
      if (!lastno(pr, f.id)) return;
      const x = pr[f.id];
      if (f.vrsta === 'vrstice') v.polja[f.id] = x.map(r => { const o = {}; f.stolpci.forEach((s, i) => { o[s.id] = r[i] || ''; }); return o; });
      else if (f.vrsta === 'poudarek') v.polja[f.id] = x;
      else if (f.vrsta === 'izbira') v.polja[f.id] = { izbrana: x, svoj: '' };
      else if (f.vrsta === 'seznam') v.polja[f.id] = { izbrane: x.slice(), svoj: '' };
      else if (f.vrsta === 'motiv') v.polja[f.id] = { izbran: x, svoj: '', dodatno: 'privzeto', dodatnoSvoj: '' };
      else v.polja[f.id] = vJeziku(x, jezik);
    });
    return v;
  }

  // Varni elementi: neznane vrednosti nadomesti s privzetimi.
  function elementi(P, p, e) {
    const oz = p.ozadja ? (poId(p.ozadja, e.ozadje) || p.ozadja[0]) : null;
    return {
      ozadje: oz,
      sonce: lastno(P.elementi.sonce, e.sonce) ? e.sonce : 'desno',
      plasti: e.plasti === 3 ? 3 : 2,
      format: poId(p.formati, e.format) || p.formati[0],
      poudarki: Array.isArray(e.poudarki) ? e.poudarki : []
    };
  }

  function vrstica(f, r, i, jezik) {
    let s = f.vrstica[jezik].split('{{#}}').join(String(i + 1));
    f.stolpci.forEach(st => { s = s.split('{{' + st.id + '}}').join(citati(String(r[st.id] || '').trim())); });
    return s
      .replace(/""/g, '')
      .replace(/\(\s*(icon:|ikona:)?\s*\)/g, '')
      .replace(/\s+[–:]\s*$/, '')
      .replace(/^\s*[–:]\s*/, '')
      .replace(/\s+[–:](\s+[–:])+/g, ' –')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
  const polna = (f, r) => r && f.stolpci.some(s => String(r[s.id] || '').trim());

  function reze(P, p, v, jezik) {
    const m = {}, prazna = [], opozorila = [], e = elementi(P, p, v.elementi || {});
    m.format = e.format[jezik];
    if (p.sonce) m.sonce = P.elementi.sonce[e.sonce][jezik];
    if (e.ozadje) m.ozadje = e.ozadje[jezik];
    if (p.greben) m.greben = P.elementi.greben[e.plasti + '-' + (e.ozadje && e.ozadje.id === 'svetlo' ? 'svetlo' : 'temno')][jezik];
    (p.poudarki || []).forEach(x => { m['p:' + x.id] = x[e.poudarki.includes(x.id) ? 'da' : 'ne'][jezik]; });
    (p.polja || []).forEach(f => {
      const x = v.polja[f.id];
      if (f.vrsta === 'vrstice') {
        const vrstice = (x || []).filter(r => polna(f, r)).map((r, i) => vrstica(f, r, i, jezik));
        m.N = String(vrstice.length);
        if (vrstice.length) m[f.id] = vrstice.join('; ');
        else { m[f.id] = null; prazna.push(f.oznaka); }
      } else if (f.vrsta === 'poudarek') {
        const vir = (v.polja[f.vir] || []).filter(r => r && polna(poId(p.polja, f.vir), r));
        const r = vir[x] || vir[0];
        const t = r ? citati(String(r[f.stolpec] || '').trim()) : '';
        m[f.id] = t || null;
      } else if (f.vrsta === 'izbira') {
        const vse = moznosti(P, f), o = poId(vse, x.izbrana);
        const svoj = f.svoj && x.izbrana === 'svoj' ? citati(String(x.svoj || '').trim()) : '';
        if (f.svoj && x.izbrana === 'svoj' && !svoj) opozorila.push('Pri polju »' + f.oznaka + '« vpiši svoj opis ali izberi možnost.');
        m[f.id] = o ? o[jezik] : (svoj || vse[0][jezik]);
      } else if (f.vrsta === 'seznam') {
        const vse = moznosti(P, f);
        const izbrani = vse.filter(o => x.izbrane.includes(o.id)).map(o => o[jezik])
          .concat(String(x.svoj || '').split(';').map(s => citati(s.trim())).filter(Boolean));
        if (!izbrani.length) { opozorila.push('Seznam »' + f.oznaka + '« je prazen; uporabljen je prvi element.'); izbrani.push(vse[0][jezik]); }
        const st = Math.ceil(Math.sqrt(izbrani.length));
        m[f.id] = izbrani.join('; ');
        m[f.id + '_N'] = String(izbrani.length);
        m[f.id + '_mreza'] = st + '×' + Math.ceil(izbrani.length / st);
      } else if (f.vrsta === 'motiv') {
        const mo = poId(P.motivi, x.izbran), svoj = citati(String(x.svoj || '').trim());
        if (!mo && !svoj) opozorila.push('Vpiši svoj motiv ali izberi enega s seznama.');
        const izbrani = mo || P.motivi[0];
        m.motiv = mo ? mo.motiv[jezik] : (svoj || izbrani.motiv[jezik]);
        const dSvoj = citati(String(x.dodatnoSvoj || '').trim());
        m.dodatno = x.dodatno === 'brez' ? BREZ_DODATNO[jezik]
          : x.dodatno === 'svoj' ? (dSvoj || BREZ_DODATNO[jezik])
          : (mo ? mo.dodatno[jezik] : BREZ_DODATNO[jezik]);
      } else {
        const t = citati(String(x || '').trim());
        if (!t) {
          if (f.vSliki) { m[f.id] = null; prazna.push(f.oznaka); }
          else m[f.id] = vJeziku(f.privzeto, jezik);
        } else {
          m[f.id] = t;
          if (f.vrstic && f.znakov && Math.ceil(t.length / f.znakov) > f.vrstic) {
            opozorila.push('»' + f.oznaka + '« je predolg: pri ' + t.length + ' znakih bo verjetno več kot ' + f.vrstic + (f.vrstic === 1 ? ' vrstica.' : ' vrstice.'));
          }
        }
      }
    });
    return { mapa: m, prazna, opozorila, e };
  }

  function uporabi(t, m, jezik) {
    Object.keys(m).forEach(k => {
      if (m[k] === null) t = t.split('"{{' + k + '}}"').join(PRAZNO[jezik]).split('{{' + k + '}}').join(PRAZNO[jezik]);
    });
    return t.replace(/\{\{([^}]+)\}\}/g, (cel, k) => (lastno(m, k) && m[k] !== null ? m[k] : cel));
  }
  function pocisti(t) {
    return t.replace(/ +([.,;])/g, '$1').replace(/ {2,}/g, ' ').trim();
  }

  function sestavi(P, idPredloge, v, n) {
    const p = predloga(P, idPredloge), j = n.jezik === 'sl' ? 'sl' : 'en', B = P.bloki;
    const idOrodja = lastno(P.orodja, n.orodje) ? n.orodje : 'univerzalno', o = P.orodja[idOrodja];
    const r = reze(P, p, v, j);
    const deli = [];
    if (idOrodja === 'sd') deli.push(o.predpona);
    if (p.slog) deli.push(B.slog[j]);
    if (r.e.ozadje && r.e.ozadje.blok) deli.push(B[r.e.ozadje.blok][j]);
    if (p.tipo && n.tipo) deli.push(B.tipo[j]);
    deli.push(pocisti(uporabi(p.besedilo[j], r.mapa, j)));
    if (Object.values(r.mapa).some(x => x === null)) deli.push(PRAZNO_STAVEK[j]);
    let negativni = null;
    if (idOrodja === 'sd') {
      const seznam = o.negativ.filter(x => !(p.tipo && x === 'text')).join(', ');
      negativni = n.ne ? B.ne[j] + ' ' + seznam : seznam;
    } else if (idOrodja !== 'midjourney' && n.ne) {
      deli.push(B.ne[j]);
    }
    if (o.zakljucek) deli.push(o.zakljucek[j]);
    let pozitivni;
    if (idOrodja === 'midjourney') {
      pozitivni = deli.join(' ');
      if (n.ne) pozitivni += ' --no ' + MJ_NO.filter(x => !(p.tipo && (x === 'text' || x === 'letters'))).join(', ');
      pozitivni += ' --ar ' + r.e.format.ar + ' --style raw --stylize 50';
    } else {
      pozitivni = deli.join('\n');
    }
    const opozorila = r.opozorila.slice();
    if (o.besedilo === false && p.tipo) opozorila.unshift(o.ime + ' besedila ne izpiše zanesljivo; besedilo dodaj naknadno v Canvi ali Inkscapu.');
    r.prazna.forEach(x => opozorila.push('Polje »' + x + '« je prazno – v sliki bo prazen trak.'));
    if (r.e.poudarki.filter(x => poId(p.poudarki, x)).length > 1) opozorila.push('Izbranih je več oranžnih poudarkov; pravilo teme je oranžna največ 10 % slike.');
    return { pozitivni, negativni, opozorila };
  }

  function zacetno(P) {
    return { verzija: 1, predloga: P.predloge[0].id, jezik: 'en', orodje: 'univerzalno', tipo: true, ne: true, vrednosti: {} };
  }

  // Obdrži obliko privzete vrednosti; tuje ključe in napačne tipe zavrže.
  function ocisti(priv, u) {
    if (Array.isArray(priv)) {
      if (!Array.isArray(u)) return priv;
      const vz = priv[0];
      if (vz === undefined || typeof vz === 'string') return u.filter(x => typeof x === 'string');
      return u.filter(x => x && typeof x === 'object' && !Array.isArray(x)).map(x => ocisti(vz, x));
    }
    if (priv && typeof priv === 'object') {
      const o = {};
      Object.keys(priv).forEach(k => { o[k] = u && typeof u === 'object' && !Array.isArray(u) && lastno(u, k) ? ocisti(priv[k], u[k]) : priv[k]; });
      return o;
    }
    return typeof u === typeof priv ? u : priv;
  }

  function preveriUvoz(P, obj) {
    if (!obj || typeof obj !== 'object' || obj.verzija !== 1) return { ok: false, napaka: 'Datoteka ni izvoz tega orodja (manjka "verzija": 1).' };
    const s = zacetno(P);
    if (poId(P.predloge, obj.predloga)) s.predloga = obj.predloga;
    if (obj.jezik === 'en' || obj.jezik === 'sl') s.jezik = obj.jezik;
    if (lastno(P.orodja, obj.orodje)) s.orodje = obj.orodje;
    if (typeof obj.tipo === 'boolean') s.tipo = obj.tipo;
    if (typeof obj.ne === 'boolean') s.ne = obj.ne;
    const vr = obj.vrednosti && typeof obj.vrednosti === 'object' ? obj.vrednosti : {};
    P.predloge.forEach(p => { if (lastno(vr, p.id)) s.vrednosti[p.id] = ocisti(privzeto(P, p), vr[p.id]); });
    return { ok: true, stanje: s };
  }

  koren.S59DGO_JEDRO = { poId, predloga, moznosti, privzeto, primer, sestavi, zacetno, preveriUvoz, citati };
})(globalThis);
```

Opomba k `ocisti`: privzeta vrednost `vrstice` ima vsaj `min` vrstic, zato je `priv[0]` vzorec vrstice; `poudarki` in `izbrane` sta seznama nizov.

- [ ] **Step 4: Poženi teste in popravi do zelenega**

Run: `docker run --rm -v "$PWD:/app:ro" -w /app node:22-alpine node tests/prompti.test.mjs`
Expected: `OK: prompti.test.mjs, N preverjanj` (N > 700). Če test pade zaradi besedila predloge (npr. ostanek `""` pri praznem polju), popravi **podatke predloge** v Task 3 obliki, ne testa.

- [ ] **Step 5: Poženi vse teste**

Run: `bin/test.sh`
Expected: vse `OK`.

- [ ] **Step 6: Commit**

```bash
git add docs/orodja/s59dgo-prompti.html tests/prompti.test.mjs
git commit -m "Generator promptov: jedro za sestavljanje, primere in uvoz s testi

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Vmesnik – obrazec, izhod, kopiranje

**Files:**
- Modify: `docs/orodja/s59dgo-prompti.html` (`<script id="vmesnik">`)

**Interfaces:**
- Consumes: `window.S59DGO_JEDRO` (Task 4), `window.S59DGO_PREDOGLED.izrisi(svg, P, predloga, vrednosti)` (prazna do Task 6), ID-ji iz Task 1.
- Produces: `posodobi()` kliče izris predogleda in shranjevanje; Task 7 doda `shrani()`/`nalozi()` v isti skripti (v tej nalogi sta prazni).

- [ ] **Step 1: Napiši vmesnik**

Zamenjaj vsebino `<script id="vmesnik">` z:

```js
(function () {
  'use strict';
  const J = window.S59DGO_JEDRO;
  const P = JSON.parse(document.getElementById('podatki').textContent);
  const $ = id => document.getElementById(id);
  let stanje = nalozi();
  let stevecId = 0;
  const nid = () => 'v' + (++stevecId);
  let poudarkiIzbirniki = [];

  // SHRANJEVANJE-ZAČETEK (Task 7)
  function nalozi() { return J.zacetno(P); }
  function shrani() {}
  // SHRANJEVANJE-KONEC

  const tp = () => J.predloga(P, stanje.predloga);
  function vr() {
    const p = tp();
    if (!stanje.vrednosti[p.id]) stanje.vrednosti[p.id] = J.privzeto(P, p);
    return stanje.vrednosti[p.id];
  }

  function el(tag, lastnosti, ...otroci) {
    const e = document.createElement(tag);
    Object.entries(lastnosti || {}).forEach(([k, v]) => {
      if (k === 'besedilo') e.textContent = v;
      else if (v === true) e.setAttribute(k, '');
      else if (v !== false && v != null) e.setAttribute(k, v);
    });
    otroci.forEach(o => { if (o) e.appendChild(o); });
    return e;
  }

  function vnosnoPolje(oznaka, vrednost, ob, o = {}) {
    const id = nid();
    const vnos = el(o.dolgo ? 'textarea' : 'input', { id, type: o.dolgo ? null : 'text', maxlength: o.max || 200, placeholder: o.namig || null, rows: o.dolgo ? 2 : null, autocomplete: 'off' });
    vnos.value = vrednost || '';
    vnos.addEventListener('input', () => { ob(vnos.value); posodobi(); });
    return el('div', { class: 'polje' }, el('label', { for: id, besedilo: oznaka }), vnos);
  }

  function izbirnik(oznaka, moznosti, izbrana, ob) {
    const id = nid();
    const sel = el('select', { id });
    moznosti.forEach(([val, ime]) => sel.appendChild(el('option', { value: val, besedilo: ime })));
    sel.value = izbrana;
    sel.addEventListener('change', () => ob(sel.value));
    return { ovoj: el('div', { class: 'polje' }, el('label', { for: id, besedilo: oznaka }), sel), sel };
  }

  const POLJA = {
    besedilo(f, v) {
      const oznaka = f.vSliki ? f.oznaka : f.oznaka + ' (opis, ne izpiše se)';
      return vnosnoPolje(oznaka, v.polja[f.id], x => { v.polja[f.id] = x; }, { max: f.max, namig: f.namig, dolgo: f.max > 90 });
    },
    datum(f, v) { return POLJA.besedilo(f, v); },
    vrstice(f, v) {
      const vrstice = v.polja[f.id];
      const fs = el('fieldset', null, el('legend', { besedilo: f.oznaka + ' (' + vrstice.length + ')' }));
      vrstice.forEach((r, i) => {
        const vrsta = el('div', { class: 'vrstica', style: '--stolpcev:' + f.stolpci.length });
        f.stolpci.forEach(s => {
          const vnos = el('input', { type: 'text', maxlength: s.max, placeholder: s.oznaka, 'aria-label': s.oznaka + ' ' + (i + 1), autocomplete: 'off' });
          vnos.value = r[s.id] || '';
          vnos.addEventListener('input', () => { r[s.id] = vnos.value; posodobi(); });
          vrsta.appendChild(vnos);
        });
        const odstrani = el('button', { type: 'button', class: 'gumb gumb--tih', 'aria-label': 'Odstrani vrstico ' + (i + 1), besedilo: '✕', disabled: vrstice.length <= f.min });
        odstrani.addEventListener('click', () => { vrstice.splice(i, 1); izrisiPolja(); posodobi(); });
        vrsta.appendChild(odstrani);
        fs.appendChild(vrsta);
      });
      const dodaj = el('button', { type: 'button', class: 'gumb gumb--tih', besedilo: '+ Dodaj vrstico', disabled: vrstice.length >= f.max });
      dodaj.addEventListener('click', () => {
        const nova = {};
        f.stolpci.forEach(s => { nova[s.id] = ''; });
        vrstice.push(nova);
        izrisiPolja();
        posodobi();
        const vnosi = $('polja').querySelectorAll('.vrstica input');
        if (vnosi.length) vnosi[vnosi.length - f.stolpci.length].focus();
      });
      fs.appendChild(dodaj);
      return fs;
    },
    poudarek(f, v, p) {
      const { ovoj, sel } = izbirnik(f.oznaka, [], '', x => { v.polja[f.id] = Number(x); posodobi(); });
      poudarkiIzbirniki.push({ sel, f, v, p });
      return ovoj;
    },
    izbira(f, v) {
      const x = v.polja[f.id];
      const moz = J.moznosti(P, f).map(o => [o.id, o.ime]);
      if (f.svoj) moz.push(['svoj', 'Svoj opis …']);
      const ovoj = el('div');
      const svoj = vnosnoPolje('Svoj opis (' + f.oznaka.toLowerCase() + ')', x.svoj, t => { x.svoj = t; }, { max: 160, namig: 'v jeziku prompta' });
      const izb = izbirnik(f.oznaka, moz, x.izbrana, val => { x.izbrana = val; svoj.hidden = val !== 'svoj'; posodobi(); });
      svoj.hidden = x.izbrana !== 'svoj';
      ovoj.append(izb.ovoj, svoj);
      return ovoj;
    },
    seznam(f, v) {
      const x = v.polja[f.id];
      const fs = el('fieldset', null, el('legend', { besedilo: f.oznaka }));
      const kl = el('div', { class: 'kljukice' });
      J.moznosti(P, f).forEach(o => {
        const cb = el('input', { type: 'checkbox', value: o.id });
        cb.checked = x.izbrane.includes(o.id);
        cb.addEventListener('change', () => {
          x.izbrane = J.moznosti(P, f).map(m => m.id).filter(id => (id === o.id ? cb.checked : x.izbrane.includes(id)));
          posodobi();
        });
        kl.appendChild(el('label', null, cb, document.createTextNode(o.ime)));
      });
      fs.appendChild(kl);
      fs.appendChild(vnosnoPolje('Dodatni (ločeni s podpičjem, v jeziku prompta)', x.svoj, t => { x.svoj = t; }, { max: 300 }));
      return fs;
    },
    motiv(f, v) {
      const x = v.polja[f.id];
      const ovoj = el('div');
      const svoj = vnosnoPolje('Svoj motiv (v jeziku prompta)', x.svoj, t => { x.svoj = t; }, { max: 200 });
      const dSvoj = vnosnoPolje('Svoj dodatni element', x.dodatnoSvoj, t => { x.dodatnoSvoj = t; }, { max: 200 });
      const m = izbirnik(f.oznaka, P.motivi.map(o => [o.id, o.ime]).concat([['svoj', 'Svoj opis …']]), x.izbran, val => { x.izbran = val; svoj.hidden = val !== 'svoj'; posodobi(); });
      const d = izbirnik('Dodatni element', [['privzeto', 'Iz motiva'], ['brez', 'Brez'], ['svoj', 'Svoj opis …']], x.dodatno, val => { x.dodatno = val; dSvoj.hidden = val !== 'svoj'; posodobi(); });
      svoj.hidden = x.izbran !== 'svoj';
      dSvoj.hidden = x.dodatno !== 'svoj';
      ovoj.append(m.ovoj, svoj, d.ovoj, dSvoj);
      return ovoj;
    }
  };

  function osveziPoudarke() {
    poudarkiIzbirniki.forEach(({ sel, f, v, p }) => {
      const stolpci = J.poId(p.polja, f.vir).stolpci;
      const polne = v.polja[f.vir].filter(r => stolpci.some(s => String(r[s.id] || '').trim()));
      const izbrana = Math.min(v.polja[f.id] || 0, Math.max(polne.length - 1, 0));
      sel.replaceChildren(...(polne.length ? polne : [{}]).map((r, i) => el('option', { value: i, besedilo: (i + 1) + '. ' + (r[f.stolpec] || r[stolpci[0].id] || '(prazno)') })));
      sel.value = String(izbrana);
    });
  }

  function izrisiPolja() {
    const p = tp(), v = vr(), box = $('polja');
    poudarkiIzbirniki = [];
    box.replaceChildren(...(p.polja || []).map(f => POLJA[f.vrsta](f, v, p)));
    $('korak-besedilo').hidden = !(p.polja || []).length;
  }

  function skupinaGumbov(naslov, moznosti, izbrana, ob) {
    const ime = nid();
    const fs = el('fieldset', { class: 'gumbi' }, el('legend', { besedilo: naslov }));
    moznosti.forEach(([val, oznaka]) => {
      const r = el('input', { type: 'radio', name: ime, value: val });
      r.checked = val === izbrana;
      r.addEventListener('change', () => { ob(val); posodobi(); });
      fs.appendChild(el('label', null, r, el('span', { besedilo: oznaka })));
    });
    return fs;
  }

  function izrisiElemente() {
    const p = tp(), e = vr().elementi, box = $('elementi');
    box.replaceChildren();
    if (p.ozadja && p.ozadja.length > 1) box.appendChild(skupinaGumbov('Ozadje', p.ozadja.map(o => [o.id, o.ime]), e.ozadje, x => { e.ozadje = x; }));
    if (p.sonce) box.appendChild(skupinaGumbov('Sonce', Object.entries(P.elementi.sonce).map(([k, s]) => [k, s.ime]), e.sonce, x => { e.sonce = x; }));
    if (p.greben) box.appendChild(skupinaGumbov('Plasti grebena', [['2', '2'], ['3', '3']], String(e.plasti), x => { e.plasti = Number(x); }));
    if (p.formati.length > 1) box.appendChild(skupinaGumbov('Format', p.formati.map(f => [f.id, f.ime]), e.format, x => { e.format = x; }));
    if (p.poudarki && p.poudarki.length) {
      const fs = el('fieldset', null, el('legend', { besedilo: 'Oranžni poudarek' }));
      const kl = el('div', { class: 'kljukice' });
      p.poudarki.forEach(x => {
        const cb = el('input', { type: 'checkbox', value: x.id });
        cb.checked = e.poudarki.includes(x.id);
        cb.addEventListener('change', () => {
          e.poudarki = p.poudarki.map(y => y.id).filter(id => (id === x.id ? cb.checked : e.poudarki.includes(id)));
          posodobi();
        });
        kl.appendChild(el('label', null, cb, document.createTextNode(x.ime)));
      });
      fs.appendChild(kl);
      box.appendChild(fs);
    }
    $('korak-elementi').hidden = !box.children.length;
  }

  function kopiraj(t, gumb, pre) {
    const uspeh = () => {
      gumb.textContent = 'Kopirano';
      gumb.classList.add('gumb--kopirano');
      setTimeout(() => { gumb.textContent = 'Kopiraj'; gumb.classList.remove('gumb--kopirano'); }, 2000);
    };
    const rocno = () => {
      const izbor = window.getSelection(), obseg = document.createRange();
      obseg.selectNodeContents(pre);
      izbor.removeAllRanges();
      izbor.addRange(obseg);
      gumb.textContent = 'Označeno – Cmd/Ctrl+C';
      setTimeout(() => { gumb.textContent = 'Kopiraj'; }, 3000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(uspeh, rocno);
    else rocno();
  }

  function blokIzhoda(naslov, besedilo) {
    const pre = el('pre', { tabindex: '0', besedilo });
    const gumb = el('button', { type: 'button', class: 'gumb', besedilo: 'Kopiraj' });
    gumb.addEventListener('click', () => kopiraj(besedilo, gumb, pre));
    return el('div', { class: 'izhod__blok' }, el('div', { class: 'izhod__glava' }, el('h3', { besedilo: naslov }), gumb), pre);
  }

  function posodobi() {
    const p = tp(), v = vr();
    const r = J.sestavi(P, p.id, v, { jezik: stanje.jezik, orodje: stanje.orodje, tipo: stanje.tipo, ne: stanje.ne });
    const bloki = [blokIzhoda(r.negativni ? 'Pozitivni prompt' : 'Prompt', r.pozitivni)];
    if (r.negativni) bloki.push(blokIzhoda('Negativni prompt', r.negativni));
    $('bloki-izhoda').replaceChildren(...bloki);
    $('stevec').textContent = r.pozitivni.length + ' znakov' + (r.negativni ? ' · negativni ' + r.negativni.length : '');
    $('opozorila').replaceChildren(...r.opozorila.map(t => el('li', { besedilo: t })));
    $('opozorila').hidden = !r.opozorila.length;
    osveziPoudarke();
    window.S59DGO_PREDOGLED.izrisi($('predogled'), P, p, v);
    shrani();
  }

  function izrisiVse() {
    const p = tp();
    $('predloga').value = p.id;
    $('opis-predloge').textContent = p.opis;
    $('polje-tipo').hidden = !p.tipo;
    $('tipo').checked = stanje.tipo;
    $('ne').checked = stanje.ne;
    $('orodje').value = stanje.orodje;
    document.querySelectorAll('input[name=jezik]').forEach(r => { r.checked = r.value === stanje.jezik; });
    izrisiPolja();
    izrisiElemente();
    posodobi();
  }

  function zacni() {
    const skupine = {};
    P.predloge.forEach(p => {
      if (!skupine[p.skupina]) skupine[p.skupina] = $('predloga').appendChild(el('optgroup', { label: p.skupina }));
      skupine[p.skupina].appendChild(el('option', { value: p.id, besedilo: p.ime }));
    });
    Object.entries(P.orodja).forEach(([id, o]) => $('orodje').appendChild(el('option', { value: id, besedilo: o.ime })));
    $('predloga').addEventListener('change', e => { stanje.predloga = e.target.value; izrisiVse(); });
    $('orodje').addEventListener('change', e => { stanje.orodje = e.target.value; posodobi(); });
    $('tipo').addEventListener('change', e => { stanje.tipo = e.target.checked; posodobi(); });
    $('ne').addEventListener('change', e => { stanje.ne = e.target.checked; posodobi(); });
    document.querySelectorAll('input[name=jezik]').forEach(r => r.addEventListener('change', () => { stanje.jezik = r.value; posodobi(); }));
    $('gumb-primer').addEventListener('click', () => { const p = tp(); stanje.vrednosti[p.id] = J.primer(P, p, stanje.jezik); izrisiVse(); });
    $('gumb-ponastavi').addEventListener('click', () => { const p = tp(); stanje.vrednosti[p.id] = J.privzeto(P, p); izrisiVse(); });
    // DATOTEKE (Task 7)
    izrisiVse();
  }

  zacni();
})();
```

- [ ] **Step 2: Preveri v brskalniku**

Run: `open docs/orodja/s59dgo-prompti.html` (Chrome). Preveri ročno in s konzolo (DevTools):
- Konzola brez napak ob nalaganju.
- Izbirnik ima 4 skupine in 15 predlog; ob menjavi se obrazec zamenja, opis se posodobi.
- »Izpolni s primerom« pri »Napoved dogodka« izpolni polja; prompt vsebuje `"Field day na Sviščakih"`.
- Lestvica: »+ Dodaj vrstico« do 10, nato onemogočen; ✕ onemogočen pri 2 vrsticah; izbirnik »poudarek« pri tehnični kartici sledi vpisanim vrednostim.
- Midjourney: prompt v eni vrstici z `--ar`; SD: dva bloka s svojima gumboma.
- »Kopiraj« kopira (prilepi v urejevalnik), gumb za 2 s kaže »Kopirano«.
- Opozorila se pokažejo ob praznem naslovu in izginejo, ko je vpisan.

- [ ] **Step 3: Poženi teste (vmesnik ne sme pokvariti jedra)**

Run: `bin/test.sh`
Expected: vse `OK`.

- [ ] **Step 4: Commit**

```bash
git add docs/orodja/s59dgo-prompti.html
git commit -m "Generator promptov: obrazec, izbira elementov, izhod in kopiranje

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Shematski predogled (SVG)

**Files:**
- Modify: `docs/orodja/s59dgo-prompti.html` (`<script id="predogled-js">`)

**Interfaces:**
- Consumes: `P`, predloga z `shema` (Task 3), vrednosti (Task 4), `J.poId`.
- Produces: `window.S59DGO_PREDOGLED.izrisi(svg, P, predloga, vrednosti)` – izriše v podani `<svg>`; vse besedilo prek `textContent`.

Pomen elementov sheme (koordinate v % slike, `v` = velikost pisave v % širine):

| `t` | Lastnosti | Izris |
|---|---|---|
| `pas` | `x,y,w,h,barva,r?` | pravokotnik; `r` v % širine |
| `sonce` | `y` | oranžen krog levo/desno po elementu `sonce`; nič, če `brez` ali predloga nima sonca |
| `greben` | `od, do, barve? \| barvePo?` | plasti kotnih silhuet; brez `barve` po elementih `plasti`/`ozadje` |
| `besedilo` | `polje \| polja[], x, y, v, barva, krepko?, verzalke?, pisava?("n"), sirina?, vrstic?` | prelomljeno besedilo; prazno → prosojen trak |
| `staticno` | `besedilo, x, y, v, barva, verzalke?` | fiksno besedilo |
| `znacka` | `polje, x, y, v, poudarek, barvaNe?, besediloNe?` | zaobljena značka; oranžna, če je poudarek vklopljen |
| `vrstice` | `polje, x, y, w, h, palice? \| krogi? \| kljucVrednost?, poudarek?` | vrstice lestvice / časovnice / ključ–vrednost |
| `ploscice` | `polje, x, y, w, h, stolpcev, poudarek` | mreža ploščic s številko in oznako |
| `koraki` | `polje, x, y, w, h, puscice, zadnja` | ploščice korakov, vodoravno ali navpično (po formatu) |
| `motiv` | `x, y, w, h, barva ("auto" = svetlo/temno)` | jambor z Yagi anteno in loki |
| `pokal` | `x, y, w, h, poudarek` | pokal, oranžen ali ledeno moder |
| `krog` | `x, y, r, barva` | poln krog |
| `celice` | `polje, x, y, w, h, barve, poudarek?` | mreža celic po številu izbranih elementov seznama |

- [ ] **Step 1: Napiši predogled**

Zamenjaj vsebino `<script id="predogled-js">` z:

```js
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const OZADJA = { temno: '#15304f', svetlo: '#eef3f8', bela: '#ffffff', prosojno: '#ffffff' };
  const GREBENI = { '2-temno': ['#1f4470', '#2a5687'], '3-temno': ['#b9d0e6', '#1f4470', '#2a5687'], '2-svetlo': ['#b9d0e6', '#2a5687'], '3-svetlo': ['#b9d0e6', '#2a5687', '#15304f'] };
  const OBLIKE = [
    [0, .5, 12, .2, 24, .42, 38, 0, 50, .3, 62, .1, 76, .36, 88, .16, 100, .42],
    [0, .58, 14, .32, 28, .52, 44, .18, 58, .48, 72, .28, 86, .52, 100, .38],
    [0, .74, 18, .5, 34, .68, 52, .44, 70, .7, 86, .5, 100, .64]
  ];
  const ORANZNA = '#d9702a';

  function s(tag, a, besedilo) {
    const e = document.createElementNS(NS, tag);
    Object.keys(a || {}).forEach(k => e.setAttribute(k, a[k]));
    if (besedilo != null) e.textContent = besedilo;
    return e;
  }
  function prelomi(t, n) {
    const out = [];
    let vr = '';
    t.split(/\s+/).forEach(b => {
      if (vr && (vr + ' ' + b).length > n) { out.push(vr); vr = b; } else vr = (vr + ' ' + b).trim();
    });
    if (vr) out.push(vr);
    return out;
  }

  function izrisi(svg, P, p, v) {
    const J = window.S59DGO_JEDRO, e = v.elementi || {};
    const f = J.poId(p.formati, e.format) || p.formati[0];
    const W = 1000, H = Math.round(W * f.h / f.w);
    const oz = p.ozadja ? (J.poId(p.ozadja, e.ozadje) || p.ozadja[0]).id : '';
    const sh = p.shema || {};
    const c = {
      P, p, v, e, W, H, oz, J,
      X: x => x * W / 100,
      Y: y => y * H / 100,
      barva: x => (x.barve ? x.barve[oz] : x.barva === 'auto' ? (oz === 'svetlo' ? '#15304f' : '#b9d0e6') : x.barva),
      poudarek: id => !id || (e.poudarki || []).includes(id)
    };
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.replaceChildren();
    svg.appendChild(s('rect', { width: W, height: H, fill: (sh.ozadja && sh.ozadja[oz]) || sh.ozadje || OZADJA[oz] || OZADJA.temno }));
    if (oz === 'prosojno') sahovnica(svg, c);
    (sh.elementi || []).forEach(x => { if (ELEMENTI[x.t]) ELEMENTI[x.t](svg, x, c); });
    (f.varno || []).forEach(r => svg.appendChild(s('rect', { x: c.X(r.x) + 3, y: c.Y(r.y) + 3, width: c.X(r.w) - 6, height: c.Y(r.h) - 6, fill: 'none', stroke: ORANZNA, 'stroke-width': 4, 'stroke-dasharray': '14 10' })));
  }

  function sahovnica(svg, c) {
    const g = s('g', { fill: '#e6ecf2' }), k = 40;
    for (let y = 0; y < c.H; y += k) for (let x = (y / k) % 2 ? k : 0; x < c.W; x += 2 * k) g.appendChild(s('rect', { x, y, width: k, height: k }));
    svg.appendChild(g);
  }

  function besedilo(svg, t, x, c) {
    const v = x.v * c.W / 100, sirina = c.X(x.sirina || 80);
    if (!t) {
      svg.appendChild(s('rect', { x: c.X(x.x), y: c.Y(x.y) - v * .8, width: sirina * .5, height: v * .8, rx: 4, fill: x.barva, opacity: .28 }));
      return;
    }
    if (x.verzalke) t = t.toUpperCase();
    const vrstice = prelomi(t, Math.max(4, Math.floor(sirina / (v * (x.verzalke ? .68 : .56))))).slice(0, x.vrstic || 1);
    const tx = s('text', { x: c.X(x.x), y: c.Y(x.y), fill: x.barva, 'font-size': v, 'font-family': x.pisava === 'n' ? 'Space Grotesk, Trebuchet MS, Arial, sans-serif' : 'IBM Plex Sans, Arial, sans-serif', 'font-weight': x.krepko ? 700 : 400, 'letter-spacing': x.verzalke ? v * .08 : 0 });
    vrstice.forEach((r, i) => tx.appendChild(s('tspan', { x: c.X(x.x), dy: i ? v * 1.12 : 0 }, r)));
    svg.appendChild(tx);
  }
  const polne = (c, id) => {
    const f = c.J.poId(c.p.polja, id);
    return (c.v.polja[id] || []).filter(r => f.stolpci.some(st => String(r[st.id] || '').trim()));
  };
  const izbranaVrstica = (c, id) => (id ? Math.min(Number(c.v.polja[id]) || 0, 99) : -1);

  function greben(svg, od, d, barve, c) {
    barve.forEach((b, i) => {
      const o = OBLIKE[OBLIKE.length - barve.length + i];
      let pot = 'M0 ' + c.Y(d);
      for (let k = 0; k < o.length; k += 2) pot += ' L' + c.X(o[k]) + ' ' + (c.Y(od) + o[k + 1] * (c.Y(d) - c.Y(od)));
      svg.appendChild(s('path', { d: pot + ' L' + c.W + ' ' + c.Y(d) + ' Z', fill: b }));
    });
  }

  function antena(svg, x, b, c) {
    const cx = c.X(x.x + x.w / 2), vrh = c.Y(x.y), dno = c.Y(x.y + x.h), w = c.X(x.w), h = dno - vrh;
    svg.appendChild(s('rect', { x: cx - w * .05, y: vrh + h * .22, width: w * .1, height: h * .78, fill: b }));
    [0, 1].forEach(i => {
      const y = vrh + h * (.28 + i * .16);
      svg.appendChild(s('rect', { x: cx - w * .42, y, width: w * .84, height: w * .05, fill: b }));
      for (let k = 0; k < 5; k++) svg.appendChild(s('rect', { x: cx - w * .38 + k * w * .18, y: y - w * .12, width: w * .04, height: w * .28, fill: b }));
    });
    [.45, .75].forEach((r, i) => svg.appendChild(s('path', { d: 'M' + (cx - w * r) + ' ' + (vrh + h * .12) + ' A' + w * r + ' ' + w * r + ' 0 0 1 ' + (cx + w * r) + ' ' + (vrh + h * .12), fill: 'none', stroke: b, 'stroke-width': w * .04, 'stroke-linecap': 'round', opacity: .85 - i * .35 })));
  }

  const ELEMENTI = {
    pas(svg, x, c) { svg.appendChild(s('rect', { x: c.X(x.x), y: c.Y(x.y), width: c.X(x.w), height: c.Y(x.h), rx: x.r ? c.X(x.r) : 0, fill: c.barva(x) })); },
    krog(svg, x, c) { svg.appendChild(s('circle', { cx: c.X(x.x), cy: c.Y(x.y), r: c.X(x.r), fill: x.barva })); },
    sonce(svg, x, c) {
      if (!c.p.sonce || c.e.sonce === 'brez') return;
      svg.appendChild(s('circle', { cx: c.X(c.e.sonce === 'levo' ? 12 : 88), cy: c.Y(x.y), r: Math.min(c.W, c.H) * .055, fill: ORANZNA }));
    },
    greben(svg, x, c) {
      const kljuc = (c.e.plasti === 3 ? 3 : 2) + '-' + (c.oz === 'svetlo' ? 'svetlo' : 'temno');
      greben(svg, x.od, x.do, x.barve || (x.barvePo && x.barvePo[c.oz]) || GREBENI[kljuc], c);
    },
    besedilo(svg, x, c) {
      const t = x.polja ? x.polja.map(id => String(c.v.polja[id] || '').trim()).filter(Boolean).join(' · ') : String(c.v.polja[x.polje] || '').trim();
      besedilo(svg, t, x, c);
    },
    staticno(svg, x, c) { besedilo(svg, x.besedilo, Object.assign({ sirina: 90 }, x), c); },
    znacka(svg, x, c) {
      const vkl = c.poudarek(x.poudarek), v = x.v * c.W / 100;
      const t = String(c.v.polja[x.polje] || '').trim().toUpperCase() || '·····';
      const w = t.length * v * .7 + v * 1.6;
      svg.appendChild(s('rect', { x: c.X(x.x), y: c.Y(x.y) - v * 1.25, width: w, height: v * 1.8, rx: v * .35, fill: vkl ? ORANZNA : (x.barvaNe || '#b9d0e6') }));
      svg.appendChild(s('text', { x: c.X(x.x) + v * .8, y: c.Y(x.y), fill: vkl ? '#ffffff' : (x.besediloNe || '#15304f'), 'font-size': v, 'font-weight': 600, 'letter-spacing': v * .1, 'font-family': 'IBM Plex Sans, Arial, sans-serif' }, t));
    },
    vrstice(svg, x, c) {
      const f = c.J.poId(c.p.polja, x.polje), vrstice = polne(c, x.polje);
      const n = Math.max(vrstice.length, 1), rh = Math.min(c.Y(x.h) / n, c.Y(x.h) / 4), v = Math.min(rh * .42, c.W * .03);
      // pri lestvici je poudarek id poudarka predloge (prva vrstica), sicer id polja z izbrano vrstico
      const izb = !x.poudarek ? -1 : x.palice ? (c.poudarek(x.poudarek) ? 0 : -1) : Math.min(izbranaVrstica(c, x.poudarek), vrstice.length - 1);
      const stevila = vrstice.map(r => parseFloat(String(r[f.stolpci[f.stolpci.length - 1].id] || '').replace(/[^\d,.]/g, '').replace(',', '.')) || 0);
      const max = Math.max(...stevila, 1);
      vrstice.forEach((r, i) => {
        const y = c.Y(x.y) + i * rh, oranzno = izb >= 0 && i === izb;
        if (x.palice) {
          svg.appendChild(s('rect', { x: c.X(x.x), y: y + rh * .12, width: c.X(x.w) * (.35 + .65 * stevila[i] / max), height: rh * .76, rx: 4, fill: oranzno ? ORANZNA : '#2a5687' }));
          svg.appendChild(s('text', { x: c.X(x.x) + v * .6, y: y + rh * .5 + v * .35, fill: '#ffffff', 'font-size': v, 'font-weight': 700, 'font-family': 'Space Grotesk, Arial, sans-serif' }, (i + 1) + '. ' + f.stolpci.map(st => r[st.id]).filter(Boolean).join('   ')));
        } else if (x.krogi) {
          svg.appendChild(s('rect', { x: c.X(x.x) + v * .45, y: y, width: 3, height: rh, fill: '#d3dfeb' }));
          svg.appendChild(s('circle', { cx: c.X(x.x) + v * .5, cy: y + rh * .45, r: v * .5, fill: oranzno ? ORANZNA : '#2a5687' }));
          svg.appendChild(s('text', { x: c.X(x.x) + v * 1.6, y: y + rh * .45 + v * .35, fill: '#172433', 'font-size': v, 'font-family': 'IBM Plex Sans, Arial, sans-serif' }, f.stolpci.map(st => r[st.id]).filter(Boolean).join(' · ')));
        } else {
          const [k, vr] = f.stolpci;
          svg.appendChild(s('text', { x: c.X(x.x), y: y + rh * .55, fill: '#5f7590', 'font-size': v * .8, 'font-weight': 600, 'letter-spacing': v * .08, 'font-family': 'IBM Plex Sans, Arial, sans-serif' }, String(r[k.id] || '').toUpperCase()));
          svg.appendChild(s('text', { x: c.X(x.x + x.w * .48), y: y + rh * .55, fill: oranzno ? '#b0561a' : '#172433', 'font-size': v, 'font-weight': 700, 'font-family': 'IBM Plex Sans, Arial, sans-serif' }, r[vr.id] || ''));
        }
        svg.appendChild(s('rect', { x: c.X(x.x), y: y + rh - 1, width: c.X(x.w), height: 1.5, fill: '#d3dfeb', opacity: x.palice ? 1 : .6 }));
      });
    },
    ploscice(svg, x, c) {
      const f = c.J.poId(c.p.polja, x.polje), vrstice = polne(c, x.polje);
      const st = x.stolpcev, vr = Math.max(Math.ceil(vrstice.length / st), 1), rez = c.X(1.5);
      const pw = (c.X(x.w) - rez * (st - 1)) / st, ph = Math.min((c.Y(x.h) - rez * (vr - 1)) / vr, pw * .7);
      const izb = Math.min(izbranaVrstica(c, x.poudarek), vrstice.length - 1);
      vrstice.forEach((r, i) => {
        const px = c.X(x.x) + (i % st) * (pw + rez), py = c.Y(x.y) + Math.floor(i / st) * (ph + rez);
        svg.appendChild(s('rect', { x: px, y: py, width: pw, height: ph, rx: 6, fill: '#1f4470' }));
        svg.appendChild(s('text', { x: px + pw * .08, y: py + ph * .55, fill: i === izb ? '#f0955a' : '#ffffff', 'font-size': ph * .38, 'font-weight': 700, 'font-family': 'Space Grotesk, Arial, sans-serif' }, r[f.stolpci[0].id] || ''));
        svg.appendChild(s('text', { x: px + pw * .08, y: py + ph * .82, fill: '#b9d0e6', 'font-size': ph * .13, 'font-weight': 600, 'letter-spacing': ph * .01, 'font-family': 'IBM Plex Sans, Arial, sans-serif' }, String(r[f.stolpci[1].id] || '').toUpperCase()));
      });
    },
    koraki(svg, x, c) {
      const f = c.J.poId(c.p.polja, x.polje), vrstice = polne(c, x.polje), n = Math.max(vrstice.length, 1);
      const navp = c.e.format === 'navpicno', rez = c.X(2.5);
      const tw = navp ? c.X(x.w) : (c.X(x.w) - rez * (n - 1)) / n, th = navp ? (c.Y(x.h) - rez * (n - 1)) / n : c.Y(x.h) * .8;
      const crta = c.poudarek(x.puscice) ? ORANZNA : '#2a5687';
      vrstice.forEach((r, i) => {
        const px = c.X(x.x) + (navp ? 0 : i * (tw + rez)), py = c.Y(x.y) + (navp ? i * (th + rez) : 0);
        svg.appendChild(s('rect', { x: px, y: py, width: tw, height: th, rx: 6, fill: '#ffffff' }));
        if (i === vrstice.length - 1 && c.poudarek(x.zadnja) && x.zadnja) svg.appendChild(s('rect', { x: px, y: py, width: tw, height: 6, fill: ORANZNA }));
        const v = Math.min(tw, th) * (navp ? .32 : .2);
        svg.appendChild(s('text', { x: px + v * .5, y: py + v * 1.2, fill: '#15304f', 'font-size': v, 'font-weight': 700, 'font-family': 'Space Grotesk, Arial, sans-serif' }, String(i + 1)));
        svg.appendChild(s('text', { x: px + (navp ? v * 1.6 : v * .5), y: py + (navp ? v * 1.1 : v * 2.2), fill: '#172433', 'font-size': v * .42, 'font-weight': 700, 'font-family': 'IBM Plex Sans, Arial, sans-serif' }, r[f.stolpci[0].id] || ''));
        if (i < vrstice.length - 1) {
          const ax = navp ? px + tw / 2 : px + tw + rez / 2, ay = navp ? py + th + rez / 2 : py + th / 2;
          svg.appendChild(s('path', { d: navp ? 'M' + (ax - 8) + ' ' + (ay - 5) + ' L' + ax + ' ' + (ay + 5) + ' L' + (ax + 8) + ' ' + (ay - 5) : 'M' + (ax - 5) + ' ' + (ay - 8) + ' L' + (ax + 5) + ' ' + ay + ' L' + (ax - 5) + ' ' + (ay + 8), fill: 'none', stroke: crta, 'stroke-width': 4 }));
        }
      });
    },
    motiv(svg, x, c) { antena(svg, x, c.barva(x), c); },
    pokal(svg, x, c) {
      const b = c.poudarek(x.poudarek) ? ORANZNA : '#b9d0e6', X0 = c.X(x.x), Y0 = c.Y(x.y), w = c.X(x.w), h = c.Y(x.h);
      svg.appendChild(s('path', { d: 'M' + X0 + ' ' + Y0 + ' H' + (X0 + w) + ' Q' + (X0 + w) + ' ' + (Y0 + h * .6) + ' ' + (X0 + w / 2) + ' ' + (Y0 + h * .62) + ' Q' + X0 + ' ' + (Y0 + h * .6) + ' ' + X0 + ' ' + Y0 + ' Z', fill: b }));
      svg.appendChild(s('rect', { x: X0 + w * .44, y: Y0 + h * .6, width: w * .12, height: h * .25, fill: b }));
      svg.appendChild(s('rect', { x: X0 + w * .25, y: Y0 + h * .85, width: w * .5, height: h * .12, rx: 3, fill: b }));
    },
    celice(svg, x, c) {
      const f = c.J.poId(c.p.polja, x.polje), izb = c.v.polja[x.polje] || { izbrane: [], svoj: '' };
      const imena = c.J.moznosti(c.P, f).filter(o => izb.izbrane.includes(o.id)).map(o => o.ime)
        .concat(String(izb.svoj || '').split(';').map(t => t.trim()).filter(Boolean));
      const n = Math.max(imena.length, 1), st = Math.ceil(Math.sqrt(n)), vr = Math.ceil(n / st);
      const cw = c.X(x.w) / st, ch = c.Y(x.h) / vr, b = c.barva(x);
      imena.forEach((ime, i) => {
        const cx = c.X(x.x) + (i % st) * cw + cw / 2, cy = c.Y(x.y) + Math.floor(i / st) * ch + ch / 2, r = Math.min(cw, ch) * .22;
        svg.appendChild(s('rect', { x: cx - cw / 2 + 4, y: cy - ch / 2 + 4, width: cw - 8, height: ch - 8, fill: 'none', stroke: '#d3dfeb', 'stroke-width': 2 }));
        svg.appendChild(s('circle', { cx, cy: cy - r * .3, r, fill: 'none', stroke: b, 'stroke-width': r * .22 }));
        if (x.poudarek) svg.appendChild(s('circle', { cx: cx + r * .7, cy: cy - r, r: r * .22, fill: ORANZNA }));
        svg.appendChild(s('text', { x: cx, y: cy + r * 1.6, 'text-anchor': 'middle', fill: '#5f7590', 'font-size': Math.min(cw * .08, 22), 'font-family': 'IBM Plex Sans, Arial, sans-serif' }, ime));
      });
    }
  };

  window.S59DGO_PREDOGLED = { izrisi };
})();
```

- [ ] **Step 2: Preveri v brskalniku**

Run: `open docs/orodja/s59dgo-prompti.html`. Za vsako od 15 predlog klikni »Izpolni s primerom« in preveri:
- Razmerje SVG ustreza formatu (3:2, 4:5, 1:1, 9:16, A4, 1640×624, 4:1); pri menjavi formata (statistika, koraki, napoved 4:5/9:16) se shema prilagodi.
- Pri 9:16 črtkani pasovi zgoraj in spodaj, pri pasici črtkan srednji pas.
- Sonce levo/desno/brez in 2/3 plasti grebena se takoj vidijo; svetlo ozadje naslovne slike posvetli nebo in greben.
- Odstranitev poudarka (npr. »Oranžna značka«) spremeni barvo v shemi.
- Prazno besedilo je prosojen trak; besedilo `<b>Test</b> & "x"` se v shemi izpiše dobesedno (ne kot HTML).
- Konzola brez napak; pri prosojnem ozadju ikon je viden šahovski vzorec.

- [ ] **Step 3: Poženi teste**

Run: `bin/test.sh`
Expected: vse `OK`.

- [ ] **Step 4: Commit**

```bash
git add docs/orodja/s59dgo-prompti.html
git commit -m "Generator promptov: shematski predogled postavitve v SVG

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Shranjevanje, izvoz in uvoz

**Files:**
- Modify: `docs/orodja/s59dgo-prompti.html` (`<script id="vmesnik">`)

**Interfaces:**
- Consumes: `J.preveriUvoz`, `J.zacetno` (Task 4); oznaki `// SHRANJEVANJE-ZAČETEK/KONEC` in `// DATOTEKE (Task 7)` (Task 5).
- Produces: samodejno shranjevanje v `localStorage['s59dgo-prompti-v1']`, izvoz in uvoz JSON.

- [ ] **Step 1: Zamenjaj shranjevanje**

V `<script id="vmesnik">` zamenjaj blok med `// SHRANJEVANJE-ZAČETEK (Task 7)` in `// SHRANJEVANJE-KONEC` z:

```js
  // SHRANJEVANJE-ZAČETEK
  const KLJUC = 's59dgo-prompti-v1';
  function nalozi() {
    try {
      const t = localStorage.getItem(KLJUC);
      if (t) {
        const r = J.preveriUvoz(P, JSON.parse(t));
        if (r.ok) return r.stanje;
      }
    } catch (napaka) { /* brez shranjevanja (zasebno okno, peskovnik) */ }
    return J.zacetno(P);
  }
  function shrani() {
    try { localStorage.setItem(KLJUC, JSON.stringify(stanje)); } catch (napaka) { /* brez shranjevanja */ }
  }
  // SHRANJEVANJE-KONEC
```

- [ ] **Step 2: Dodaj izvoz in uvoz**

V `zacni()` zamenjaj vrstico `// DATOTEKE (Task 7)` z:

```js
    const sporoci = t => { $('stanje-datoteke').textContent = t; };
    $('gumb-izvozi').addEventListener('click', () => {
      const datum = new Date().toISOString().slice(0, 10);
      const url = URL.createObjectURL(new Blob([JSON.stringify(stanje, null, 2)], { type: 'application/json' }));
      const a = el('a', { href: url, download: 's59dgo-prompt-' + stanje.predloga + '-' + datum + '.json' });
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      sporoci('Izvoženo.');
    });
    $('datoteka-uvoz').addEventListener('change', e => {
      const dat = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!dat) return;
      dat.text().then(t => {
        let obj;
        try { obj = JSON.parse(t); } catch (napaka) { sporoci('Uvoz ni uspel: datoteka ni veljaven JSON.'); return; }
        const r = J.preveriUvoz(P, obj);
        if (!r.ok) { sporoci('Uvoz ni uspel: ' + r.napaka); return; }
        stanje = r.stanje;
        izrisiVse();
        sporoci('Uvoženo: ' + dat.name);
      }, () => sporoci('Uvoz ni uspel: datoteke ni mogoče prebrati.'));
    });
```

- [ ] **Step 3: Preveri v brskalniku**

Run: `open docs/orodja/s59dgo-prompti.html`
- Izpolni napoved, izberi SL in Midjourney, osveži stran: vse ostane (predloga, jezik, orodje, vrednosti).
- »Izvozi nastavitve« prenese `s59dgo-prompt-napoved-YYYY-MM-DD.json` z `"verzija": 1`.
- »Ponastavi predlogo« izprazni le trenutno predlogo; preklop na drugo predlogo pokaže njene prejšnje vrednosti.
- Uvoz izvožene datoteke obnovi stanje; uvoz poljubne `.txt` preimenovane v `.json` izpiše »ni veljaven JSON«; uvoz `{"verzija":2}` izpiše napako iz jedra. Brez `alert`.
- Zasebno okno Chroma (`Cmd+Shift+N`) z isto datoteko: orodje dela, konzola brez napak.
- DevTools → Application → Local Storage: vnos `s59dgo-prompti-v1`. V konzoli `localStorage.setItem('s59dgo-prompti-v1','{pokvarjeno')` in osveži: orodje se naloži z začetnim stanjem.

- [ ] **Step 4: Poženi teste**

Run: `bin/test.sh`
Expected: vse `OK`.

- [ ] **Step 5: Commit**

```bash
git add docs/orodja/s59dgo-prompti.html
git commit -m "Generator promptov: samodejno shranjevanje, izvoz in uvoz nastavitev

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Pregled, objava artefakta in dokumentacija

**Files:**
- Modify: `CLAUDE.md`
- Modify (po potrebi): `docs/orodja/s59dgo-prompti.html`

**Interfaces:**
- Consumes: končana datoteka iz Task 1–7.
- Produces: URL artefakta, zapisan v `CLAUDE.md`.

- [ ] **Step 1: Celoten ročni pregled v Chromu** (skill `claude-in-chrome` ali ročno; datoteka prek `file://`)
- Vseh 15 predlog × EN/SL × 5 orodij: prompt brez `{{`, smiselna opozorila.
- Svetli in temni način (DevTools → Rendering → `prefers-color-scheme`): berljivost, kontrast, shema ostane v barvah grafike.
- Širina 375 px (DevTools device toolbar): en stolpec, brez vodoravnega drsenja, gumbi dosegljivi.
- Tipkovnica: Tab skozi vse kontrole, fokus viden, radijski gumbi s puščicami.

- [ ] **Step 2: Popravi najdeno, poženi teste, commitaj popravke** (če jih je)

Run: `bin/test.sh` → vse `OK`; commit `Generator promptov: popravki po pregledu`.

- [ ] **Step 3: Objavi artefakt**

Naloži skill `artifact-design` (pogodba strani), preveri, da `<title>`, barvni žetoni in temni način ustrezajo; nato `Artifact` publish s `file_path: docs/orodja/s59dgo-prompti.html`, `icon: "prompt"`, `description: "Generator AI promptov za grafiko s59dgo.org: predloga, besedilo, elementi, orodje."`. Zabeleži vrnjeni URL.

- [ ] **Step 4: Preveri objavljeno stran**

Odpri URL: delovanje kopiranja (ali nadomestno označevanje), izvoza (prenos datoteke) in shranjevanja v peskovniku artefakta. Če prenos izvoza ne deluje, naloži skill `artifact-capabilities` in dodaj zmožnost za shranjevanje datotek (ponovna objava na isti poti); če `localStorage` ni na voljo, mora orodje vseeno delovati (Review Focus 4).

- [ ] **Step 5: Posodobi `CLAUDE.md`**

V razdelku »Kaj je to« za odstavek o grafiki dodaj vrstico:

```markdown
Generator promptov (izpolni predloge iz dokumenta, ena datoteka, deluje brez povezave): `docs/orodja/s59dgo-prompti.html`, objavljen kot artefakt <URL iz Step 3>. Pisave vanj vdela `bin/prompti-pisave.sh`; predloge so v bloku `#podatki` in jih `tests/test-prompti.php` primerja z `docs/ai-prompti-grafika.md` – ob spremembi dokumenta posodobi tudi orodje.
```

V razdelek »Ukazi« pod `bin/grafika-referenca.sh` dodaj:

```bash
bin/prompti-pisave.sh     # vdela pisave teme kot base64 v docs/orodja/s59dgo-prompti.html
```

in pri `bin/test.sh` dopolni komentar: `# … in Node test jedra generatorja promptov (node:22-alpine)`.

- [ ] **Step 6: Končni testi in commit**

Run: `bin/test.sh` → vse `OK`.

```bash
git add CLAUDE.md docs/orodja/s59dgo-prompti.html
git commit -m "Generator promptov: objava artefakta in dokumentacija

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Zaključek veje**

Uporabi skill `superpowers:finishing-a-development-branch`; nič se ne potisne brez odobritve uporabnika.
