<?php
/**
 * Plugin Name: s59dgo – lokalna kopija
 * Description: Samo za lokalni WordPress (bin/lokalno.sh): blokira pošto in omogoči primerjalno temo s59dgo-izdana prek piškotka s59dgo_primerjava=izdana.
 *
 * @package s59dgo
 */

defined( 'ABSPATH' ) || exit;

/**
 * Vrne s59dgo-izdana, če brskalnik to zahteva s piškotkom in je tema nameščena.
 *
 * @param string $tema Ime mape aktivne teme.
 * @return string
 */
function s59dgo_lokalno_primerjalna_tema( string $tema ): string {
	if ( isset( $_COOKIE['s59dgo_primerjava'] ) && 'izdana' === $_COOKIE['s59dgo_primerjava']
		&& is_dir( WP_CONTENT_DIR . '/themes/s59dgo-izdana' ) ) {
		return 's59dgo-izdana';
	}
	return $tema;
}
add_filter( 'template', 's59dgo_lokalno_primerjalna_tema' );
add_filter( 'stylesheet', 's59dgo_lokalno_primerjalna_tema' );

/**
 * Namesto pošiljanja zapiše prejemnika in zadevo v dnevnik.
 *
 * @param null|bool $nic      Rezultat prejšnjih filtrov.
 * @param array     $atributi Argumenti wp_mail().
 * @return false
 */
function s59dgo_lokalno_posta( $nic, array $atributi ) {
	$prejemnik = isset( $atributi['to'] ) ? implode( ', ', (array) $atributi['to'] ) : '';
	$zadeva    = isset( $atributi['subject'] ) ? (string) $atributi['subject'] : '';
	error_log( 's59dgo-lokalno: pošta ni poslana – za: ' . $prejemnik . ', zadeva: ' . $zadeva ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
	return false;
}
add_filter( 'pre_wp_mail', 's59dgo_lokalno_posta', 10, 2 );
