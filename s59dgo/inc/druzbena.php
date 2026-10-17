<?php
/**
 * Oznake Open Graph in Twitter za deljenje na družbenih omrežjih.
 *
 * @package s59dgo
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 's59dgo_druzbena_drug_vir' ) ) :
	/**
	 * Ali oznake za deljenje že izpisuje vtičnik (Yoast SEO, Rank Math, Jetpack).
	 *
	 * @return bool
	 */
	function s59dgo_druzbena_drug_vir() {
		return defined( 'WPSEO_VERSION' )
			|| class_exists( 'RankMath' )
			|| (bool) apply_filters( 'jetpack_enable_open_graph', false ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- branje filtra Jetpacka, ne lastna kljuka.
	}
endif;

if ( ! function_exists( 's59dgo_druzbena_slika' ) ) :
	/**
	 * Slika za deljenje: izrez 1200×630, sicer large, brez naslovne slike logotip strani.
	 *
	 * @return array{0:string,1:int,2:int,3:bool}|false
	 */
	function s59dgo_druzbena_slika() {
		if ( is_singular() && has_post_thumbnail() ) {
			$id    = get_post_thumbnail_id();
			$slika = wp_get_attachment_image_src( $id, 's59dgo-deljenje' );
			if ( ! $slika || empty( $slika[3] ) ) {
				$slika = wp_get_attachment_image_src( $id, 'large' );
			}
			if ( $slika ) {
				return $slika;
			}
		}
		$logo = (int) get_theme_mod( 'custom_logo' );
		return $logo ? wp_get_attachment_image_src( $logo, 'full' ) : false;
	}
endif;

if ( ! function_exists( 's59dgo_druzbena_izvlecek' ) ) :
	/**
	 * Opis za deljenje: ročni izvleček ali začetek vsebine, brez filtrov the_content v <head>.
	 *
	 * @return string Do 30 besed brez HTML; prazno za objavo z geslom.
	 */
	function s59dgo_druzbena_izvlecek() {
		$objava = get_post();
		if ( ! $objava || post_password_required( $objava ) ) {
			return '';
		}
		$besedilo = has_excerpt( $objava ) ? $objava->post_excerpt : strip_shortcodes( excerpt_remove_blocks( $objava->post_content ) );
		return wp_trim_words( wp_strip_all_tags( $besedilo ), 30, '…' );
	}
endif;

if ( ! function_exists( 's59dgo_druzbena_podatki' ) ) :
	/**
	 * Vrednosti oznak za trenutno stran; prazno za arhive, iskanje in 404.
	 *
	 * @return array<string,string|int>
	 */
	function s59dgo_druzbena_podatki() {
		$ime  = get_bloginfo( 'name' );
		$opis = get_bloginfo( 'description' );

		if ( is_singular() ) {
			$izvlecek = s59dgo_druzbena_izvlecek();
			$p        = array(
				'og:type'        => 'article',
				'og:title'       => wp_strip_all_tags( get_the_title() ),
				'og:url'         => get_permalink(),
				'og:description' => '' !== $izvlecek ? $izvlecek : $opis,
			);
		} elseif ( is_home() || is_front_page() ) {
			$p = array(
				'og:type'        => 'website',
				'og:title'       => $ime,
				'og:url'         => home_url( '/' ),
				'og:description' => $opis,
			);
		} else {
			return array();
		}

		$p['og:site_name'] = $ime;
		$p['og:locale']    = 'sl_SI';

		$slika = s59dgo_druzbena_slika();
		if ( $slika ) {
			$p['og:image']        = $slika[0];
			$p['og:image:width']  = (int) $slika[1];
			$p['og:image:height'] = (int) $slika[2];
			$alt                  = is_singular() && has_post_thumbnail() ? trim( (string) get_post_meta( get_post_thumbnail_id(), '_wp_attachment_image_alt', true ) ) : '';
			if ( '' !== $alt ) {
				$p['og:image:alt'] = $alt;
			}
		}
		$p['twitter:card'] = $slika ? 'summary_large_image' : 'summary';

		return apply_filters( 's59dgo_druzbena_podatki', $p );
	}
endif;

if ( ! function_exists( 's59dgo_druzbena_oznake' ) ) :
	/**
	 * Izpiše oznake v <head>, razen če jih že izpisuje vtičnik.
	 */
	function s59dgo_druzbena_oznake() {
		if ( s59dgo_druzbena_drug_vir() ) {
			return;
		}
		foreach ( s59dgo_druzbena_podatki() as $kljuc => $vrednost ) {
			$atribut = 0 === strpos( $kljuc, 'twitter:' ) ? 'name' : 'property';
			$vsebina = in_array( $kljuc, array( 'og:url', 'og:image' ), true ) ? esc_url( $vrednost ) : esc_attr( $vrednost );
			printf( '<meta %s="%s" content="%s">' . "\n", $atribut, esc_attr( $kljuc ), $vsebina ); // phpcs:ignore WordPress.Security.EscapeOutput -- $atribut je fiksen niz, ostalo je escapano zgoraj.
		}
	}
endif;
add_action( 'wp_head', 's59dgo_druzbena_oznake', 5 );
