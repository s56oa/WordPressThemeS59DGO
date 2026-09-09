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
