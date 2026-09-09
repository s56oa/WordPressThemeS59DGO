<?php
// Preveri, da glava teme in functions.php obstajata in vsebujeta ključne podatke.
require __DIR__ . '/preveri.php';

$style = file_get_contents( __DIR__ . '/../s59dgo/style.css' );
preveri( false !== strpos( $style, 'Theme Name: S59DGO' ), 'style.css ima Theme Name' );
preveri( false !== strpos( $style, 'Text Domain: s59dgo' ), 'style.css ima Text Domain s59dgo' );
preveri( 1 === preg_match( '/^Version: \d+\.\d+\.\d+$/m', $style ), 'style.css ima semantično verzijo' );

$functions = file_get_contents( __DIR__ . '/../s59dgo/functions.php' );
preveri( false !== strpos( $functions, "define( 'S59DGO_VERSION'" ), 'functions.php definira S59DGO_VERSION' );
preveri( false === strpos( $functions, '?>' ), 'functions.php nima zaključne oznake' );
preveri( file_exists( __DIR__ . '/../s59dgo/screenshot.png' ), 'screenshot.png obstaja' );
$png = getimagesize( __DIR__ . '/../s59dgo/screenshot.png' );
preveri( 1200 === $png[0] && 900 === $png[1], 'screenshot.png je 1200x900' );
preveri( file_exists( __DIR__ . '/../s59dgo/readme.txt' ), 'readme.txt obstaja' );
preveri( file_exists( __DIR__ . '/../s59dgo/languages/index.php' ), 'mapa languages obstaja' );
