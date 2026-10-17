<?php
require __DIR__ . '/preveri.php';
require __DIR__ . '/stubs.php';
require __DIR__ . '/../s59dgo/inc/druzbena.php';

$koda = file_get_contents( __DIR__ . '/../s59dgo/inc/druzbena.php' );
preveri( false !== strpos( $koda, "add_action( 'wp_head', 's59dgo_druzbena_oznake', 5 )" ), 'druzbena.php se priklopi na wp_head' );
preveri( false === strpos( $koda, '?>' ), 'druzbena.php nima zaključne oznake' );
$functions = file_get_contents( __DIR__ . '/../s59dgo/functions.php' );
preveri( false !== strpos( $functions, "'druzbena'" ), 'functions.php nalaga druzbena.php' );
$setup = file_get_contents( __DIR__ . '/../s59dgo/inc/setup.php' );
preveri( false !== strpos( $setup, "add_image_size( 's59dgo-deljenje', 1200, 630, true )" ), 'setup.php doda velikost s59dgo-deljenje 1200×630' );

$izrez  = array( 'https://example.test/slika-1200x630.jpg', 1200, 630, true );
$velika = array( 'https://example.test/slika-1024x683.jpg', 1024, 683, true );
$cela   = array( 'https://example.test/slika.jpg', 640, 427, false );

// Objava z naslovno sliko, ki ima izrez za deljenje.
s59dgo_test_ponastavi(
	array(
		'is_singular'   => true,
		'title'         => 'Field day "Sviščaki"',
		'excerpt'       => 'Postavitev anten od 9. ure.',
		'has_thumbnail' => true,
		'slike'         => array( 's59dgo-deljenje' => $izrez, 'large' => $velika ),
		'alt'           => 'Ilustracija: antena nad grebenom',
	)
);
$p = s59dgo_druzbena_podatki();
preveri( 'article' === $p['og:type'], 'objava: og:type article' );
preveri( 'Field day "Sviščaki"' === $p['og:title'], 'objava: og:title je naslov objave' );
preveri( 'https://example.test/objava/' === $p['og:url'], 'objava: og:url je povezava objave' );
preveri( 'Postavitev anten od 9. ure.' === $p['og:description'], 'objava: og:description iz izvlečka' );
preveri( $izrez[0] === $p['og:image'] && 1200 === $p['og:image:width'] && 630 === $p['og:image:height'], 'objava: og:image je izrez 1200×630' );
preveri( 'Ilustracija: antena nad grebenom' === $p['og:image:alt'], 'objava: og:image:alt iz besedila alt' );
preveri( 'sl_SI' === $p['og:locale'] && 'Radio klub Snežnik' === $p['og:site_name'], 'objava: jezik in ime strani' );
preveri( 'summary_large_image' === $p['twitter:card'], 'objava: twitter:card s sliko' );

// Izreza za deljenje ni (stara slika) → velikost large.
s59dgo_test_ponastavi( array( 'is_singular' => true, 'title' => 'T', 'has_thumbnail' => true, 'slike' => array( 's59dgo-deljenje' => $cela, 'large' => $velika ) ) );
$p = s59dgo_druzbena_podatki();
preveri( $velika[0] === $p['og:image'], 'brez izreza: og:image je large' );
preveri( ! isset( $p['og:image:alt'] ), 'brez besedila alt: ni og:image:alt' );

// Objava brez naslovne slike, z logotipom strani.
s59dgo_test_ponastavi( array( 'is_singular' => true, 'title' => 'T', 'theme_mods' => array( 'custom_logo' => 7 ), 'slike' => array( 'full' => array( 'https://example.test/logo.png', 200, 200, false ) ) ) );
$p = s59dgo_druzbena_podatki();
preveri( 'https://example.test/logo.png' === $p['og:image'], 'brez naslovne slike: logotip strani' );
preveri( 'summary_large_image' === $p['twitter:card'], 'logotip: twitter:card s sliko' );

// Brez naslovne slike in brez logotipa.
s59dgo_test_ponastavi( array( 'is_singular' => true, 'title' => 'T' ) );
$p = s59dgo_druzbena_podatki();
preveri( ! isset( $p['og:image'] ) && 'summary' === $p['twitter:card'], 'brez slike: ni og:image, twitter:card summary' );
preveri( 'Ilirska Bistrica · S59DGO' === $p['og:description'], 'brez izvlečka: opis strani' );

// Domača stran.
s59dgo_test_ponastavi( array( 'is_home' => true ) );
$p = s59dgo_druzbena_podatki();
preveri( 'website' === $p['og:type'] && 'Radio klub Snežnik' === $p['og:title'], 'doma: website z imenom strani' );
preveri( 'https://example.test/' === $p['og:url'], 'doma: og:url je domača stran' );

// Arhiv, iskanje, 404: brez oznak.
foreach ( array( 'is_archive', 'is_search', 'is_404' ) as $kontekst ) {
	s59dgo_test_ponastavi( array( $kontekst => true ) );
	preveri( array() === s59dgo_druzbena_podatki(), "{$kontekst}: brez oznak" );
}

// Izpis: varno escapan, twitter z name=, og s property=.
s59dgo_test_ponastavi( array( 'is_singular' => true, 'title' => 'A "B" & <i>C</i>', 'has_thumbnail' => true, 'slike' => array( 's59dgo-deljenje' => $izrez ) ) );
ob_start();
s59dgo_druzbena_oznake();
$izpis = ob_get_clean();
preveri( false !== strpos( $izpis, '<meta property="og:title" content="A &quot;B&quot; &amp; C">' ), 'izpis: og:title escapan' );
preveri( false !== strpos( $izpis, '<meta name="twitter:card" content="summary_large_image">' ), 'izpis: twitter z name=' );
preveri( false === strpos( $izpis, '<i>' ), 'izpis: brez HTML oznak v naslovu' );

// Vtičnik za SEO (Yoast) že izpisuje oznake → tema se umakne.
define( 'WPSEO_VERSION', '23.0' );
ob_start();
s59dgo_druzbena_oznake();
preveri( '' === ob_get_clean(), 'z Yoast SEO: tema ne izpiše oznak' );
