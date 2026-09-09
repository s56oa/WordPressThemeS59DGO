<?php
/**
 * Komentarji.
 *
 * @package s59dgo
 */

defined( 'ABSPATH' ) || exit;

if ( post_password_required() ) {
	return;
}
?>
<section id="komentarji" class="komentarji ovoj ovoj--besedilo">
	<?php if ( have_comments() ) : ?>
		<h2 class="komentarji__naslov">
			<?php
			/* translators: %s: število komentarjev */
			printf( esc_html__( 'Komentarji (%s)', 's59dgo' ), esc_html( number_format_i18n( get_comments_number() ) ) );
			?>
		</h2>
		<ol class="komentarji__seznam">
			<?php
			wp_list_comments(
				array(
					'style'       => 'ol',
					'avatar_size' => 48,
					'short_ping'  => true,
				)
			);
			?>
		</ol>
		<?php the_comments_navigation(); ?>
	<?php endif; ?>

	<?php if ( ! comments_open() && get_comments_number() ) : ?>
		<p class="komentarji__zaprto"><?php esc_html_e( 'Komentiranje je zaprto.', 's59dgo' ); ?></p>
	<?php endif; ?>

	<?php
	comment_form(
		array(
			'title_reply'  => __( 'Napišite komentar', 's59dgo' ),
			'label_submit' => __( 'Objavi komentar', 's59dgo' ),
		)
	);
	?>
</section>
