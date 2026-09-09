<?php
/**
 * Temno modri trak z grebenom pod glavo.
 *
 * @package s59dgo
 */

defined( 'ABSPATH' ) || exit;

$s59dgo_trak = s59dgo_trak_podatki();
?>
<section class="trak<?php echo $s59dgo_trak['velik'] ? ' trak--velik' : ''; ?>">
	<div class="ovoj trak__vsebina">
		<h1 class="trak__naslov"><?php echo esc_html( $s59dgo_trak['naslov'] ); ?></h1>
		<?php if ( '' !== $s59dgo_trak['podnaslov'] ) : ?>
			<p class="trak__podnaslov"><?php echo esc_html( $s59dgo_trak['podnaslov'] ); ?></p>
		<?php endif; ?>
		<?php if ( '' !== $s59dgo_trak['meta'] ) : ?>
			<div class="trak__meta"><?php echo wp_kses( $s59dgo_trak['meta'], s59dgo_dovoljen_html_meta() ); ?>
		<?php endif; ?>
	</div>
	<svg class="trak__greben" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true" focusable="false">
		<path d="M0 90 L0 62 L120 48 L230 60 L340 30 L420 44 L520 18 L610 40 L700 8 L790 36 L880 22 L980 50 L1080 30 L1180 52 L1280 38 L1380 58 L1440 46 L1440 90 Z" fill="currentColor"></path>
		<path d="M0 74 L120 60 L230 72 L340 42 L420 56 L520 30 L610 52 L700 20 L790 48 L880 34 L980 62 L1080 42 L1180 64 L1280 50 L1380 70 L1440 58" fill="none" stroke="#5f86b0" stroke-width="1.5" opacity="0.5"></path>
	</svg>
</section>
