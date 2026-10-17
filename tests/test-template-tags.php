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

// Domača stran z nastavitvama iz Customizerja.
s59dgo_test_ponastavi( array( 'is_home' => true, 'theme_mods' => array( 's59dgo_naslov_doma' => 'Aktualno', 's59dgo_podnaslov_doma' => 'Iz kluba' ) ) );
$t = s59dgo_trak_podatki();
preveri( 'Aktualno' === $t['naslov'], 'doma: naslov iz Customizerja' );
preveri( 'Iz kluba' === $t['podnaslov'], 'doma: podnaslov iz Customizerja' );

// Prazni nastavitvi (samo presledki) → privzeti vrednosti.
s59dgo_test_ponastavi( array( 'is_home' => true, 'theme_mods' => array( 's59dgo_naslov_doma' => '   ', 's59dgo_podnaslov_doma' => '' ) ) );
$t = s59dgo_trak_podatki();
preveri( 'Novice s Snežnika' === $t['naslov'], 'doma: prazen naslov → privzeti' );
preveri( 'Ilirska Bistrica · S59DGO' === $t['podnaslov'], 'doma: prazen podnaslov → slogan' );

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

// Objava brez naslova → rezervni naslov, ne prazen <h1>.
s59dgo_test_ponastavi( array( 'is_singular' => true, 'title' => '  ' ) );
$t = s59dgo_trak_podatki();
preveri( '(brez naslova)' === $t['naslov'], 'brez naslova: rezervni naslov' );

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
