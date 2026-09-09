<?php
require __DIR__ . '/preveri.php';
$koda = file_get_contents( __DIR__ . '/../s59dgo/inc/enqueue.php' );
preveri( false !== strpos( $koda, "wp_enqueue_style( 's59dgo-style', get_stylesheet_uri(), array(), S59DGO_VERSION )" ), 'enqueue nalaga style.css z verzijo' );
preveri( false !== strpos( $koda, "'s59dgo-navigation'" ), 'enqueue nalaga navigation.js' );
preveri( false !== strpos( $koda, "'strategy' => 'defer'" ), 'navigation.js je defer' );
preveri( false !== strpos( $koda, "add_action( 'wp_enqueue_scripts', 's59dgo_sredstva' )" ), 'kljuka wp_enqueue_scripts' );
preveri( file_exists( __DIR__ . '/../s59dgo/assets/js/navigation.js' ), 'navigation.js obstaja' );
$js = file_get_contents( __DIR__ . '/../s59dgo/assets/js/navigation.js' );
foreach ( array( "'Escape'", 'aria-expanded', 'podmeni__preklop', 'je-odprt', 'menu-item-has-children' ) as $iskano ) {
	preveri( false !== strpos( $js, $iskano ), "navigation.js vsebuje {$iskano}" );
}
