<?php
require __DIR__ . '/preveri.php';
$h = file_get_contents( __DIR__ . '/../s59dgo/header.php' );
foreach ( array(
	'<html <?php language_attributes(); ?> class="brez-js">',
	"document.documentElement.classList.remove('brez-js')",
	'<meta name="viewport" content="width=device-width, initial-scale=1">',
	'<?php wp_head(); ?>',
	'<?php wp_body_open(); ?>',
	'<a class="preskoci" href="#vsebina">',
	'class="glava__preklop" aria-controls="glavni-meni" aria-expanded="false"',
	'id="glavni-meni" class="glava__meni"',
	'data-oznaka-podmeni=',
	"'theme_location' => 'glavni'",
	"'fallback_cb'",
	"current_user_can( 'edit_theme_options' )",
	'class="glava__iskanje-preklop" aria-controls="glava-iskanje" aria-expanded="false"',
	'id="glava-iskanje" class="glava__iskanje" hidden',
	"get_template_part( 'template-parts/trak' )",
) as $iskano ) {
	preveri( false !== strpos( $h, $iskano ), "header.php vsebuje {$iskano}" );
}
$s = file_get_contents( __DIR__ . '/../s59dgo/searchform.php' );
preveri( false !== strpos( $s, 'class="iskanje"' ), 'searchform ima form.iskanje' );
preveri( false !== strpos( $s, 'type="search"' ), 'searchform ima input search' );
preveri( false !== strpos( $s, 'name="s"' ), 'searchform ima name=s' );
$svg = file_get_contents( __DIR__ . '/../s59dgo/assets/img/greben.svg' );
preveri( false !== strpos( $svg, 'viewBox="0 0 800 520"' ), 'greben.svg 800x520' );
