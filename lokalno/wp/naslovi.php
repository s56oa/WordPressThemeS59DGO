<?php
/**
 * Reprezentativni naslovi za preverjanje (wp eval-file; bin/preveri-lokalno.sh).
 * Izpiše JSON za odkrijNaslove() v lokalno/preverjanje/jedro.mjs. Samo objavljene vsebine.
 *
 * @package s59dgo
 */

// Najnovejša objavljena objava (z naslovno sliko ali brez nje).
$s59dgo_objava = static function ( $s_sliko ) {
	$poizvedba = array(
		'post_type'      => 'post',
		'post_status'    => 'publish',
		'has_password'   => false,
		'posts_per_page' => 1,
		'orderby'        => 'date',
		'order'          => 'DESC',
		'meta_query'     => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
			array(
				'key'     => '_thumbnail_id',
				'compare' => $s_sliko ? 'EXISTS' : 'NOT EXISTS',
			),
		),
	);
	$objave = get_posts( $poizvedba );
	return $objave ? $objave[0] : null;
};

$s59dgo_s_sliko   = $s59dgo_objava( true );
$s59dgo_brez      = $s59dgo_objava( false );
$s59dgo_strani    = get_posts(
	array(
		'post_type'      => 'page',
		'post_status'    => 'publish',
		'has_password'   => false,
		'posts_per_page' => 1,
		'orderby'        => 'menu_order date',
		'order'          => 'ASC',
	)
);
$s59dgo_najnovejsa = get_posts(
	array(
		'post_type'      => 'post',
		'post_status'    => 'publish',
		'has_password'   => false,
		'posts_per_page' => 1,
	)
);

// Kategorija in oznaka z največ objavami (hide_empty šteje samo objavljene).
$s59dgo_izraz = static function ( $taksonomija ) {
	$izrazi = get_terms(
		array(
			'taxonomy'   => $taksonomija,
			'hide_empty' => true,
			'orderby'    => 'count',
			'order'      => 'DESC',
			'number'     => 1,
		)
	);
	if ( is_wp_error( $izrazi ) || ! $izrazi ) {
		return null;
	}
	$povezava = get_term_link( $izrazi[0] );
	return is_wp_error( $povezava ) ? null : $povezava;
};

// Iskalni niz: prva beseda z vsaj štirimi črkami iz naslova najnovejše objave.
$s59dgo_niz = null;
if ( $s59dgo_najnovejsa ) {
	$s59dgo_naslov = html_entity_decode( wp_strip_all_tags( get_the_title( $s59dgo_najnovejsa[0] ) ), ENT_QUOTES, 'UTF-8' );
	if ( preg_match( '/\p{L}{4,}/u', $s59dgo_naslov, $s59dgo_zadetek ) ) {
		$s59dgo_niz = $s59dgo_zadetek[0];
	}
}

$s59dgo_datum = null;
if ( $s59dgo_najnovejsa ) {
	$s59dgo_cas   = get_post_time( 'U', true, $s59dgo_najnovejsa[0] );
	$s59dgo_datum = get_month_link( (int) gmdate( 'Y', $s59dgo_cas ), (int) gmdate( 'n', $s59dgo_cas ) );
}

$s59dgo_naslovi = array(
	'domov'                => home_url( '/' ),
	'objava_s_sliko'       => $s59dgo_s_sliko ? get_permalink( $s59dgo_s_sliko ) : null,
	'objava_s_sliko_id'    => $s59dgo_s_sliko ? (int) $s59dgo_s_sliko->ID : null,
	'objava_brez_slike'    => $s59dgo_brez ? get_permalink( $s59dgo_brez ) : null,
	'objava_brez_slike_id' => $s59dgo_brez ? (int) $s59dgo_brez->ID : null,
	'stran'                => $s59dgo_strani ? get_permalink( $s59dgo_strani[0] ) : null,
	'kategorija'           => $s59dgo_izraz( 'category' ),
	'oznaka'               => $s59dgo_izraz( 'post_tag' ),
	'datum'                => $s59dgo_datum,
	'iskalni_niz'          => $s59dgo_niz,
);

echo wp_json_encode( $s59dgo_naslovi, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) . "\n";
