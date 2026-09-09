# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Kaj je to

Klasična WordPress tema `s59dgo` za www.s59dgo.org (Radio klub Snežnik Ilirska Bistrica, S59DGO). Tema živi v podmapi `s59dgo/`; koren repozitorija nosi orodja (`bin/`) in dokumentacijo (`docs/`). Komunikacija z naročnikom in nizi v temi so v slovenščini.

Potrjen dizajn: `docs/superpowers/specs/2026-09-09-s59dgo-wordpress-theme-design.md`. Vizualna referenca (smer »Grebeni«): https://claude.ai/code/artifact/ee9e3cd9-3f7a-4423-8d20-946d153fc80b

## Ukazi

Lokalno ni PHP niti WordPressa; PHP teče prek Dockerja.

```bash
bin/lint.sh          # php -l za vse s59dgo/**/*.php v sliki php:8.3-cli
bin/test.sh          # statični in enotski testi v tests/ (stubi WP funkcij v tests/stubs.php)
bin/phpcs.sh         # PHPCS z WordPress Coding Standards v Dockerju (phpcs.xml.dist); bin/phpcs.sh --fix požene phpcbf
bin/build-zip.sh     # lint + testi + phpcs + dist/s59dgo.zip za nalaganje v WP administracijo
bin/screenshot.sh    # regenerira s59dgo/screenshot.png iz bin/screenshot.svg (rsvg-convert v Dockerju)
```

Nov test: `tests/test-<ime>.php`, ki vključi `tests/preveri.php` (in `tests/stubs.php` za funkcije iz `inc/`).

Preizkus poteka na strežniku: zip naloži kot neaktivno temo, preglej prek Videz → Teme → »Predogled v živo«, aktiviraj šele po pregledu. Pred aktivacijo: dodeli meni lokaciji »Glavni meni«, nastavi logotip, napolni gradnike noge (`noga-1..3`), Nastavitve → Branje → 9 objav na stran.

## Arhitektura

- **Brez build koraka.** `s59dgo/style.css` vsebuje glavo teme in vse sloge; barve so CSS spremenljivke `--barva-*`, temni način je `@media (prefers-color-scheme: dark)` blok, ki jih prepiše. Pisave so woff2 v `assets/fonts/` prek `@font-face`, brez zunanjih klicev.
- **`theme.json` ima samo `settings`** (paleta, pisave, velikosti, `contentSize`/`wideSize`). Brez `styles` in brez Site Editorja; postavitev določajo PHP predloge.
- **Trak z grebenom** (`template-parts/trak.php` + `s59dgo_trak_podatki()` v `inc/template-tags.php`) je edini kontekstno odvisen del: vsebino izbere glede na `is_home()/is_archive()/is_search()/is_singular()/is_404()`. `header.php` ga vključi enkrat, za vse predloge.
- **Mreža objav** je predloga-del `template-parts/mreza.php`, ki jo uporabljajo `home.php`, `index.php`, `archive.php` in `search.php`; `template-parts/kartica.php` je ena kartica znotraj mreže. Domača stran je WP nastavitev »Zadnje objave«, zato mrežo izriše `home.php`, ne `front-page.php`.
- `functions.php` samo nalaga `inc/setup.php`, `inc/enqueue.php`, `inc/template-tags.php`.
- Nastavitvi v Customizerju (`inc/customizer.php`, razdelek Identiteta spletišča): `s59dgo_naslov_doma` in `s59dgo_podnaslov_doma` (prazno = »Novice s Snežnika« / slogan strani). Razvijalske prilagoditvene točke: filtri `s59dgo_naslov_doma`, `s59dgo_podnaslov_doma` in `s59dgo_noga_besedilo`. Tema nima lastnih tipov vsebine ali meta polj.

## Konvencije

- Text domain, slug in prefiks funkcij: `s59dgo` / `s59dgo_`. Razredi CSS so slovenski, BEM-podobni (`.glava__meni`, `.mreza`, `.kartica`).
- Nizi v predlogah so slovenski in oviti v `__()`/`esc_html_e( …, 's59dgo' )`.
- Vsak izpis gre skozi `esc_html`/`esc_url`/`esc_attr`; `the_content()` in `the_excerpt()` sta izjemi.
