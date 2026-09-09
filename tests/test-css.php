<?php
require __DIR__ . '/preveri.php';
$css = file_get_contents( __DIR__ . '/../s59dgo/style.css' );
preveri( substr_count( $css, '{' ) === substr_count( $css, '}' ), 'zaviti oklepaji so uravnoteženi' );
foreach ( array(
	'--barva-ozadje: #eef3f8;', '--barva-glava: #15304f;', '--barva-poudarek: #d9702a;', '--barva-poudarek-besedilo: #b0561a;', '--barva-poudarek-hover: #8a4312;', '--barva-noga: #ffffff;',
	'@media (prefers-color-scheme: dark)', '--barva-ozadje: #0f1c2b;', '--barva-poudarek: #f0955a;',
	'.preskoci', '.vizualno-skrito', '.glava {', 'position: sticky;', '.glava__meni', '.podmeni__preklop', '.trak {', '.trak--velik', '.trak__greben', '.noga {', '.noga__stolpci',
	'@media (max-width: 899px)', '@media (min-width: 900px)',
) as $iskano ) {
	preveri( false !== strpos( $css, $iskano ), "style.css vsebuje {$iskano}" );
}
foreach ( array(
	'.mreza {', 'grid-template-columns: repeat(3, minmax(0, 1fr));', '.kartica {', '.kartica__naslov', '.kartica__nadomestna',
	'.pagination', '.besedilo > *', '.besedilo > .alignwide', '.besedilo > .alignfull', '.objava__slika', '.post-navigation', '.komentarji {', '.vsebina--404', '.prazno {',
	'@media (max-width: 1099px)', '@media (max-width: 639px)',
) as $iskano ) {
	preveri( false !== strpos( $css, $iskano ), "style.css vsebuje {$iskano}" );
}
