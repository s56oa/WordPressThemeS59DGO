<?php
/**
 * Funkcije predlog: trak z grebenom, kategorija, datum, slika kartice.
 *
 * @package s59dgo
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 's59dgo_dovoljen_html_meta' ) ) :
	/**
	 * Dovoljen HTML za značko kategorije in datum (za wp_kses ob izpisu).
	 *
	 * @return array
	 */
	function s59dgo_dovoljen_html_meta() {
		return array(
			'a'    => array(
				'href'  => array(),
				'class' => array(),
			),
			'time' => array(
				'class'    => array(),
				'datetime' => array(),
			),
		);
	}
endif;

if ( ! function_exists( 's59dgo_kategorija' ) ) :
	/**
	 * Značka prve kategorije objave; prazno za uncategorized ali brez kategorije.
	 *
	 * @return string Escapan HTML.
	 */
	function s59dgo_kategorija() {
		$kategorije = get_the_category();
		if ( empty( $kategorije ) ) {
			return '';
		}
		$prva = $kategorije[0];
		if ( 'uncategorized' === $prva->slug ) {
			return '';
		}
		return sprintf(
			'<a class="znacka" href="%s">%s</a>',
			esc_url( get_category_link( $prva->term_id ) ),
			esc_html( $prva->name )
		);
	}
endif;

if ( ! function_exists( 's59dgo_datum' ) ) :
	/**
	 * Datum objave v slovenski obliki.
	 *
	 * @return string Escapan HTML.
	 */
	function s59dgo_datum() {
		return sprintf(
			'<time class="datum" datetime="%s">%s</time>',
			esc_attr( get_the_date( 'Y-m-d' ) ),
			esc_html( get_the_date( 'j. n. Y' ) )
		);
	}
endif;

if ( ! function_exists( 's59dgo_slika_kartice' ) ) :
	/**
	 * Izpiše naslovno sliko kartice ali nadomestni greben.
	 */
	function s59dgo_slika_kartice() {
		if ( has_post_thumbnail() ) {
			echo get_the_post_thumbnail( null, 's59dgo-kartica', array( 'loading' => 'lazy' ) ); // phpcs:ignore WordPress.Security.EscapeOutput -- WP vrne varen HTML.
			return;
		}
		printf(
			'<img class="kartica__nadomestna" src="%s" alt="" width="800" height="520" loading="lazy">',
			esc_url( S59DGO_URI . '/assets/img/greben.svg' )
		);
	}
endif;

if ( ! function_exists( 's59dgo_trak_podatki' ) ) :
	/**
	 * Vsebina traku z grebenom glede na kontekst.
	 *
	 * @return array{naslov:string,podnaslov:string,meta:string,velik:bool}
	 */
	function s59dgo_trak_podatki() {
		$podatki = array(
			'naslov'    => '',
			'podnaslov' => '',
			'meta'      => '',
			'velik'     => true,
		);

		if ( is_404() ) {
			$podatki['naslov'] = __( 'Stran ne obstaja', 's59dgo' );
			$podatki['velik']  = false;
		} elseif ( is_search() ) {
			global $wp_query;
			$stevilo = isset( $wp_query->found_posts ) ? (int) $wp_query->found_posts : 0;
			/* translators: %s: iskalni niz */
			$podatki['naslov'] = sprintf( __( 'Iskanje: %s', 's59dgo' ), get_search_query( false ) );
			/* translators: %s: število zadetkov */
			$podatki['podnaslov'] = sprintf( __( 'Število zadetkov: %s', 's59dgo' ), number_format_i18n( $stevilo ) );
		} elseif ( is_home() ) {
			$naslov    = trim( (string) get_theme_mod( 's59dgo_naslov_doma', '' ) );
			$podnaslov = trim( (string) get_theme_mod( 's59dgo_podnaslov_doma', '' ) );
			if ( '' === $naslov ) {
				$naslov = __( 'Novice s Snežnika', 's59dgo' );
			}
			if ( '' === $podnaslov ) {
				$podnaslov = get_bloginfo( 'description' );
			}
			$podatki['naslov']    = apply_filters( 's59dgo_naslov_doma', $naslov );
			$podatki['podnaslov'] = apply_filters( 's59dgo_podnaslov_doma', $podnaslov );
		} elseif ( is_archive() ) {
			$podatki['naslov']    = wp_strip_all_tags( get_the_archive_title() );
			$podatki['podnaslov'] = wp_strip_all_tags( get_the_archive_description() );
		} elseif ( is_singular() ) {
			$podatki['naslov'] = get_the_title();
			$podatki['velik']  = false;
			if ( is_single() ) {
				$podatki['meta'] = s59dgo_kategorija() . s59dgo_datum();
			}
		}

		return $podatki;
	}
endif;
