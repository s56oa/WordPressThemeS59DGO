<?php
/**
 * ID-ji priponk brez izreza v posnetku stanja produkcije (php brez WordPressa; bin/preveri-lokalno.sh).
 * Argument: kartica ali deljenje. Izpiše ID-je, ločene s presledkom.
 *
 * @package s59dgo
 */

$s59dgo_vrsta = isset( $argv[1] ) ? (string) $argv[1] : '';
if ( ! in_array( $s59dgo_vrsta, array( 'kartica', 'deljenje' ), true ) ) {
	fwrite( STDERR, "Uporaba: php brez-izrezov.php kartica|deljenje\n" ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite
	exit( 2 );
}
$s59dgo_stanje = json_decode( (string) file_get_contents( '/stanje/stanje-produkcije.json' ), true, 512, JSON_THROW_ON_ERROR ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
$s59dgo_idji   = array();
foreach ( $s59dgo_stanje['slike'] ?? array() as $s59dgo_slika ) {
	if ( false === $s59dgo_slika[ 'ima_' . $s59dgo_vrsta ] && $s59dgo_slika['priponka_id'] > 0 ) {
		$s59dgo_idji[] = (int) $s59dgo_slika['priponka_id'];
	}
}
echo implode( ' ', array_unique( $s59dgo_idji ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
