# AI prompti za grafiko spletne strani s59dgo.org

Predloge promptov za izdelavo naslovnih slik, infografik, objav za družbena omrežja, plakatov, ikon in dekorativnih elementov, ki so vizualno skladni z WordPress temo `s59dgo` (smer »Grebeni«).

Datum: 2026-09-12 · Velja za temo s59dgo 1.1.0 · Vir barv in pisav: `s59dgo/style.css`, `s59dgo/theme.json`, `s59dgo/assets/img/greben.svg`.

## Kako uporabljati

1. Kopiraj **slogovni blok** (§2) na začetek vsakega prompta. V predlogah je označen z `[SLOG]`.
2. Izberi predlogo za vrsto grafike (§3–§6) in zamenjaj vse `{placeholderje}`.
3. Če slika vsebuje besedilo, dodaj še **tipografski blok** (§2.3) in besedilo zapiši dobesedno v narekovajih.
4. Po potrebi dodaj **negativni blok** (§2.4) ali parametre za konkretno orodje (§7).
5. Pred objavo preleti kontrolni seznam (§8).

Vsaka predloga ima angleško (EN) in slovensko (SL) različico. EN različica je zanesljivejša v Midjourneyju, Stable Diffusion in Flux; SL različica deluje v ChatGPT, Gemini in Claude. Besedilo, ki se izpiše v sliki, je vedno slovensko, ne glede na jezik prompta.

---

## 1. Slogovni vodnik (izvleček iz teme)

### 1.1 Paleta

| Vloga | Svetli način | Temni način | Uporaba v grafikah |
|---|---|---|---|
| Temno modra (glava, trak) | `#15304f` | `#0a1420` | Prevladujoče ozadje ilustracij, značke, naslovi na svetli podlagi |
| Modre plasti grebena | `#1f4470`, `#2a5687` | `#152638`, `#1f4470` | Silhuete grebena, sekundarne ploskve |
| Ledeno modra (tiho besedilo na temnem) | `#b9d0e6` | `#8fa9c4` | Podnaslovi, sneg, oddaljeni grebeni, tanke črte |
| Ozadje strani | `#eef3f8` | `#0f1c2b` | Ozadje svetlih grafik, »nebo« v svetlih ilustracijah |
| Površina (kartice) | `#ffffff` | `#152638` | Ploščice, polja infografik |
| Besedilo | `#172433` / `#46586c` / `#5f7590` | `#dbe6f1` / `#b7c9db` / `#8fa9c4` | Besedilo na svetli podlagi (3 stopnje) |
| Črte | `#d3dfeb` | `#27405a` | Ločnice, mreže tabel |
| Oranžna (poudarek) | `#d9702a` | `#f0955a` | Sonce, signal, ena poudarjena vrednost, gumb; **največ 5–10 % površine** |
| Oranžna za besedilo | `#b0561a` | `#f0955a` | Povezave in besedilo v oranžni (kontrast ≥ 4,5:1) |

### 1.2 Pisavi

| Vloga | Pisava | Reze | Opis za generator |
|---|---|---|---|
| Naslovi | Space Grotesk | 500, 700 | »bold geometric grotesque sans-serif« |
| Besedilo | IBM Plex Sans | 400, 600 | »clean humanist sans-serif« |
| Oznake (značke, datumi) | IBM Plex Sans 600 | 12 px, verzalke, razmik 0,1 em | »small uppercase labels with wide letter spacing« |

Obe pisavi sta odprtokodni (OFL) in sta v `s59dgo/assets/fonts/`. Generatorji slik pisav ne poznajo po imenu, zato besedilo v končni grafiki po možnosti dodaj sam (Canva, Inkscape, Affinity) s pravima pisavama.

### 1.3 Motiv in oblikovna pravila

- **Greben Snežnika**: 2–3 plasti kotnih (low-poly) silhuet gora, zložene od spredaj nazaj, spredaj najsvetlejša modra, zadaj najtemnejša ali obratno; brez podrobnosti, brez dreves.
- **Sonce**: majhen poln oranžen krog, praviloma desno zgoraj, nikoli več kot en.
- **Radioamaterski elementi**: antene (Yagi, vertikalka, dipol), jambori, koncentrični loki radijskih valov, Morsejeve pike in črte, zemljevidi z lokatorji, kompas.
- **Ploskovno**: čiste enobarvne ploskve, brez gradientov, senc, obrob, tekstur, 3D učinka, odsevov.
- **Zaobljenost**: 4–6 px na ploščicah (v razmerju do slike: komaj opazna), značke 3 px, gumbi 4 px, krogi za avatarje/ikone.
- **Prostor**: veliko praznine, kompozicija v spodnji tretjini (greben) in zgornji desni (sonce).
- **Brez** obrazov, besedila (razen kjer je izrecno zahtevano), tujih logotipov, klasičnih stock motivov (stisk rok, žarnice, puzzle).

---

## 2. Skupni bloki

### 2.1 Slogovni blok `[SLOG]` – EN

```
Style: flat geometric vector illustration in the visual identity of Radio klub Snežnik (S59DGO), an amateur radio club from Ilirska Bistrica, Slovenia. Clean solid-color shapes only: no gradients, no shadows, no outlines, no textures, no 3D, no photorealism. Palette: deep navy #15304f as the dominant background, lighter navy layers #1f4470 and #2a5687, pale ice blue #b9d0e6 and off-white #eef3f8 for snow and light areas, sunset orange #d9702a used sparingly as the single accent color (a small solid sun disc, a signal, one highlight), at most 10 % of the image. Recurring motif: two or three layered angular low-poly mountain ridge silhouettes of Mount Snežnik stacked front to back, generous empty space above them. Mood: alpine, calm, modern, technical. Amateur radio context: antennas, masts, concentric radio-wave arcs, morse dots and dashes. No text, no letters, no logos, no watermarks, no human faces.
```

### 2.2 Slogovni blok `[SLOG]` – SL

```
Slog: ploskovna geometrijska vektorska ilustracija v vizualni podobi Radio kluba Snežnik (S59DGO), radioamaterskega kluba iz Ilirske Bistrice. Samo čiste enobarvne ploskve: brez gradientov, senc, obrob, tekstur, 3D učinka in fotorealizma. Paleta: temno modra #15304f kot prevladujoče ozadje, svetlejši modri plasti #1f4470 in #2a5687, ledeno modra #b9d0e6 in umazano bela #eef3f8 za sneg in svetle površine, oranžna sončnega zahoda #d9702a zelo zmerno kot edina poudarna barva (majhen poln sončni disk, signal, en poudarek), največ 10 % slike. Ponavljajoči se motiv: dve ali tri plasti kotnih (low-poly) silhuet grebena Snežnika, zložene od spredaj nazaj, nad njimi veliko praznega prostora. Vzdušje: alpsko, mirno, sodobno, tehnično. Radioamaterski kontekst: antene, jambori, koncentrični loki radijskih valov, Morsejeve pike in črte. Brez besedila, črk, logotipov, vodnih žigov in človeških obrazov.
```

### 2.3 Tipografski blok `[TIPO]` (dodaj, kadar slika vsebuje besedilo)

EN:
```
Typography: headlines in a bold geometric grotesque sans-serif (like Space Grotesk), body text in a clean humanist sans-serif (like IBM Plex Sans), small labels in uppercase with wide letter spacing. Text on navy is white #ffffff or ice blue #b9d0e6; text on light backgrounds is dark navy #172433; orange text only as #b0561a on light or #f0955a on dark. Render the text EXACTLY as written between quotes, in Slovenian, keeping the diacritics č, š, ž. Do not add any other words. Left-aligned, generous line spacing.
```

SL:
```
Tipografija: naslovi v krepki geometrijski grotesk pisavi (kot Space Grotesk), besedilo v čisti humanistični pisavi brez serifov (kot IBM Plex Sans), majhne oznake v verzalkah s širokim razmikom črk. Besedilo na temno modri je belo #ffffff ali ledeno modro #b9d0e6; na svetli podlagi temno modro #172433; oranžno besedilo samo #b0561a na svetli ali #f0955a na temni podlagi. Besedilo izpiši NATANČNO tako, kot je zapisano med narekovaji, v slovenščini, s šumniki č, š, ž. Ne dodajaj drugih besed. Levo poravnano, zračen razmik med vrsticami.
```

### 2.4 Negativni blok `[NE]` (za orodja z negativnim promptom ali kot zaključni stavek)

EN:
```
Avoid: gradients, drop shadows, glow, neon, lens flare, 3D render, photo, realistic textures, stock-photo look, clip-art, cartoon characters, faces, hands, extra logos, watermarks, random letters, garbled text, more than one sun, purple or green or red hues, busy backgrounds, borders or frames around the image.
```

SL:
```
Izogibaj se: gradientom, sencam, sijaju, neonu, lens flare, 3D upodobitvi, fotografiji, realističnim teksturam, videzu stock fotografije, clip-artu, risanim likom, obrazom, rokam, tujim logotipom, vodnim žigom, naključnim črkam, popačenemu besedilu, več kot enemu soncu, vijoličnim, zelenim ali rdečim odtenkom, natrpanim ozadjem, okvirjem okoli slike.
```

### 2.5 Blok za temni način `[TEMNO]`

Uporabi namesto barv ozadja iz `[SLOG]`, kadar bo grafika samostojno na temni podlagi (npr. transparentna ikona ali diagram, ki mora delovati v obeh načinih):

```
The image must work on both a light background #eef3f8 and a dark background #0f1c2b. Use mid-tone shapes only (#2a5687, #5f7590, #d9702a) and avoid pure white or very dark navy fills. Transparent background.
```

---

## 3. Naslovne slike objav

**Namen**: naslovna slika (»Featured image«) objave. Tema jo izreže na 800×520 px za kartico v mreži in prikaže v širini 1100 px nad besedilom objave.

**Mere**: generiraj v razmerju **3:2** (npr. 1536×1024 ali 1600×1067), nato izreži na 1600×1040 (razmerje 20:13). Glavni motiv naj bo v sredini, ker WordPress reže z obeh strani. **Brez besedila** – naslov in kategorija se izpišeta v temi.

**Ozadje**: privzeto temno modra `#15304f` (kot nadomestna slika `greben.svg`). Za pestrost lahko vsaka tretja objava uporabi svetlo različico (nebo `#eef3f8`, greben v modrih).

### 3.1 Splošna predloga – EN

```
[SLOG]
Featured image for a blog post about {tema objave}. Composition: {motiv} as the central subject in the middle third of the image, layered navy ridge silhouettes of Snežnik across the bottom quarter, a small solid orange sun disc top right, {dodatni element}. Landscape 3:2 aspect ratio, subject centered so the image survives cropping on both sides, plenty of empty navy sky. [NE]
```

### 3.1 Splošna predloga – SL

```
[SLOG]
Naslovna slika za objavo o {tema objave}. Kompozicija: {motiv} kot osrednji predmet v srednji tretjini slike, plasti temno modrih silhuet grebena Snežnika čez spodnjo četrtino, majhen poln oranžen sončni disk desno zgoraj, {dodatni element}. Ležeče razmerje 3:2, motiv na sredini, da slika prenese rez na obeh straneh, veliko praznega temno modrega neba. [NE]
```

### 3.2 Motivi po kategorijah

| Kategorija | `{motiv}` EN | `{motiv}` SL | `{dodatni element}` |
|---|---|---|---|
| Dogodki | a group of three simplified tents and a portable telescopic mast with a small Yagi antenna on a mountain meadow | tri poenostavljeni šotori in prenosni teleskopski jambor z majhno Yagi anteno na gorskem travniku | thin concentric radio-wave arcs in ice blue leaving the antenna |
| Dogodki – izobraževanje | an open notebook, a morse key and a handheld transceiver laid flat, top-down view | odprt zvezek, Morsejev ključ in ročna radijska postaja, pogled od zgoraj | a row of morse dots and dashes in ice blue along the bottom |
| Contests | a tall lattice tower with stacked Yagi antennas, wave arcs spreading to both sides | visok mrežasti stolp z zloženimi Yagi antenami, loki valov na obe strani | a faint Maidenhead grid of thin lines in #1f4470 behind the tower |
| Contests – VHF/UHF | a mountain summit with a portable mast and a long directional antenna pointing to the horizon | gorski vrh s prenosnim jamborom in dolgo usmerjeno anteno, obrnjeno proti obzorju | a distant second ridge in #b9d0e6 as a snow line |
| Občni zbori | a long table seen from above with simplified chairs around it and a single microphone | dolga miza od zgoraj s poenostavljenimi stoli okoli nje in enim mikrofonom | a small calendar page icon in ice blue in the top left |
| Članarina | a stylized membership card with a rounded 6 px corner radius and a round emblem placeholder, floating over the ridge | stilizirana članska kartica z zaobljenimi vogali (6 px) in okroglim praznim emblemom, ki lebdi nad grebenom | three ice-blue dashes suggesting text lines on the card, no letters |
| Spletne kamere / vreme | a weather camera on a short pole on a snowy summit, a wide view over layered ridges | vremenska kamera na kratkem drogu na zasneženem vrhu, širok pogled čez plasti grebenov | thin horizontal snow line in #eef3f8 at the summit |
| Splošno / novice | a single vertical antenna on the highest ridge peak with three wave arcs | ena navpična antena na najvišjem vrhu grebena s tremi loki valov | none |

### 3.3 Izpolnjena primera

EN (Contests):
```
Style: flat geometric vector illustration in the visual identity of Radio klub Snežnik (S59DGO), an amateur radio club from Ilirska Bistrica, Slovenia. Clean solid-color shapes only: no gradients, no shadows, no outlines, no textures, no 3D, no photorealism. Palette: deep navy #15304f as the dominant background, lighter navy layers #1f4470 and #2a5687, pale ice blue #b9d0e6 and off-white #eef3f8 for snow and light areas, sunset orange #d9702a used sparingly as the single accent color, at most 10 % of the image. Recurring motif: two or three layered angular low-poly mountain ridge silhouettes of Mount Snežnik stacked front to back, generous empty space above them. Mood: alpine, calm, modern, technical. No text, no letters, no logos, no watermarks, no human faces.
Featured image for a blog post about the results of the IARU VHF contest. Composition: a tall lattice tower with stacked Yagi antennas, wave arcs spreading to both sides as the central subject in the middle third of the image, layered navy ridge silhouettes of Snežnik across the bottom quarter, a small solid orange sun disc top right, a faint Maidenhead grid of thin lines in #1f4470 behind the tower. Landscape 3:2 aspect ratio, subject centered so the image survives cropping on both sides, plenty of empty navy sky. Avoid: gradients, drop shadows, glow, neon, 3D render, photo, stock-photo look, clip-art, faces, extra logos, watermarks, random letters, more than one sun, purple or green or red hues, borders or frames.
```

SL (Občni zbor, svetla različica):
```
Slog: ploskovna geometrijska vektorska ilustracija v vizualni podobi Radio kluba Snežnik (S59DGO). Samo čiste enobarvne ploskve: brez gradientov, senc, obrob, tekstur in 3D učinka. Paleta: tokrat SVETLO ozadje #eef3f8 (nebo), greben v modrih #b9d0e6 (zadaj), #2a5687 (sredina) in #15304f (spredaj), oranžna #d9702a samo za en majhen sončni disk. Vzdušje: alpsko, mirno, sodobno. Brez besedila, logotipov in obrazov.
Naslovna slika za objavo o rednem letnem občnem zboru kluba. Kompozicija: dolga miza od zgoraj s poenostavljenimi stoli okoli nje in enim mikrofonom v temno modri #15304f kot osrednji predmet v srednji tretjini slike, plasti silhuet grebena Snežnika čez spodnjo četrtino, majhen poln oranžen sončni disk desno zgoraj, majhna ikona koledarskega lista v #2a5687 levo zgoraj. Ležeče razmerje 3:2, motiv na sredini, veliko praznega svetlega neba. Izogibaj se gradientom, sencam, fotografiji, obrazom, naključnim črkam, več kot enemu soncu.
```

---

## 4. Infografike

**Namen**: samostojne informativne grafike znotraj objav (rezultati, urniki, frekvence, koraki, statistika).

**Mere**: širina **2200 px** (prikaz 1100 px = `wideSize`) ali **1520 px** (prikaz 760 px = `contentSize`). Višina poljubna; za dolge infografike raje več ločenih slik kot ena zelo visoka. Za vstavljanje kot blok »Slika« s poravnavo »Široko«.

**Ozadje**: bela površina `#ffffff` z naslovnim trakom v `#15304f` zgoraj (kot trak z grebenom v temi) ali polno temno modro ozadje. Podatki v ploščicah z zaobljenimi vogali, ločnice `#d3dfeb`.

**Besedilo v sliki**: generatorji besedilo pogosto popačijo. Priporočeni postopek: (a) generiraj z besedilom v ChatGPT/Gemini/Ideogram in ročno popravi, ali (b) generiraj **samo postavitev in grafiko brez besedila** in besedilo dodaj v Canvi/Inkscapu s pisavama teme. V predlogah je besedilo označeno; če ga izpustiš, dodaj stavek »leave the text areas as empty solid bars« / »besedilna polja pusti kot prazne enobarvne trakove«.

### 4.1 Rezultati tekmovanja (lestvica)

EN:
```
[SLOG] [TIPO]
Infographic: results leaderboard of {ime tekmovanja}, {datum}. Layout: a navy #15304f title band across the top with the text "{NASLOV}" in white bold and a small uppercase label "{KATEGORIJA}" in ice blue; a low angular ridge silhouette in #1f4470 along the bottom edge of the band. Below, a white #ffffff panel with {N} rows, each row a horizontal bar: rank number in bold, callsign "{KLIC1}", "{KLIC2}", "{KLIC3}" in a geometric sans-serif, score right-aligned. Bar lengths proportional to the scores {rezultati}. First place bar in sunset orange #d9702a, all other bars in #2a5687, thin separators in #d3dfeb. Off-white #eef3f8 page background around the panel, 6 px rounded corners. Portrait, aspect ratio 4:5, wide margins.
```

SL:
```
[SLOG] [TIPO]
Infografika: lestvica rezultatov tekmovanja {ime tekmovanja}, {datum}. Postavitev: temno modri #15304f naslovni trak čez vrh z besedilom "{NASLOV}" v beli krepki pisavi in majhno oznako v verzalkah "{KATEGORIJA}" v ledeno modri; nizka kotna silhueta grebena v #1f4470 ob spodnjem robu traku. Pod njim bela #ffffff plošča z {N} vrsticami, vsaka vrstica je vodoravni stolpec: uvrstitev v krepki pisavi, klicni znak "{KLIC1}", "{KLIC2}", "{KLIC3}" v geometrijski pisavi brez serifov, rezultat desno poravnan. Dolžine stolpcev sorazmerne z rezultati {rezultati}. Stolpec prvega mesta v oranžni #d9702a, vsi ostali v #2a5687, tanke ločnice v #d3dfeb. Umazano belo #eef3f8 ozadje strani okoli plošče, vogali zaobljeni 6 px. Pokončno, razmerje 4:5, široki robovi.
```

Primer izpolnjenih vrednosti: `{NASLOV}` = »Rezultati – Marconi Memorial VHF 2026«, `{KATEGORIJA}` = »SINGLE OP 144 MHz«, `{KLIC1..3}` = S59DGO, S50C, S57O, `{rezultati}` = 128 400 / 95 200 / 71 850.

### 4.2 Urnik dogodka ali koledar tekmovanj

EN:
```
[SLOG] [TIPO]
Infographic: schedule for {dogodek}, {datum}. Layout: navy #15304f title band at the top with "{NASLOV}" in white bold and the date "{DATUM}" as a small uppercase ice-blue label. Below, a vertical timeline on a white panel: a thin vertical line in #d3dfeb on the left, one solid circle per item, {N} items. Each item: time "{URA}" in bold navy on the left, event name "{DOGODEK}" in dark navy #172433, one-line note in muted blue #5f7590. Circles in #2a5687; the current or key item "{POUDAREK}" has an orange #d9702a circle. Small flat icons next to items: antenna, coffee cup, microphone, trophy, all single-color #2a5687. A low ridge silhouette in #eef3f8 at the very bottom. Portrait 4:5, generous spacing.
```

SL:
```
[SLOG] [TIPO]
Infografika: urnik za {dogodek}, {datum}. Postavitev: temno modri #15304f naslovni trak zgoraj z "{NASLOV}" v beli krepki pisavi in datumom "{DATUM}" kot majhno ledeno modro oznako v verzalkah. Pod njim navpična časovnica na beli plošči: tanka navpična črta v #d3dfeb na levi, en poln krog na postavko, {N} postavk. Vsaka postavka: ura "{URA}" v krepki temno modri na levi, ime dogodka "{DOGODEK}" v temno modri #172433, enovrstična opomba v tihi modri #5f7590. Krogi v #2a5687; ključna postavka "{POUDAREK}" ima oranžen #d9702a krog. Majhne ploskovne ikone ob postavkah: antena, skodelica kave, mikrofon, pokal, vse enobarvne #2a5687. Nizka silhueta grebena v #eef3f8 čisto spodaj. Pokončno 4:5, zračen razmik.
```

Za koledar tekmovanj (mesečni pregled) zamenjaj časovnico s tabelo: »a 12-row table, one row per month, month label in uppercase on the left, contest names as navy pills, weekend dates as small labels«.

### 4.3 Tehnična kartica: frekvence, repetitorji, lokator

EN:
```
[SLOG] [TIPO]
Technical info card for {vsebina, npr. club repeater / club station}. Layout: full navy #15304f background, a single white #ffffff card with 6 px rounded corners centered with wide margins. Card header: "{NASLOV}" in bold dark navy, under it an uppercase label "{PODNASLOV}" in muted blue #5f7590. Body: a two-column key–value list, {N} rows, keys in uppercase small labels (e.g. "FREKVENCA", "ODMIK", "CTCSS", "LOKATOR", "NADM. VIŠINA"), values in bold dark navy; values: {vrednosti}. One highlighted value "{POUDAREK}" in orange #b0561a. Right side of the card: a flat icon of a mast with a vertical antenna and three concentric wave arcs in #2a5687. Behind the card, low ridge silhouettes in #1f4470 and #2a5687 across the bottom of the navy background, small orange sun top right. Landscape 3:2.
```

SL:
```
[SLOG] [TIPO]
Tehnična kartica za {vsebina, npr. klubski repetitor / klubska postaja}. Postavitev: polno temno modro #15304f ozadje, ena bela #ffffff kartica z vogali 6 px na sredini s širokimi robovi. Glava kartice: "{NASLOV}" v krepki temno modri, pod njim oznaka v verzalkah "{PODNASLOV}" v tihi modri #5f7590. Telo: dvostolpčni seznam ključ–vrednost, {N} vrstic, ključi kot majhne oznake v verzalkah (npr. "FREKVENCA", "ODMIK", "CTCSS", "LOKATOR", "NADM. VIŠINA"), vrednosti v krepki temno modri; vrednosti: {vrednosti}. Ena poudarjena vrednost "{POUDAREK}" v oranžni #b0561a. Desna stran kartice: ploskovna ikona jambora z navpično anteno in tremi koncentričnimi loki valov v #2a5687. Za kartico nizke silhuete grebena v #1f4470 in #2a5687 čez spodnji del temno modrega ozadja, majhno oranžno sonce desno zgoraj. Ležeče 3:2.
```

### 4.4 Koraki (kako do licence, kako se včlaniti)

EN:
```
[SLOG] [TIPO]
Step-by-step infographic: "{NASLOV}" in {N} steps. Layout: off-white #eef3f8 background, title in bold dark navy #172433 at the top left with a short subtitle in muted blue #5f7590. Steps arranged {horizontally in a row / vertically}, each step a white #ffffff tile with 6 px rounded corners: a large step number "1", "2", "3"... in bold navy #15304f, a single-color flat icon in #2a5687 ({ikone, npr. book, pencil, radio, certificate, handshake-free: two overlapping circles}), a short step title "{KORAK}" in bold, one line of description in dark navy. Steps connected by a thin line in #d3dfeb with small orange #d9702a arrow heads. The final step tile has an orange top border. Layered ridge silhouettes in #b9d0e6 and #2a5687 along the bottom edge. Aspect ratio {3:2 / 4:5}, wide margins.
```

SL:
```
[SLOG] [TIPO]
Infografika po korakih: "{NASLOV}" v {N} korakih. Postavitev: umazano belo #eef3f8 ozadje, naslov v krepki temno modri #172433 zgoraj levo s kratkim podnaslovom v tihi modri #5f7590. Koraki razporejeni {vodoravno v vrsti / navpično}, vsak korak je bela #ffffff ploščica z vogali 6 px: velika številka koraka "1", "2", "3"… v krepki temno modri #15304f, enobarvna ploskovna ikona v #2a5687 ({ikone, npr. knjiga, svinčnik, radijska postaja, diploma, dva prekrivajoča se kroga}), kratek naslov koraka "{KORAK}" v krepki pisavi, ena vrstica opisa v temno modri. Koraki povezani s tanko črto v #d3dfeb z majhnimi oranžnimi #d9702a puščicami. Zadnja ploščica ima oranžen zgornji rob. Plasti silhuet grebena v #b9d0e6 in #2a5687 ob spodnjem robu. Razmerje {3:2 / 4:5}, široki robovi.
```

### 4.5 Statistika kluba (številke v ploščicah)

EN:
```
[SLOG] [TIPO]
Stat tiles infographic: "{NASLOV}" ({leto}). Layout: navy #15304f background with layered ridge silhouettes in #1f4470 and #2a5687 across the bottom third and a small orange sun top right. Title in white bold at the top left, subtitle "{PODNASLOV}" in ice blue #b9d0e6. A grid of {N} tiles (2 columns), each tile a slightly lighter navy #1f4470 rectangle with 6 px rounded corners: a large bold number "{ŠTEVILKA}" in white, an uppercase label "{OZNAKA}" in ice blue below it, a tiny single-color icon in #b9d0e6 in the corner. Exactly one tile, "{POUDAREK}", has its number in orange #f0955a. Numbers: {vrednosti}. Landscape 3:2 or square 1:1.
```

SL:
```
[SLOG] [TIPO]
Infografika s številkami v ploščicah: "{NASLOV}" ({leto}). Postavitev: temno modro #15304f ozadje s plastmi silhuet grebena v #1f4470 in #2a5687 čez spodnjo tretjino in majhnim oranžnim soncem desno zgoraj. Naslov v beli krepki pisavi zgoraj levo, podnaslov "{PODNASLOV}" v ledeno modri #b9d0e6. Mreža {N} ploščic (2 stolpca), vsaka ploščica malce svetlejši temno modri #1f4470 pravokotnik z vogali 6 px: velika krepka številka "{ŠTEVILKA}" v beli, pod njo oznaka v verzalkah "{OZNAKA}" v ledeno modri, drobna enobarvna ikona v #b9d0e6 v kotu. Natanko ena ploščica, "{POUDAREK}", ima številko v oranžni #f0955a. Številke: {vrednosti}. Ležeče 3:2 ali kvadrat 1:1.
```

Primer `{vrednosti}`: 62 članov · 1964 leto ustanovitve · 18 tekmovanj na leto · 4 repetitorji.

---

## 5. Družbena omrežja in plakati

**Mere**: Facebook/Instagram objava 1080×1080 (1:1), pokončna objava 1080×1350 (4:5), zgodba/reel 1080×1920 (9:16), Facebook naslovnica 1640×624 (prikazano ~820×312), plakat A4 2480×3508 ali A3 3508×4961 (razmerje 1:1,414, 300 dpi). Za zgodbe pusti zgornjih in spodnjih 250 px brez pomembne vsebine.

**Načelo**: slika za omrežja je »trak z grebenom« teme v kvadratu – temno modro ozadje, naslov v beli krepki, podnaslov v ledeno modri, oranžna značka za kategorijo ali datum, greben spodaj.

### 5.1 Napoved dogodka – kvadrat 1:1

EN:
```
[SLOG] [TIPO]
Social media post announcing {dogodek}. Square 1:1. Layout: full navy #15304f background; top left a small orange #d9702a rounded pill with white uppercase text "{ZNAČKA, npr. DOGODEK}"; below it the headline "{NASLOV}" in large white bold geometric sans-serif, max three lines; under it the date and place "{DATUM} · {KRAJ}" in ice blue #b9d0e6 uppercase with wide letter spacing; one line of detail "{PODROBNOST}" in ice blue. Bottom third: layered angular ridge silhouettes of Snežnik in #1f4470 and #2a5687 with {motiv, npr. a portable mast with a Yagi antenna} on the highest peak, small orange sun top right. Bottom left corner: the callsign "S59DGO" as a small white uppercase label. Wide margins of at least 8 % of the width. [NE]
```

SL:
```
[SLOG] [TIPO]
Objava za družbena omrežja z napovedjo dogodka {dogodek}. Kvadrat 1:1. Postavitev: polno temno modro #15304f ozadje; zgoraj levo majhna oranžna #d9702a zaobljena značka z belim besedilom v verzalkah "{ZNAČKA, npr. DOGODEK}"; pod njo naslov "{NASLOV}" v veliki beli krepki geometrijski pisavi brez serifov, največ tri vrstice; pod njim datum in kraj "{DATUM} · {KRAJ}" v ledeno modri #b9d0e6 v verzalkah s širokim razmikom; ena vrstica podrobnosti "{PODROBNOST}" v ledeno modri. Spodnja tretjina: plasti kotnih silhuet grebena Snežnika v #1f4470 in #2a5687 z {motiv, npr. prenosnim jamborom z Yagi anteno} na najvišjem vrhu, majhno oranžno sonce desno zgoraj. Spodnji levi kot: klicni znak "S59DGO" kot majhna bela oznaka v verzalkah. Široki robovi vsaj 8 % širine. [NE]
```

### 5.2 Pokončna objava 4:5 in zgodba 9:16

Uporabi predlogo 5.1 in zamenjaj prvi stavek o formatu:

- 4:5: `Portrait 4:5 (1080×1350). Same layout, the ridge takes the bottom 40 %, headline may be four lines.` / `Pokončno 4:5 (1080×1350). Enaka postavitev, greben zavzame spodnjih 40 %, naslov ima lahko štiri vrstice.`
- 9:16: `Vertical story 9:16 (1080×1920). Keep the top 13 % and bottom 13 % free of text (only navy sky and ridge). Headline in the vertical center, ridge in the bottom 30 %, larger sun.` / `Pokončna zgodba 9:16 (1080×1920). Zgornjih 13 % in spodnjih 13 % brez besedila (samo temno modro nebo in greben). Naslov na navpični sredini, greben v spodnjih 30 %, večje sonce.`

### 5.3 Rezultat ali čestitka (kvadrat)

EN:
```
[SLOG] [TIPO]
Social media post celebrating a result: "{NASLOV, npr. 1. mesto v kategoriji SO 144 MHz}". Square 1:1. Navy #15304f background. Top: small orange pill "{ZNAČKA, npr. CONTEST}". Center: a large white bold number or rank "{ŠTEVILKA}" (very large, half the height), next to it the callsign "{KLIC}" and the contest name "{TEKMOVANJE}" in ice blue. A simple flat trophy icon in orange #d9702a next to the number, no gradients. Bottom third: ridge silhouettes and one lattice tower with stacked Yagi antennas in #2a5687. "S59DGO" small white label bottom left. [NE]
```

SL:
```
[SLOG] [TIPO]
Objava za družbena omrežja ob rezultatu: "{NASLOV, npr. 1. mesto v kategoriji SO 144 MHz}". Kvadrat 1:1. Temno modro #15304f ozadje. Zgoraj: majhna oranžna značka "{ZNAČKA, npr. CONTEST}". Sredina: velika bela krepka številka ali uvrstitev "{ŠTEVILKA}" (zelo velika, polovica višine), ob njej klicni znak "{KLIC}" in ime tekmovanja "{TEKMOVANJE}" v ledeno modri. Preprosta ploskovna ikona pokala v oranžni #d9702a ob številki, brez gradientov. Spodnja tretjina: silhuete grebena in en mrežasti stolp z zloženimi Yagi antenami v #2a5687. "S59DGO" majhna bela oznaka spodaj levo. [NE]
```

### 5.4 Plakat A4/A3 (vabilo)

EN:
```
[SLOG] [TIPO]
Printable poster, portrait A4 aspect ratio (1:1.414), 300 dpi, for print. Layout in three bands. Top band (55 % of height): navy #15304f with a large headline "{NASLOV}" in white bold geometric sans-serif, an uppercase ice-blue label "{ZNAČKA}" above it, and layered angular ridge silhouettes of Snežnik in #1f4470 and #2a5687 at the bottom of the band with {motiv} on the peak and a small orange sun; the band ends with the angular ridge edge cutting into the light area below (no straight line). Middle band: off-white #eef3f8 with three columns of details, each with a single-color icon in #2a5687 and uppercase label in muted blue #5f7590: "KDAJ" "{DATUM IN URA}", "KJE" "{KRAJ}", "KDO" "{ORGANIZATOR}"; below them two lines of description "{OPIS}" in dark navy #172433. Bottom band (12 %): white #ffffff with the callsign "S59DGO", the website "www.s59dgo.org" and a small orange #d9702a rounded button shape with white text "{POZIV, npr. Vabljeni!}". Leave 10 mm safe margins. Vector-clean, print-ready, CMYK-safe colors. [NE]
```

SL:
```
[SLOG] [TIPO]
Plakat za tisk, pokončno razmerje A4 (1:1,414), 300 dpi. Postavitev v treh pasovih. Zgornji pas (55 % višine): temno modra #15304f z velikim naslovom "{NASLOV}" v beli krepki geometrijski pisavi brez serifov, nad njim ledeno modra oznaka v verzalkah "{ZNAČKA}", ob dnu pasu plasti kotnih silhuet grebena Snežnika v #1f4470 in #2a5687 z {motiv} na vrhu in majhnim oranžnim soncem; pas se konča s kotnim robom grebena, ki reže v svetlo območje spodaj (brez ravne črte). Srednji pas: umazano bela #eef3f8 s tremi stolpci podrobnosti, vsak z enobarvno ikono v #2a5687 in oznako v verzalkah v tihi modri #5f7590: "KDAJ" "{DATUM IN URA}", "KJE" "{KRAJ}", "KDO" "{ORGANIZATOR}"; pod njimi dve vrstici opisa "{OPIS}" v temno modri #172433. Spodnji pas (12 %): bela #ffffff s klicnim znakom "S59DGO", spletnim naslovom "www.s59dgo.org" in majhnim oranžnim #d9702a zaobljenim gumbom z belim besedilom "{POZIV, npr. Vabljeni!}". Pusti 10 mm varnega roba. Vektorsko čisto, pripravljeno za tisk, barve varne za CMYK. [NE]
```

Za A3 uporabi isto predlogo; generator ne pozna dpi, zato generiraj v največji možni ločljivosti in povečaj z vektorskim prerisom (Inkscape »Trace bitmap«) ali z AI povečavo.

### 5.5 Facebook naslovnica / pasica (1640×624)

EN:
```
[SLOG]
Wide banner, aspect ratio 2.63:1 (1640×624). Full navy #15304f background, layered angular ridge silhouettes of Snežnik across the bottom 45 % in #1f4470 (back) and #2a5687 (front), a single vertical antenna on the highest peak in ice blue #b9d0e6 with three thin concentric wave arcs, small solid orange sun in the top right quarter. Keep the center 40 % of the width empty (the profile picture and page name overlay it). No text. [NE]
```

SL:
```
[SLOG]
Široka pasica, razmerje 2,63:1 (1640×624). Polno temno modro #15304f ozadje, plasti kotnih silhuet grebena Snežnika čez spodnjih 45 % v #1f4470 (zadaj) in #2a5687 (spredaj), ena navpična antena na najvišjem vrhu v ledeno modri #b9d0e6 s tremi tankimi koncentričnimi loki valov, majhno polno oranžno sonce v zgornji desni četrtini. Srednjih 40 % širine pusti prazno (čez njih se prikažeta profilna slika in ime strani). Brez besedila. [NE]
```

---

## 6. Ikone, piktogrami in dekor

**Mere**: ikone generiraj na kvadratu 1024×1024, en motiv na sliko, nato prerisi v SVG (Inkscape »Trace bitmap« ali ročno) in shrani v `s59dgo/assets/img/` ali v knjižnico WordPressa. Za spletno stran je ciljna velikost 24 px in 48 px, debelina črte 2 px pri 24 px.

**Barva**: enobarvno. Za svetli način `#15304f` ali `#2a5687`, za temni način `#b9d0e6`; najbolje generiraj v čisti črni na belem in barvo določi v SVG (`fill="currentColor"`), da ikona podeduje barvo iz CSS.

### 6.1 Ikone kategorij in menija (set)

EN:
```
Flat single-color icon set in one consistent style: solid black #000000 shapes on a pure white background, geometric, built on a 24 px grid with 2 px stroke weight and rounded line ends, minimal detail, no outlines around fills, no gradients, no shadows, no text. Each icon centered in its own square cell with equal padding, arranged in a {N}×{M} grid. Icons: {seznam, npr. a Yagi antenna on a mast; a trophy cup; a group meeting table with three chairs; a membership card with a small circle; a weather camera on a pole; a calendar page; a handheld transceiver; a morse key; a mountain ridge with a sun; a radio wave with three arcs; a map pin over a grid square; an envelope}. Vector-like, crisp edges, suitable for tracing to SVG.
```

SL:
```
Set ploskovnih enobarvnih ikon v enotnem slogu: polne črne #000000 oblike na čisto belem ozadju, geometrijske, na mreži 24 px z debelino črte 2 px in zaobljenimi konci, minimalno podrobnosti, brez obrob okoli polnil, brez gradientov, senc in besedila. Vsaka ikona na sredini svoje kvadratne celice z enakim odmikom, razporejene v mrežo {N}×{M}. Ikone: {seznam, npr. Yagi antena na jamboru; pokal; miza za sestanek s tremi stoli; članska kartica z majhnim krogom; vremenska kamera na drogu; koledarski list; ročna radijska postaja; Morsejev ključ; gorski greben s soncem; radijski val s tremi loki; zemljevidna bucika nad kvadratom mreže; ovojnica}. Vektorski videz, ostri robovi, primerno za prerisovanje v SVG.
```

Predlagani nabor za temo: Dogodki (šotor + jambor), Contests (pokal ali stolp), Občni zbori (miza), Članarina (kartica), Kamere (kamera), Aplikacije (zaslon z lokom valov), Iskanje (lupa), Kontakt (ovojnica), Doniraj (srce v krogu).

### 6.2 Ikone spletnih aplikacij (EDI Log Analitika, EDI to ADIF, Crosscheck, Contest Logger)

EN:
```
[SLOG]
App icon, square 1:1 with 6 px rounded corners at 1024 px (about 12 % radius), solid navy #15304f background, a single flat symbol in white #ffffff centered at 60 % of the width, one small orange #d9702a accent element. Symbol for {aplikacija}: {simbol, npr. a bar chart with three bars over a wave arc (Analitika) / two document sheets with an arrow between them (EDI to ADIF) / two overlapping document sheets with a check mark (Crosscheck) / a notebook page with a small antenna (Contest Logger)}. No text, no gradients, no shadows, no bevel. Deliver also a version with transparent background.
```

SL:
```
[SLOG]
Ikona aplikacije, kvadrat 1:1 z zaobljenimi vogali (pri 1024 px približno 12 % polmera), polno temno modro #15304f ozadje, en ploskovni simbol v beli #ffffff na sredini v 60 % širine, en majhen oranžen #d9702a poudarni element. Simbol za {aplikacija}: {simbol, npr. stolpčni graf s tremi stolpci nad lokom valov (Analitika) / dva lista dokumenta s puščico med njima (EDI to ADIF) / dva prekrivajoča se lista s kljukico (Crosscheck) / stran zvezka z majhno anteno (Contest Logger)}. Brez besedila, gradientov, senc in reliefa. Dodaj še različico s prosojnim ozadjem.
```

### 6.3 Vzorec grebena in ozadja

EN:
```
Seamless horizontally tileable pattern strip: angular low-poly mountain ridge silhouettes in three layers, back layer #1f4470, middle #2a5687, front #15304f, on a flat navy #0f1c2b sky, no sun, no gradients, no texture, no stars. The left and right edges must match exactly so the strip tiles seamlessly. Wide aspect ratio 4:1. Peaks of varied height between 30 % and 70 % of the strip height, calm rhythm, no sharp needles.
```

SL:
```
Brezšiven vodoravno ponovljiv vzorčni trak: kotne (low-poly) silhuete gorskega grebena v treh plasteh, zadnja #1f4470, srednja #2a5687, sprednja #15304f, na ravnem temno modrem #0f1c2b nebu, brez sonca, gradientov, tekstur in zvezd. Levi in desni rob se morata natanko ujemati, da se trak brezšivno ponavlja. Široko razmerje 4:1. Vrhovi različnih višin med 30 % in 70 % višine traku, umirjen ritem, brez ostrih igel.
```

Različica za svetlo ozadje: `back layer #b9d0e6, middle #d3dfeb, front #eef3f8 on a white #ffffff sky` / `zadaj #b9d0e6, sredina #d3dfeb, spredaj #eef3f8 na belem #ffffff nebu` (nežen dekor pod naslovom ali v nogi).

### 6.4 Ločila in majhni dekorativni elementi

EN:
```
Set of {N} small flat decorative elements in the visual identity of an alpine amateur radio club, each centered in its own square cell on a pure white background, solid navy #15304f with a single orange #d9702a accent, no gradients, no outlines, no text: a short three-peak ridge as a section divider; a sun disc rising behind two peaks; three concentric radio-wave arcs; a horizontal row of morse dots and dashes; a simple compass rose with an orange north needle; a small dipole antenna between two masts. Vector-like, crisp, suitable for tracing to SVG.
```

SL:
```
Set {N} majhnih ploskovnih dekorativnih elementov v vizualni podobi alpskega radioamaterskega kluba, vsak na sredini svoje kvadratne celice na čisto belem ozadju, polna temno modra #15304f z enim oranžnim #d9702a poudarkom, brez gradientov, obrob in besedila: kratek greben s tremi vrhovi kot ločilo razdelkov; sončni disk, ki vzhaja za dvema vrhovoma; trije koncentrični loki radijskih valov; vodoravna vrsta Morsejevih pik in črt; preprosta kompasna roža z oranžno severno iglo; majhen dipol med dvema jamboroma. Vektorski videz, ostro, primerno za prerisovanje v SVG.
```

---

## 7. Opombe po orodjih

### Skupno
- Barvne kode `#rrggbb` upoštevajo ChatGPT/DALL-E, Gemini, Ideogram in Claude približno; Midjourney in SD jih pogosto ignorirajo. Zato so v `[SLOG]` barve opisane tudi z besedami (deep navy, ice blue, sunset orange). Končno barvno uskladitev naredi v urejevalniku (Photopea, GIMP: krivulje ali zamenjava barv).
- Najboljša referenca sloga je izvoz `s59dgo/assets/img/greben.svg` ali `s59dgo/screenshot.png` kot slika, ki jo priložiš promptu (ChatGPT, Gemini, Midjourney `--sref`).
- Besedilo v sliki: najbolj zanesljivi so Ideogram, Gemini (Nano Banana) in ChatGPT; Midjourney in SD besedilo popačita. Slovenske šumnike vedno preveri.

### Midjourney
- Dodaj parametre na konec: `--ar 3:2` (naslovne), `--ar 1:1`, `--ar 4:5`, `--ar 9:16`, `--ar 2:3` (plakat, nato obreži na A4), `--style raw`, `--stylize 50`.
- Negativni blok zapiši kot `--no gradient, shadow, glow, neon, photo, text, letters, watermark, face, frame`.
- Za doslednost serije: `--sref {URL referenčne slike}` z že sprejeto naslovno sliko in `--sw 50`; pri drugi sliki dodaj `--seed` prve.
- Besedilo v sliko dodaj naknadno.

### ChatGPT (DALL-E / GPT Image) in Gemini (Nano Banana)
- Prompti delujejo v obeh jezikih; SL različice so pisane za ta orodja.
- Priloži referenčno sliko in reci: »Upoštevaj slog priložene slike (barve, ploskovnost, greben).«
- Popravki v pogovoru: »Odstrani gradient na nebu«, »Sonce naj bo manjše in samo eno«, »Popravi besedilo: 'Občni zbor' s č«.
- Za prosojno ozadje izrecno zahtevaj »transparent background PNG«.

### Ideogram
- Najboljši za infografike in plakate z besedilom. Izberi slog »Design«, besedilo v narekovajih, dodaj `[TIPO]`.
- Paleta: v nastavitvah izberi »Custom palette« in vnesi `#15304f #2a5687 #b9d0e6 #eef3f8 #d9702a`.

### Stable Diffusion / Flux
- Positive prompt: `[SLOG]` + predloga, na začetek dodaj `flat vector illustration, minimalist, solid colors, (no gradient:1.3)`.
- Negative prompt: vsebina `[NE]` + `text, watermark, signature, blurry, noise, jpeg artifacts, photo, realistic`.
- CFG 5–7, brez LoRA fotorealizma; za doslednost uporabi IP-Adapter z `greben.svg` kot referenco.

### Canva / Inkscape (dokončanje)
- Besedilo dodaj s Space Grotesk (naslovi, 700) in IBM Plex Sans (besedilo, 400/600); obe pisavi sta v `s59dgo/assets/fonts/` (woff2) in brezplačno na Google Fonts.
- Oznake: verzalke, razmik črk 0,1 em, 12–14 px pri širini 800 px.

---

## 8. Kontrolni seznam pred objavo

- [ ] **Slog**: brez gradientov, senc in obrob; največ eno sonce; oranžne največ 10 %.
- [ ] **Barve**: modra res `#15304f`/`#2a5687` (po potrebi uskladi v urejevalniku), ne vijolična ali turkizna.
- [ ] **Besedilo**: pravilno slovensko s šumniki, brez naključnih črk; kontrast besedila proti podlagi ≥ 4,5:1 (oranžno besedilo samo `#b0561a` na svetli ali `#f0955a` na temni).
- [ ] **Mere**: naslovna slika ≥ 1600×1040 (motiv na sredini), infografika 2200 ali 1520 px široka, omrežja 1080 px, plakat 300 dpi.
- [ ] **Temni način**: prosojne slike preveri na `#0f1c2b`; ikone uporabljajo `currentColor`.
- [ ] **Datoteka**: WebP ali JPEG kakovosti 80, naslovna < 300 KB, infografika < 600 KB; ime datoteke z ASCII in pomišljaji (`marconi-2026-rezultati.webp`).
- [ ] **WordPress**: nastavi kot »Naslovna slika« objave; alt besedilo v slovenščini (npr. »Ilustracija: stolp z antenami nad grebenom Snežnika«); infografiko vstavi kot blok Slika s poravnavo Široko in besedilnim povzetkom podatkov pod njo (dostopnost).
- [ ] **Izvirnik**: shrani prompt in izvorno sliko (Canva/SVG) v arhiv kluba za poznejše popravke.

---

## Priloga: hitri izpis barv za lepljenje

```
navy #15304f · navy-2 #1f4470 · navy-3 #2a5687 · ice #b9d0e6 · off-white #eef3f8 · white #ffffff
text #172433 · text-2 #46586c · muted #5f7590 · line #d3dfeb
orange #d9702a · orange-text #b0561a · orange-dark-mode #f0955a
dark bg #0f1c2b · dark surface #152638 · dark header #0a1420 · dark line #27405a
```
