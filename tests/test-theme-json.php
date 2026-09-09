<?php
require __DIR__ . '/preveri.php';
$json = json_decode( file_get_contents( __DIR__ . '/../s59dgo/theme.json' ), true );
preveri( is_array( $json ), 'theme.json je veljaven JSON' );
preveri( 3 === $json['version'], 'theme.json version 3' );
preveri( ! isset( $json['styles'] ), 'theme.json nima styles' );
preveri( false === $json['settings']['appearanceTools'], 'appearanceTools false' );
preveri( '760px' === $json['settings']['layout']['contentSize'], 'contentSize 760px' );
preveri( '1100px' === $json['settings']['layout']['wideSize'], 'wideSize 1100px' );
$slugi = array_column( $json['settings']['color']['palette'], 'slug' );
foreach ( array( 'temno-modra', 'oranzna', 'sneg', 'povrsina', 'besedilo', 'tiha' ) as $slug ) {
	preveri( in_array( $slug, $slugi, true ), "paleta ima {$slug}" );
}
$pisave = array_column( $json['settings']['typography']['fontFamilies'], 'slug' );
preveri( array( 'naslovi', 'besedilo' ) === $pisave, 'pisavi naslovi in besedilo' );
preveri( 5 === count( $json['settings']['typography']['fontSizes'] ), '5 velikosti pisave' );
preveri( file_exists( __DIR__ . '/../s59dgo/assets/css/editor.css' ), 'editor.css obstaja' );
foreach ( $json['settings']['typography']['fontFamilies'] as $druzina ) {
	preveri( 4 === count( $druzina['fontFace'] ), "4 fontFace vnosi za {$druzina['slug']}" );
	foreach ( $druzina['fontFace'] as $vnos ) {
		preveri( isset( $vnos['unicodeRange'] ) && '' !== $vnos['unicodeRange'], "fontFace ({$druzina['slug']}) ima unicodeRange" );
		preveri( 'swap' === $vnos['fontDisplay'], "fontFace ({$druzina['slug']}) fontDisplay swap" );
	}
}
preveri( true === $json['settings']['color']['custom'], 'color.custom true' );
