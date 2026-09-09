<?php
require __DIR__ . '/preveri.php';
$koda = file_get_contents( __DIR__ . '/../s59dgo/inc/setup.php' );
foreach ( array(
	"add_theme_support( 'title-tag' )",
	"add_theme_support( 'post-thumbnails' )",
	"add_image_size( 's59dgo-kartica', 800, 520, true )",
	"'custom-logo',",
	"add_theme_support( 'align-wide' )",
	"add_editor_style( 'assets/css/editor.css' )",
	"'glavni' => __( 'Glavni meni', 's59dgo' )",
	"'noga-1'", "'noga-2'", "'noga-3'",
	"add_action( 'after_setup_theme', 's59dgo_nastavitve' )",
	"add_action( 'widgets_init', 's59dgo_gradniki' )",
	"add_filter( 'excerpt_length', 's59dgo_dolzina_izvlecka' )",
	"add_filter( 'get_the_archive_title_prefix', '__return_empty_string' )",
) as $iskano ) {
	preveri( false !== strpos( $koda, $iskano ), "setup.php vsebuje {$iskano}" );
}
preveri( false === strpos( $koda, '?>' ), 'setup.php nima zaključne oznake' );
