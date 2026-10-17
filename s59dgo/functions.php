<?php
/**
 * Tema S59DGO – nalagalnik.
 *
 * @package s59dgo
 */

defined( 'ABSPATH' ) || exit;

define( 'S59DGO_VERSION', wp_get_theme()->get( 'Version' ) );
define( 'S59DGO_POT', get_template_directory() );
define( 'S59DGO_URI', get_template_directory_uri() );

foreach ( array( 'setup', 'enqueue', 'template-tags', 'customizer', 'druzbena' ) as $s59dgo_datoteka ) {
	require S59DGO_POT . '/inc/' . $s59dgo_datoteka . '.php';
}
unset( $s59dgo_datoteka );
