<?php
require __DIR__ . '/preveri.php';
$koren = __DIR__ . '/../';
$cesta = $koren . 'lokalno/docker-compose.yml';
preveri( file_exists( $cesta ), 'lokalno/docker-compose.yml obstaja' );
$compose = file_get_contents( $cesta );
foreach ( array( 'internal: true', '127.0.0.1:8080:80', '../s59dgo:/var/www/html/wp-content/themes/s59dgo:ro', 'mariadb:10.11', 'wordpress:php8.5-apache', 'wordpress:cli-php8.5', '../prod_backups:/backup:ro' ) as $iskano ) {
	preveri( false !== strpos( $compose, $iskano ), "docker-compose.yml vsebuje {$iskano}" );
}
// Omrežje »zunanje« sme biti le v storitvi prenos (in v definiciji omrežij).
$deli      = explode( "\nnetworks:", $compose );
$storitve  = $deli[0];
$brez      = preg_replace( '/^  prenos:\n(?:    .*\n|\n)*/m', '', $storitve );
preveri( false !== strpos( $storitve, 'zunanje' ), 'storitev prenos uporablja omrežje zunanje' );
preveri( false === strpos( $brez, 'zunanje' ), 'omrežje zunanje je samo v storitvi prenos' );
preg_match_all( '/^\s*image:\s*(\S+)/m', $compose, $slike );
foreach ( $slike[1] as $slika ) {
	if ( 0 === strpos( $slika, 'ghcr.io/validator/validator' ) ) {
		continue;
	}
	preveri( ':latest' !== substr( $slika, -7 ), "slika {$slika} ni :latest" );
}
$ignore = file_get_contents( $koren . '.gitignore' );
preveri( 1 === preg_match( '/^prod_backups\/$/m', $ignore ), '.gitignore ignorira prod_backups/' );
