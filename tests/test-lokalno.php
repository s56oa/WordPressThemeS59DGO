<?php
require __DIR__ . '/preveri.php';
$koren = __DIR__ . '/../';
$cesta = $koren . 'lokalno/docker-compose.yml';
preveri( file_exists( $cesta ), 'lokalno/docker-compose.yml obstaja' );
$compose = file_get_contents( $cesta );
foreach ( array( 'internal: true', '127.0.0.1:8059:80', '../s59dgo:/var/www/html/wp-content/themes/s59dgo:ro', 'mariadb:10.11', 'wordpress:php8.5-apache', 'wordpress:cli-php8.5', '../prod_backups:/backup:ro' ) as $iskano ) {
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

// Obnova iz backupa (lokalno/obnovi.sh) in vgradnje v Compose.
foreach ( array( './mu-plugins/s59dgo-lokalno.php:/var/www/html/wp-content/mu-plugins/s59dgo-lokalno.php:ro', './wp:/lokalno-wp:ro', './obnovi.sh:/lokalno/obnovi.sh:ro' ) as $iskano ) {
	preveri( false !== strpos( $compose, $iskano ), "docker-compose.yml vsebuje {$iskano}" );
}
preveri( 2 === substr_count( $compose, './mu-plugins/s59dgo-lokalno.php:' ), 'mu-plugin je vgrajen v wp in cli' );
$cesta = $koren . 'lokalno/obnovi.sh';
preveri( file_exists( $cesta ), 'lokalno/obnovi.sh obstaja' );
$obnovi = file_get_contents( $cesta );
$zamenjave = array();
foreach ( array( 's59dgo.si', 's59dgo.org' ) as $domena ) {
	foreach ( array( "www.{$domena}", $domena ) as $gostitelj ) {
		$zamenjave[] = "'https://{$gostitelj}' 'http://localhost:8059'";
		$zamenjave[] = "'http://{$gostitelj}' 'http://localhost:8059'";
		$zamenjave[] = "'//{$gostitelj}' '//localhost:8059'";
	}
}
$odmik = 0;
foreach ( $zamenjave as $par ) {
	$najdeno = strpos( $obnovi, $par, $odmik );
	preveri( false !== $najdeno, "obnovi.sh zamenja {$par} v pravem vrstnem redu" );
	$odmik = $najdeno + strlen( $par );
}
preveri( false !== strpos( $obnovi, 'wp search-replace "$od" "$na" --all-tables-with-prefix --precise --quiet' ), 'obnovi.sh uporablja wp search-replace prek vseh tabel s predpono' );
preveri( false !== strpos( $obnovi, 'plugin deactivate two-factor backuply' ), 'obnovi.sh izklopi two-factor in backuply' );
preveri( 1 !== preg_match( '#(cp|mv|tar)[^\n]*themes/s59dgo/#', $obnovi ), 'obnovi.sh ne kopira v themes/s59dgo/' );
foreach ( array( "--exclude='wp-content/themes/s59dgo'", "--exclude='wp-content/backuply'", "--exclude='wp-content/backups_*'" ) as $iskano ) {
	preveri( false !== strpos( $obnovi, $iskano ), "obnovi.sh vsebuje {$iskano}" );
}
preveri( false === strpos( $obnovi, "--exclude='wp-content/plugins/backuply'" ), 'obnovi.sh kopira vtičnik backuply (izklopi ga šele v bazi)' );
foreach ( array( "WP_DEBUG_LOG '/stanje/debug.log'", "WP_ENVIRONMENT_TYPE 'local'", 'WP_HTTP_BLOCK_EXTERNAL true', 'DISABLE_WP_CRON true', 'AUTOMATIC_UPDATER_DISABLED true', 'WP_DEBUG_DISPLAY false', '--dbprefix="$predpona"', 'rewrite flush --hard', 'eval-file /lokalno-wp/stanje-produkcije.php' ) as $iskano ) {
	preveri( false !== strpos( $obnovi, $iskano ), "obnovi.sh vsebuje {$iskano}" );
}
preveri( file_exists( $koren . 'lokalno/wp/stanje-produkcije.php' ), 'lokalno/wp/stanje-produkcije.php obstaja' );
$stanje = (string) @file_get_contents( $koren . 'lokalno/wp/stanje-produkcije.php' );
foreach ( array( "'arhiv'", "'cas_arhiva'", "'jedro'", "'predpona'", "'slike'", "'nastavitve'", "'php_v_uploads'", "'ima_kartica'", "'ima_deljenje'", "'posts_per_page'", "'meni_glavni'", "'logotip'", "'gradniki'", "'tema'" ) as $kljuc ) {
	preveri( false !== strpos( $stanje, $kljuc ), "stanje-produkcije.php izpiše ključ {$kljuc}" );
}
$bin = file_get_contents( $koren . 'bin/lokalno.sh' );
preveri( false === strpos( $bin, 'še ni izveden' ), 'bin/lokalno.sh izvede ukaz obnovi' );
preveri( 1 === preg_match( '/run --rm[^\n]* prenos wp core download[^\n]*--locale=sl_SI/', $bin ), 'bin/lokalno.sh prenese jedro v vsebniku prenos (sl_SI)' );
