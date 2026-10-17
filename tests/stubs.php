<?php
/**
 * Nadomestne funkcije WordPressa za teste brez WP.
 * Stanje se nastavlja prek $GLOBALS['s59dgo_test'].
 */
define( 'ABSPATH', __DIR__ . '/' );

$GLOBALS['s59dgo_test'] = array(
	'is_home'             => false,
	'is_search'           => false,
	'is_404'              => false,
	'is_archive'          => false,
	'is_singular'         => false,
	'is_single'           => false,
	'search_query'        => '',
	'found_posts'         => 0,
	'title'               => '',
	'archive_title'       => '',
	'archive_description' => '',
	'categories'          => array(),
	'has_thumbnail'       => false,
	'date'                => '2026-07-08',
	'theme_mods'          => array(),
	'excerpt'             => '',
	'slike'               => array(),
	'alt'                 => '',
	'bloginfo'            => array(
		'name'        => 'Radio klub Snežnik',
		'description' => 'Ilirska Bistrica · S59DGO',
	),
);

function s59dgo_t( $kljuc ) {
	return $GLOBALS['s59dgo_test'][ $kljuc ];
}
function s59dgo_test_ponastavi( array $prepisi = array() ) {
	$privzeto = array(
		'is_home' => false, 'is_search' => false, 'is_404' => false, 'is_archive' => false,
		'is_singular' => false, 'is_single' => false, 'search_query' => '', 'found_posts' => 0,
		'title' => '', 'archive_title' => '', 'archive_description' => '', 'categories' => array(),
		'has_thumbnail' => false, 'date' => '2026-07-08', 'theme_mods' => array(),
		'excerpt' => '', 'slike' => array(), 'alt' => '',
		'bloginfo' => array( 'name' => 'Radio klub Snežnik', 'description' => 'Ilirska Bistrica · S59DGO' ),
	);
	$GLOBALS['s59dgo_test'] = array_merge( $privzeto, $prepisi );
	$GLOBALS['wp_query']    = (object) array( 'found_posts' => $GLOBALS['s59dgo_test']['found_posts'] );
}

function is_home() { return s59dgo_t( 'is_home' ); }
function is_search() { return s59dgo_t( 'is_search' ); }
function is_404() { return s59dgo_t( 'is_404' ); }
function is_archive() { return s59dgo_t( 'is_archive' ); }
function is_singular() { return s59dgo_t( 'is_singular' ); }
function is_single() { return s59dgo_t( 'is_single' ); }
function get_search_query() { return s59dgo_t( 'search_query' ); }
function get_the_title() { return s59dgo_t( 'title' ); }
function get_the_archive_title() { return s59dgo_t( 'archive_title' ); }
function get_the_archive_description() { return s59dgo_t( 'archive_description' ); }
function get_the_category() { return s59dgo_t( 'categories' ); }
function get_category_link( $id ) { return 'https://example.test/category/' . $id . '/'; }
function has_post_thumbnail() { return s59dgo_t( 'has_thumbnail' ); }
function get_the_post_thumbnail( $post = null, $velikost = 'post-thumbnail', $atributi = array() ) {
	return '<img src="https://example.test/slika.jpg" alt="">';
}
function get_the_date( $oblika = 'j. n. Y' ) { return date( $oblika, strtotime( s59dgo_t( 'date' ) ) ); }
function get_bloginfo( $kljuc, $filter = 'raw' ) { $b = s59dgo_t( 'bloginfo' ); return isset( $b[ $kljuc ] ) ? $b[ $kljuc ] : ''; }
function apply_filters( $kljuka, $vrednost ) { return $vrednost; }
function __( $niz, $domena = null ) { return $niz; }
function esc_html__( $niz, $domena = null ) { return $niz; }
function esc_html( $niz ) { return htmlspecialchars( (string) $niz, ENT_QUOTES, 'UTF-8' ); }
function esc_attr( $niz ) { return esc_html( $niz ); }
function esc_url( $niz ) { return $niz; }
function number_format_i18n( $stevilo ) { return (string) $stevilo; }
function wp_strip_all_tags( $niz ) { return trim( strip_tags( (string) $niz ) ); }
function get_theme_mod( $kljuc, $privzeto = false ) { $m = s59dgo_t( 'theme_mods' ); return isset( $m[ $kljuc ] ) ? $m[ $kljuc ] : $privzeto; }
function get_permalink() { return 'https://example.test/objava/'; }
function is_front_page() { return false; }
function home_url( $pot = '' ) { return 'https://example.test' . $pot; }
function get_the_excerpt() { return s59dgo_t( 'excerpt' ); }
function get_post_thumbnail_id() { return 5; }
function wp_get_attachment_image_src( $id, $velikost = 'thumbnail' ) { $s = s59dgo_t( 'slike' ); return isset( $s[ $velikost ] ) ? $s[ $velikost ] : false; }
function get_post_meta( $id, $kljuc = '', $en = false ) { return s59dgo_t( 'alt' ); }
function wp_trim_words( $besedilo, $stevilo = 55, $vec = '…' ) { $b = preg_split( '/\s+/', trim( (string) $besedilo ) ); return count( $b ) > $stevilo ? implode( ' ', array_slice( $b, 0, $stevilo ) ) . $vec : implode( ' ', $b ); }
function add_action( $kljuka, $funkcija, $prednost = 10, $argumenti = 1 ) { return true; }

define( 'S59DGO_URI', 'https://example.test/wp-content/themes/s59dgo' );
s59dgo_test_ponastavi();
