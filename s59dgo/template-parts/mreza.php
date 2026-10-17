<?php
/**
 * Mreža objav s paginacijo; skupna za home, index, archive, search.
 *
 * @package s59dgo
 */

defined( 'ABSPATH' ) || exit;

?>
<main id="vsebina" class="vsebina">
	<div class="ovoj">
		<?php if ( have_posts() ) : ?>
			<div class="mreza">
				<?php
				while ( have_posts() ) :
					the_post();
					get_template_part( 'template-parts/kartica' );
				endwhile;
				?>
			</div>
			<?php
			the_posts_pagination(
				array(
					'prev_text'          => '‹ ' . __( 'Novejše objave', 's59dgo' ),
					'next_text'          => __( 'Starejše objave', 's59dgo' ) . ' ›',
					'screen_reader_text' => __( 'Navigacija po objavah', 's59dgo' ),
				)
			);
			?>
		<?php else : ?>
			<div class="prazno">
				<p><?php esc_html_e( 'Ni objav, ki bi ustrezale.', 's59dgo' ); ?></p>
				<?php get_search_form(); ?>
			</div>
		<?php endif; ?>
	</div>
</main>
