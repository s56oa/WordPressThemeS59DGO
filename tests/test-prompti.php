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

$md = file_get_contents( __DIR__ . '/../docs/ai-prompti-grafika.md' );

/** Besedilo razdelka od »### {$st} « do naslednjega naslova ## ali ###. */
function prompti_razdelek( $md, $st ) {
	$z = strpos( $md, "\n### {$st} " );
	if ( false === $z ) {
		return '';
	}
	$k = preg_match( '/\n#{2,3} /', $md, $n, PREG_OFFSET_CAPTURE, $z + 5 ) ? $n[0][1] : strlen( $md );
	return substr( $md, $z, $k - $z );
}

/** Vsebine kodnih blokov ``` v besedilu. */
function prompti_kode( $besedilo ) {
	preg_match_all( '/```\n(.*?)\n```/s', $besedilo, $n );
	return $n[1];
}

$slog_en = prompti_kode( prompti_razdelek( $md, '2.1' ) );
$slog_sl = prompti_kode( prompti_razdelek( $md, '2.2' ) );
$tipo    = prompti_kode( prompti_razdelek( $md, '2.3' ) );
$ne      = prompti_kode( prompti_razdelek( $md, '2.4' ) );
preveri( $p['bloki']['slog']['en'] === $slog_en[0], 'blok SLOG EN = dokument §2.1' );
preveri( $p['bloki']['slog']['sl'] === $slog_sl[0], 'blok SLOG SL = dokument §2.2' );
preveri( $p['bloki']['tipo']['en'] === $tipo[0] && $p['bloki']['tipo']['sl'] === $tipo[1], 'blok TIPO = dokument §2.3' );
preveri( $p['bloki']['ne']['en'] === $ne[0] && $p['bloki']['ne']['sl'] === $ne[1], 'blok NE = dokument §2.4' );
$temno = prompti_kode( prompti_razdelek( $md, '2.5' ) );
preveri( $p['bloki']['temno']['en'] === $temno[0], 'blok TEMNO EN = dokument §2.5' );
preveri( '' !== $p['bloki']['temno']['sl'] && '' !== $p['bloki']['slog_svetlo']['en'] && '' !== $p['bloki']['slog_svetlo']['sl'], 'bloka TEMNO SL in SLOG_SVETLO nista prazna' );

$vrstice = array_values( array_filter( explode( "\n", prompti_razdelek( $md, '3.2' ) ), function ( $v ) {
	return 0 === strpos( $v, '| ' ) && false === strpos( $v, 'Kategorija' );
} ) );
preveri( 8 === count( $vrstice ) && 8 === count( $p['motivi'] ), '8 motivov v dokumentu in v orodju' );
foreach ( $vrstice as $i => $v ) {
	$c = array_map( 'trim', explode( '|', trim( $v, " |\n" ) ) );
	$m = $p['motivi'][ $i ];
	preveri( $m['ime'] === $c[0] && $m['motiv']['en'] === $c[1] && $m['motiv']['sl'] === $c[2], "motiv {$c[0]} = dokument §3.2" );
	preveri( '' !== $m['dodatno']['en'] && '' !== $m['dodatno']['sl'], "motiv {$c[0]} ima dodatni element EN in SL" );
}
foreach ( array( 'desno', 'levo', 'brez' ) as $k ) {
	preveri( isset( $p['elementi']['sonce'][ $k ]['en'], $p['elementi']['sonce'][ $k ]['sl'] ), "sonce {$k}" );
}
foreach ( array( '2-temno', '3-temno', '2-svetlo', '3-svetlo' ) as $k ) {
	preveri( isset( $p['elementi']['greben'][ $k ]['en'], $p['elementi']['greben'][ $k ]['sl'] ), "greben {$k}" );
}
preveri( array( 'univerzalno', 'midjourney', 'chatgpt', 'ideogram', 'sd' ) === array_keys( $p['orodja'] ), '5 orodij v pravem vrstnem redu' );
preveri( 4 === count( $p['vrhovi'] ), '4 motivi za vrh grebena' );

preg_match_all( '/^### ([3-6]\.\d) /m', $md, $n );
$razdelki = array_values( array_diff( array_unique( $n[1] ), array( '3.2', '3.3' ) ) );
$v_orodju = array_column( $p['predloge'], 'razdelek' );
sort( $razdelki );
sort( $v_orodju );
preveri( 15 === count( $razdelki ) && $razdelki === $v_orodju, 'vsak razdelek §3–§6 ima natanko eno predlogo (15)' );
preveri( count( $p['predloge'] ) === count( array_unique( array_column( $p['predloge'], 'id' ) ) ), 'id-ji predlog so enolični' );

foreach ( $p['predloge'] as $t ) {
	$id = $t['id'];
	preveri( ! empty( $t['formati'] ), "{$id}: ima vsaj en format" );
	foreach ( $t['formati'] as $f ) {
		preveri( isset( $f['id'], $f['ime'], $f['ar'], $f['w'], $f['h'], $f['en'], $f['sl'] ), "{$id}: format {$f['id']} je popoln" );
	}
	$dovoljene = array( 'format' );
	$obvezne   = array( 'format' );
	foreach ( array( 'sonce', 'greben' ) as $e ) {
		if ( ! empty( $t[ $e ] ) ) {
			$dovoljene[] = $e;
			$obvezne[]   = $e;
		}
	}
	if ( ! empty( $t['ozadja'] ) ) {
		$dovoljene[] = 'ozadje';
		$obvezne[]   = 'ozadje';
	}
	foreach ( isset( $t['poudarki'] ) ? $t['poudarki'] : array() as $x ) {
		$dovoljene[] = 'p:' . $x['id'];
		$obvezne[]   = 'p:' . $x['id'];
	}
	foreach ( $t['polja'] as $f ) {
		if ( 'motiv' === $f['vrsta'] ) {
			array_push( $dovoljene, 'motiv', 'dodatno' );
			array_push( $obvezne, 'motiv', 'dodatno' );
			continue;
		}
		$dovoljene[] = $f['id'];
		$obvezne[]   = $f['id'];
		if ( 'vrstice' === $f['vrsta'] ) {
			$dovoljene[] = 'N';
			$stolpci     = array_merge( array( '#' ), array_column( $f['stolpci'], 'id' ) );
			foreach ( array( 'en', 'sl' ) as $j ) {
				preg_match_all( '/\{\{([^}]+)\}\}/', $f['vrstica'][ $j ], $r );
				preveri( ! array_diff( $r[1], $stolpci ), "{$id}: vrstica {$j} uporablja le stolpce" );
			}
		}
		if ( 'seznam' === $f['vrsta'] ) {
			array_push( $dovoljene, $f['id'] . '_N', $f['id'] . '_mreza' );
		}
		if ( 'poudarek' === $f['vrsta'] ) {
			preveri( in_array( $f['vir'], array_column( $t['polja'], 'id' ), true ), "{$id}: poudarek kaže na obstoječe polje" );
		}
	}
	$po_jezikih = array();
	foreach ( array( 'en', 'sl' ) as $j ) {
		preveri( isset( $t['besedilo'][ $j ] ) && '' !== $t['besedilo'][ $j ], "{$id}: besedilo {$j}" );
		preg_match_all( '/\{\{([^}]+)\}\}/', $t['besedilo'][ $j ], $r );
		$rabljene         = array_values( array_unique( $r[1] ) );
		$po_jezikih[ $j ] = $rabljene;
		preveri( ! array_diff( $rabljene, $dovoljene ), "{$id} {$j}: vse reže imajo vir (" . implode( ',', array_diff( $rabljene, $dovoljene ) ) . ')' );
		preveri( ! array_diff( $obvezne, $rabljene ), "{$id} {$j}: vsa polja in elementi so uporabljeni (" . implode( ',', array_diff( $obvezne, $rabljene ) ) . ')' );
		preveri( false === strpos( preg_replace( '/\{\{[^}]+\}\}/', '', $t['besedilo'][ $j ] ), '{' ), "{$id} {$j}: brez starih {placeholderjev}" );
	}
	sort( $po_jezikih['en'] );
	sort( $po_jezikih['sl'] );
	preveri( $po_jezikih['en'] === $po_jezikih['sl'], "{$id}: EN in SL uporabljata iste reže" );
	preveri( isset( $t['shema']['elementi'] ) && is_array( $t['shema']['elementi'] ), "{$id}: ima shemo predogleda" );
}
