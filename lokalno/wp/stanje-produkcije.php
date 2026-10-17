<?php
/**
 * Posnetek stanja produkcije takoj po obnovi (wp eval-file, argumenta: ime in čas arhiva).
 * Izpiše JSON na stdout; obnovi.sh ga shrani v /stanje/stanje-produkcije.json.
 *
 * @package s59dgo
 */

global $wpdb, $wp_version;

// Ali ima priponka izrez v metapodatkih in na disku.
$s59dgo_ima_izrez = static function ( $meta, $datoteka, $velikost ) {
	if ( empty( $meta['sizes'][ $velikost ]['file'] ) || ! $datoteka ) {
		return false;
	}
	return file_exists( dirname( $datoteka ) . '/' . $meta['sizes'][ $velikost ]['file'] );
};

$s59dgo_slike   = array();
$s59dgo_objave  = get_posts(
	array(
		'post_type'      => 'post',
		'post_status'    => 'publish',
		'posts_per_page' => -1,
		'meta_key'       => '_thumbnail_id', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
		'orderby'        => 'ID',
		'order'          => 'ASC',
	)
);
foreach ( $s59dgo_objave as $s59dgo_objava ) {
	$s59dgo_id       = (int) get_post_thumbnail_id( $s59dgo_objava );
	$s59dgo_meta     = $s59dgo_id ? wp_get_attachment_metadata( $s59dgo_id ) : false;
	$s59dgo_datoteka = $s59dgo_id ? get_attached_file( $s59dgo_id ) : false;
	$s59dgo_slike[]  = array(
		'objava_id'    => (int) $s59dgo_objava->ID,
		'naslov'       => get_the_title( $s59dgo_objava ),
		'priponka_id'  => $s59dgo_id,
		'sirina'       => isset( $s59dgo_meta['width'] ) ? (int) $s59dgo_meta['width'] : 0,
		'visina'       => isset( $s59dgo_meta['height'] ) ? (int) $s59dgo_meta['height'] : 0,
		'ima_kartica'  => $s59dgo_ima_izrez( $s59dgo_meta, $s59dgo_datoteka, 's59dgo-kartica' ),
		'ima_deljenje' => $s59dgo_ima_izrez( $s59dgo_meta, $s59dgo_datoteka, 's59dgo-deljenje' ),
	);
}

$s59dgo_lokacije = get_nav_menu_locations();
$s59dgo_meni     = empty( $s59dgo_lokacije['glavni'] ) ? null : wp_get_nav_menu_object( $s59dgo_lokacije['glavni'] );
$s59dgo_gradniki = get_option( 'sidebars_widgets', array() );
$s59dgo_noga     = array();
foreach ( array( 'noga-1', 'noga-2', 'noga-3' ) as $s59dgo_obmocje ) {
	$s59dgo_noga[ $s59dgo_obmocje ] = isset( $s59dgo_gradniki[ $s59dgo_obmocje ] ) ? array_values( (array) $s59dgo_gradniki[ $s59dgo_obmocje ] ) : array();
}

$s59dgo_uploads = wp_get_upload_dir()['basedir'];
$s59dgo_php     = array();
if ( is_dir( $s59dgo_uploads ) ) {
	$s59dgo_iter = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $s59dgo_uploads, FilesystemIterator::SKIP_DOTS ) );
	foreach ( $s59dgo_iter as $s59dgo_dat ) {
		if ( $s59dgo_dat->isFile() && preg_match( '/\.(php\d?|phtml|phar)$/i', $s59dgo_dat->getFilename() ) ) {
			$s59dgo_php[] = 'wp-content/uploads/' . ltrim( substr( $s59dgo_dat->getPathname(), strlen( $s59dgo_uploads ) ), '/' );
		}
	}
	sort( $s59dgo_php );
}

$s59dgo_stanje = array(
	'arhiv'         => isset( $args[0] ) ? (string) $args[0] : '',
	'cas_arhiva'    => isset( $args[1] ) ? (string) $args[1] : '',
	'jedro'         => $wp_version,
	'predpona'      => $wpdb->prefix,
	'nastavitve'    => array(
		'posts_per_page' => (int) get_option( 'posts_per_page' ),
		'meni_glavni'    => $s59dgo_meni ? $s59dgo_meni->name : null,
		'logotip'        => (int) get_theme_mod( 'custom_logo', 0 ),
		'gradniki'       => $s59dgo_noga,
		'tema'           => get_option( 'stylesheet' ),
	),
	'slike'         => $s59dgo_slike,
	'php_v_uploads' => $s59dgo_php,
);

echo wp_json_encode( $s59dgo_stanje, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) . "\n";
