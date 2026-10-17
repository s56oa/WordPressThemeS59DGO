# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Kaj je to

Klasična WordPress tema `s59dgo` za www.s59dgo.si (Radio klub Snežnik Ilirska Bistrica, S59DGO). Tema živi v podmapi `s59dgo/`; koren repozitorija nosi orodja (`bin/`) in dokumentacijo (`docs/`). Komunikacija z naročnikom in nizi v temi so v slovenščini.

Potrjen dizajn: `docs/superpowers/specs/2026-09-09-s59dgo-wordpress-theme-design.md`. Vizualna referenca (smer »Grebeni«): https://claude.ai/code/artifact/ee9e3cd9-3f7a-4423-8d20-946d153fc80b

Grafika za objave (naslovne slike, infografike, omrežja, ikone): predloge AI promptov v `docs/ai-prompti-grafika.md`, referenčne SVG/PNG v slogu teme v `docs/grafika-referenca/`. Interaktivni vodnik s sestavljalnikom promptov: https://claude.ai/code/artifact/1f8918e8-d624-4fa1-853c-d24127de5d1e

Generator promptov (izpolni predloge iz dokumenta, ena datoteka, deluje brez povezave): `docs/orodja/s59dgo-prompti.html`, objavljen kot artefakt https://claude.ai/artifact/UMSHX2i8n54uMS5ALpKT2B (zmožnost `downloads` za izvoz). Pisave vanj vdela `bin/prompti-pisave.sh`; predloge so v bloku `#podatki` in jih `tests/test-prompti.php` primerja z `docs/ai-prompti-grafika.md` – ob spremembi dokumenta posodobi tudi orodje. Za objavo artefakta pripravi kopijo brez ovoja `<!doctype>…<body>` z `bin/prompti-artefakt.sh <pot>` in jo objavi na isti URL.

## Ukazi

Lokalno ni PHP niti WordPressa; PHP teče prek Dockerja.

```bash
bin/lint.sh          # php -l za vse s59dgo/**/*.php v sliki php:8.3-cli
bin/test.sh          # statični in enotski testi v tests/ (stubi WP funkcij v tests/stubs.php), Node testa tests/prompti.test.mjs in tests/lokalno.test.mjs (node:22-alpine) ter tests/lokalno.test.sh (bash:5.2)
bin/phpcs.sh         # PHPCS z WordPress Coding Standards v Dockerju (phpcs.xml.dist); bin/phpcs.sh --fix požene phpcbf
bin/build-zip.sh     # lint + testi + phpcs + dist/s59dgo.zip za nalaganje v WP administracijo
bin/screenshot.sh    # regenerira s59dgo/screenshot.png iz bin/screenshot.svg (rsvg-convert v Dockerju)
bin/grafika-referenca.sh  # upodobi docs/grafika-referenca/*.svg v PNG s pisavama teme
bin/prompti-pisave.sh     # vdela pisave teme kot base64 v docs/orodja/s59dgo-prompti.html
bin/prompti-artefakt.sh <pot>  # kopija generatorja brez ovoja <!doctype>…<body> za objavo artefakta
bin/lokalno.sh gor|dol|obnovi [arhiv]|odpri|pobrisi  # lokalna kopija produkcije v Dockerju: http://localhost:8059
bin/preveri-lokalno.sh    # kontrole 1–9 teme na lokalni kopiji; poročilo v dist/preverjanje/porocilo.html
```

Nov test: `tests/test-<ime>.php`, ki vključi `tests/preveri.php` (in `tests/stubs.php` za funkcije iz `inc/`).

Preizkus poteka na strežniku: zip naloži kot neaktivno temo, preglej prek Videz → Teme → »Predogled v živo«, aktiviraj šele po pregledu. Pred aktivacijo: dodeli meni lokaciji »Glavni meni«, nastavi logotip, napolni gradnike noge (`noga-1..3`), Nastavitve → Branje → 9 objav na stran. Po posodobitvi na 1.2.0 enkrat poženi vtičnik »Regenerate Thumbnails«, da dobijo obstoječe slike izreza 800×520 in 1200×630.

Lokalna kopija produkcije: `bin/lokalno.sh obnovi` iz najnovejšega arhiva Backuply v `prod_backups/` (ali podanega) postavi WordPress na `http://localhost:8059` (8080 zaseda drug projekt) in izpiše enkratno geslo za lokalnega skrbnika `lokalni`; novo geslo dobiš z ponovnim `obnovi`. `bin/preveri-lokalno.sh` brez ponovne obnove traja ≈ 1 min in zapiše `dist/preverjanje/porocilo.html`, `najdbe.json` in `posnetki/`; najdbe so `napaka` (izhod 1), `opozorilo` ali `ročni korak`, tema se primerja z zadnjim git tagom (lokalna tema `s59dgo-izdana`).

`AGENTS.md` (ni v gitu) je kopija tega dokumenta za Codex; ob spremembi `CLAUDE.md` jo posodobi.

Projektni skilli v `.claude/skills/`: `s59dgo-izdaja-teme` (lokalno preverjanje, verzija, zip, merge, tag, GitHub release, namestitev), `s59dgo-generator-promptov` (urejanje in ponovna objava generatorja), `s59dgo-pregled-zive-strani` (crosscheck www.s59dgo.si s Claude in Chrome).

## Arhitektura

- **Brez build koraka.** `s59dgo/style.css` vsebuje glavo teme in vse sloge; barve so CSS spremenljivke `--barva-*`, temni način je `@media (prefers-color-scheme: dark)` blok, ki jih prepiše. Pisave so woff2 v `assets/fonts/` prek `@font-face`, brez zunanjih klicev.
- **`theme.json` ima samo `settings`** (paleta, pisave, velikosti, `contentSize`/`wideSize`). Brez `styles` in brez Site Editorja; postavitev določajo PHP predloge.
- **Trak z grebenom** (`template-parts/trak.php` + `s59dgo_trak_podatki()` v `inc/template-tags.php`) je edini kontekstno odvisen del: vsebino izbere glede na `is_home()/is_archive()/is_search()/is_singular()/is_404()`. `header.php` ga vključi enkrat, za vse predloge.
- **Mreža objav** je predloga-del `template-parts/mreza.php`, ki jo uporabljajo `home.php`, `index.php`, `archive.php` in `search.php`; `template-parts/kartica.php` je ena kartica znotraj mreže. Domača stran je WP nastavitev »Zadnje objave«, zato mrežo izriše `home.php`, ne `front-page.php`.
- `functions.php` samo nalaga `inc/setup.php`, `inc/enqueue.php`, `inc/template-tags.php`, `inc/customizer.php` in `inc/druzbena.php`.
- **Naslovne slike**: kartice v mreži so vedno 20:13 (velikost `s59dgo-kartica` 800×520, CSS `object-fit: cover`), posamezna objava pokaže celo sliko (`large`). `inc/druzbena.php` izpiše oznake Open Graph/Twitter v `wp_head` (slika `s59dgo-deljenje` 1200×630, sicer `large` ali logotip) in se umakne, če so aktivni Yoast SEO, Rank Math ali Jetpack (filter `s59dgo_druzbena_podatki`). Generator promptov mora slediti tem razmerjem.
- **Lokalna kopija produkcije** (`lokalno/`, Docker Compose): WordPress in baza tečeta v notranjem omrežju brez interneta; internet imata le vsebnik `prenos` (jedro WP) in gradnja slike `brskalnik`. `vrata` (socat) je poleg notranjega še v omrežju `objava` (ni `internal`, ker Docker sicer ne objavi porta), objavi samo `127.0.0.1:8059` in posreduje le na `wp:80`. Podatki produkcije so samo v `prod_backups/` (gitignore) in volumnih `s59dgo-lokalno_*` ter vsebujejo zasebne podatke (uporabniki, komentarji, wp-config): nikoli `git add` iz teh poti; `bin/lokalno.sh pobrisi` volumne izbriše. Tema se vgradi samo za branje iz `s59dgo/`.
- Nastavitvi v Customizerju (`inc/customizer.php`, razdelek Identiteta spletišča): `s59dgo_naslov_doma` in `s59dgo_podnaslov_doma` (prazno = »Novice s Snežnika« / slogan strani). Razvijalske prilagoditvene točke: filtri `s59dgo_naslov_doma`, `s59dgo_podnaslov_doma` in `s59dgo_noga_besedilo`. Tema nima lastnih tipov vsebine ali meta polj.

## Konvencije

- Text domain, slug in prefiks funkcij: `s59dgo` / `s59dgo_`. Razredi CSS so slovenski, BEM-podobni (`.glava__meni`, `.mreza`, `.kartica`).
- Nizi v predlogah so slovenski in oviti v `__()`/`esc_html_e( …, 's59dgo' )`.
- Vsak izpis gre skozi `esc_html`/`esc_url`/`esc_attr`; `the_content()` in `the_excerpt()` sta izjemi.
