<?php
require __DIR__ . '/preveri.php';
$f = file_get_contents( __DIR__ . '/../s59dgo/footer.php' );
foreach ( array( '<footer class="noga">', "is_active_sidebar( 'noga-1' )", "array( 'noga-1', 'noga-2', 'noga-3' )", 'dynamic_sidebar(', 'class="noga__spodaj"', "date_i18n( 'Y' )", "apply_filters( 's59dgo_noga_besedilo', '' )", 'wp_kses_post(', '<?php wp_footer(); ?>', '</html>' ) as $iskano ) {
	preveri( false !== strpos( $f, $iskano ), "footer.php vsebuje {$iskano}" );
}
