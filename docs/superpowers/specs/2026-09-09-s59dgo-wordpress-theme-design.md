# Spec: WordPress tema »s59dgo« za Radio klub Snežnik Ilirska Bistrica

Datum: 2026-09-09
Stanje: potrjen dizajn, pripravljeno za načrt implementacije

## 1. Namen in cilji

Nova klasična WordPress tema za www.s59dgo.org, ki nadomesti temo Iconic One.
Prioriteti, ki ju je potrdil naročnik:

1. Sodoben, prepoznaven videz v gorskem/alpskem vzdušju, izpeljan iz logotipa
   kluba (temno modra, sneg, oranžna sončnega zahoda, motiv Snežnika).
2. Odlična uporaba na mobilnih napravah.

Izbrana vizualna smer je **»Grebeni«** (Smer B na oblikovalski tabli
https://claude.ai/code/artifact/ee9e3cd9-3f7a-4423-8d20-946d153fc80b):
temno modra glava s silhueto grebena, objave brez kartic z značko kategorije,
svetla noga.

Urejanje postavitve prek Site Editorja NI cilj; vsebina se ureja v Gutenbergu
kot doslej.

## 2. Analiza obstoječe strani (izhodišče)

- WordPress 7.1, tema Iconic One, jezik `sl-SI`, vsebina v blokih.
- Domača stran: kronološki seznam objav z desno stransko vrstico (iskanje,
  zadnje objave, zadnji komentarji, angleški naslovi gradnikov).
- Meni: Domov · O društvu (O društvu, Informacije, Donacije društvu,
  Radioamaterstvo v slikah) · Spletne kamere (Snežnik, Sviščaki, včeraj,
  teden) · Spletne aplikacije (EDI Log Analitika, EDI to ADIF, EDI Log
  Crosscheck, VHF/UHF Contest Logger).
- Kategorije objav: Dogodki (+ izobraževanje), Contests, Občni zbori,
  Članarina, Uncategorized.
- Strani spletnih kamer prikazujejo statične slike iz
  `wp-content/sneznik_latest/` (npr. `sneznik_latest.jpg`); ostanejo navadne
  strani.
- Logotip: okrogel emblem (nastavljen kot ikona spletišča), banner z gorami.

## 3. Odločitve (potrjene z naročnikom)

| Področje | Odločitev |
|---|---|
| Vrsta teme | Klasična PHP tema (ne FSE, ne child theme) |
| Postavitev | En stolpec brez stranske vrstice, povsod |
| Glava | Logotip + ime + meni v eni vrstici, prilepljena; hamburger na mobilnem |
| Domača stran | Mreža zadnjih objav (3 stolpci, 9 na stran); brez hero, brez blokov aplikacij/kamer |
| Strani kamer | Navadne strani, brez posebne predloge |
| Noga | Kontakt in uradne ure + gumb Doniraj (widget območja) |
| Temni način | Samodejno po sistemu (`prefers-color-scheme`), brez stikala |
| Build | Brez build koraka: čisti CSS z custom properties + vanilla JS |
| Pisave | Space Grotesk (naslovi) + IBM Plex Sans (besedilo), woff2 gostovane v temi |
| theme.json | Minimalen: samo `settings` (paleta, pisave, velikosti) |
| Razvoj/namestitev | Neposredno na strežniku prek zip/FTP; lokalno samo lint |
| Jezik | Nizi v slovenščini, oviti v `__()`/`esc_html_e()` s text domain `s59dgo` |

## 4. Struktura repozitorija

```
S59DGO_WordPressTheme/          (git koren)
├── CLAUDE.md
├── bin/
│   ├── build-zip.sh            → ustvari dist/s59dgo.zip iz s59dgo/
│   └── lint.sh                 → php -l prek Docker (php:8.3-cli) za vse *.php
├── docs/superpowers/specs/     → ta spec
├── docs/superpowers/plans/     → načrt implementacije
└── s59dgo/                     (tema; slug = text domain = s59dgo)
    ├── style.css               glava teme + vsi slogi
    ├── theme.json
    ├── functions.php
    ├── screenshot.png          1200×900
    ├── header.php, footer.php
    ├── home.php                mreža objav (domača stran = zadnje objave)
    ├── index.php               rezervna predloga (enaka mreža)
    ├── archive.php, search.php mreža + naslov arhiva/iskanja v traku
    ├── single.php, page.php
    ├── 404.php
    ├── searchform.php
    ├── inc/
    │   ├── setup.php           add_theme_support, meniji, velikosti slik, widget območja
    │   ├── enqueue.php         style.css, navigation.js, editor slogi
    │   └── template-tags.php   s59dgo_kategorija(), s59dgo_datum(), s59dgo_slika_kartice(), s59dgo_trak()
    ├── template-parts/
    │   ├── trak.php            temno modri trak z grebenom (naslov + podnaslov)
    │   ├── kartica.php         kartica objave v mreži
    │   ├── vsebina-objava.php  telo posamezne objave
    │   └── vsebina-stran.php   telo strani
    └── assets/
        ├── css/editor.css      slogi za urejevalnik blokov
        ├── js/navigation.js    mobilni meni, iskanje, Esc
        ├── fonts/*.woff2       SpaceGrotesk-Medium/Bold, IBMPlexSans-Regular/SemiBold
        └── img/greben.svg      nadomestna slika kartice + dekor traku
```

## 5. Komponente

### 5.1 Glava (`header.php`)
- `<header class="glava">`, `position: sticky; top: 0`, ozadje `--barva-glava` (#15304f), višina 80 px (64 px na mobilnem).
- Levo: logotip prek `the_custom_logo()` (okrogel, 54 px; rezerva: ime strani), ime strani (`bloginfo('name')`) v Space Grotesk, pod njim podnaslov (`bloginfo('description')`) v razprtih verzalkah.
- Desno: `wp_nav_menu` lokacija `glavni` (»Glavni meni«), globina 2 (podmeni se odpre na hover/fokus na namizju, kot razširjen seznam na mobilnem). Aktivna postavka: spodnja oranžna črta. Ikona iskanja odpre `searchform.php` v spustnem polju.
- Mobilno (< 900 px): gumb hamburger (`aria-controls`, `aria-expanded`), meni se odpre kot polna plast pod glavo. Esc in klik izven zapreta. Zaslon brez JS prikaže meni odprt pod glavo.
- Povezava »Preskoči na vsebino« na `#vsebina`.

### 5.2 Trak z grebenom (`template-parts/trak.php`)
- Temno modri blok neposredno pod glavo z SVG silhueto grebena ob spodnjem robu (barva grebena = barva ozadja telesa, zato je prehod brezšiven v obeh načinih).
- Vsebina po kontekstu (`s59dgo_trak()`):
  - domača stran (`is_home()`): naslov iz nastavitve `s59dgo_naslov_doma` (Videz → Prilagodi → Identiteta spletišča), prazno = »Novice s Snežnika« (filter `s59dgo_naslov_doma`); podnaslov iz nastavitve `s59dgo_podnaslov_doma`, prazno = `bloginfo('description')` (dodano v 1.1.0);
  - arhiv kategorije/oznake: `the_archive_title()` + opis;
  - iskanje: »Iskanje: <niz>« + število zadetkov;
  - objava/stran: naslov vsebine; na objavi še kategorija in datum;
  - 404: »Stran ne obstaja«.
- Višina: visok trak (naslov 46 px) na domači strani in arhivih, nizek (naslov 34 px) na objavah in straneh.

### 5.3 Mreža objav (`home.php`, `archive.php`, `search.php`, `index.php`)
- `<main id="vsebina">` z `.mreza` (`display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 32px`), pod 1100 px 2 stolpca, pod 640 px 1 stolpec.
- 9 objav na stran: nastavi se v Nastavitve → Branje (tema tega ne vsiljuje), dokumentirano v CLAUDE.md.
- Paginacija: `the_posts_pagination()` s slovenskimi oznakami »Novejše« / »Starejše objave«.
- Prazen rezultat: sporočilo + iskalni obrazec.

### 5.4 Kartica (`template-parts/kartica.php`)
- `<article>` z: slika (`the_post_thumbnail('s59dgo-kartica')`, 800×520, `object-fit: cover`, zaobljenost 6 px), vrstica z značko kategorije (prva kategorija, temno modra podlaga) in datumom (`j. n. Y, npr. 8. 7. 2026`), naslov (`h2`, Space Grotesk 22 px, povezava), izvleček (`the_excerpt()`, 20 besed, brez »Read More«).
- Brez naslovne slike: `assets/img/greben.svg` v enakem razmerju.
- Celotna kartica je klikljiva prek naslova; slika ima isto povezavo.

### 5.5 Objava in stran (`single.php`, `page.php`)
- Enostolpna vsebina, širina besedila 72 ch (`--sirina-besedilo: 760px`), bloki z `alignwide` do 1100 px in `alignfull` do roba.
- Objava: trak z naslovom, kategorijo, datumom; naslovna slika pod trakom (če obstaja); vsebina; na dnu oznake, navigacija prejšnja/naslednja objava; komentarji prek `comments_template()` samo, če so odprti ali obstajajo.
- Stran: trak z naslovom; vsebina; brez naslovne slike v traku (strani kamer imajo slike v vsebini).

### 5.6 Noga (`footer.php`)
- Svetla noga (`--barva-noga`), tri widget območja: `noga-1` (Kontakt), `noga-2` (Uradne ure), `noga-3` (Podpora, tu blok Gumb → Donacije društvu). Na mobilnem se zložijo v en stolpec.
- Spodnja vrstica: »© <leto> <ime strani> · S59DGO« in »Urednik: …« (drugo besedilo prek filtra `s59dgo_noga_besedilo`, privzeto prazno).
- Brez menija v nogi (naročnik ni izbral povezav).

### 5.7 Barve in tipografija (`style.css` + `theme.json`)
Svetli način:
```
--barva-ozadje: #eef3f8   --barva-povrsina: #ffffff
--barva-besedilo: #172433 --barva-besedilo-2: #46586c --barva-tiha: #5f7590
--barva-glava: #15304f    --barva-glava-besedilo: #ffffff --barva-glava-tiha: #b9d0e6
--barva-poudarek: #d9702a --barva-poudarek-besedilo: #b0561a --barva-poudarek-hover: #8a4312
--barva-crta: #d3dfeb     --barva-noga: #ffffff
```
Temni način (`@media (prefers-color-scheme: dark)`):
```
--barva-ozadje: #0f1c2b   --barva-povrsina: #152638
--barva-besedilo: #dbe6f1 --barva-besedilo-2: #b7c9db --barva-tiha: #8fa9c4
--barva-glava: #0a1420    (glava ostane temno modra, greben v barvi ozadja)
--barva-poudarek: #f0955a --barva-poudarek-besedilo: #f0955a --barva-poudarek-hover: #ffb07a
--barva-crta: #27405a     --barva-noga: #0a1420
```
`--barva-poudarek-besedilo` se uporablja za besedilne povezave in gumbe (kontrast ≥ 4,5:1 na svetli podlagi), `--barva-poudarek` za značke, greben, fokus in podčrtaj menija.
Pisave: `@font-face` za Space Grotesk 500/700 in IBM Plex Sans 400/600 (woff2, `font-display: swap`), rezerve `'Trebuchet MS', Arial, sans-serif` in `'Helvetica Neue', Arial, sans-serif`.
`theme.json` (`version: 3`): `settings.color.palette` z zgornjimi imenovanimi barvami (slovenska imena), `settings.typography.fontFamilies` (obe pisavi z `fontFace`), `fontSizes` (majhna 14, osnovna 17, srednja 21, velika 28, ogromna 46), `settings.layout` (`contentSize: 760px`, `wideSize: 1100px`), `appearanceTools: false`. Brez `styles`. theme.json `fontFace` vnosi so razdeljeni po podnaborih (latin, latin-ext) z `unicodeRange` in `fontDisplay: swap`, enako kot @font-face v style.css.

### 5.8 `inc/setup.php`
- `add_theme_support`: `title-tag`, `post-thumbnails`, `custom-logo` (okrogel, 200×200, flex), `html5` (vsi), `automatic-feed-links`, `responsive-embeds`, `align-wide`, `editor-styles` + `add_editor_style('assets/css/editor.css')`, `wp-block-styles` NE.
- `add_image_size('s59dgo-kartica', 800, 520, true)`.
- `register_nav_menus(['glavni' => 'Glavni meni'])`.
- `register_sidebar` × 3 za nogo.
- `load_theme_textdomain('s59dgo', get_template_directory() . '/languages')`.
- Filter `excerpt_length` → 20, `excerpt_more` → `…`.

### 5.9 `inc/enqueue.php`
- `wp_enqueue_style('s59dgo-style', get_stylesheet_uri(), [], S59DGO_VERSION)`.
- `wp_enqueue_script('s59dgo-navigation', …/assets/js/navigation.js, [], S59DGO_VERSION, ['strategy' => 'defer'])`.
- `S59DGO_VERSION` iz `wp_get_theme()->get('Version')`.
- Pisave se nalagajo prek `@font-face` v `style.css` (relativne poti `assets/fonts/`), brez zunanjih klicev.

### 5.10 `assets/js/navigation.js`
- Brez odvisnosti. Ob `DOMContentLoaded`: gumb `.glava__preklop` preklaplja razred `je-odprt` na `.glava__meni` in `aria-expanded`; Esc zapre; klik izven zapre; podmeniji na mobilnem se odpirajo s klikom na puščico (`button.podmeni__preklop`); gumb iskanja preklaplja `.glava__iskanje` in fokusira polje.

## 6. Podatkovni tok

Vse iz standardnih WP virov: objave (WP_Query glavne zanke), naslovna slika, kategorije, meniji (`wp_nav_menu`), logotip in ime/podnaslov (Customizer), widget območja (Videz → Gradniki). Tema ne dodaja lastnih tipov vsebine ali meta polj; v Customizerju ima dve besedilni nastavitvi za trak domače strani (§5.2, `inc/customizer.php`). Edine prilagoditvene točke za razvijalca so filtri `s59dgo_naslov_doma` in `s59dgo_noga_besedilo`.

## 7. Obravnava napak in robni primeri

- Brez logotipa: prikaže se ime strani kot besedilo.
- Brez menija dodeljenega lokaciji: `wp_page_menu` rezerva ni zaželena; prikaže se prazno + opomba samo administratorju (`current_user_can('edit_theme_options')`): »Dodelite meni lokaciji Glavni meni«.
- Brez naslovne slike: `greben.svg`.
- Brez gradnikov v nogi: stolpec se ne izriše; če ni nobenega, ostane le spodnja vrstica.
- Objave brez kategorije (Uncategorized): značka se skrije, če je kategorija `uncategorized`.
- Dolgi naslovi v kartici: `overflow-wrap: anywhere`, brez rezanja.
- JS onemogočen: meni je viden (razred `brez-js` na `<html>`, ki ga JS odstrani).

## 8. Preizkušanje

1. `bin/lint.sh`: `docker run --rm -v "$PWD/s59dgo":/app php:8.3-cli` z `php -l` za vsako `.php` datoteko; neuspeh ustavi build.
2. `bin/build-zip.sh`: požene lint, nato `zip -r dist/s59dgo.zip s59dgo -x '.DS_Store' '*/.*'`.
3. Na strežniku: Videz → Teme → Naloži temo (zip) → »Predogled v živo« (Customizer) brez aktivacije; preveri domačo stran, objavo, stran O društvu, stran kamere, arhiv kategorije, iskanje, 404, mobilno širino, temni način sistema.
4. Vtičnik Theme Check na strežniku pred aktivacijo (brez napak stopnje REQUIRED).
5. Pred aktivacijo: dodeli meni lokaciji »Glavni meni«, nastavi logotip, napolni tri gradnike noge, Nastavitve → Branje → 9 objav na stran.

## 9. Izven obsega

- Site Editor / FSE, blokovske predloge.
- Posebna predloga za spletne kamere, samodejno osveževanje slik.
- Hero, blok aplikacij ali kamer na domači strani.
- Stikalo za temni način.
- Večjezičnost (samo slovenščina; nizi so prevedljivi).
- Migracija vsebine (vsebina ostane, menja se le tema).
