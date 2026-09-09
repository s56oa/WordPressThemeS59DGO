<?php
/**
 * Noga: trije stolpci gradnikov in spodnja vrstica.
 *
 * @package s59dgo
 */

defined( 'ABSPATH' ) || exit;

$s59dgo_obmocja = array( 'noga-1', 'noga-2', 'noga-3' );
$s59dgo_aktivna = is_active_sidebar( 'noga-1' ) || is_active_sidebar( 'noga-2' ) || is_active_sidebar( 'noga-3' );
$s59dgo_dodatno = apply_filters( 's59dgo_noga_besedilo', '' );
?>
<footer class="noga">
	<div class="ovoj">
		<?php if ( $s59dgo_aktivna ) : ?>
			<div class="noga__stolpci">
				<?php foreach ( $s59dgo_obmocja as $s59dgo_obmocje ) : ?>
					<?php if ( is_active_sidebar( $s59dgo_obmocje ) ) : ?>
						<div class="noga__stolpec"><?php dynamic_sidebar( $s59dgo_obmocje ); ?></div>
					<?php endif; ?>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>

		<div class="noga__spodaj">
			<span>© <?php echo esc_html( date_i18n( 'Y' ) ); ?> <?php bloginfo( 'name' ); ?> · S59DGO</span>
			<?php if ( $s59dgo_dodatno ) : ?>
				<span><?php echo wp_kses_post( $s59dgo_dodatno ); ?></span>
			<?php endif; ?>
		</div>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
