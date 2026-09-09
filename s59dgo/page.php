<?php
/**
 * Statična stran.
 *
 * @package s59dgo
 */

defined( 'ABSPATH' ) || exit;

get_header();
?>
<main id="vsebina" class="vsebina">
	<?php
	while ( have_posts() ) :
		the_post();
		get_template_part( 'template-parts/vsebina', 'stran' );
	endwhile;
	?>
</main>
<?php
get_footer();
