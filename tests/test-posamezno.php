<?php
require __DIR__ . '/preveri.php';
$koren = __DIR__ . '/../s59dgo/';
$single = file_get_contents( $koren . 'single.php' );
preveri( false !== strpos( $single, "get_template_part( 'template-parts/vsebina', 'objava' )" ), 'single.php nalaga vsebina-objava' );
$page = file_get_contents( $koren . 'page.php' );
preveri( false !== strpos( $page, "get_template_part( 'template-parts/vsebina', 'stran' )" ), 'page.php nalaga vsebina-stran' );
$objava = file_get_contents( $koren . 'template-parts/vsebina-objava.php' );
foreach ( array( "post_class( 'objava' )", 'has_post_thumbnail()', 'class="objava__slika ovoj ovoj--siroko"', 'class="besedilo"', 'the_content();', 'wp_link_pages(', 'the_tags(', 'the_post_navigation(', "'Prejšnja objava'", "'Naslednja objava'", 'comments_open() || get_comments_number()', 'comments_template();' ) as $iskano ) {
	preveri( false !== strpos( $objava, $iskano ), "vsebina-objava.php vsebuje {$iskano}" );
}
$stran = file_get_contents( $koren . 'template-parts/vsebina-stran.php' );
foreach ( array( "post_class( 'stran' )", 'class="besedilo"', 'the_content();' ) as $iskano ) {
	preveri( false !== strpos( $stran, $iskano ), "vsebina-stran.php vsebuje {$iskano}" );
}
preveri( false === strpos( $stran, 'the_post_thumbnail' ), 'stran brez naslovne slike' );
$komentarji = file_get_contents( $koren . 'comments.php' );
foreach ( array( 'post_password_required()', 'id="komentarji"', 'wp_list_comments(', 'the_comments_navigation();', 'comment_form(' ) as $iskano ) {
	preveri( false !== strpos( $komentarji, $iskano ), "comments.php vsebuje {$iskano}" );
}
$napaka = file_get_contents( $koren . '404.php' );
foreach ( array( 'class="vsebina vsebina--404"', 'class="prazno"', 'get_search_form()', "home_url( '/' )" ) as $iskano ) {
	preveri( false !== strpos( $napaka, $iskano ), "404.php vsebuje {$iskano}" );
}
