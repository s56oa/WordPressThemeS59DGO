<?php
/**
 * Glava strani: logotip, ime, meni, iskanje; nato trak z grebenom.
 *
 * @package s59dgo
 */

defined( 'ABSPATH' ) || exit;

?>
<!doctype html>
<html <?php language_attributes(); ?> class="brez-js">
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<script>document.documentElement.classList.remove('brez-js');</script>
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="preskoci" href="#vsebina"><?php esc_html_e( 'Preskoči na vsebino', 's59dgo' ); ?></a>

<header class="glava">
	<div class="ovoj glava__vrstica">
		<div class="glava__znamka">
			<?php
			if ( has_custom_logo() ) {
				the_custom_logo();
			}
			$s59dgo_opis = get_bloginfo( 'description' );
			?>
			<div class="glava__imena">
				<a class="glava__ime" href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><?php bloginfo( 'name' ); ?></a>
				<?php if ( $s59dgo_opis ) : ?>
					<span class="glava__podnaslov"><?php echo esc_html( $s59dgo_opis ); ?></span>
				<?php endif; ?>
			</div>
		</div>

		<div class="glava__gumbi">
			<button type="button" class="glava__iskanje-preklop" aria-controls="glava-iskanje" aria-expanded="false">
				<span class="vizualno-skrito"><?php esc_html_e( 'Iskanje', 's59dgo' ); ?></span>
				<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path></svg>
			</button>
			<button type="button" class="glava__preklop" aria-controls="glavni-meni" aria-expanded="false">
				<span class="vizualno-skrito"><?php esc_html_e( 'Meni', 's59dgo' ); ?></span>
				<svg class="ikona-meni" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>
				<svg class="ikona-zapri" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>
			</button>
		</div>

		<nav id="glavni-meni" class="glava__meni" aria-label="<?php esc_attr_e( 'Glavni meni', 's59dgo' ); ?>" data-oznaka-podmeni="<?php esc_attr_e( 'Odpri podmeni', 's59dgo' ); ?>">
			<?php
			if ( has_nav_menu( 'glavni' ) ) {
				wp_nav_menu(
					array(
						'theme_location' => 'glavni',
						'container'      => false,
						'menu_class'     => 'meni',
						'depth'          => 2,
						'fallback_cb'    => false,
					)
				);
			} elseif ( current_user_can( 'edit_theme_options' ) ) {
				printf(
					'<p class="glava__opomba"><a href="%s">%s</a></p>',
					esc_url( admin_url( 'nav-menus.php' ) ),
					esc_html__( 'Dodelite meni lokaciji »Glavni meni« (Videz → Meniji).', 's59dgo' )
				);
			}
			?>
		</nav>
	</div>

	<div id="glava-iskanje" class="glava__iskanje" hidden>
		<div class="ovoj">
			<?php get_search_form(); ?>
		</div>
	</div>
</header>

<?php
get_template_part( 'template-parts/trak' );
