<?php
/**
 * Nalaganje slogov in skript.
 *
 * @package s59dgo
 */

defined( 'ABSPATH' ) || exit;

/**
 * Sprednji del: style.css in navigation.js.
 */
function s59dgo_sredstva() {
	wp_enqueue_style( 's59dgo-style', get_stylesheet_uri(), array(), S59DGO_VERSION );

	wp_enqueue_script(
		's59dgo-navigation',
		S59DGO_URI . '/assets/js/navigation.js',
		array(),
		S59DGO_VERSION,
		array( 'strategy' => 'defer' )
	);

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 's59dgo_sredstva' );
