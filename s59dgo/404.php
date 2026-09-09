<?php
/**
 * Stran ne obstaja.
 *
 * @package s59dgo
 */

defined( 'ABSPATH' ) || exit;

get_header();
?>
<main id="vsebina" class="vsebina vsebina--404">
	<div class="ovoj ovoj--besedilo">
		<div class="prazno">
			<p><?php esc_html_e( 'Strani na tem naslovu ni. Poskusite z iskanjem ali se vrnite na domačo stran.', 's59dgo' ); ?></p>
			<?php get_search_form(); ?>
			<p><a class="gumb" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Na domačo stran', 's59dgo' ); ?></a></p>
		</div>
	</div>
</main>
<?php
get_footer();
