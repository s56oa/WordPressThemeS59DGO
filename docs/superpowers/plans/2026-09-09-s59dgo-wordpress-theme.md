# Načrt implementacije: WordPress tema »s59dgo«

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Klasična WordPress tema `s59dgo` (smer »Grebeni«) za www.s59dgo.org, pripravljena kot zip za nalaganje v WP administracijo.

**Architecture:** PHP predloge brez build koraka; en `style.css` s CSS spremenljivkami in temnim načinom po sistemu; `theme.json` samo z nastavitvami; kontekstni trak z grebenom (`s59dgo_trak_podatki()`) in ena kartica objave za vse mreže. Lokalno ni WordPressa: PHP sintaksa in enotski testi čistih funkcij tečejo v Dockerju (`php:8.3-cli`) z nadomestnimi (stub) WP funkcijami.

**Tech Stack:** WordPress ≥ 6.4 (cilj 7.1), PHP ≥ 7.4, čisti CSS, vanilla JS, Docker za lint/teste, `zip`, `qlmanage` (macOS) za screenshot.

**Spec:** `docs/superpowers/specs/2026-09-09-s59dgo-wordpress-theme-design.md`

## Global Constraints

- Slug teme, text domain in prefiks funkcij: `s59dgo` / `s59dgo_`. Konstante `S59DGO_VERSION`, `S59DGO_POT`, `S59DGO_URI`.
- Vsi uporabniški nizi v slovenščini, oviti v `__()`, `_e()`, `esc_html__()`, `esc_html_e()`, `esc_attr_e()` s text domain `'s59dgo'`.
- Vsak izpis skozi `esc_html()`, `esc_attr()`, `esc_url()`; izjemi `the_content()`, `the_excerpt()` in funkcije teme, ki vračajo že escapan HTML (označene v docblocku z `@return string Escapan HTML`).
- Brez build koraka, brez zunanjih klicev (pisave lokalno). Brez `styles` v `theme.json`. Brez `front-page.php`.
- Razredi CSS: slovenski, BEM-podobni (`.glava__meni`, `.kartica__naslov`, modifikator `--velik`, stanje `je-odprt`).
- Barvne spremenljivke natanko po specu §5.7 (svetli in temni način).
- PHP datoteke brez zaključne oznake `?>`; vsaka se začne z `<?php` in `defined( 'ABSPATH' ) || exit;` (razen predlog, ki jih nalaga WP: `header.php`, `footer.php`, `*.php` v korenu teme in `template-parts/` – tam `ABSPATH` ni potreben, a ne škodi).
- Vsak commit vsebuje pripis:
  ```
  Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01GmfDexDDZPL4svxD43KLZn
  ```
- Ukazi tečejo iz korena repozitorija (`S59DGO_WordPressTheme/`).

---

## Zemljevid datotek

| Datoteka | Odgovornost | Naloga |
|---|---|---|
| `bin/lint.sh` | `php -l` vseh PHP datotek teme v Dockerju | 1 |
| `bin/test.sh` | požene `tests/test-*.php` v Dockerju | 1 |
| `bin/build-zip.sh` | lint + `dist/s59dgo.zip` | 1 |
| `tests/stubs.php`, `tests/preveri.php` | nadomestne WP funkcije in mini assert | 1 |
| `s59dgo/style.css` | glava teme, `@font-face`, vsi slogi | 1, 4, 11, 12 |
| `s59dgo/functions.php` | konstante, nalaganje `inc/` | 1 |
| `s59dgo/inc/setup.php` | podpore, meniji, slike, gradniki, filtri | 2 |
| `s59dgo/inc/enqueue.php` | CSS/JS enqueue | 3 |
| `s59dgo/assets/js/navigation.js` | mobilni meni, podmeniji, iskanje, Esc | 3 |
| `s59dgo/assets/fonts/*` | woff2 + licence | 4 |
| `s59dgo/theme.json`, `s59dgo/assets/css/editor.css` | nastavitve urejevalnika | 5 |
| `s59dgo/inc/template-tags.php` | `s59dgo_trak_podatki()`, `s59dgo_kategorija()`, `s59dgo_datum()`, `s59dgo_slika_kartice()` | 6 |
| `tests/test-template-tags.php` | testi zgornjih funkcij | 6 |
| `s59dgo/header.php`, `searchform.php`, `assets/img/greben.svg` | glava, iskalni obrazec, nadomestna slika | 7 |
| `s59dgo/template-parts/trak.php`, `kartica.php`, `mreza.php`; `home.php`, `index.php`, `archive.php`, `search.php` | trak, kartica, mreža in predloge seznamov | 8 |
| `s59dgo/single.php`, `page.php`, `template-parts/vsebina-objava.php`, `vsebina-stran.php`, `comments.php`, `404.php` | posamezne vsebine | 9 |
| `s59dgo/footer.php` | noga z gradniki | 10 |
| `s59dgo/screenshot.png`, `bin/screenshot.svg`, `s59dgo/languages/`, `s59dgo/readme.txt` | zaključek in paket | 13 |

---

### Task 1: Ogrodje teme in orodja (lint, test, zip)

**Files:**
- Create: `bin/lint.sh`, `bin/test.sh`, `bin/build-zip.sh`
- Create: `tests/preveri.php`, `tests/stubs.php`, `tests/test-ogrodje.php`
- Create: `s59dgo/style.css` (samo glava), `s59dgo/functions.php`, `s59dgo/index.php` (začasno minimalen), `s59dgo/inc/.gitkeep` (ne – ustvarimo prazne `inc/*.php` v nadaljnjih nalogah; tu samo mapo z `.gitkeep`)

**Interfaces:**
- Produces: `bin/lint.sh` (izhod `PHP sintaksa v redu`, koda 0/1), `bin/test.sh` (požene vse `tests/test-*.php`, koda 0/1), `bin/build-zip.sh` (`dist/s59dgo.zip`), `tests/preveri.php` s funkcijo `preveri( bool $pogoj, string $sporocilo ): void` in `tests/stubs.php` z globalnim `$GLOBALS['s59dgo_test']` (glej kodo), konstante `S59DGO_VERSION`, `S59DGO_POT`, `S59DGO_URI`.

- [ ] **Step 1: Napiši test ogrodja (`tests/test-ogrodje.php`)**

```php
<?php
// Preveri, da glava teme in functions.php obstajata in vsebujeta ključne podatke.
require __DIR__ . '/preveri.php';

$style = file_get_contents( __DIR__ . '/../s59dgo/style.css' );
preveri( false !== strpos( $style, 'Theme Name: S59DGO' ), 'style.css ima Theme Name' );
preveri( false !== strpos( $style, 'Text Domain: s59dgo' ), 'style.css ima Text Domain s59dgo' );
preveri( 1 === preg_match( '/^Version: \d+\.\d+\.\d+$/m', $style ), 'style.css ima semantično verzijo' );

$functions = file_get_contents( __DIR__ . '/../s59dgo/functions.php' );
preveri( false !== strpos( $functions, "define( 'S59DGO_VERSION'" ), 'functions.php definira S59DGO_VERSION' );
preveri( false === strpos( $functions, '?>' ), 'functions.php nima zaključne oznake' );
```

- [ ] **Step 2: Napiši `tests/preveri.php`**

```php
<?php
/**
 * Mini assert za teste brez ogrodja.
 */
function preveri( $pogoj, $sporocilo ) {
	if ( ! $pogoj ) {
		fwrite( STDERR, "NEUSPEH: {$sporocilo}\n" );
		exit( 1 );
	}
	echo "OK: {$sporocilo}\n";
}
```

- [ ] **Step 3: Napiši `tests/stubs.php`** (nadomestne WP funkcije; uporablja jih Naloga 6, a spadajo v ogrodje)

```php
<?php
/**
 * Nadomestne funkcije WordPressa za teste brez WP.
 * Stanje se nastavlja prek $GLOBALS['s59dgo_test'].
 */
$GLOBALS['s59dgo_test'] = array(
	'is_home'             => false,
	'is_search'           => false,
	'is_404'              => false,
	'is_archive'          => false,
	'is_singular'         => false,
	'is_single'           => false,
	'search_query'        => '',
	'found_posts'         => 0,
	'title'               => '',
	'archive_title'       => '',
	'archive_description' => '',
	'categories'          => array(),
	'has_thumbnail'       => false,
	'date'                => '2026-07-08',
	'bloginfo'            => array(
		'name'        => 'Radio klub Snežnik',
		'description' => 'Ilirska Bistrica · S59DGO',
	),
);

function s59dgo_t( $kljuc ) {
	return $GLOBALS['s59dgo_test'][ $kljuc ];
}
function s59dgo_test_ponastavi( array $prepisi = array() ) {
	$privzeto = array(
		'is_home' => false, 'is_search' => false, 'is_404' => false, 'is_archive' => false,
		'is_singular' => false, 'is_single' => false, 'search_query' => '', 'found_posts' => 0,
		'title' => '', 'archive_title' => '', 'archive_description' => '', 'categories' => array(),
		'has_thumbnail' => false, 'date' => '2026-07-08',
		'bloginfo' => array( 'name' => 'Radio klub Snežnik', 'description' => 'Ilirska Bistrica · S59DGO' ),
	);
	$GLOBALS['s59dgo_test'] = array_merge( $privzeto, $prepisi );
	$GLOBALS['wp_query']    = (object) array( 'found_posts' => $GLOBALS['s59dgo_test']['found_posts'] );
}

function is_home() { return s59dgo_t( 'is_home' ); }
function is_search() { return s59dgo_t( 'is_search' ); }
function is_404() { return s59dgo_t( 'is_404' ); }
function is_archive() { return s59dgo_t( 'is_archive' ); }
function is_singular() { return s59dgo_t( 'is_singular' ); }
function is_single() { return s59dgo_t( 'is_single' ); }
function get_search_query() { return s59dgo_t( 'search_query' ); }
function get_the_title() { return s59dgo_t( 'title' ); }
function get_the_archive_title() { return s59dgo_t( 'archive_title' ); }
function get_the_archive_description() { return s59dgo_t( 'archive_description' ); }
function get_the_category() { return s59dgo_t( 'categories' ); }
function get_category_link( $id ) { return 'https://example.test/category/' . $id . '/'; }
function has_post_thumbnail() { return s59dgo_t( 'has_thumbnail' ); }
function get_the_post_thumbnail( $post = null, $velikost = 'post-thumbnail', $atributi = array() ) {
	return '<img src="https://example.test/slika.jpg" alt="">';
}
function get_the_date( $oblika = 'j. n. Y' ) { return date( $oblika, strtotime( s59dgo_t( 'date' ) ) ); }
function get_bloginfo( $kljuc, $filter = 'raw' ) { $b = s59dgo_t( 'bloginfo' ); return isset( $b[ $kljuc ] ) ? $b[ $kljuc ] : ''; }
function apply_filters( $kljuka, $vrednost ) { return $vrednost; }
function __( $niz, $domena = null ) { return $niz; }
function esc_html__( $niz, $domena = null ) { return $niz; }
function esc_html( $niz ) { return htmlspecialchars( (string) $niz, ENT_QUOTES, 'UTF-8' ); }
function esc_attr( $niz ) { return esc_html( $niz ); }
function esc_url( $niz ) { return $niz; }
function number_format_i18n( $stevilo ) { return (string) $stevilo; }
function wp_strip_all_tags( $niz ) { return trim( strip_tags( (string) $niz ) ); }
function get_permalink() { return 'https://example.test/objava/'; }

define( 'S59DGO_URI', 'https://example.test/wp-content/themes/s59dgo' );
s59dgo_test_ponastavi();
```

- [ ] **Step 4: Napiši `bin/lint.sh`, `bin/test.sh`, `bin/build-zip.sh` in jih naredi izvršljive**

`bin/lint.sh`:
```bash
#!/usr/bin/env bash
# Preveri sintakso vseh PHP datotek teme v Dockerju (lokalno ni PHP).
set -euo pipefail
cd "$(dirname "$0")/.."
docker run --rm -v "$PWD/s59dgo:/app:ro" -w /app php:8.3-cli sh -c '
  status=0
  for f in $(find . -name "*.php" | sort); do
    out=$(php -l "$f" 2>&1) || { echo "$out"; status=1; }
  done
  [ "$status" -eq 0 ] && echo "PHP sintaksa v redu"
  exit $status'
```

`bin/test.sh`:
```bash
#!/usr/bin/env bash
# Požene vse tests/test-*.php v Dockerju.
set -euo pipefail
cd "$(dirname "$0")/.."
docker run --rm -v "$PWD:/app:ro" -w /app php:8.3-cli sh -c '
  status=0
  for t in tests/test-*.php; do
    echo "== $t"
    php "$t" || status=1
  done
  exit $status'
```

`bin/build-zip.sh`:
```bash
#!/usr/bin/env bash
# Lint + zip teme za nalaganje v WP administracijo.
set -euo pipefail
cd "$(dirname "$0")/.."
bin/lint.sh
mkdir -p dist
rm -f dist/s59dgo.zip
zip -rq dist/s59dgo.zip s59dgo -x '*/.DS_Store' '*/.*'
echo "Ustvarjeno dist/s59dgo.zip ($(du -h dist/s59dgo.zip | cut -f1))"
```

```bash
chmod +x bin/lint.sh bin/test.sh bin/build-zip.sh
```

- [ ] **Step 5: Poženi test in preveri, da pade**

Run: `bin/test.sh`
Expected: `NEUSPEH` (style.css ne obstaja → `file_get_contents` opozorilo in neuspeh), izhodna koda 1.

- [ ] **Step 6: Napiši `s59dgo/style.css` (samo glava), `s59dgo/functions.php`, začasni `s59dgo/index.php`**

`s59dgo/style.css`:
```css
/*
Theme Name: S59DGO
Theme URI: https://www.s59dgo.org/
Author: Radio klub Snežnik Ilirska Bistrica
Author URI: https://www.s59dgo.org/
Description: Klasična tema za spletno stran Radio kluba Snežnik Ilirska Bistrica – S59DGO. Temno modra glava z grebenom Snežnika, mreža objav, temni način po sistemu.
Version: 1.0.0
Requires at least: 6.4
Tested up to: 7.1
Requires PHP: 7.4
License: GNU General Public License v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Text Domain: s59dgo
Tags: blog, one-column, custom-logo, custom-menu, featured-images, threaded-comments, translation-ready, wide-blocks
*/
```

`s59dgo/functions.php`:
```php
<?php
/**
 * Tema S59DGO – nalagalnik.
 *
 * @package s59dgo
 */

defined( 'ABSPATH' ) || exit;

define( 'S59DGO_VERSION', wp_get_theme()->get( 'Version' ) );
define( 'S59DGO_POT', get_template_directory() );
define( 'S59DGO_URI', get_template_directory_uri() );

foreach ( array( 'setup', 'enqueue', 'template-tags' ) as $s59dgo_datoteka ) {
	$s59dgo_pot = S59DGO_POT . '/inc/' . $s59dgo_datoteka . '.php';
	if ( file_exists( $s59dgo_pot ) ) {
		require $s59dgo_pot;
	}
}
unset( $s59dgo_datoteka, $s59dgo_pot );
```

`s59dgo/index.php` (začasno; Naloga 8 ga zamenja):
```php
<?php
/**
 * Začasna predloga – zamenja jo Naloga 8.
 *
 * @package s59dgo
 */

get_header();
?>
<main id="vsebina" class="vsebina"></main>
<?php
get_footer();
```

Ustvari še `s59dgo/inc/` (prazna mapa z `.gitkeep`).

- [ ] **Step 7: Poženi lint, test in build**

Run: `bin/lint.sh && bin/test.sh && bin/build-zip.sh && unzip -l dist/s59dgo.zip`
Expected: `PHP sintaksa v redu`, 5× `OK:`, `Ustvarjeno dist/s59dgo.zip`, v seznamu `s59dgo/style.css`, `s59dgo/functions.php`, `s59dgo/index.php`.

- [ ] **Step 8: Commit**

```bash
git add bin tests s59dgo
git commit -m "Ogrodje teme s59dgo: glava, functions.php, lint/test/zip skripti"
```

---

### Task 2: Nastavitve teme (`inc/setup.php`)

**Files:**
- Create: `s59dgo/inc/setup.php`
- Test: `tests/test-setup.php`

**Interfaces:**
- Produces: lokacija menija `glavni`; velikost slike `s59dgo-kartica` (800×520, crop); widget območja `noga-1`, `noga-2`, `noga-3` z `before_widget='<div id="%1$s" class="gradnik %2$s">'`, `before_title='<h2 class="gradnik__naslov">'`; `$GLOBALS['content_width'] = 1100`; filtra `excerpt_length` → 20 in `excerpt_more` → `…`; `get_the_archive_title_prefix` → ''.

- [ ] **Step 1: Napiši test (`tests/test-setup.php`)** – statični test vsebine, ker `add_theme_support` brez WP ne teče

```php
<?php
require __DIR__ . '/preveri.php';
$koda = file_get_contents( __DIR__ . '/../s59dgo/inc/setup.php' );
foreach ( array(
	"add_theme_support( 'title-tag' )",
	"add_theme_support( 'post-thumbnails' )",
	"add_image_size( 's59dgo-kartica', 800, 520, true )",
	"add_theme_support( 'custom-logo'",
	"add_theme_support( 'align-wide' )",
	"add_editor_style( 'assets/css/editor.css' )",
	"'glavni' => __( 'Glavni meni', 's59dgo' )",
	"'noga-1'", "'noga-2'", "'noga-3'",
	"add_action( 'after_setup_theme', 's59dgo_nastavitve' )",
	"add_action( 'widgets_init', 's59dgo_gradniki' )",
	"add_filter( 'excerpt_length', 's59dgo_dolzina_izvlecka' )",
	"add_filter( 'get_the_archive_title_prefix', '__return_empty_string' )",
) as $iskano ) {
	preveri( false !== strpos( $koda, $iskano ), "setup.php vsebuje {$iskano}" );
}
preveri( false === strpos( $koda, '?>' ), 'setup.php nima zaključne oznake' );
```

- [ ] **Step 2: Poženi test, pričakuj neuspeh**

Run: `bin/test.sh`
Expected: `NEUSPEH: setup.php vsebuje add_theme_support( 'title-tag' )` (datoteka še ne obstaja).

- [ ] **Step 3: Napiši `s59dgo/inc/setup.php`**

```php
<?php
/**
 * Podpore, meniji, slike, gradniki in filtri teme.
 *
 * @package s59dgo
 */

defined( 'ABSPATH' ) || exit;

/**
 * Nastavitve ob nalaganju teme.
 */
function s59dgo_nastavitve() {
	load_theme_textdomain( 's59dgo', S59DGO_POT . '/languages' );

	add_theme_support( 'title-tag' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'post-thumbnails' );
	add_image_size( 's59dgo-kartica', 800, 520, true );
	add_theme_support(
		'custom-logo',
		array(
			'height'      => 200,
			'width'       => 200,
			'flex-height' => true,
			'flex-width'  => true,
		)
	);
	add_theme_support(
		'html5',
		array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' )
	);
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'align-wide' );
	add_theme_support( 'editor-styles' );
	add_editor_style( 'assets/css/editor.css' );

	register_nav_menus(
		array(
			'glavni' => __( 'Glavni meni', 's59dgo' ),
		)
	);
}
add_action( 'after_setup_theme', 's59dgo_nastavitve' );

/**
 * Širina vsebine za vdelane elemente.
 */
function s59dgo_sirina_vsebine() {
	$GLOBALS['content_width'] = 1100;
}
add_action( 'after_setup_theme', 's59dgo_sirina_vsebine', 0 );

/**
 * Tri widget območja v nogi.
 */
function s59dgo_gradniki() {
	$obmocja = array(
		'noga-1' => __( 'Noga – Kontakt', 's59dgo' ),
		'noga-2' => __( 'Noga – Uradne ure', 's59dgo' ),
		'noga-3' => __( 'Noga – Podpora', 's59dgo' ),
	);
	foreach ( $obmocja as $id => $ime ) {
		register_sidebar(
			array(
				'name'          => $ime,
				'id'            => $id,
				'description'   => __( 'Stolpec v nogi strani.', 's59dgo' ),
				'before_widget' => '<div id="%1$s" class="gradnik %2$s">',
				'after_widget'  => '</div>',
				'before_title'  => '<h2 class="gradnik__naslov">',
				'after_title'   => '</h2>',
			)
		);
	}
}
add_action( 'widgets_init', 's59dgo_gradniki' );

/**
 * Dolžina izvlečka v kartici.
 *
 * @return int
 */
function s59dgo_dolzina_izvlecka() {
	return 20;
}
add_filter( 'excerpt_length', 's59dgo_dolzina_izvlecka' );

/**
 * Konec izvlečka brez povezave »Read more«.
 *
 * @return string
 */
function s59dgo_konec_izvlecka() {
	return '…';
}
add_filter( 'excerpt_more', 's59dgo_konec_izvlecka' );

add_filter( 'get_the_archive_title_prefix', '__return_empty_string' );
```

- [ ] **Step 4: Poženi lint in test**

Run: `bin/lint.sh && bin/test.sh`
Expected: `PHP sintaksa v redu`, vsi `OK:`.

- [ ] **Step 5: Commit**

```bash
git add s59dgo/inc/setup.php tests/test-setup.php
git commit -m "Dodaj nastavitve teme: podpore, meni, velikost kartice, gradniki noge"
```

---

### Task 3: Nalaganje sredstev in JS za meni

**Files:**
- Create: `s59dgo/inc/enqueue.php`, `s59dgo/assets/js/navigation.js`
- Test: `tests/test-enqueue.php`, `node --check`

**Interfaces:**
- Consumes: `S59DGO_VERSION`, `S59DGO_URI` (Naloga 1).
- Produces: handle `s59dgo-style`, `s59dgo-navigation` (defer). JS pričakuje v DOM (Naloga 7): `.glava`, `button.glava__preklop[aria-controls=glavni-meni]`, `nav#glavni-meni.glava__meni[data-oznaka-podmeni]`, `button.glava__iskanje-preklop[aria-controls=glava-iskanje]`, `div#glava-iskanje.glava__iskanje[hidden]`, `<html class="brez-js">`. Stanja: `.glava__meni.je-odprt`, `li.menu-item-has-children.je-odprt`, gumb `button.podmeni__preklop`.

- [ ] **Step 1: Napiši test (`tests/test-enqueue.php`)**

```php
<?php
require __DIR__ . '/preveri.php';
$koda = file_get_contents( __DIR__ . '/../s59dgo/inc/enqueue.php' );
preveri( false !== strpos( $koda, "wp_enqueue_style( 's59dgo-style', get_stylesheet_uri(), array(), S59DGO_VERSION )" ), 'enqueue nalaga style.css z verzijo' );
preveri( false !== strpos( $koda, "'s59dgo-navigation'" ), 'enqueue nalaga navigation.js' );
preveri( false !== strpos( $koda, "'strategy' => 'defer'" ), 'navigation.js je defer' );
preveri( false !== strpos( $koda, "add_action( 'wp_enqueue_scripts', 's59dgo_sredstva' )" ), 'kljuka wp_enqueue_scripts' );
preveri( file_exists( __DIR__ . '/../s59dgo/assets/js/navigation.js' ), 'navigation.js obstaja' );
$js = file_get_contents( __DIR__ . '/../s59dgo/assets/js/navigation.js' );
foreach ( array( "'Escape'", 'aria-expanded', 'podmeni__preklop', 'je-odprt', 'menu-item-has-children' ) as $iskano ) {
	preveri( false !== strpos( $js, $iskano ), "navigation.js vsebuje {$iskano}" );
}
```

- [ ] **Step 2: Poženi test, pričakuj neuspeh**

Run: `bin/test.sh`
Expected: `NEUSPEH: enqueue nalaga style.css z verzijo`.

- [ ] **Step 3: Napiši `s59dgo/inc/enqueue.php`**

```php
<?php
/**
 * Nalaganje slogov in skript.
 *
 * @package s59dgo
 */

defined( 'ABSPATH' ) || exit;

/**
 * Sprednji del: style.css in navigation.js.
 */
function s59dgo_sredstva() {
	wp_enqueue_style( 's59dgo-style', get_stylesheet_uri(), array(), S59DGO_VERSION );

	wp_enqueue_script(
		's59dgo-navigation',
		S59DGO_URI . '/assets/js/navigation.js',
		array(),
		S59DGO_VERSION,
		array( 'strategy' => 'defer' )
	);

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 's59dgo_sredstva' );
```

- [ ] **Step 4: Napiši `s59dgo/assets/js/navigation.js`**

```js
/**
 * Mobilni meni, podmeniji, iskalno polje in zapiranje z Esc / klikom izven.
 * Brez odvisnosti.
 */
(function () {
	'use strict';

	var glava = document.querySelector('.glava');
	if (!glava) {
		return;
	}

	var preklop = glava.querySelector('.glava__preklop');
	var meni = glava.querySelector('.glava__meni');
	var iskanjePreklop = glava.querySelector('.glava__iskanje-preklop');
	var iskanje = glava.querySelector('.glava__iskanje');
	var oznakaPodmeni = meni ? meni.getAttribute('data-oznaka-podmeni') || 'Podmeni' : 'Podmeni';

	function nastaviMeni(odprt) {
		if (!preklop || !meni) {
			return;
		}
		preklop.setAttribute('aria-expanded', odprt ? 'true' : 'false');
		meni.classList.toggle('je-odprt', odprt);
	}

	function nastaviIskanje(odprt) {
		if (!iskanjePreklop || !iskanje) {
			return;
		}
		iskanjePreklop.setAttribute('aria-expanded', odprt ? 'true' : 'false');
		iskanje.hidden = !odprt;
		if (odprt) {
			var polje = iskanje.querySelector('input[type="search"]');
			if (polje) {
				polje.focus();
			}
		}
	}

	function zapriPodmenije() {
		if (!meni) {
			return;
		}
		meni.querySelectorAll('.menu-item-has-children.je-odprt').forEach(function (element) {
			element.classList.remove('je-odprt');
			var gumb = element.querySelector(':scope > .podmeni__preklop');
			if (gumb) {
				gumb.setAttribute('aria-expanded', 'false');
			}
		});
	}

	function zapriVse() {
		nastaviMeni(false);
		nastaviIskanje(false);
		zapriPodmenije();
	}

	if (preklop && meni) {
		preklop.addEventListener('click', function () {
			var odprt = preklop.getAttribute('aria-expanded') !== 'true';
			nastaviIskanje(false);
			nastaviMeni(odprt);
		});
	}

	if (iskanjePreklop && iskanje) {
		iskanjePreklop.addEventListener('click', function () {
			var odprt = iskanje.hidden;
			nastaviMeni(false);
			nastaviIskanje(odprt);
		});
	}

	if (meni) {
		meni.querySelectorAll('.menu-item-has-children > a').forEach(function (povezava) {
			var gumb = document.createElement('button');
			gumb.type = 'button';
			gumb.className = 'podmeni__preklop';
			gumb.setAttribute('aria-expanded', 'false');
			gumb.innerHTML =
				'<span class="vizualno-skrito">' + oznakaPodmeni + '</span>' +
				'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg>';
			povezava.after(gumb);
			gumb.addEventListener('click', function () {
				var element = gumb.parentElement;
				var odprt = !element.classList.contains('je-odprt');
				zapriPodmenije();
				element.classList.toggle('je-odprt', odprt);
				gumb.setAttribute('aria-expanded', odprt ? 'true' : 'false');
			});
		});
	}

	document.addEventListener('keydown', function (dogodek) {
		if (dogodek.key === 'Escape') {
			zapriVse();
		}
	});

	document.addEventListener('click', function (dogodek) {
		if (!glava.contains(dogodek.target)) {
			zapriVse();
		}
	});
})();
```

- [ ] **Step 5: Preveri JS sintakso, lint in test**

Run: `node --check s59dgo/assets/js/navigation.js && bin/lint.sh && bin/test.sh`
Expected: brez izpisa iz `node --check`, `PHP sintaksa v redu`, vsi `OK:`.

- [ ] **Step 6: Commit**

```bash
git add s59dgo/inc/enqueue.php s59dgo/assets/js/navigation.js tests/test-enqueue.php
git commit -m "Dodaj nalaganje slogov/skript in JS za mobilni meni"
```

---

### Task 4: Pisave v temi in `@font-face`

**Files:**
- Create: `s59dgo/assets/fonts/space-grotesk-{latin,latin-ext}-{500,700}-normal.woff2`, `s59dgo/assets/fonts/ibm-plex-sans-{latin,latin-ext}-{400,600}-normal.woff2`, `s59dgo/assets/fonts/LICENSE-space-grotesk.txt`, `s59dgo/assets/fonts/LICENSE-ibm-plex-sans.txt`
- Modify: `s59dgo/style.css` (dodaj `@font-face` blok za glavo)
- Test: `tests/test-pisave.php`

**Interfaces:**
- Produces: družini `'Space Grotesk'` (500, 700) in `'IBM Plex Sans'` (400, 600), unicode-range latin + latin-ext (šumniki).

- [ ] **Step 1: Napiši test (`tests/test-pisave.php`)**

```php
<?php
require __DIR__ . '/preveri.php';
$mapa = __DIR__ . '/../s59dgo/assets/fonts/';
foreach ( array(
	'space-grotesk-latin-500-normal.woff2', 'space-grotesk-latin-ext-500-normal.woff2',
	'space-grotesk-latin-700-normal.woff2', 'space-grotesk-latin-ext-700-normal.woff2',
	'ibm-plex-sans-latin-400-normal.woff2', 'ibm-plex-sans-latin-ext-400-normal.woff2',
	'ibm-plex-sans-latin-600-normal.woff2', 'ibm-plex-sans-latin-ext-600-normal.woff2',
) as $datoteka ) {
	preveri( file_exists( $mapa . $datoteka ) && filesize( $mapa . $datoteka ) > 1000, "pisava {$datoteka} obstaja" );
	$glava = file_get_contents( $mapa . $datoteka, false, null, 0, 4 );
	preveri( 'wOF2' === $glava, "{$datoteka} je woff2" );
}
preveri( file_exists( $mapa . 'LICENSE-space-grotesk.txt' ), 'licenca Space Grotesk' );
preveri( file_exists( $mapa . 'LICENSE-ibm-plex-sans.txt' ), 'licenca IBM Plex Sans' );
$style = file_get_contents( __DIR__ . '/../s59dgo/style.css' );
preveri( 4 === substr_count( $style, "font-family: 'Space Grotesk';" ), '4 @font-face za Space Grotesk' );
preveri( 4 === substr_count( $style, "font-family: 'IBM Plex Sans';" ), '4 @font-face za IBM Plex Sans' );
preveri( false !== strpos( $style, 'font-display: swap;' ), 'font-display: swap' );
```

- [ ] **Step 2: Poženi test, pričakuj neuspeh**

Run: `bin/test.sh`
Expected: `NEUSPEH: pisava space-grotesk-latin-500-normal.woff2 obstaja`.

- [ ] **Step 3: Prenesi pisave (Fontsource prek jsDelivr, licenca OFL)**

```bash
mkdir -p s59dgo/assets/fonts && cd s59dgo/assets/fonts
for w in 500 700; do for s in latin latin-ext; do
  curl -fsSL -o "space-grotesk-$s-$w-normal.woff2" "https://cdn.jsdelivr.net/npm/@fontsource/space-grotesk@5/files/space-grotesk-$s-$w-normal.woff2"
done; done
for w in 400 600; do for s in latin latin-ext; do
  curl -fsSL -o "ibm-plex-sans-$s-$w-normal.woff2" "https://cdn.jsdelivr.net/npm/@fontsource/ibm-plex-sans@5/files/ibm-plex-sans-$s-$w-normal.woff2"
done; done
curl -fsSL -o LICENSE-space-grotesk.txt https://cdn.jsdelivr.net/npm/@fontsource/space-grotesk@5/LICENSE
curl -fsSL -o LICENSE-ibm-plex-sans.txt https://cdn.jsdelivr.net/npm/@fontsource/ibm-plex-sans@5/LICENSE
ls -la && cd -
```
Expected: 8 datotek woff2 (vsaka 10–40 KB) in 2 licenci.

- [ ] **Step 4: Dodaj `@font-face` v `s59dgo/style.css` takoj za glavo teme**

```css

/* ==========================================================================
   1. Pisave (lokalno, brez zunanjih klicev)
   ========================================================================== */
@font-face {
	font-family: 'Space Grotesk';
	font-style: normal;
	font-weight: 500;
	font-display: swap;
	src: url('assets/fonts/space-grotesk-latin-ext-500-normal.woff2') format('woff2');
	unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
@font-face {
	font-family: 'Space Grotesk';
	font-style: normal;
	font-weight: 500;
	font-display: swap;
	src: url('assets/fonts/space-grotesk-latin-500-normal.woff2') format('woff2');
	unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
	font-family: 'Space Grotesk';
	font-style: normal;
	font-weight: 700;
	font-display: swap;
	src: url('assets/fonts/space-grotesk-latin-ext-700-normal.woff2') format('woff2');
	unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
@font-face {
	font-family: 'Space Grotesk';
	font-style: normal;
	font-weight: 700;
	font-display: swap;
	src: url('assets/fonts/space-grotesk-latin-700-normal.woff2') format('woff2');
	unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
	font-family: 'IBM Plex Sans';
	font-style: normal;
	font-weight: 400;
	font-display: swap;
	src: url('assets/fonts/ibm-plex-sans-latin-ext-400-normal.woff2') format('woff2');
	unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
@font-face {
	font-family: 'IBM Plex Sans';
	font-style: normal;
	font-weight: 400;
	font-display: swap;
	src: url('assets/fonts/ibm-plex-sans-latin-400-normal.woff2') format('woff2');
	unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
	font-family: 'IBM Plex Sans';
	font-style: normal;
	font-weight: 600;
	font-display: swap;
	src: url('assets/fonts/ibm-plex-sans-latin-ext-600-normal.woff2') format('woff2');
	unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
@font-face {
	font-family: 'IBM Plex Sans';
	font-style: normal;
	font-weight: 600;
	font-display: swap;
	src: url('assets/fonts/ibm-plex-sans-latin-600-normal.woff2') format('woff2');
	unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
```

- [ ] **Step 5: Poženi test**

Run: `bin/test.sh`
Expected: vsi `OK:`.

- [ ] **Step 6: Commit**

```bash
git add s59dgo/assets/fonts s59dgo/style.css tests/test-pisave.php
git commit -m "Dodaj lokalne pisave Space Grotesk in IBM Plex Sans z @font-face"
```

---

### Task 5: `theme.json` in slogi urejevalnika

**Files:**
- Create: `s59dgo/theme.json`, `s59dgo/assets/css/editor.css`
- Test: `tests/test-theme-json.php`

**Interfaces:**
- Produces: paleta z identifikatorji `temno-modra`, `oranzna`, `sneg`, `povrsina`, `besedilo`, `tiha`; pisavi `naslovi` in `besedilo`; velikosti `majhna`, `osnovna`, `srednja`, `velika`, `ogromna`; `layout.contentSize=760px`, `wideSize=1100px`.

- [ ] **Step 1: Napiši test (`tests/test-theme-json.php`)**

```php
<?php
require __DIR__ . '/preveri.php';
$json = json_decode( file_get_contents( __DIR__ . '/../s59dgo/theme.json' ), true );
preveri( is_array( $json ), 'theme.json je veljaven JSON' );
preveri( 3 === $json['version'], 'theme.json version 3' );
preveri( ! isset( $json['styles'] ), 'theme.json nima styles' );
preveri( false === $json['settings']['appearanceTools'], 'appearanceTools false' );
preveri( '760px' === $json['settings']['layout']['contentSize'], 'contentSize 760px' );
preveri( '1100px' === $json['settings']['layout']['wideSize'], 'wideSize 1100px' );
$slugi = array_column( $json['settings']['color']['palette'], 'slug' );
foreach ( array( 'temno-modra', 'oranzna', 'sneg', 'povrsina', 'besedilo', 'tiha' ) as $slug ) {
	preveri( in_array( $slug, $slugi, true ), "paleta ima {$slug}" );
}
$pisave = array_column( $json['settings']['typography']['fontFamilies'], 'slug' );
preveri( array( 'naslovi', 'besedilo' ) === $pisave, 'pisavi naslovi in besedilo' );
preveri( 5 === count( $json['settings']['typography']['fontSizes'] ), '5 velikosti pisave' );
preveri( file_exists( __DIR__ . '/../s59dgo/assets/css/editor.css' ), 'editor.css obstaja' );
```

- [ ] **Step 2: Poženi test, pričakuj neuspeh**

Run: `bin/test.sh`
Expected: `NEUSPEH: theme.json je veljaven JSON`.

- [ ] **Step 3: Napiši `s59dgo/theme.json`**

```json
{
	"$schema": "https://schemas.wp.org/trunk/theme.json",
	"version": 3,
	"settings": {
		"appearanceTools": false,
		"layout": {
			"contentSize": "760px",
			"wideSize": "1100px"
		},
		"color": {
			"custom": false,
			"customGradient": false,
			"defaultPalette": false,
			"defaultGradients": false,
			"palette": [
				{ "slug": "temno-modra", "color": "#15304f", "name": "Temno modra" },
				{ "slug": "oranzna", "color": "#d9702a", "name": "Oranžna" },
				{ "slug": "sneg", "color": "#eef3f8", "name": "Sneg" },
				{ "slug": "povrsina", "color": "#ffffff", "name": "Bela" },
				{ "slug": "besedilo", "color": "#172433", "name": "Besedilo" },
				{ "slug": "tiha", "color": "#5f7590", "name": "Tiha modra" }
			]
		},
		"typography": {
			"customFontSize": false,
			"fontFamilies": [
				{
					"slug": "naslovi",
					"name": "Space Grotesk",
					"fontFamily": "'Space Grotesk', 'Trebuchet MS', Arial, sans-serif",
					"fontFace": [
						{ "fontFamily": "Space Grotesk", "fontWeight": "500", "fontStyle": "normal", "src": [ "file:./assets/fonts/space-grotesk-latin-500-normal.woff2", "file:./assets/fonts/space-grotesk-latin-ext-500-normal.woff2" ] },
						{ "fontFamily": "Space Grotesk", "fontWeight": "700", "fontStyle": "normal", "src": [ "file:./assets/fonts/space-grotesk-latin-700-normal.woff2", "file:./assets/fonts/space-grotesk-latin-ext-700-normal.woff2" ] }
					]
				},
				{
					"slug": "besedilo",
					"name": "IBM Plex Sans",
					"fontFamily": "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
					"fontFace": [
						{ "fontFamily": "IBM Plex Sans", "fontWeight": "400", "fontStyle": "normal", "src": [ "file:./assets/fonts/ibm-plex-sans-latin-400-normal.woff2", "file:./assets/fonts/ibm-plex-sans-latin-ext-400-normal.woff2" ] },
						{ "fontFamily": "IBM Plex Sans", "fontWeight": "600", "fontStyle": "normal", "src": [ "file:./assets/fonts/ibm-plex-sans-latin-600-normal.woff2", "file:./assets/fonts/ibm-plex-sans-latin-ext-600-normal.woff2" ] }
					]
				}
			],
			"fontSizes": [
				{ "slug": "majhna", "size": "14px", "name": "Majhna" },
				{ "slug": "osnovna", "size": "17px", "name": "Osnovna" },
				{ "slug": "srednja", "size": "21px", "name": "Srednja" },
				{ "slug": "velika", "size": "28px", "name": "Velika" },
				{ "slug": "ogromna", "size": "46px", "name": "Ogromna" }
			]
		}
	}
}
```

- [ ] **Step 4: Napiši `s59dgo/assets/css/editor.css`**

```css
/* Slogi urejevalnika blokov – usklajeni s style.css. */
.editor-styles-wrapper {
	font-family: 'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif;
	font-size: 17px;
	line-height: 1.6;
	color: #172433;
	background: #ffffff;
}
.editor-styles-wrapper h1,
.editor-styles-wrapper h2,
.editor-styles-wrapper h3,
.editor-styles-wrapper h4 {
	font-family: 'Space Grotesk', 'Trebuchet MS', Arial, sans-serif;
	font-weight: 700;
	color: #15304f;
	line-height: 1.2;
}
.editor-styles-wrapper a {
	color: #d9702a;
}
.editor-styles-wrapper .wp-block-button__link {
	background: #d9702a;
	color: #ffffff;
	border-radius: 4px;
	font-family: 'Space Grotesk', 'Trebuchet MS', Arial, sans-serif;
	font-weight: 700;
}
```

- [ ] **Step 5: Poženi test**

Run: `bin/test.sh`
Expected: vsi `OK:`.

- [ ] **Step 6: Commit**

```bash
git add s59dgo/theme.json s59dgo/assets/css/editor.css tests/test-theme-json.php
git commit -m "Dodaj theme.json z nastavitvami in sloge urejevalnika"
```

---

### Task 6: Funkcije predlog (`inc/template-tags.php`) – TDD s stubi

**Files:**
- Create: `s59dgo/inc/template-tags.php`
- Test: `tests/test-template-tags.php`

**Interfaces:**
- Consumes: `tests/stubs.php` (Naloga 1).
- Produces:
  - `s59dgo_trak_podatki(): array{naslov:string, podnaslov:string, meta:string, velik:bool}` – `meta` je escapan HTML (kategorija + datum) samo na posamezni objavi.
  - `s59dgo_kategorija(): string` – escapan HTML `<a class="znacka" href="…">Ime</a>` prve kategorije ali `''` (če ni kategorije ali je `uncategorized`).
  - `s59dgo_datum(): string` – escapan HTML `<time class="datum" datetime="2026-07-08">8. 7. 2026</time>`.
  - `s59dgo_slika_kartice(): void` – izpiše `<img>` naslovne slike (`s59dgo-kartica`) ali `<img class="kartica__nadomestna" src="…/assets/img/greben.svg" alt="">`.

- [ ] **Step 1: Napiši teste (`tests/test-template-tags.php`)**

```php
<?php
require __DIR__ . '/preveri.php';
require __DIR__ . '/stubs.php';
require __DIR__ . '/../s59dgo/inc/template-tags.php';

// Domača stran.
s59dgo_test_ponastavi( array( 'is_home' => true ) );
$t = s59dgo_trak_podatki();
preveri( 'Novice s Snežnika' === $t['naslov'], 'doma: naslov Novice s Snežnika' );
preveri( 'Ilirska Bistrica · S59DGO' === $t['podnaslov'], 'doma: podnaslov iz opisa strani' );
preveri( true === $t['velik'], 'doma: velik trak' );
preveri( '' === $t['meta'], 'doma: brez meta' );

// Iskanje.
s59dgo_test_ponastavi( array( 'is_search' => true, 'search_query' => 'snežnik', 'found_posts' => 3 ) );
$t = s59dgo_trak_podatki();
preveri( 'Iskanje: snežnik' === $t['naslov'], 'iskanje: naslov z nizom' );
preveri( 'Število zadetkov: 3' === $t['podnaslov'], 'iskanje: število zadetkov' );

// Arhiv kategorije.
s59dgo_test_ponastavi( array( 'is_archive' => true, 'archive_title' => '<span>Dogodki</span>', 'archive_description' => '<p>Opis</p>' ) );
$t = s59dgo_trak_podatki();
preveri( 'Dogodki' === $t['naslov'], 'arhiv: naslov brez HTML' );
preveri( 'Opis' === $t['podnaslov'], 'arhiv: opis brez HTML' );
preveri( true === $t['velik'], 'arhiv: velik trak' );

// 404.
s59dgo_test_ponastavi( array( 'is_404' => true ) );
$t = s59dgo_trak_podatki();
preveri( 'Stran ne obstaja' === $t['naslov'], '404: naslov' );
preveri( false === $t['velik'], '404: nizek trak' );

// Stran.
s59dgo_test_ponastavi( array( 'is_singular' => true, 'title' => 'O društvu' ) );
$t = s59dgo_trak_podatki();
preveri( 'O društvu' === $t['naslov'], 'stran: naslov' );
preveri( false === $t['velik'], 'stran: nizek trak' );
preveri( '' === $t['meta'], 'stran: brez meta' );

// Objava s kategorijo in datumom.
$kategorija = (object) array( 'term_id' => 5, 'name' => 'Dogodki', 'slug' => 'dogodki' );
s59dgo_test_ponastavi( array( 'is_singular' => true, 'is_single' => true, 'title' => 'Vabilo', 'categories' => array( $kategorija ), 'date' => '2026-05-28' ) );
$t = s59dgo_trak_podatki();
preveri( false !== strpos( $t['meta'], '<a class="znacka" href="https://example.test/category/5/">Dogodki</a>' ), 'objava: meta ima značko kategorije' );
preveri( false !== strpos( $t['meta'], '<time class="datum" datetime="2026-05-28">28. 5. 2026</time>' ), 'objava: meta ima datum' );

// Kategorija uncategorized se skrije.
s59dgo_test_ponastavi( array( 'categories' => array( (object) array( 'term_id' => 1, 'name' => 'Uncategorized', 'slug' => 'uncategorized' ) ) ) );
preveri( '' === s59dgo_kategorija(), 'uncategorized se ne prikaže' );
s59dgo_test_ponastavi();
preveri( '' === s59dgo_kategorija(), 'brez kategorije prazen niz' );

// Ime kategorije je escapano.
s59dgo_test_ponastavi( array( 'categories' => array( (object) array( 'term_id' => 7, 'name' => 'A & B', 'slug' => 'a-b' ) ) ) );
preveri( false !== strpos( s59dgo_kategorija(), 'A &amp; B' ), 'ime kategorije je escapano' );

// Slika kartice: nadomestna.
s59dgo_test_ponastavi( array( 'has_thumbnail' => false ) );
ob_start();
s59dgo_slika_kartice();
$html = ob_get_clean();
preveri( false !== strpos( $html, 'assets/img/greben.svg' ), 'brez naslovne slike: greben.svg' );
preveri( false !== strpos( $html, 'class="kartica__nadomestna"' ), 'nadomestna slika ima razred' );

// Slika kartice: naslovna.
s59dgo_test_ponastavi( array( 'has_thumbnail' => true ) );
ob_start();
s59dgo_slika_kartice();
$html = ob_get_clean();
preveri( false !== strpos( $html, 'https://example.test/slika.jpg' ), 'z naslovno sliko: thumbnail' );
preveri( false === strpos( $html, 'greben.svg' ), 'z naslovno sliko: brez nadomestne' );
```

- [ ] **Step 2: Poženi test, pričakuj neuspeh**

Run: `bin/test.sh`
Expected: PHP fatal `Failed opening required '.../template-tags.php'`, koda 1.

- [ ] **Step 3: Napiši `s59dgo/inc/template-tags.php`**

```php
<?php
/**
 * Funkcije predlog: trak z grebenom, kategorija, datum, slika kartice.
 *
 * @package s59dgo
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 's59dgo_kategorija' ) ) :
	/**
	 * Značka prve kategorije objave; prazno za uncategorized ali brez kategorije.
	 *
	 * @return string Escapan HTML.
	 */
	function s59dgo_kategorija() {
		$kategorije = get_the_category();
		if ( empty( $kategorije ) ) {
			return '';
		}
		$prva = $kategorije[0];
		if ( 'uncategorized' === $prva->slug ) {
			return '';
		}
		return sprintf(
			'<a class="znacka" href="%s">%s</a>',
			esc_url( get_category_link( $prva->term_id ) ),
			esc_html( $prva->name )
		);
	}
endif;

if ( ! function_exists( 's59dgo_datum' ) ) :
	/**
	 * Datum objave v slovenski obliki.
	 *
	 * @return string Escapan HTML.
	 */
	function s59dgo_datum() {
		return sprintf(
			'<time class="datum" datetime="%s">%s</time>',
			esc_attr( get_the_date( 'Y-m-d' ) ),
			esc_html( get_the_date( 'j. n. Y' ) )
		);
	}
endif;

if ( ! function_exists( 's59dgo_slika_kartice' ) ) :
	/**
	 * Izpiše naslovno sliko kartice ali nadomestni greben.
	 */
	function s59dgo_slika_kartice() {
		if ( has_post_thumbnail() ) {
			echo get_the_post_thumbnail( null, 's59dgo-kartica', array( 'loading' => 'lazy' ) ); // phpcs:ignore WordPress.Security.EscapeOutput -- WP vrne varen HTML.
			return;
		}
		printf(
			'<img class="kartica__nadomestna" src="%s" alt="" width="800" height="520" loading="lazy">',
			esc_url( S59DGO_URI . '/assets/img/greben.svg' )
		);
	}
endif;

if ( ! function_exists( 's59dgo_trak_podatki' ) ) :
	/**
	 * Vsebina traku z grebenom glede na kontekst.
	 *
	 * @return array{naslov:string,podnaslov:string,meta:string,velik:bool}
	 */
	function s59dgo_trak_podatki() {
		$podatki = array(
			'naslov'    => '',
			'podnaslov' => '',
			'meta'      => '',
			'velik'     => true,
		);

		if ( is_404() ) {
			$podatki['naslov'] = __( 'Stran ne obstaja', 's59dgo' );
			$podatki['velik']  = false;
		} elseif ( is_search() ) {
			global $wp_query;
			$stevilo = isset( $wp_query->found_posts ) ? (int) $wp_query->found_posts : 0;
			/* translators: %s: iskalni niz */
			$podatki['naslov'] = sprintf( __( 'Iskanje: %s', 's59dgo' ), get_search_query() );
			/* translators: %s: število zadetkov */
			$podatki['podnaslov'] = sprintf( __( 'Število zadetkov: %s', 's59dgo' ), number_format_i18n( $stevilo ) );
		} elseif ( is_home() ) {
			$podatki['naslov']    = apply_filters( 's59dgo_naslov_doma', __( 'Novice s Snežnika', 's59dgo' ) );
			$podatki['podnaslov'] = get_bloginfo( 'description', 'display' );
		} elseif ( is_archive() ) {
			$podatki['naslov']    = wp_strip_all_tags( get_the_archive_title() );
			$podatki['podnaslov'] = wp_strip_all_tags( get_the_archive_description() );
		} elseif ( is_singular() ) {
			$podatki['naslov'] = get_the_title();
			$podatki['velik']  = false;
			if ( is_single() ) {
				$podatki['meta'] = s59dgo_kategorija() . s59dgo_datum();
			}
		}

		return $podatki;
	}
endif;
```

- [ ] **Step 4: Poženi lint in test**

Run: `bin/lint.sh && bin/test.sh`
Expected: `PHP sintaksa v redu`, vsi `OK:` (skupaj 25 v tem testu).

- [ ] **Step 5: Commit**

```bash
git add s59dgo/inc/template-tags.php tests/test-template-tags.php
git commit -m "Dodaj funkcije predlog: trak, kategorija, datum, slika kartice (s testi)"
```

---

### Task 7: Glava, iskalni obrazec in nadomestna slika

**Files:**
- Create: `s59dgo/header.php`, `s59dgo/searchform.php`, `s59dgo/assets/img/greben.svg`
- Test: `tests/test-header.php`

**Interfaces:**
- Consumes: DOM pogodba iz Naloge 3; `template-parts/trak.php` (Naloga 8 – `get_template_part` tiho preskoči manjkajočo datoteko, zato je vrstni red varen).
- Produces: `<a class="preskoci" href="#vsebina">`, `header.glava > .ovoj.glava__vrstica`, `.glava__znamka`, `.glava__ime`, `.glava__podnaslov`, `button.glava__preklop`, `nav#glavni-meni.glava__meni > ul.meni`, `button.glava__iskanje-preklop`, `div#glava-iskanje.glava__iskanje[hidden]`, `form.iskanje` s `input.iskanje__polje` in `button.iskanje__gumb`.

- [ ] **Step 1: Napiši test (`tests/test-header.php`)**

```php
<?php
require __DIR__ . '/preveri.php';
$h = file_get_contents( __DIR__ . '/../s59dgo/header.php' );
foreach ( array(
	'<html <?php language_attributes(); ?> class="brez-js">',
	"document.documentElement.classList.remove('brez-js')",
	'<meta name="viewport" content="width=device-width, initial-scale=1">',
	'<?php wp_head(); ?>',
	'<?php wp_body_open(); ?>',
	'<a class="preskoci" href="#vsebina">',
	'class="glava__preklop" aria-controls="glavni-meni" aria-expanded="false"',
	'id="glavni-meni" class="glava__meni"',
	'data-oznaka-podmeni=',
	"'theme_location' => 'glavni'",
	"'fallback_cb'     => false",
	"current_user_can( 'edit_theme_options' )",
	'class="glava__iskanje-preklop" aria-controls="glava-iskanje" aria-expanded="false"',
	'id="glava-iskanje" class="glava__iskanje" hidden',
	"get_template_part( 'template-parts/trak' )",
) as $iskano ) {
	preveri( false !== strpos( $h, $iskano ), "header.php vsebuje {$iskano}" );
}
$s = file_get_contents( __DIR__ . '/../s59dgo/searchform.php' );
preveri( false !== strpos( $s, 'class="iskanje"' ), 'searchform ima form.iskanje' );
preveri( false !== strpos( $s, 'type="search"' ), 'searchform ima input search' );
preveri( false !== strpos( $s, 'name="s"' ), 'searchform ima name=s' );
$svg = file_get_contents( __DIR__ . '/../s59dgo/assets/img/greben.svg' );
preveri( false !== strpos( $svg, 'viewBox="0 0 800 520"' ), 'greben.svg 800x520' );
```

- [ ] **Step 2: Poženi test, pričakuj neuspeh**

Run: `bin/test.sh`
Expected: `NEUSPEH: header.php vsebuje …`.

- [ ] **Step 3: Napiši `s59dgo/header.php`**

```php
<?php
/**
 * Glava strani: logotip, ime, meni, iskanje; nato trak z grebenom.
 *
 * @package s59dgo
 */

?>
<!doctype html>
<html <?php language_attributes(); ?> class="brez-js">
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<script>document.documentElement.classList.remove('brez-js');</script>
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="preskoci" href="#vsebina"><?php esc_html_e( 'Preskoči na vsebino', 's59dgo' ); ?></a>

<header class="glava">
	<div class="ovoj glava__vrstica">
		<div class="glava__znamka">
			<?php
			if ( has_custom_logo() ) {
				the_custom_logo();
			}
			$s59dgo_opis = get_bloginfo( 'description', 'display' );
			?>
			<div class="glava__imena">
				<a class="glava__ime" href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><?php bloginfo( 'name' ); ?></a>
				<?php if ( $s59dgo_opis ) : ?>
					<span class="glava__podnaslov"><?php echo esc_html( $s59dgo_opis ); ?></span>
				<?php endif; ?>
			</div>
		</div>

		<div class="glava__gumbi">
			<button type="button" class="glava__iskanje-preklop" aria-controls="glava-iskanje" aria-expanded="false">
				<span class="vizualno-skrito"><?php esc_html_e( 'Iskanje', 's59dgo' ); ?></span>
				<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path></svg>
			</button>
			<button type="button" class="glava__preklop" aria-controls="glavni-meni" aria-expanded="false">
				<span class="vizualno-skrito"><?php esc_html_e( 'Meni', 's59dgo' ); ?></span>
				<svg class="ikona-meni" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>
				<svg class="ikona-zapri" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>
			</button>
		</div>

		<nav id="glavni-meni" class="glava__meni" aria-label="<?php esc_attr_e( 'Glavni meni', 's59dgo' ); ?>" data-oznaka-podmeni="<?php esc_attr_e( 'Odpri podmeni', 's59dgo' ); ?>">
			<?php
			if ( has_nav_menu( 'glavni' ) ) {
				wp_nav_menu(
					array(
						'theme_location' => 'glavni',
						'container'      => false,
						'menu_class'     => 'meni',
						'depth'          => 2,
						'fallback_cb'    => false,
					)
				);
			} elseif ( current_user_can( 'edit_theme_options' ) ) {
				printf(
					'<p class="glava__opomba"><a href="%s">%s</a></p>',
					esc_url( admin_url( 'nav-menus.php' ) ),
					esc_html__( 'Dodelite meni lokaciji »Glavni meni« (Videz → Meniji).', 's59dgo' )
				);
			}
			?>
		</nav>
	</div>

	<div id="glava-iskanje" class="glava__iskanje" hidden>
		<div class="ovoj">
			<?php get_search_form(); ?>
		</div>
	</div>
</header>

<?php get_template_part( 'template-parts/trak' ); ?>
```

- [ ] **Step 4: Napiši `s59dgo/searchform.php`**

```php
<?php
/**
 * Iskalni obrazec.
 *
 * @package s59dgo
 */

$s59dgo_id = wp_unique_id( 'iskanje-' );
?>
<form role="search" method="get" class="iskanje" action="<?php echo esc_url( home_url( '/' ) ); ?>">
	<label class="vizualno-skrito" for="<?php echo esc_attr( $s59dgo_id ); ?>"><?php esc_html_e( 'Išči po strani', 's59dgo' ); ?></label>
	<input id="<?php echo esc_attr( $s59dgo_id ); ?>" class="iskanje__polje" type="search" name="s" value="<?php echo esc_attr( get_search_query() ); ?>" placeholder="<?php esc_attr_e( 'Išči …', 's59dgo' ); ?>">
	<button class="iskanje__gumb" type="submit"><?php esc_html_e( 'Išči', 's59dgo' ); ?></button>
</form>
```

- [ ] **Step 5: Napiši `s59dgo/assets/img/greben.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="800" height="520">
  <rect width="800" height="520" fill="#15304f"/>
  <circle cx="640" cy="130" r="34" fill="#d9702a"/>
  <path d="M0 400 L90 330 L170 370 L260 260 L340 320 L430 210 L520 300 L600 250 L690 330 L800 280 L800 520 L0 520 Z" fill="#1f4470"/>
  <path d="M0 450 L110 400 L200 430 L300 350 L400 410 L500 340 L610 400 L700 370 L800 420 L800 520 L0 520 Z" fill="#2a5687"/>
</svg>
```

- [ ] **Step 6: Poženi lint in test**

Run: `bin/lint.sh && bin/test.sh`
Expected: `PHP sintaksa v redu`, vsi `OK:`.

- [ ] **Step 7: Commit**

```bash
git add s59dgo/header.php s59dgo/searchform.php s59dgo/assets/img/greben.svg tests/test-header.php
git commit -m "Dodaj glavo z menijem in iskanjem ter nadomestno sliko grebena"
```

---

### Task 8: Trak, kartica, mreža in predloge seznamov

**Files:**
- Create: `s59dgo/template-parts/trak.php`, `s59dgo/template-parts/kartica.php`, `s59dgo/template-parts/mreza.php`, `s59dgo/home.php`, `s59dgo/archive.php`, `s59dgo/search.php`
- Modify: `s59dgo/index.php` (zamenjaj začasno vsebino)
- Test: `tests/test-mreza.php`

**Interfaces:**
- Consumes: `s59dgo_trak_podatki()`, `s59dgo_kategorija()`, `s59dgo_datum()`, `s59dgo_slika_kartice()` (Naloga 6).
- Produces: `section.trak[.trak--velik] > .ovoj.trak__vsebina > h1.trak__naslov, p.trak__podnaslov, div.trak__meta` + `svg.trak__greben`; `article.kartica` z `.kartica__slika`, `.kartica__meta`, `.kartica__naslov`, `.kartica__izvlecek`; `main#vsebina.vsebina > .ovoj > .mreza` in `nav.pagination` (WP privzeto) ali `.prazno`.

- [ ] **Step 1: Napiši test (`tests/test-mreza.php`)**

```php
<?php
require __DIR__ . '/preveri.php';
$koren = __DIR__ . '/../s59dgo/';
$trak  = file_get_contents( $koren . 'template-parts/trak.php' );
foreach ( array( 's59dgo_trak_podatki()', 'class="trak', "trak--velik", 'class="trak__naslov"', 'class="trak__podnaslov"', 'class="trak__meta"', 'class="trak__greben"', 'viewBox="0 0 1440 90"' ) as $iskano ) {
	preveri( false !== strpos( $trak, $iskano ), "trak.php vsebuje {$iskano}" );
}
$kartica = file_get_contents( $koren . 'template-parts/kartica.php' );
foreach ( array( "post_class( 'kartica' )", 's59dgo_slika_kartice()', 's59dgo_kategorija()', 's59dgo_datum()', 'class="kartica__naslov"', 'the_excerpt()' ) as $iskano ) {
	preveri( false !== strpos( $kartica, $iskano ), "kartica.php vsebuje {$iskano}" );
}
$mreza = file_get_contents( $koren . 'template-parts/mreza.php' );
foreach ( array( '<main id="vsebina" class="vsebina">', 'class="mreza"', "get_template_part( 'template-parts/kartica' )", 'the_posts_pagination(', "'Starejše objave'", 'class="prazno"', 'get_search_form()' ) as $iskano ) {
	preveri( false !== strpos( $mreza, $iskano ), "mreza.php vsebuje {$iskano}" );
}
foreach ( array( 'home.php', 'index.php', 'archive.php', 'search.php' ) as $predloga ) {
	$koda = file_get_contents( $koren . $predloga );
	preveri( false !== strpos( $koda, 'get_header();' ) && false !== strpos( $koda, "get_template_part( 'template-parts/mreza' );" ) && false !== strpos( $koda, 'get_footer();' ), "{$predloga} uporablja mrežo" );
}
preveri( ! file_exists( $koren . 'front-page.php' ), 'ni front-page.php' );
```

- [ ] **Step 2: Poženi test, pričakuj neuspeh**

Run: `bin/test.sh`
Expected: `NEUSPEH: trak.php vsebuje …`.

- [ ] **Step 3: Napiši `s59dgo/template-parts/trak.php`**

```php
<?php
/**
 * Temno modri trak z grebenom pod glavo.
 *
 * @package s59dgo
 */

$s59dgo_trak = s59dgo_trak_podatki();
?>
<section class="trak<?php echo $s59dgo_trak['velik'] ? ' trak--velik' : ''; ?>">
	<div class="ovoj trak__vsebina">
		<h1 class="trak__naslov"><?php echo esc_html( $s59dgo_trak['naslov'] ); ?></h1>
		<?php if ( '' !== $s59dgo_trak['podnaslov'] ) : ?>
			<p class="trak__podnaslov"><?php echo esc_html( $s59dgo_trak['podnaslov'] ); ?></p>
		<?php endif; ?>
		<?php if ( '' !== $s59dgo_trak['meta'] ) : ?>
			<div class="trak__meta"><?php echo $s59dgo_trak['meta']; // phpcs:ignore WordPress.Security.EscapeOutput -- že escapano v s59dgo_trak_podatki(). ?></div>
		<?php endif; ?>
	</div>
	<svg class="trak__greben" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true" focusable="false">
		<path d="M0 90 L0 62 L120 48 L230 60 L340 30 L420 44 L520 18 L610 40 L700 8 L790 36 L880 22 L980 50 L1080 30 L1180 52 L1280 38 L1380 58 L1440 46 L1440 90 Z" fill="currentColor"></path>
		<path d="M0 74 L120 60 L230 72 L340 42 L420 56 L520 30 L610 52 L700 20 L790 48 L880 34 L980 62 L1080 42 L1180 64 L1280 50 L1380 70 L1440 58" fill="none" stroke="#5f86b0" stroke-width="1.5" opacity="0.5"></path>
	</svg>
</section>
```

- [ ] **Step 4: Napiši `s59dgo/template-parts/kartica.php`**

```php
<?php
/**
 * Kartica objave v mreži.
 *
 * @package s59dgo
 */

?>
<article id="objava-<?php the_ID(); ?>" <?php post_class( 'kartica' ); ?>>
	<a class="kartica__slika" href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true">
		<?php s59dgo_slika_kartice(); ?>
	</a>
	<div class="kartica__meta">
		<?php echo s59dgo_kategorija() . s59dgo_datum(); // phpcs:ignore WordPress.Security.EscapeOutput -- funkciji vračata escapan HTML. ?>
	</div>
	<h2 class="kartica__naslov"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
	<div class="kartica__izvlecek"><?php the_excerpt(); ?></div>
</article>
```

- [ ] **Step 5: Napiši `s59dgo/template-parts/mreza.php`**

```php
<?php
/**
 * Mreža objav s paginacijo; skupna za home, index, archive, search.
 *
 * @package s59dgo
 */

?>
<main id="vsebina" class="vsebina">
	<div class="ovoj">
		<?php if ( have_posts() ) : ?>
			<div class="mreza">
				<?php
				while ( have_posts() ) :
					the_post();
					get_template_part( 'template-parts/kartica' );
				endwhile;
				?>
			</div>
			<?php
			the_posts_pagination(
				array(
					'prev_text'          => '‹ ' . __( 'Novejše', 's59dgo' ),
					'next_text'          => __( 'Starejše objave', 's59dgo' ) . ' ›',
					'screen_reader_text' => __( 'Navigacija po objavah', 's59dgo' ),
				)
			);
			?>
		<?php else : ?>
			<div class="prazno">
				<p><?php esc_html_e( 'Ni objav, ki bi ustrezale.', 's59dgo' ); ?></p>
				<?php get_search_form(); ?>
			</div>
		<?php endif; ?>
	</div>
</main>
```

- [ ] **Step 6: Napiši `home.php`, `index.php`, `archive.php`, `search.php`** (vse štiri enake; docblock naj pove, kdaj jo WP uporabi)

`s59dgo/home.php`:
```php
<?php
/**
 * Domača stran (nastavitev »Zadnje objave«): mreža objav.
 *
 * @package s59dgo
 */

get_header();
get_template_part( 'template-parts/mreza' );
get_footer();
```

`s59dgo/index.php`:
```php
<?php
/**
 * Rezervna predloga: mreža objav.
 *
 * @package s59dgo
 */

get_header();
get_template_part( 'template-parts/mreza' );
get_footer();
```

`s59dgo/archive.php`:
```php
<?php
/**
 * Arhivi (kategorije, oznake, datumi, avtorji): mreža objav.
 *
 * @package s59dgo
 */

get_header();
get_template_part( 'template-parts/mreza' );
get_footer();
```

`s59dgo/search.php`:
```php
<?php
/**
 * Rezultati iskanja: mreža objav.
 *
 * @package s59dgo
 */

get_header();
get_template_part( 'template-parts/mreza' );
get_footer();
```

- [ ] **Step 7: Poženi lint in test**

Run: `bin/lint.sh && bin/test.sh`
Expected: `PHP sintaksa v redu`, vsi `OK:`.

- [ ] **Step 8: Commit**

```bash
git add s59dgo/template-parts s59dgo/home.php s59dgo/index.php s59dgo/archive.php s59dgo/search.php tests/test-mreza.php
git commit -m "Dodaj trak z grebenom, kartico in mrežo objav za sezname"
```

---

### Task 9: Posamezna objava, stran, komentarji, 404

**Files:**
- Create: `s59dgo/single.php`, `s59dgo/page.php`, `s59dgo/template-parts/vsebina-objava.php`, `s59dgo/template-parts/vsebina-stran.php`, `s59dgo/comments.php`, `s59dgo/404.php`
- Test: `tests/test-posamezno.php`

**Interfaces:**
- Produces: `main#vsebina.vsebina > article.objava|.stran` z `.objava__slika.ovoj.ovoj--siroko`, `.besedilo` (vsebina blokov; `.besedilo > *` max 760px, `.alignwide` 1100px, `.alignfull` polna širina), `.objava__noga`, `.objava__oznake`, `nav.post-navigation` (WP), `section#komentarji.komentarji`, `main.vsebina--404 .prazno`.

- [ ] **Step 1: Napiši test (`tests/test-posamezno.php`)**

```php
<?php
require __DIR__ . '/preveri.php';
$koren = __DIR__ . '/../s59dgo/';
$single = file_get_contents( $koren . 'single.php' );
preveri( false !== strpos( $single, "get_template_part( 'template-parts/vsebina', 'objava' )" ), 'single.php nalaga vsebina-objava' );
$page = file_get_contents( $koren . 'page.php' );
preveri( false !== strpos( $page, "get_template_part( 'template-parts/vsebina', 'stran' )" ), 'page.php nalaga vsebina-stran' );
$objava = file_get_contents( $koren . 'template-parts/vsebina-objava.php' );
foreach ( array( "post_class( 'objava' )", 'has_post_thumbnail()', 'class="objava__slika ovoj ovoj--siroko"', 'class="besedilo"', 'the_content();', 'wp_link_pages(', 'the_tags(', 'the_post_navigation(', "'Prejšnja objava'", "'Naslednja objava'", 'comments_open() || get_comments_number()', 'comments_template();' ) as $iskano ) {
	preveri( false !== strpos( $objava, $iskano ), "vsebina-objava.php vsebuje {$iskano}" );
}
$stran = file_get_contents( $koren . 'template-parts/vsebina-stran.php' );
foreach ( array( "post_class( 'stran' )", 'class="besedilo"', 'the_content();' ) as $iskano ) {
	preveri( false !== strpos( $stran, $iskano ), "vsebina-stran.php vsebuje {$iskano}" );
}
preveri( false === strpos( $stran, 'the_post_thumbnail' ), 'stran brez naslovne slike' );
$komentarji = file_get_contents( $koren . 'comments.php' );
foreach ( array( 'post_password_required()', 'id="komentarji"', 'wp_list_comments(', 'the_comments_navigation();', 'comment_form(' ) as $iskano ) {
	preveri( false !== strpos( $komentarji, $iskano ), "comments.php vsebuje {$iskano}" );
}
$napaka = file_get_contents( $koren . '404.php' );
foreach ( array( 'class="vsebina vsebina--404"', 'class="prazno"', 'get_search_form()', "home_url( '/' )" ) as $iskano ) {
	preveri( false !== strpos( $napaka, $iskano ), "404.php vsebuje {$iskano}" );
}
```

- [ ] **Step 2: Poženi test, pričakuj neuspeh**

Run: `bin/test.sh`
Expected: `NEUSPEH: single.php nalaga vsebina-objava`.

- [ ] **Step 3: Napiši `single.php` in `page.php`**

`s59dgo/single.php`:
```php
<?php
/**
 * Posamezna objava.
 *
 * @package s59dgo
 */

get_header();
?>
<main id="vsebina" class="vsebina">
	<?php
	while ( have_posts() ) :
		the_post();
		get_template_part( 'template-parts/vsebina', 'objava' );
	endwhile;
	?>
</main>
<?php
get_footer();
```

`s59dgo/page.php`:
```php
<?php
/**
 * Statična stran.
 *
 * @package s59dgo
 */

get_header();
?>
<main id="vsebina" class="vsebina">
	<?php
	while ( have_posts() ) :
		the_post();
		get_template_part( 'template-parts/vsebina', 'stran' );
	endwhile;
	?>
</main>
<?php
get_footer();
```

- [ ] **Step 4: Napiši `template-parts/vsebina-objava.php` in `vsebina-stran.php`**

`s59dgo/template-parts/vsebina-objava.php`:
```php
<?php
/**
 * Telo posamezne objave (naslov je v traku).
 *
 * @package s59dgo
 */

?>
<article id="objava-<?php the_ID(); ?>" <?php post_class( 'objava' ); ?>>
	<?php if ( has_post_thumbnail() ) : ?>
		<figure class="objava__slika ovoj ovoj--siroko">
			<?php the_post_thumbnail( 'large' ); ?>
		</figure>
	<?php endif; ?>

	<div class="besedilo">
		<?php
		the_content();
		wp_link_pages(
			array(
				'before' => '<nav class="objava__strani">' . esc_html__( 'Strani:', 's59dgo' ),
				'after'  => '</nav>',
			)
		);
		?>
	</div>

	<footer class="objava__noga ovoj ovoj--besedilo">
		<?php the_tags( '<div class="objava__oznake">', ' ', '</div>' ); ?>
		<?php
		the_post_navigation(
			array(
				'prev_text' => '<span class="nav-oznaka">' . esc_html__( 'Prejšnja objava', 's59dgo' ) . '</span><span class="nav-naslov">%title</span>',
				'next_text' => '<span class="nav-oznaka">' . esc_html__( 'Naslednja objava', 's59dgo' ) . '</span><span class="nav-naslov">%title</span>',
			)
		);
		?>
	</footer>

	<?php
	if ( comments_open() || get_comments_number() ) {
		comments_template();
	}
	?>
</article>
```

`s59dgo/template-parts/vsebina-stran.php`:
```php
<?php
/**
 * Telo statične strani (naslov je v traku).
 *
 * @package s59dgo
 */

?>
<article id="stran-<?php the_ID(); ?>" <?php post_class( 'stran' ); ?>>
	<div class="besedilo">
		<?php
		the_content();
		wp_link_pages(
			array(
				'before' => '<nav class="objava__strani">' . esc_html__( 'Strani:', 's59dgo' ),
				'after'  => '</nav>',
			)
		);
		?>
	</div>
</article>
```

- [ ] **Step 5: Napiši `comments.php` in `404.php`**

`s59dgo/comments.php`:
```php
<?php
/**
 * Komentarji.
 *
 * @package s59dgo
 */

if ( post_password_required() ) {
	return;
}
?>
<section id="komentarji" class="komentarji ovoj ovoj--besedilo">
	<?php if ( have_comments() ) : ?>
		<h2 class="komentarji__naslov">
			<?php
			/* translators: %s: število komentarjev */
			printf( esc_html__( 'Komentarji (%s)', 's59dgo' ), esc_html( number_format_i18n( get_comments_number() ) ) );
			?>
		</h2>
		<ol class="komentarji__seznam">
			<?php
			wp_list_comments(
				array(
					'style'       => 'ol',
					'avatar_size' => 48,
					'short_ping'  => true,
				)
			);
			?>
		</ol>
		<?php the_comments_navigation(); ?>
	<?php endif; ?>

	<?php if ( ! comments_open() && get_comments_number() ) : ?>
		<p class="komentarji__zaprto"><?php esc_html_e( 'Komentiranje je zaprto.', 's59dgo' ); ?></p>
	<?php endif; ?>

	<?php
	comment_form(
		array(
			'title_reply' => __( 'Napišite komentar', 's59dgo' ),
			'label_submit' => __( 'Objavi komentar', 's59dgo' ),
		)
	);
	?>
</section>
```

`s59dgo/404.php`:
```php
<?php
/**
 * Stran ne obstaja.
 *
 * @package s59dgo
 */

get_header();
?>
<main id="vsebina" class="vsebina vsebina--404">
	<div class="ovoj ovoj--besedilo">
		<div class="prazno">
			<p><?php esc_html_e( 'Strani na tem naslovu ni. Poskusite z iskanjem ali se vrnite na domačo stran.', 's59dgo' ); ?></p>
			<?php get_search_form(); ?>
			<p><a class="gumb" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Na domačo stran', 's59dgo' ); ?></a></p>
		</div>
	</div>
</main>
<?php
get_footer();
```

- [ ] **Step 6: Poženi lint in test**

Run: `bin/lint.sh && bin/test.sh`
Expected: `PHP sintaksa v redu`, vsi `OK:`.

- [ ] **Step 7: Commit**

```bash
git add s59dgo/single.php s59dgo/page.php s59dgo/template-parts/vsebina-objava.php s59dgo/template-parts/vsebina-stran.php s59dgo/comments.php s59dgo/404.php tests/test-posamezno.php
git commit -m "Dodaj predloge za objavo, stran, komentarje in 404"
```

---

### Task 10: Noga

**Files:**
- Create: `s59dgo/footer.php`
- Test: `tests/test-footer.php`

**Interfaces:**
- Consumes: widget območja `noga-1..3` (Naloga 2), filter `s59dgo_noga_besedilo`.
- Produces: `footer.noga > .ovoj > .noga__stolpci > .noga__stolpec` (samo aktivna), `.noga__spodaj`.

- [ ] **Step 1: Napiši test (`tests/test-footer.php`)**

```php
<?php
require __DIR__ . '/preveri.php';
$f = file_get_contents( __DIR__ . '/../s59dgo/footer.php' );
foreach ( array( '<footer class="noga">', "is_active_sidebar( 'noga-1' )", "array( 'noga-1', 'noga-2', 'noga-3' )", 'dynamic_sidebar(', 'class="noga__spodaj"', "date_i18n( 'Y' )", "apply_filters( 's59dgo_noga_besedilo', '' )", 'wp_kses_post(', '<?php wp_footer(); ?>', '</html>' ) as $iskano ) {
	preveri( false !== strpos( $f, $iskano ), "footer.php vsebuje {$iskano}" );
}
```

- [ ] **Step 2: Poženi test, pričakuj neuspeh**

Run: `bin/test.sh`
Expected: `NEUSPEH: footer.php vsebuje <footer class="noga">`.

- [ ] **Step 3: Napiši `s59dgo/footer.php`**

```php
<?php
/**
 * Noga: trije stolpci gradnikov in spodnja vrstica.
 *
 * @package s59dgo
 */

$s59dgo_obmocja = array( 'noga-1', 'noga-2', 'noga-3' );
$s59dgo_aktivna = is_active_sidebar( 'noga-1' ) || is_active_sidebar( 'noga-2' ) || is_active_sidebar( 'noga-3' );
$s59dgo_dodatno = apply_filters( 's59dgo_noga_besedilo', '' );
?>
<footer class="noga">
	<div class="ovoj">
		<?php if ( $s59dgo_aktivna ) : ?>
			<div class="noga__stolpci">
				<?php foreach ( $s59dgo_obmocja as $s59dgo_obmocje ) : ?>
					<?php if ( is_active_sidebar( $s59dgo_obmocje ) ) : ?>
						<div class="noga__stolpec"><?php dynamic_sidebar( $s59dgo_obmocje ); ?></div>
					<?php endif; ?>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>

		<div class="noga__spodaj">
			<span>© <?php echo esc_html( date_i18n( 'Y' ) ); ?> <?php bloginfo( 'name' ); ?> · S59DGO</span>
			<?php if ( $s59dgo_dodatno ) : ?>
				<span><?php echo wp_kses_post( $s59dgo_dodatno ); ?></span>
			<?php endif; ?>
		</div>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
```

- [ ] **Step 4: Poženi lint in test**

Run: `bin/lint.sh && bin/test.sh`
Expected: `PHP sintaksa v redu`, vsi `OK:`.

- [ ] **Step 5: Commit**

```bash
git add s59dgo/footer.php tests/test-footer.php
git commit -m "Dodaj nogo s tremi območji gradnikov"
```

---

### Task 11: Slogi I – spremenljivke, osnova, glava, meni, trak, noga

**Files:**
- Modify: `s59dgo/style.css` (dodaj za `@font-face` blokom)
- Test: `tests/test-css.php`

**Interfaces:**
- Produces: spremenljivke `--barva-*`, `--pisava-naslovi`, `--pisava-besedilo`, `--sirina-ovoj`, `--sirina-siroko`, `--sirina-besedilo`, `--rob`; razredi `.ovoj`, `.ovoj--siroko`, `.ovoj--besedilo`, `.vizualno-skrito`, `.preskoci`, `.gumb`, `.znacka`, `.datum`.

- [ ] **Step 1: Napiši test (`tests/test-css.php`)** – preveri prisotnost spremenljivk in ključnih pravil ter uravnotežene zavite oklepaje

```php
<?php
require __DIR__ . '/preveri.php';
$css = file_get_contents( __DIR__ . '/../s59dgo/style.css' );
preveri( substr_count( $css, '{' ) === substr_count( $css, '}' ), 'zaviti oklepaji so uravnoteženi' );
foreach ( array(
	'--barva-ozadje: #eef3f8;', '--barva-glava: #15304f;', '--barva-poudarek: #d9702a;', '--barva-noga: #ffffff;',
	'@media (prefers-color-scheme: dark)', '--barva-ozadje: #0f1c2b;', '--barva-poudarek: #f0955a;',
	'.preskoci', '.vizualno-skrito', '.glava {', 'position: sticky;', '.glava__meni', '.podmeni__preklop', '.trak {', '.trak--velik', '.trak__greben', '.noga {', '.noga__stolpci',
	'@media (max-width: 899px)', '@media (min-width: 900px)',
) as $iskano ) {
	preveri( false !== strpos( $css, $iskano ), "style.css vsebuje {$iskano}" );
}
```

- [ ] **Step 2: Poženi test, pričakuj neuspeh**

Run: `bin/test.sh`
Expected: `NEUSPEH: style.css vsebuje --barva-ozadje: #eef3f8;`.

- [ ] **Step 3: Dodaj sloge v `s59dgo/style.css`** (za `@font-face` blokom)

```css

/* ==========================================================================
   2. Spremenljivke (svetli način) in temni način po sistemu
   ========================================================================== */
:root {
	--barva-ozadje: #eef3f8;
	--barva-povrsina: #ffffff;
	--barva-besedilo: #172433;
	--barva-besedilo-2: #46586c;
	--barva-tiha: #5f7590;
	--barva-glava: #15304f;
	--barva-glava-besedilo: #ffffff;
	--barva-glava-tiha: #b9d0e6;
	--barva-poudarek: #d9702a;
	--barva-poudarek-hover: #b0561a;
	--barva-crta: #d3dfeb;
	--barva-noga: #ffffff;

	--pisava-naslovi: 'Space Grotesk', 'Trebuchet MS', Arial, sans-serif;
	--pisava-besedilo: 'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif;

	--sirina-ovoj: 1200px;
	--sirina-siroko: 1100px;
	--sirina-besedilo: 760px;
	--rob: 20px;

	color-scheme: light;
}

@media (prefers-color-scheme: dark) {
	:root {
		--barva-ozadje: #0f1c2b;
		--barva-povrsina: #152638;
		--barva-besedilo: #dbe6f1;
		--barva-besedilo-2: #b7c9db;
		--barva-tiha: #8fa9c4;
		--barva-glava: #0a1420;
		--barva-glava-besedilo: #ffffff;
		--barva-glava-tiha: #8fa9c4;
		--barva-poudarek: #f0955a;
		--barva-poudarek-hover: #ffb07a;
		--barva-crta: #27405a;
		--barva-noga: #0a1420;
		color-scheme: dark;
	}
}

/* ==========================================================================
   3. Osnova
   ========================================================================== */
*,
*::before,
*::after {
	box-sizing: border-box;
}

html {
	-webkit-text-size-adjust: 100%;
	scroll-behavior: smooth;
}

body {
	margin: 0;
	font-family: var(--pisava-besedilo);
	font-size: 17px;
	line-height: 1.6;
	color: var(--barva-besedilo);
	background: var(--barva-ozadje);
	overflow-wrap: anywhere;
}

h1, h2, h3, h4, h5, h6 {
	font-family: var(--pisava-naslovi);
	font-weight: 700;
	line-height: 1.2;
	color: var(--barva-besedilo);
	margin: 0 0 0.5em;
}

p {
	margin: 0 0 1em;
}

a {
	color: var(--barva-poudarek);
	text-decoration: none;
}

a:hover,
a:focus {
	color: var(--barva-poudarek-hover);
	text-decoration: underline;
}

:focus-visible {
	outline: 3px solid var(--barva-poudarek);
	outline-offset: 2px;
}

img,
video,
iframe {
	max-width: 100%;
	height: auto;
}

button,
input,
textarea,
select {
	font: inherit;
	color: inherit;
}

.ovoj {
	width: 100%;
	max-width: var(--sirina-ovoj);
	margin-left: auto;
	margin-right: auto;
	padding-left: var(--rob);
	padding-right: var(--rob);
}

.ovoj--siroko {
	max-width: calc(var(--sirina-siroko) + 2 * var(--rob));
}

.ovoj--besedilo {
	max-width: calc(var(--sirina-besedilo) + 2 * var(--rob));
}

.vizualno-skrito {
	position: absolute !important;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
}

.preskoci {
	position: absolute;
	top: -100px;
	left: 16px;
	z-index: 100;
	padding: 10px 16px;
	background: var(--barva-poudarek);
	color: #ffffff;
	border-radius: 4px;
}

.preskoci:focus {
	top: 16px;
	color: #ffffff;
	text-decoration: none;
}

.gumb,
.wp-block-button__link {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 10px;
	min-height: 48px;
	padding: 12px 24px;
	background: var(--barva-poudarek);
	color: #ffffff;
	font-family: var(--pisava-naslovi);
	font-weight: 700;
	font-size: 15px;
	border: 0;
	border-radius: 4px;
	cursor: pointer;
}

.gumb:hover,
.gumb:focus,
.wp-block-button__link:hover,
.wp-block-button__link:focus {
	background: var(--barva-poudarek-hover);
	color: #ffffff;
	text-decoration: none;
}

.znacka {
	display: inline-block;
	padding: 4px 8px;
	background: var(--barva-glava);
	color: var(--barva-glava-besedilo);
	font-size: 12px;
	font-weight: 600;
	letter-spacing: 0.1em;
	text-transform: uppercase;
	border-radius: 3px;
}

.znacka:hover,
.znacka:focus {
	color: var(--barva-glava-besedilo);
	background: var(--barva-poudarek);
	text-decoration: none;
}

.datum {
	font-size: 12px;
	font-weight: 600;
	letter-spacing: 0.1em;
	text-transform: uppercase;
	color: var(--barva-tiha);
}

/* ==========================================================================
   4. Glava
   ========================================================================== */
.glava {
	position: sticky;
	top: 0;
	z-index: 50;
	background: var(--barva-glava);
	color: var(--barva-glava-besedilo);
}

.glava__vrstica {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 24px;
	min-height: 80px;
	flex-wrap: wrap;
}

.glava__znamka {
	display: flex;
	align-items: center;
	gap: 14px;
}

.glava__znamka .custom-logo-link {
	display: block;
	line-height: 0;
}

.glava__znamka .custom-logo {
	width: 54px;
	height: 54px;
	border-radius: 50%;
	object-fit: cover;
	box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.15);
}

.glava__imena {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.glava__ime {
	font-family: var(--pisava-naslovi);
	font-size: 20px;
	font-weight: 700;
	color: var(--barva-glava-besedilo);
	text-transform: uppercase;
	letter-spacing: 0.01em;
}

.glava__ime:hover,
.glava__ime:focus {
	color: var(--barva-glava-besedilo);
	text-decoration: none;
}

.glava__podnaslov {
	font-size: 12px;
	font-weight: 600;
	letter-spacing: 0.16em;
	text-transform: uppercase;
	color: var(--barva-glava-tiha);
}

.glava__gumbi {
	display: flex;
	align-items: center;
	gap: 4px;
}

.glava__preklop,
.glava__iskanje-preklop {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 44px;
	height: 44px;
	padding: 0;
	background: transparent;
	border: 0;
	border-radius: 4px;
	color: var(--barva-glava-besedilo);
	cursor: pointer;
}

.glava__preklop .ikona-zapri,
.glava__preklop[aria-expanded="true"] .ikona-meni {
	display: none;
}

.glava__preklop[aria-expanded="true"] .ikona-zapri {
	display: block;
}

.glava__opomba {
	margin: 0;
	padding: 8px 12px;
	font-size: 14px;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 4px;
}

.glava__opomba a {
	color: var(--barva-glava-besedilo);
}

/* Meni (skupno) */
.meni,
.meni ul {
	list-style: none;
	margin: 0;
	padding: 0;
}

.meni a {
	display: block;
	font-size: 15px;
	font-weight: 600;
	color: var(--barva-glava-tiha);
}

.meni a:hover,
.meni a:focus,
.meni .current-menu-item > a,
.meni .current-menu-ancestor > a {
	color: var(--barva-glava-besedilo);
	text-decoration: none;
}

.podmeni__preklop {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 44px;
	height: 44px;
	padding: 0;
	background: transparent;
	border: 0;
	color: var(--barva-glava-tiha);
	cursor: pointer;
}

.podmeni__preklop svg {
	transition: transform 0.2s;
}

.podmeni__preklop[aria-expanded="true"] svg {
	transform: rotate(180deg);
}

/* Iskanje v glavi */
.glava__iskanje {
	border-top: 1px solid rgba(255, 255, 255, 0.12);
	padding: 12px 0;
}

.iskanje {
	display: flex;
	gap: 8px;
}

.iskanje__polje {
	flex: 1;
	min-height: 48px;
	padding: 8px 14px;
	background: var(--barva-povrsina);
	color: var(--barva-besedilo);
	border: 1px solid var(--barva-crta);
	border-radius: 4px;
}

.iskanje__gumb {
	min-height: 48px;
	padding: 8px 20px;
	background: var(--barva-poudarek);
	color: #ffffff;
	font-family: var(--pisava-naslovi);
	font-weight: 700;
	border: 0;
	border-radius: 4px;
	cursor: pointer;
}

/* Namizje ≥ 900 px */
@media (min-width: 900px) {
	.glava__preklop {
		display: none;
	}

	.glava__vrstica {
		flex-wrap: nowrap;
	}

	.glava__meni {
		order: 2;
		flex: 1;
		display: flex;
		justify-content: flex-end;
	}

	.glava__gumbi {
		order: 3;
	}

	.meni {
		display: flex;
		align-items: center;
		gap: 32px;
	}

	.meni > li {
		position: relative;
		display: flex;
		align-items: center;
	}

	.meni > li > a {
		padding: 8px 0;
		border-bottom: 2px solid transparent;
	}

	.meni > .current-menu-item > a,
	.meni > .current-menu-ancestor > a {
		border-bottom-color: var(--barva-poudarek);
	}

	.meni .sub-menu {
		position: absolute;
		top: 100%;
		left: -16px;
		min-width: 240px;
		padding: 8px 0;
		background: var(--barva-glava);
		border-radius: 0 0 6px 6px;
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
		opacity: 0;
		visibility: hidden;
		transform: translateY(6px);
		transition: opacity 0.15s, transform 0.15s, visibility 0.15s;
	}

	.meni li:hover > .sub-menu,
	.meni li:focus-within > .sub-menu,
	.meni li.je-odprt > .sub-menu {
		opacity: 1;
		visibility: visible;
		transform: translateY(0);
	}

	.meni .sub-menu a {
		padding: 10px 16px;
		font-weight: 400;
	}

	.podmeni__preklop {
		width: 28px;
		height: 28px;
		margin-left: -4px;
	}
}

/* Mobilno < 900 px */
@media (max-width: 899px) {
	.glava__vrstica {
		min-height: 64px;
	}

	.glava__znamka .custom-logo {
		width: 40px;
		height: 40px;
	}

	.glava__ime {
		font-size: 15px;
	}

	.glava__podnaslov {
		font-size: 10px;
	}

	.glava__meni {
		display: none;
		order: 10;
		width: 100%;
		padding: 8px 0 16px;
		border-top: 1px solid rgba(255, 255, 255, 0.12);
	}

	.glava__meni.je-odprt,
	.brez-js .glava__meni {
		display: block;
	}

	.meni > li {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
	}

	.meni > li > a {
		flex: 1;
		padding: 12px 0;
		font-size: 17px;
	}

	.meni .sub-menu {
		display: none;
		width: 100%;
		padding-left: 16px;
		border-left: 2px solid rgba(255, 255, 255, 0.15);
	}

	.meni li.je-odprt > .sub-menu,
	.brez-js .meni .sub-menu {
		display: block;
	}

	.meni .sub-menu a {
		padding: 10px 0;
		font-weight: 400;
	}
}

/* ==========================================================================
   5. Trak z grebenom
   ========================================================================== */
.trak {
	position: relative;
	background: var(--barva-glava);
	color: var(--barva-glava-besedilo);
	padding: 28px 0 90px;
}

.trak--velik {
	padding-top: 36px;
	padding-bottom: 110px;
}

.trak__vsebina {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.trak__naslov {
	margin: 0;
	font-size: 34px;
	line-height: 1.1;
	letter-spacing: -0.02em;
	color: var(--barva-glava-besedilo);
}

.trak--velik .trak__naslov {
	font-size: 46px;
	line-height: 1.05;
}

.trak__podnaslov {
	margin: 0;
	max-width: 640px;
	font-size: 18px;
	line-height: 1.5;
	color: var(--barva-glava-tiha);
}

.trak__meta {
	display: flex;
	align-items: center;
	gap: 12px;
}

.trak__meta .znacka {
	background: var(--barva-poudarek);
}

.trak__meta .datum {
	color: var(--barva-glava-tiha);
}

.trak__greben {
	position: absolute;
	left: 0;
	bottom: -1px;
	width: 100%;
	height: 90px;
	display: block;
	color: var(--barva-ozadje);
}

@media (max-width: 899px) {
	.trak {
		padding: 20px 0 64px;
	}

	.trak--velik {
		padding-bottom: 72px;
	}

	.trak__naslov {
		font-size: 26px;
	}

	.trak--velik .trak__naslov {
		font-size: 32px;
	}

	.trak__podnaslov {
		font-size: 15px;
	}

	.trak__greben {
		height: 50px;
	}
}

/* ==========================================================================
   6. Noga
   ========================================================================== */
.noga {
	margin-top: 64px;
	padding: 44px 0 28px;
	background: var(--barva-noga);
	border-top: 1px solid var(--barva-crta);
	color: var(--barva-besedilo-2);
	font-size: 15px;
}

.noga__stolpci {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 40px;
	margin-bottom: 32px;
}

.noga__stolpec {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.gradnik__naslov,
.noga .wp-block-heading {
	margin: 0 0 8px;
	font-size: 16px;
	color: var(--barva-besedilo);
}

.noga p {
	margin: 0 0 8px;
}

.noga__spodaj {
	display: flex;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 8px 24px;
	padding-top: 16px;
	border-top: 1px solid var(--barva-crta);
	font-size: 13px;
	color: var(--barva-tiha);
}

@media (max-width: 899px) {
	.noga {
		margin-top: 40px;
		padding: 28px 0 24px;
	}

	.noga__stolpci {
		grid-template-columns: minmax(0, 1fr);
		gap: 24px;
	}

	.noga .wp-block-button__link {
		width: 100%;
	}
}
```

- [ ] **Step 4: Poženi test**

Run: `bin/test.sh`
Expected: vsi `OK:`.

- [ ] **Step 5: Commit**

```bash
git add s59dgo/style.css tests/test-css.php
git commit -m "Dodaj sloge: spremenljivke, temni način, osnova, glava, meni, trak, noga"
```

---

### Task 12: Slogi II – mreža, kartica, paginacija, objava/stran, bloki, komentarji, 404

**Files:**
- Modify: `s59dgo/style.css` (dodaj na konec), `tests/test-css.php` (razširi)

**Interfaces:**
- Consumes: razredi iz Nalog 8–10.

- [ ] **Step 1: Razširi `tests/test-css.php`** – dodaj na konec datoteke

```php
foreach ( array(
	'.mreza {', 'grid-template-columns: repeat(3, minmax(0, 1fr));', '.kartica {', '.kartica__naslov', '.kartica__nadomestna',
	'.pagination', '.besedilo > *', '.besedilo > .alignwide', '.besedilo > .alignfull', '.objava__slika', '.post-navigation', '.komentarji {', '.vsebina--404', '.prazno {',
	'@media (max-width: 1099px)', '@media (max-width: 639px)',
) as $iskano ) {
	preveri( false !== strpos( $css, $iskano ), "style.css vsebuje {$iskano}" );
}
```

- [ ] **Step 2: Poženi test, pričakuj neuspeh**

Run: `bin/test.sh`
Expected: `NEUSPEH: style.css vsebuje .mreza {`.

- [ ] **Step 3: Dodaj sloge na konec `s59dgo/style.css`**

```css

/* ==========================================================================
   7. Vsebina, mreža objav, kartica, paginacija
   ========================================================================== */
.vsebina {
	padding: 40px 0 0;
}

.mreza {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 40px 32px;
}

.kartica {
	display: flex;
	flex-direction: column;
	gap: 14px;
}

.kartica__slika {
	display: block;
	line-height: 0;
	border-radius: 6px;
	overflow: hidden;
	background: var(--barva-povrsina);
}

.kartica__slika img {
	width: 100%;
	aspect-ratio: 800 / 520;
	object-fit: cover;
	transition: transform 0.25s;
}

.kartica:hover .kartica__slika img {
	transform: scale(1.03);
}

.kartica__nadomestna {
	opacity: 0.9;
}

.kartica__meta {
	display: flex;
	align-items: center;
	gap: 12px;
}

.kartica__naslov {
	margin: 0;
	font-size: 22px;
	line-height: 1.25;
}

.kartica__naslov a {
	color: var(--barva-besedilo);
}

.kartica__naslov a:hover,
.kartica__naslov a:focus {
	color: var(--barva-poudarek);
	text-decoration: none;
}

.kartica__izvlecek {
	font-size: 15px;
	line-height: 1.55;
	color: var(--barva-besedilo-2);
}

.kartica__izvlecek p {
	margin: 0;
}

.pagination {
	margin-top: 48px;
	text-align: center;
}

.pagination .nav-links {
	display: inline-flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 6px;
}

.pagination .page-numbers {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 44px;
	min-height: 44px;
	padding: 8px 14px;
	background: var(--barva-povrsina);
	color: var(--barva-besedilo);
	border: 1px solid var(--barva-crta);
	border-radius: 4px;
	font-weight: 600;
}

.pagination .page-numbers.current {
	background: var(--barva-glava);
	color: var(--barva-glava-besedilo);
	border-color: var(--barva-glava);
}

.pagination a.page-numbers:hover,
.pagination a.page-numbers:focus {
	border-color: var(--barva-poudarek);
	color: var(--barva-poudarek);
	text-decoration: none;
}

.prazno {
	display: flex;
	flex-direction: column;
	gap: 20px;
	max-width: 560px;
	margin: 0 auto;
	padding: 40px 0;
	text-align: center;
}

.prazno .iskanje {
	text-align: left;
}

/* ==========================================================================
   8. Objava in stran (vsebina blokov)
   ========================================================================== */
.objava__slika {
	margin: 0 auto 36px;
	line-height: 0;
}

.objava__slika img {
	width: 100%;
	border-radius: 8px;
}

.besedilo > * {
	max-width: var(--sirina-besedilo);
	margin-left: auto;
	margin-right: auto;
	padding-left: var(--rob);
	padding-right: var(--rob);
}

.besedilo > .alignwide {
	max-width: calc(var(--sirina-siroko) + 2 * var(--rob));
}

.besedilo > .alignfull {
	max-width: none;
	padding-left: 0;
	padding-right: 0;
}

.besedilo h2 {
	font-size: 28px;
	margin-top: 1.6em;
}

.besedilo h3 {
	font-size: 22px;
	margin-top: 1.4em;
}

.besedilo img {
	border-radius: 6px;
}

.besedilo figure {
	margin: 1.5em auto;
}

.besedilo figcaption {
	font-size: 14px;
	color: var(--barva-tiha);
	text-align: center;
}

.besedilo blockquote {
	margin: 1.5em auto;
	padding-left: 20px;
	border-left: 3px solid var(--barva-poudarek);
	color: var(--barva-besedilo-2);
}

.besedilo pre,
.besedilo code {
	font-size: 15px;
}

.besedilo pre {
	padding: 16px;
	background: var(--barva-povrsina);
	border: 1px solid var(--barva-crta);
	border-radius: 6px;
	overflow-x: auto;
}

.besedilo table {
	width: 100%;
	border-collapse: collapse;
	font-size: 15px;
}

.besedilo th,
.besedilo td {
	padding: 8px 10px;
	border-bottom: 1px solid var(--barva-crta);
	text-align: left;
}

.besedilo .wp-block-gallery {
	margin-left: auto;
	margin-right: auto;
}

.objava__strani {
	margin: 1.5em auto 0;
}

.objava__noga {
	margin-top: 48px;
	display: flex;
	flex-direction: column;
	gap: 24px;
}

.objava__oznake {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	font-size: 14px;
}

.objava__oznake a {
	padding: 4px 10px;
	border: 1px solid var(--barva-crta);
	border-radius: 999px;
	color: var(--barva-besedilo-2);
}

.post-navigation .nav-links {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16px;
	padding-top: 24px;
	border-top: 1px solid var(--barva-crta);
}

.post-navigation .nav-next {
	text-align: right;
}

.post-navigation a {
	display: flex;
	flex-direction: column;
	gap: 4px;
	color: var(--barva-besedilo);
}

.post-navigation .nav-oznaka {
	font-size: 12px;
	font-weight: 600;
	letter-spacing: 0.1em;
	text-transform: uppercase;
	color: var(--barva-tiha);
}

.post-navigation .nav-naslov {
	font-family: var(--pisava-naslovi);
	font-weight: 700;
}

/* ==========================================================================
   9. Komentarji
   ========================================================================== */
.komentarji {
	margin-top: 48px;
	padding-top: 32px;
	border-top: 1px solid var(--barva-crta);
}

.komentarji__seznam,
.komentarji__seznam .children {
	list-style: none;
	margin: 0;
	padding: 0;
}

.komentarji__seznam .children {
	padding-left: 32px;
}

.komentarji__seznam .comment-body {
	padding: 16px 0;
	border-bottom: 1px solid var(--barva-crta);
}

.komentarji__seznam .avatar {
	border-radius: 50%;
	margin-right: 10px;
	vertical-align: middle;
}

.comment-form label {
	display: block;
	font-weight: 600;
	margin-bottom: 4px;
}

.comment-form input[type="text"],
.comment-form input[type="email"],
.comment-form input[type="url"],
.comment-form textarea {
	width: 100%;
	padding: 10px 12px;
	background: var(--barva-povrsina);
	border: 1px solid var(--barva-crta);
	border-radius: 4px;
}

.comment-form .submit {
	display: inline-flex;
	align-items: center;
	min-height: 48px;
	padding: 12px 24px;
	background: var(--barva-poudarek);
	color: #ffffff;
	font-family: var(--pisava-naslovi);
	font-weight: 700;
	border: 0;
	border-radius: 4px;
	cursor: pointer;
}

/* ==========================================================================
   10. 404
   ========================================================================== */
.vsebina--404 .prazno {
	padding: 24px 0;
}

/* ==========================================================================
   11. Odzivnost mreže
   ========================================================================== */
@media (max-width: 1099px) {
	.mreza {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}

@media (max-width: 639px) {
	.mreza {
		grid-template-columns: minmax(0, 1fr);
		gap: 28px;
	}

	.vsebina {
		padding-top: 24px;
	}

	.kartica__naslov {
		font-size: 20px;
	}

	.post-navigation .nav-links {
		grid-template-columns: minmax(0, 1fr);
	}

	.post-navigation .nav-next {
		text-align: left;
	}

	.komentarji__seznam .children {
		padding-left: 16px;
	}
}
```

- [ ] **Step 4: Poženi test**

Run: `bin/test.sh`
Expected: vsi `OK:`.

- [ ] **Step 5: Commit**

```bash
git add s59dgo/style.css tests/test-css.php
git commit -m "Dodaj sloge: mreža, kartica, paginacija, objava, bloki, komentarji, 404"
```

---

### Task 13: Screenshot, jezikovna mapa, readme in končni paket

**Files:**
- Create: `bin/screenshot.svg`, `s59dgo/screenshot.png` (1200×900), `s59dgo/languages/.gitkeep`, `s59dgo/readme.txt`
- Modify: `CLAUDE.md` (dodaj `bin/test.sh` med ukaze), `tests/test-ogrodje.php` (preveri screenshot in readme)

- [ ] **Step 1: Razširi `tests/test-ogrodje.php`** – dodaj na konec

```php
preveri( file_exists( __DIR__ . '/../s59dgo/screenshot.png' ), 'screenshot.png obstaja' );
$png = getimagesize( __DIR__ . '/../s59dgo/screenshot.png' );
preveri( 1200 === $png[0] && 900 === $png[1], 'screenshot.png je 1200x900' );
preveri( file_exists( __DIR__ . '/../s59dgo/readme.txt' ), 'readme.txt obstaja' );
preveri( is_dir( __DIR__ . '/../s59dgo/languages' ), 'mapa languages obstaja' );
```

- [ ] **Step 2: Poženi test, pričakuj neuspeh**

Run: `bin/test.sh`
Expected: `NEUSPEH: screenshot.png obstaja`.

- [ ] **Step 3: Napiši `bin/screenshot.svg` in ga pretvori v PNG**

`bin/screenshot.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="1200" height="900">
  <rect width="1200" height="900" fill="#eef3f8"/>
  <rect width="1200" height="330" fill="#15304f"/>
  <circle cx="86" cy="60" r="28" fill="#2a5687" stroke="#ffffff" stroke-opacity="0.2" stroke-width="4"/>
  <circle cx="86" cy="60" r="10" fill="#d9702a"/>
  <text x="130" y="56" font-family="Space Grotesk, Trebuchet MS, Arial, sans-serif" font-size="22" font-weight="700" fill="#ffffff">RADIO KLUB SNEŽNIK</text>
  <text x="130" y="78" font-family="IBM Plex Sans, Helvetica Neue, Arial, sans-serif" font-size="12" font-weight="600" letter-spacing="2" fill="#9fc0e0">ILIRSKA BISTRICA · S59DGO · EST. 1964</text>
  <text x="60" y="200" font-family="Space Grotesk, Trebuchet MS, Arial, sans-serif" font-size="56" font-weight="700" fill="#ffffff">Novice s Snežnika</text>
  <text x="60" y="240" font-family="IBM Plex Sans, Helvetica Neue, Arial, sans-serif" font-size="20" fill="#b9d0e6">Dogodki, tekmovanja in obvestila Radio kluba Snežnik Ilirska Bistrica.</text>
  <path d="M0 330 L0 300 L100 288 L190 298 L280 272 L350 284 L440 262 L510 280 L590 250 L670 274 L740 262 L830 286 L910 268 L990 288 L1080 276 L1160 292 L1200 282 L1200 330 Z" fill="#eef3f8"/>
  <g fill="#ffffff">
    <rect x="60" y="380" width="340" height="220" rx="6"/>
    <rect x="430" y="380" width="340" height="220" rx="6"/>
    <rect x="800" y="380" width="340" height="220" rx="6"/>
  </g>
  <g fill="#2a5687">
    <path d="M60 560 L150 500 L240 540 L330 470 L400 520 L400 600 L60 600 Z"/>
    <path d="M430 560 L520 500 L610 540 L700 470 L770 520 L770 600 L430 600 Z"/>
    <path d="M800 560 L890 500 L980 540 L1070 470 L1140 520 L1140 600 L800 600 Z"/>
  </g>
  <g>
    <rect x="60" y="624" width="84" height="22" rx="3" fill="#15304f"/>
    <rect x="430" y="624" width="84" height="22" rx="3" fill="#15304f"/>
    <rect x="800" y="624" width="84" height="22" rx="3" fill="#15304f"/>
  </g>
  <g fill="#15304f">
    <rect x="60" y="666" width="300" height="18" rx="3"/>
    <rect x="60" y="692" width="220" height="18" rx="3"/>
    <rect x="430" y="666" width="300" height="18" rx="3"/>
    <rect x="430" y="692" width="200" height="18" rx="3"/>
    <rect x="800" y="666" width="300" height="18" rx="3"/>
    <rect x="800" y="692" width="240" height="18" rx="3"/>
  </g>
  <g fill="#c9d6e3">
    <rect x="60" y="730" width="340" height="12" rx="3"/>
    <rect x="60" y="750" width="280" height="12" rx="3"/>
    <rect x="430" y="730" width="340" height="12" rx="3"/>
    <rect x="430" y="750" width="300" height="12" rx="3"/>
    <rect x="800" y="730" width="340" height="12" rx="3"/>
    <rect x="800" y="750" width="260" height="12" rx="3"/>
  </g>
  <rect x="520" y="820" width="160" height="44" rx="4" fill="#15304f"/>
  <text x="600" y="848" text-anchor="middle" font-family="Space Grotesk, Trebuchet MS, Arial, sans-serif" font-size="15" font-weight="700" fill="#ffffff">Starejše objave</text>
</svg>
```

Pretvorba v PNG: `bin/screenshot.sh` (rsvg-convert v Dockerju, brez odvisnosti od macOS orodij).
```bash
bin/screenshot.sh
```
Expected: `pixelWidth: 1200`, `pixelHeight: 900`.

- [ ] **Step 4: Ustvari `s59dgo/languages/.gitkeep` in `s59dgo/readme.txt`**

```bash
mkdir -p s59dgo/languages && touch s59dgo/languages/.gitkeep
```

`s59dgo/readme.txt`:
```
=== S59DGO ===
Contributors: s56oa
Requires at least: 6.4
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Klasična tema za spletno stran Radio kluba Snežnik Ilirska Bistrica – S59DGO.

== Namestitev ==

1. Videz → Teme → Dodaj novo → Naloži temo → dist/s59dgo.zip.
2. Pred aktivacijo: Videz → Meniji → dodeli meni lokaciji »Glavni meni«.
3. Videz → Prilagodi → Identiteta spletišča → logotip (okrogel, vsaj 200×200).
4. Videz → Gradniki → napolni »Noga – Kontakt«, »Noga – Uradne ure«, »Noga – Podpora« (gumb Doniraj kot blok Gumb).
5. Nastavitve → Branje → »Prikaži največ 9 objav«.
6. »Predogled v živo« pred aktivacijo.

== Pisave ==

Space Grotesk (SIL OFL 1.1) in IBM Plex Sans (SIL OFL 1.1), datoteke v assets/fonts/, licenci ob njih.

== Changelog ==

= 1.0.0 =
* Prva izdaja.
```

- [ ] **Step 5: Posodobi `CLAUDE.md`** – v razdelku »Ukazi« zamenjaj blok ukazov z

```bash
bin/lint.sh          # php -l za vse s59dgo/**/*.php v sliki php:8.3-cli
bin/test.sh          # statični in enotski testi v tests/ (stubi WP funkcij v tests/stubs.php)
bin/build-zip.sh     # lint + dist/s59dgo.zip za nalaganje v WP administracijo
```
in za njim dodaj odstavek: »Nov test: `tests/test-<ime>.php`, ki vključi `tests/preveri.php` (in `tests/stubs.php` za funkcije iz `inc/`). Screenshot se generira iz `bin/screenshot.svg` z `qlmanage` + `sips` (glej načrt, Naloga 13).«

- [ ] **Step 6: Poženi vse in zgradi paket**

Run: `node --check s59dgo/assets/js/navigation.js && bin/test.sh && bin/build-zip.sh && unzip -l dist/s59dgo.zip | tail -3`
Expected: vsi `OK:`, `PHP sintaksa v redu`, `Ustvarjeno dist/s59dgo.zip`, seznam brez `.DS_Store`.

- [ ] **Step 7: Commit**

```bash
git add bin/screenshot.svg s59dgo/screenshot.png s59dgo/languages/.gitkeep s59dgo/readme.txt CLAUDE.md tests/test-ogrodje.php
git commit -m "Dodaj screenshot, readme, jezikovno mapo in posodobi CLAUDE.md"
```

- [ ] **Step 8: Ročni pregled na strežniku (naročnik)** – kontrolni seznam, ki ga prilepiš v končno poročilo

1. Naloži `dist/s59dgo.zip` (Videz → Teme → Dodaj novo → Naloži temo), NE aktiviraj.
2. Videz → Meniji: obstoječi meni dodeli lokaciji »Glavni meni«.
3. »Predogled v živo«: domača stran (mreža 3 stolpci, trak »Novice s Snežnika« z grebenom), objava (naslov v traku, kategorija in datum, naslovna slika, navigacija), O društvu (galerija, široke slike), Spletna kamera Snežnik (slika čez celo širino), kategorija Dogodki (naslov brez predpone »Kategorija:«), iskanje, 404, mobilna širina (hamburger, podmeniji), temni način (sistemska nastavitev).
4. Vtičnik Theme Check: brez REQUIRED napak.
5. Gradniki noge, logotip, Nastavitve → Branje 9 objav; nato aktiviraj.

---

## Samopregled načrta

**Pokritost speca:** §3 odločitve → Naloge 1–5 (klasična, brez build, pisave lokalno, theme.json settings); §5.1 glava → 7 + 11; §5.2 trak → 6, 8, 11; §5.3 mreža in paginacija → 8, 12; §5.4 kartica in nadomestna slika → 6, 7, 8, 12; §5.5 objava/stran → 9, 12; §5.6 noga → 2, 10, 11; §5.7 barve/tipografija → 4, 5, 11; §5.8 setup → 2; §5.9 enqueue → 3; §5.10 JS → 3; §7 robni primeri (brez logotipa → ime v glavi: 7; brez menija → opomba adminu: 7; brez slike → greben: 6; brez gradnikov → samo spodnja vrstica: 10; uncategorized skrit: 6; brez JS → `brez-js`: 7 + 11); §8 preizkušanje → 1, 13. Nastavitev »9 objav na stran« je WP nastavitev (readme, Naloga 13).

**Imena, ki se ponavljajo med nalogami** (preverjeno): `s59dgo_trak_podatki`, `s59dgo_kategorija`, `s59dgo_datum`, `s59dgo_slika_kartice`, `s59dgo_nastavitve`, `s59dgo_gradniki`, `s59dgo_sredstva`, `s59dgo_dolzina_izvlecka`; razredi `glava__preklop`, `glava__meni`, `glava__iskanje-preklop`, `glava__iskanje`, `podmeni__preklop`, `je-odprt`, `brez-js`, `trak`, `trak--velik`, `trak__greben`, `kartica*`, `mreza`, `besedilo`, `ovoj--siroko`, `ovoj--besedilo`, `noga__stolpci`, `prazno`, `znacka`, `datum`; lokacija menija `glavni`; območja `noga-1..3`; velikost slike `s59dgo-kartica`.
