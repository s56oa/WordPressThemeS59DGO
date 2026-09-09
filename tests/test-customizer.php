<?php
require __DIR__ . '/preveri.php';
$koda = file_get_contents( __DIR__ . '/../s59dgo/inc/customizer.php' );
foreach ( array(
	"add_action( 'customize_register', 's59dgo_customizer' )",
	"'s59dgo_naslov_doma'",
	"'s59dgo_podnaslov_doma'",
	"'section'     => 'title_tagline'",
	"'sanitize_callback' => 'sanitize_text_field'",
	"__( 'Naslov domače strani', 's59dgo' )",
	"__( 'Podnaslov domače strani', 's59dgo' )",
) as $iskano ) {
	preveri( false !== strpos( $koda, $iskano ), "customizer.php vsebuje {$iskano}" );
}
preveri( false === strpos( $koda, '?>' ), 'customizer.php nima zaključne oznake' );
$functions = file_get_contents( __DIR__ . '/../s59dgo/functions.php' );
preveri( false !== strpos( $functions, "'customizer'" ), 'functions.php nalaga customizer.php' );
