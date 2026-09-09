<?php
/**
 * Nastavitvi naslova in podnaslova domače strani (Videz → Prilagodi → Identiteta spletišča).
 *
 * @package s59dgo
 */

defined( 'ABSPATH' ) || exit;

/**
 * Registrira nastavitvi in kontrolnika v Customizerju.
 *
 * @param WP_Customize_Manager $wp_customize Upravljalnik Customizerja.
 */
function s59dgo_customizer( $wp_customize ) {
	$wp_customize->add_setting(
		's59dgo_naslov_doma',
		array(
			'default'           => '',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'refresh',
		)
	);
	$wp_customize->add_control(
		's59dgo_naslov_doma',
		array(
			'type'        => 'text',
			'section'     => 'title_tagline',
			'label'       => __( 'Naslov domače strani', 's59dgo' ),
			'description' => __( 'Besedilo v modrem traku na domači strani. Prazno = »Novice s Snežnika«.', 's59dgo' ),
			'priority'    => 30,
		)
	);

	$wp_customize->add_setting(
		's59dgo_podnaslov_doma',
		array(
			'default'           => '',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'refresh',
		)
	);
	$wp_customize->add_control(
		's59dgo_podnaslov_doma',
		array(
			'type'        => 'text',
			'section'     => 'title_tagline',
			'label'       => __( 'Podnaslov domače strani', 's59dgo' ),
			'description' => __( 'Vrstica pod naslovom. Prazno = slogan strani.', 's59dgo' ),
			'priority'    => 31,
		)
	);
}
add_action( 'customize_register', 's59dgo_customizer' );
