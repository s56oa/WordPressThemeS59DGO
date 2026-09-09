<?php
/**
 * Telo statične strani (naslov je v traku).
 *
 * @package s59dgo
 */

defined( 'ABSPATH' ) || exit;

?>
<article id="stran-<?php the_ID(); ?>" <?php post_class( 'stran' ); ?>>
	<div class="besedilo">
		<?php
		the_content();
		wp_link_pages(
			array(
				'before' => '<nav class="objava__strani">' . esc_html__( 'Strani:', 's59dgo' ),
				'after'  => '</nav>',
			)
		);
		?>
	</div>
</article>
