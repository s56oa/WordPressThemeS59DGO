# Spec: Generator AI promptov za grafiko S59DGO

Datum: 2026-10-17
Stanje: potrjen dizajn, pripravljeno za načrt implementacije

## 1. Namen in cilji

`docs/ai-prompti-grafika.md` vsebuje 15 predlog promptov s `{placeholderji}`
in skupne bloke (`[SLOG]`, `[TIPO]`, `[NE]`, `[TEMNO]`). Obstoječi artefakt
»Grafični vodnik« (https://claude.ai/code/artifact/1f8918e8-d624-4fa1-853c-d24127de5d1e)
ima sestavljalnik, ki zna le izbrati vrsto, jezik in kategorijo; placeholderje
mora uporabnik zamenjati ročno.

Cilj je samostojno orodje, ki:

1. iz izbrane predloge, vpisanega besedila in izbranih elementov sestavi
   **končen prompt brez placeholderjev**, pripravljen za lepljenje;
2. po želji prilagodi prompt konkretnemu generatorju (Midjourney, ChatGPT/Gemini,
   Ideogram, Stable Diffusion/Flux);
3. pokaže shematski predogled kompozicije, preden prompt pošlješ generatorju;
4. deluje brez povezave kot ena datoteka in je hkrati objavljeno kot artefakt.

Uporabnik: urednik spletne strani in člani kluba, ki pripravljajo grafike za
objave na www.s59dgo.org in družbenih omrežjih.

## 2. Odločitve (potrjene z naročnikom)

| Področje | Odločitev |
|---|---|
| Dostava | ena HTML datoteka v repozitoriju + zasebni artefakt na claude.ai |
| Nadzor | predloga + polja za besedilo + izbira elementov |
| Orodja AI | privzeto univerzalno, izbira orodja doda parametre iz §7 dokumenta |
| Obseg | vseh 15 predlog iz §3–§6 dokumenta |
| Dodatki | shematski predogled, shranjevanje nastavitev, »Izpolni s primerom« |
| Brez | logotipa (ostane le oznaka »S59DGO«), kontrolnega seznama in alt besedila |
| Jezik prompta | EN in SL; besedilo v sliki je vedno slovensko |
| Jezik vmesnika | slovenščina |
| Git | veja `prompt-generator` iz `main`; nič se ne potisne brez odobritve |

## 3. Datoteke

| Pot | Vloga |
|---|---|
| `docs/orodja/s59dgo-prompti.html` | orodje: HTML + CSS + JS + podatki + vdelane pisave |
| `bin/prompti-pisave.sh` | vdela woff2 iz `s59dgo/assets/fonts/` kot base64 med označevalci v HTML |
| `tests/test-prompti.php` | test usklajenosti orodja z dokumentom in osnovne strukture |
| `CLAUDE.md` | vrstica pri »Grafika za objave« s potjo do orodja in URL artefakta |

### 3.1 Vdelava pisav

Orodje mora delovati z dvoklikom brez povezave, zato sta Space Grotesk
(500, 700) in IBM Plex Sans (400, 600), podmnožici latin in latin-ext, vdelani
kot `data:font/woff2;base64,…` v `@font-face` (8 datotek, skupaj ~130 KB,
base64 ~175 KB).

Base64 se v datoteko ne piše ročno. HTML vsebuje blok:

```
/* PISAVE:ZAČETEK */
… @font-face pravila …
/* PISAVE:KONEC */
```

`bin/prompti-pisave.sh` (Docker, kot ostala orodja; zadošča `alpine` z
`base64` in `sed`/`awk`) vsebino med označevalcema nadomesti z novo
ustvarjenimi pravili. Skripta je idempotentna; urejanje preostale datoteke
poteka neposredno. To ni build korak: datoteka v repozitoriju je vedno
končna in delujoča.

## 4. Podatkovni model

Vsi podatki so v enem bloku `<script type="application/json" id="podatki">`,
da jih lahko JS prebere z `JSON.parse` in PHP test z `json_decode`.

```
{
  "bloki":   { "slog": {en, sl}, "slog_svetlo": {en, sl}, "tipo": {en, sl},
               "ne": {en, sl}, "temno": {en, sl} },
  "motivi":  [ { "id", "ime", "motiv": {en, sl}, "dodatno": {en, sl} } ],   // tabela §3.2
  "predloge":[ { "id", "razdelek", "skupina", "ime", "opis",
                 "slog": true|false, "tipo": true|false,
                 "formati": ["3:2", …], "polja": [ … ],
                 "besedilo": { en, sl }, "primer": { … } } ],
  "orodja":  { "univerzalno", "midjourney", "chatgpt", "ideogram", "sd" }
}
```

- `razdelek` je številka iz dokumenta (npr. `"4.1"`) in jo uporablja test.
- `skupina`: Naslovne slike · Infografike · Omrežja in plakati · Ikone in dekor.
- `besedilo` vsebuje predlogo z imenovanimi režami `{{ime}}`; ločeno od
  dokumentovih `{placeholderjev}`, da jih zamenjava ne zgreši.
- `polja` opisujejo, kaj obrazec izriše za to predlogo (§5.2).
- `primer` so vrednosti za »Izpolni s primerom«, vzete iz dokumenta, kjer
  obstajajo (Marconi Memorial VHF 2026, Field day na Sviščakih, statistika
  62 / 1964 / 18 / 4); za ostale predloge smiselni primeri v istem duhu.

### 4.1 Seznam predlog

| id | Razdelek | Ime | Besedilo v sliki |
|---|---|---|---|
| `naslovna` | 3.1 | Naslovna slika objave | ne |
| `lestvica` | 4.1 | Infografika: lestvica rezultatov | da |
| `urnik` | 4.2 | Infografika: urnik / koledar tekmovanj | da |
| `tehnicna` | 4.3 | Infografika: tehnična kartica | da |
| `koraki` | 4.4 | Infografika: koraki | da |
| `statistika` | 4.5 | Infografika: statistika v ploščicah | da |
| `napoved` | 5.1 | Omrežja: napoved dogodka 1:1 | da |
| `napoved-pokoncno` | 5.2 | Omrežja: napoved 4:5 / zgodba 9:16 | da |
| `cestitka` | 5.3 | Omrežja: čestitka ob rezultatu | da |
| `plakat` | 5.4 | Plakat A4/A3 | da |
| `pasica` | 5.5 | Facebook naslovnica | ne |
| `ikone` | 6.1 | Set ikon | ne |
| `ikona-app` | 6.2 | Ikona spletne aplikacije | ne |
| `vzorec` | 6.3 | Vzorec grebena | ne |
| `locila` | 6.4 | Ločila in dekor | ne |

Urnik ima stikalo »časovnica / mesečni koledar« (dokument §4.2, zadnji odstavek).

## 5. Vmesnik

### 5.1 Postavitev

Glava je trak z grebenom in soncem kot na spletni strani. Pod njo dva stolpca:
levo obrazec, desno lepljiv stolpec s predogledom in promptom. Pod 860 px en
stolpec; predogled in prompt sta pod obrazcem. Na telefonu brez vodoravnega
drsenja, 16 px stranski rob.

Na dnu orodja vrstica: različica teme, povezava na `docs/ai-prompti-grafika.md`
(besedilo, ne povezava, ker artefakt ne vidi repozitorija) in gumbi
Izvozi / Uvozi / Ponastavi.

### 5.2 Obrazec (levo), štirje koraki

**1. Vrsta grafike.** Seznam 15 predlog, razvrščenih po skupinah (`<select>` z
`<optgroup>`); pod njim enovrstični opis predloge (mere, namen).

**2. Besedilo.** Samo polja, ki jih izbrana predloga uporablja. Vrste polj:

| Vrsta | Primer | Opomba |
|---|---|---|
| `besedilo` | naslov, značka, kraj, poziv | `maxlength` po polju; za naslov opozorilo pri več kot ~3 vrsticah (ocena po znakih) |
| `datum` | »SOB, 20. 6. 2026« | prosto besedilo, ker oblika ni enotna |
| `vrstice` | lestvica (klic + rezultat), urnik (ura + dogodek + opomba), tehnična kartica (ključ + vrednost), koraki (naslov + opis + ikona), statistika (številka + oznaka) | gumb »Dodaj vrstico«, ✕ za odstranitev, meje min/max po predlogi; `{N}` se izračuna iz števila vrstic |
| `poudarek` | katera vrstica je oranžna | izbira iz vrstic; privzeto prva |
| `seznam` | ikone v setu, elementi dekorja | izbirna polja z možnostmi iz dokumenta + »drugo« |
| `izbira` | aplikacija pri ikoni aplikacije | simbol se izpolni iz dokumenta |

Za predloge brez besedila v sliki je ta korak kratek (npr. naslovna slika ima
le »Tema objave«, ki opiše vsebino, a se ne izpiše).

**3. Elementi.** Prikazani le, kjer jih predloga podpira:

- **Motiv**: 8 iz tabele §3.2 ali »Svoj opis« (prosto besedilo); dodatni
  element: privzeti iz tabele, »brez« ali svoj.
- **Ozadje**: temno (privzeto) · svetlo (blok `slog_svetlo`) · prosojno za oba
  načina (blok `[TEMNO]`, le pri ikonah in diagramih).
- **Sonce**: desno zgoraj (privzeto) · levo zgoraj · brez.
- **Plasti grebena**: 2 · 3.
- **Format**: le dovoljeni za predlogo (npr. napoved 4:5 ali 9:16; plakat A4 ali
  A3; koraki vodoravno 3:2 ali navpično 4:5; statistika 3:2 ali 1:1).
- **Oranžni poudarek**: kateri element nosi oranžno, kjer je izbira smiselna
  (sonce, značka, prva vrstica, ikona pokala). Izbira je večkratna; pri več
  kot enem velikem poudarku (npr. značka in pokal) se izpiše opozorilo o
  pravilu »oranžne največ 10 %«, izbira pa ostane dovoljena.

**4. Izhod.**

- Jezik prompta: EN (privzeto) · SL.
- Ciljno orodje: Univerzalno (privzeto) · Midjourney · ChatGPT / Gemini ·
  Ideogram · Stable Diffusion / Flux.
- Stikali: »Dodaj tipografski blok« (prikazano le pri predlogah z besedilom,
  privzeto vklopljeno) in »Dodaj seznam izogibaj se« (privzeto vklopljeno).

Gumb »Izpolni s primerom« v glavi obrazca napolni korak 2 in 3 s primerom
izbrane predloge.

### 5.3 Desni stolpec

1. **Shematski predogled**: SVG v izbranem razmerju. Ozadje v barvi ozadja,
   2 ali 3 plasti grebena (fiksne poligonske oblike, kot v
   `docs/grafika-referenca/`), sonce na izbranem mestu, motiv kot preprosta
   ikona (antena z loki, stolp, šotor …, ena oblika na skupino motivov), besedilna
   polja kot pravokotniki z uporabnikovim besedilom v pravi pisavi in barvi.
   Pri 9:16 črtkano označeni zgornji in spodnji 13 %, pri pasici srednjih
   40 %, pri naslovni sliki obrez na 20:13. Pri ikonah, vzorcu in ločilih
   mreža celic s številom elementov. Pod predogledom napis »Shema
   postavitve, ne končna slika«.
2. **Prompt**: `<pre>` z gumbom »Kopiraj«; pri SD/Flux dva bloka
   (pozitivni in negativni), vsak s svojim gumbom. Številka znakov pod njim.
3. **Opozorila** (seznam pod promptom, samo kadar veljajo):
   - Midjourney ali SD in predloga z besedilom: »Ta generator besedila ne izpiše
     zanesljivo; besedilo dodaj naknadno v Canvi ali Inkscapu.«
   - Naslov predolg za predvideno število vrstic.
   - Prazno obvezno polje (prompt se vseeno sestavi, prazno polje se izpusti s
     stavkom »leave the text areas as empty solid bars«).
   - Dva oranžna poudarka hkrati.

## 6. Sestavljanje prompta

Vrstni red delov (ločeni s presledkom ali novo vrstico, kot v dokumentu):

1. Pri SD/Flux predpona `flat vector illustration, minimalist, solid colors, (no gradient:1.3)`.
2. `[SLOG]` (ali `slog_svetlo`), razen pri predlogah s `"slog": false`
   (ikone, vzorec, ločila). Ob prosojnem ozadju se doda `[TEMNO]`.
3. `[TIPO]`, kadar predloga ima besedilo in je stikalo vklopljeno.
4. Besedilo predloge z zamenjanimi režami. Elementi (sonce, plasti, format)
   zamenjajo ustrezne stavke v predlogi; vsaka predloga ima za to svoje reže
   (`{{sonce}}`, `{{greben}}`, `{{format}}`), da se ne dela iskanje in zamenjava
   po prostem besedilu.
5. `[NE]`, kadar je stikalo vklopljeno, glede na orodje:
   - univerzalno, ChatGPT/Gemini, Ideogram: zaključni stavek;
   - Midjourney: `--no gradient, shadow, glow, neon, photo, text, letters, watermark, face, frame`
     (pri predlogah z besedilom brez `text, letters`);
   - SD/Flux: ločen negativni prompt `[NE]` + `text, watermark, signature, blurry, noise, jpeg artifacts, photo, realistic`.
6. Zaključek po orodju:
   - Midjourney: `--ar {razmerje} --style raw --stylize 50` (A4/A3 → `--ar 2:3`, pasica → `--ar 21:8`);
   - Ideogram: vrstica »Style: Design. Custom palette: #15304f #2a5687 #b9d0e6 #eef3f8 #d9702a«;
   - ChatGPT/Gemini: stavek »Upoštevaj slog priložene referenčne slike.« v jeziku prompta, kot predlog;
   - univerzalno: nič.

Uporabnikovo besedilo se vstavi dobesedno, v narekovajih, kjer jih predloga
ima. Narekovaji `"` v uporabnikovem besedilu se zamenjajo z »«, da ne
prekinejo navedka. Prazna vrstica se v izpisu izpusti.

Pravilnost se preveri tako, da noben izhod ne vsebuje `{{`, `{` + velike črke
ali `[SLOG]`/`[TIPO]`/`[NE]` (preverja tudi test v brskalniku, §8).

## 7. Shranjevanje

- **Samodejno**: celotno stanje obrazca (predloga, jezik, orodje, vrednosti po
  predlogah) se ob vsaki spremembi zapiše v `localStorage` pod ključ
  `s59dgo-prompti-v1`; vsako branje in pisanje je v `try/catch`, orodje deluje
  tudi brez shranjevanja (zasebno okno, predogled artefakta).
- **Izvoz**: prenos datoteke `s59dgo-prompt-{id-predloge}-{datum}.json`.
- **Uvoz**: izbira datoteke `.json`; preveri se polje `"verzija": 1` in
  znane vrednosti; neznana polja se prezrejo, napaka se izpiše v vrstici, ne
  kot `alert`.
- **Ponastavi**: počisti trenutno predlogo na privzete vrednosti (ne vseh).

## 8. Videz, varnost, dostopnost

- Barve in tipografija iz teme: CSS spremenljivke na `:root`, temni način z
  `@media (prefers-color-scheme: dark)` pod `:root:not([data-theme="light"])`
  in pod `:root[data-theme="dark"]`; `body` ima izrecno ozadje. Predogled
  vedno kaže barve grafike, ne barve vmesnika.
- Brez zunanjih knjižnic in klicev; brez `innerHTML` z uporabnikovim
  besedilom (predogled `textContent`, prompt `textContent`).
- Vsa polja imajo `<label>`; gumb »Kopiraj« po kopiranju za 2 s pokaže
  »Kopirano«; ob neuspehu `navigator.clipboard` se besedilo označi za ročno
  kopiranje.
- `<title>`: »Generator promptov S59DGO«.

## 9. Preverjanje

1. **`tests/test-prompti.php`** (teče v `bin/test.sh`):
   - HTML obstaja, blok `#podatki` je veljaven JSON;
   - vsak razdelek §3.1–§6.4 iz `docs/ai-prompti-grafika.md` ima predlogo z
     enakim `razdelek` in obratno (15 predlog);
   - bloki `slog`, `tipo`, `ne` (EN in SL) se dobesedno ujemajo z
     ustreznimi kodnimi bloki v §2 dokumenta;
   - 8 motivov iz tabele §3.2 z enakim EN in SL besedilom;
   - vsaka predloga ima `besedilo.en` in `besedilo.sl`, vsaka reža `{{…}}` v
     besedilu ima polje ali element, ki jo izpolni, in obratno;
   - blok pisav vsebuje 8 `@font-face` z `data:font/woff2;base64,`.
2. **Samopreverjanje v brskalniku**: ob `?test` v URL-ju orodje za vsako
   predlogo × jezik × orodje sestavi prompt s primerom in v konzolo izpiše,
   ali kateri vsebuje nezamenjano režo. Ročno pognano pred objavo.
3. **Ročni pregled** v Chromu: vseh 15 predlog, oba jezika, vseh 5 orodij,
   svetli in temni način, širina 375 px, delovanje z dvoklikom (`file://`),
   izvoz in uvoz, »Izpolni s primerom«.
4. Objava artefakta in pregled objavljene različice.

## 10. Zunaj obsega

- Klic API generatorjev slik (orodje samo sestavi besedilo).
- Logotip v promptu ali predogledu.
- Kontrolni seznam pred objavo in alt besedilo.
- Nove predloge zunaj dokumenta (QSL kartica, potrdilo …).
- Predelava obstoječega artefakta »Grafični vodnik«. Dodatek povezave na novo
  orodje vanj je ločen korak po objavi, z odobritvijo.
