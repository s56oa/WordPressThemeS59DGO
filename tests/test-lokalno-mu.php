<?php
require __DIR__ . '/preveri.php';

// Lastni stubi: mu-plugin je zunaj teme in ne uporablja tests/stubs.php.
define( 'ABSPATH', __DIR__ . '/' );
$GLOBALS['s59dgo_test_filtri'] = array();
function add_filter( $ime, $klic, $prednost = 10, $argumenti = 1 ) {
	$GLOBALS['s59dgo_test_filtri'][ $ime ] = array( $klic, $argumenti );
	return true;
}

$vsebina = sys_get_temp_dir() . '/s59dgo-mu-' . getmypid();
define( 'WP_CONTENT_DIR', $vsebina );
$dnevnik = $vsebina . '-dnevnik.log';
ini_set( 'error_log', $dnevnik );
ini_set( 'log_errors', '1' );

$pot = __DIR__ . '/../lokalno/mu-plugins/s59dgo-lokalno.php';
preveri( file_exists( $pot ), 'lokalno/mu-plugins/s59dgo-lokalno.php obstaja' );
require $pot;

$koda = file_get_contents( $pot );
preveri( false === strpos( $koda, '?>' ), 'mu-plugin nima zaključne oznake' );
foreach ( array( 'template', 'stylesheet' ) as $filter ) {
	preveri( isset( $GLOBALS['s59dgo_test_filtri'][ $filter ] ) && 's59dgo_lokalno_primerjalna_tema' === $GLOBALS['s59dgo_test_filtri'][ $filter ][0], "mu-plugin se priklopi na {$filter}" );
}
preveri( isset( $GLOBALS['s59dgo_test_filtri']['pre_wp_mail'] ) && 's59dgo_lokalno_posta' === $GLOBALS['s59dgo_test_filtri']['pre_wp_mail'][0] && 2 === $GLOBALS['s59dgo_test_filtri']['pre_wp_mail'][1], 'mu-plugin se priklopi na pre_wp_mail z dvema argumentoma' );

unset( $_COOKIE['s59dgo_primerjava'] );
preveri( 's59dgo' === s59dgo_lokalno_primerjalna_tema( 's59dgo' ), 'brez piškotka ostane tema s59dgo' );

$_COOKIE['s59dgo_primerjava'] = 'izdana';
preveri( 's59dgo' === s59dgo_lokalno_primerjalna_tema( 's59dgo' ), 's piškotkom brez mape s59dgo-izdana ostane s59dgo' );

mkdir( $vsebina . '/themes/s59dgo-izdana', 0777, true );
preveri( 's59dgo-izdana' === s59dgo_lokalno_primerjalna_tema( 's59dgo' ), 's piškotkom in mapo izbere s59dgo-izdana' );

$_COOKIE['s59dgo_primerjava'] = 'kaj-drugega';
preveri( 's59dgo' === s59dgo_lokalno_primerjalna_tema( 's59dgo' ), 'druga vrednost piškotka ne zamenja teme' );
unset( $_COOKIE['s59dgo_primerjava'] );

$rezultat = s59dgo_lokalno_posta(
	null,
	array(
		'to'      => 'a@b.si',
		'subject' => 'Test',
	)
);
preveri( false === $rezultat, 's59dgo_lokalno_posta vrne false (pošta se ne pošlje)' );
$zapis = (string) @file_get_contents( $dnevnik );
preveri( false !== strpos( $zapis, 'a@b.si' ) && false !== strpos( $zapis, 'Test' ), 'dnevnik vsebuje prejemnika in zadevo' );

rmdir( $vsebina . '/themes/s59dgo-izdana' );
rmdir( $vsebina . '/themes' );
rmdir( $vsebina );
@unlink( $dnevnik );
