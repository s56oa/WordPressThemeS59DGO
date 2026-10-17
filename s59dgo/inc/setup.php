<?php
/**
 * Podpore, meniji, slike, gradniki in filtri teme.
 *
 * @package s59dgo
 */

defined( 'ABSPATH' ) || exit;

/**
 * Nastavitve ob nalaganju teme.
 */
function s59dgo_nastavitve() {
	load_theme_textdomain( 's59dgo', S59DGO_POT . '/languages' );

	add_theme_support( 'title-tag' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'post-thumbnails' );
	add_image_size( 's59dgo-kartica', 800, 520, true );
	add_image_size( 's59dgo-deljenje', 1200, 630, true );
	add_theme_support(
		'custom-logo',
		array(
			'height'      => 200,
			'width'       => 200,
			'flex-height' => true,
			'flex-width'  => true,
		)
	);
	add_theme_support(
		'html5',
		array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' )
	);
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'align-wide' );
	add_theme_support( 'editor-styles' );
	add_editor_style( 'assets/css/editor.css' );

	register_nav_menus(
		array(
			'glavni' => __( 'Glavni meni', 's59dgo' ),
		)
	);
}
add_action( 'after_setup_theme', 's59dgo_nastavitve' );

/**
 * Širina vsebine za vdelane elemente.
 */
function s59dgo_sirina_vsebine() {
	$GLOBALS['content_width'] = 1100;
}
add_action( 'after_setup_theme', 's59dgo_sirina_vsebine', 0 );

/**
 * Tri widget območja v nogi.
 */
function s59dgo_gradniki() {
	$obmocja = array(
		'noga-1' => __( 'Noga – Kontakt', 's59dgo' ),
		'noga-2' => __( 'Noga – Uradne ure', 's59dgo' ),
		'noga-3' => __( 'Noga – Podpora', 's59dgo' ),
	);
	foreach ( $obmocja as $id => $ime ) {
		register_sidebar(
			array(
				'name'          => $ime,
				'id'            => $id,
				'description'   => __( 'Stolpec v nogi strani.', 's59dgo' ),
				'before_widget' => '<div id="%1$s" class="gradnik %2$s">',
				'after_widget'  => '</div>',
				'before_title'  => '<h2 class="gradnik__naslov">',
				'after_title'   => '</h2>',
			)
		);
	}
}
add_action( 'widgets_init', 's59dgo_gradniki' );

/**
 * Dolžina izvlečka v kartici.
 *
 * @return int
 */
function s59dgo_dolzina_izvlecka() {
	return 20;
}
add_filter( 'excerpt_length', 's59dgo_dolzina_izvlecka' );

/**
 * Konec izvlečka brez povezave »Read more«.
 *
 * @return string
 */
function s59dgo_konec_izvlecka() {
	return '…';
}
add_filter( 'excerpt_more', 's59dgo_konec_izvlecka' );

add_filter( 'get_the_archive_title_prefix', '__return_empty_string' );
