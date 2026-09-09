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
