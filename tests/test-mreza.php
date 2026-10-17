<?php
require __DIR__ . '/preveri.php';
$koren = __DIR__ . '/../s59dgo/';
$trak  = file_get_contents( $koren . 'template-parts/trak.php' );
foreach ( array( 's59dgo_trak_podatki()', 'class="trak', "trak--velik", 'class="trak__naslov"', 'class="trak__podnaslov"', 'class="trak__meta"', 'class="trak__greben"', 'viewBox="0 0 1440 90"' ) as $iskano ) {
	preveri( false !== strpos( $trak, $iskano ), "trak.php vsebuje {$iskano}" );
}
preveri( substr_count( $trak, '<div' ) === substr_count( $trak, '</div>' ), 'trak.php: vsak <div> je zaprt' );
preveri( false !== strpos( $trak, "s59dgo_dovoljen_html_meta() ); ?></div>" ), 'trak.php: trak__meta je zaprt znotraj pogoja' );
$kartica = file_get_contents( $koren . 'template-parts/kartica.php' );
foreach ( array( "post_class( 'kartica' )", 's59dgo_slika_kartice()', 's59dgo_kategorija()', 's59dgo_datum()', 'class="kartica__naslov"', 'the_excerpt()' ) as $iskano ) {
	preveri( false !== strpos( $kartica, $iskano ), "kartica.php vsebuje {$iskano}" );
}
$mreza = file_get_contents( $koren . 'template-parts/mreza.php' );
foreach ( array( '<main id="vsebina" class="vsebina">', 'class="mreza"', "get_template_part( 'template-parts/kartica' )", 'the_posts_pagination(', "'Novejše objave'", "'Starejše objave'", 'class="prazno"', 'get_search_form()' ) as $iskano ) {
	preveri( false !== strpos( $mreza, $iskano ), "mreza.php vsebuje {$iskano}" );
}
foreach ( array( 'home.php', 'index.php', 'archive.php', 'search.php' ) as $predloga ) {
	$koda = file_get_contents( $koren . $predloga );
	preveri( false !== strpos( $koda, 'get_header();' ) && false !== strpos( $koda, "get_template_part( 'template-parts/mreza' );" ) && false !== strpos( $koda, 'get_footer();' ), "{$predloga} uporablja mrežo" );
}
preveri( ! file_exists( $koren . 'front-page.php' ), 'ni front-page.php' );
