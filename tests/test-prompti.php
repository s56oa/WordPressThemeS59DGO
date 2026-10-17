<?php
require __DIR__ . '/preveri.php';
$pot  = __DIR__ . '/../docs/orodja/s59dgo-prompti.html';
preveri( file_exists( $pot ), 'orodje docs/orodja/s59dgo-prompti.html obstaja' );
$html = file_get_contents( $pot );
preveri( false !== strpos( $html, '<title>Generator promptov S59DGO</title>' ), 'naslov strani' );
preveri( 1 === substr_count( $html, '/* PISAVE:ZAČETEK */' ) && 1 === substr_count( $html, '/* PISAVE:KONEC */' ), 'označevalca pisav' );
preveri( 8 === substr_count( $html, 'src:url(data:font/woff2;base64,' ), '8 vdelanih pisav' );
preveri( 1 === preg_match( '#<script type="application/json" id="podatki">(.*?)</script>#s', $html, $m ), 'blok podatkov' );
$p = json_decode( $m[1], true );
preveri( is_array( $p ) && 1 === $p['verzija'], 'podatki so veljaven JSON z verzijo 1' );
foreach ( array( 'jedro', 'predogled-js', 'vmesnik' ) as $id ) {
	preveri( false !== strpos( $html, '<script id="' . $id . '">' ), "skripta #{$id}" );
}
preveri( 0 === preg_match( '#(src|href)="https?://#', $html ), 'brez zunanjih virov' );
