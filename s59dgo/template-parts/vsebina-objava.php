<?php
/**
 * Telo posamezne objave (naslov je v traku).
 *
 * @package s59dgo
 */

defined( 'ABSPATH' ) || exit;

?>
<article id="objava-<?php the_ID(); ?>" <?php post_class( 'objava' ); ?>>
	<?php if ( has_post_thumbnail() ) : ?>
		<figure class="objava__slika ovoj ovoj--siroko">
			<?php the_post_thumbnail( 'large' ); ?>
		</figure>
	<?php endif; ?>

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

	<footer class="objava__noga ovoj ovoj--besedilo">
		<?php the_tags( '<div class="objava__oznake"><span class="screen-reader-text">' . esc_html__( 'Oznake:', 's59dgo' ) . '</span>', ' ', '</div>' ); ?>
		<?php
		the_post_navigation(
			array(
				'prev_text' => '<span class="nav-oznaka">' . esc_html__( 'Prejšnja objava', 's59dgo' ) . '</span><span class="nav-naslov">%title</span>',
				'next_text' => '<span class="nav-oznaka">' . esc_html__( 'Naslednja objava', 's59dgo' ) . '</span><span class="nav-naslov">%title</span>',
			)
		);
		?>
	</footer>

	<?php
	if ( comments_open() || get_comments_number() ) {
		comments_template();
	}
	?>
</article>
