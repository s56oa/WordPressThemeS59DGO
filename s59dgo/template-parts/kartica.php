<?php
/**
 * Kartica objave v mreži.
 *
 * @package s59dgo
 */

defined( 'ABSPATH' ) || exit;

?>
<article id="objava-<?php the_ID(); ?>" <?php post_class( 'kartica' ); ?>>
	<a class="kartica__slika" href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true">
		<?php s59dgo_slika_kartice(); ?>
	</a>
	<div class="kartica__meta">
		<?php echo wp_kses( s59dgo_kategorija() . s59dgo_datum(), s59dgo_dovoljen_html_meta() ); ?>
	</div>
	<h2 class="kartica__naslov"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
	<div class="kartica__izvlecek"><?php the_excerpt(); ?></div>
</article>
