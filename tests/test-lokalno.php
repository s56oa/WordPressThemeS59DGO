<?php
require __DIR__ . '/preveri.php';
$koren = __DIR__ . '/../';
$cesta = $koren . 'lokalno/docker-compose.yml';
preveri( file_exists( $cesta ), 'lokalno/docker-compose.yml obstaja' );
$compose = file_get_contents( $cesta );
foreach ( array( 'internal: true', '127.0.0.1:8059:80', '../s59dgo:/var/www/html/wp-content/themes/s59dgo:ro', 'mariadb:10.11', 'wordpress:php8.5-apache', 'wordpress:cli-php8.5', '../prod_backups:/backup:ro' ) as $iskano ) {
	preveri( false !== strpos( $compose, $iskano ), "docker-compose.yml vsebuje {$iskano}" );
}
// Omrežje »zunanje« sme biti le v storitvi prenos (in v definiciji omrežij).
$deli      = explode( "\nnetworks:", $compose );
$storitve  = $deli[0];
$brez      = preg_replace( '/^  prenos:\n(?:    .*\n|\n)*/m', '', $storitve );
preveri( false !== strpos( $storitve, 'zunanje' ), 'storitev prenos uporablja omrežje zunanje' );
preveri( false === strpos( $brez, 'zunanje' ), 'omrežje zunanje je samo v storitvi prenos' );
// Omrežje »objava« (ni notranje) sme biti le v storitvi vrata, ki posreduje samo na wp:80.
$brez_vrat = preg_replace( '/^  vrata:\n(?:    .*\n|\n)*/m', '', $storitve );
preveri( 1 === preg_match( '/^  vrata:\n(?:    .*\n|\n)*?      - objava\n/m', $storitve ), 'storitev vrata uporablja omrežje objava' );
preveri( false === strpos( $brez_vrat, 'objava' ), 'omrežje objava je samo v storitvi vrata' );
preveri( false !== strpos( $compose, 'TCP-LISTEN:80,fork,reuseaddr TCP:wp:80' ), 'vrata posredujejo samo na wp:80' );
preg_match( '/^  brskalnik:\n((?:    .*\n|\n)*)/m', $storitve, $brskalnik );
preveri( isset( $brskalnik[1] ) && 1 === preg_match( '/^    init: true$/m', $brskalnik[1] ), 'brskalnik ima init: true' );
preg_match_all( '/^\s*image:\s*(\S+)/m', $compose, $slike );
foreach ( $slike[1] as $slika ) {
	if ( 0 === strpos( $slika, 'ghcr.io/validator/validator' ) ) {
		continue;
	}
	preveri( ':latest' !== substr( $slika, -7 ), "slika {$slika} ni :latest" );
}
$ignore = file_get_contents( $koren . '.gitignore' );
preveri( 1 === preg_match( '/^prod_backups\/$/m', $ignore ), '.gitignore ignorira prod_backups/' );

// Obnova iz backupa (lokalno/obnovi.sh) in vgradnje v Compose.
foreach ( array( './mu-plugins/s59dgo-lokalno.php:/var/www/html/wp-content/mu-plugins/s59dgo-lokalno.php:ro', './wp:/lokalno-wp:ro', './obnovi.sh:/lokalno/obnovi.sh:ro' ) as $iskano ) {
	preveri( false !== strpos( $compose, $iskano ), "docker-compose.yml vsebuje {$iskano}" );
}
preveri( 2 === substr_count( $compose, './mu-plugins/s59dgo-lokalno.php:' ), 'mu-plugin je vgrajen v wp in cli' );
$cesta = $koren . 'lokalno/obnovi.sh';
preveri( file_exists( $cesta ), 'lokalno/obnovi.sh obstaja' );
$obnovi = file_get_contents( $cesta );
$zamenjave = array();
foreach ( array( 's59dgo.si', 's59dgo.org' ) as $domena ) {
	foreach ( array( "www.{$domena}", $domena ) as $gostitelj ) {
		$zamenjave[] = "'https://{$gostitelj}' 'http://localhost:8059'";
		$zamenjave[] = "'http://{$gostitelj}' 'http://localhost:8059'";
		$zamenjave[] = "'//{$gostitelj}' '//localhost:8059'";
	}
}
// Za tem še poševnice, ubežane v JSON (bloki, nastavitve vtičnikov): https:\/\/… → http:\/\/localhost:8059.
foreach ( array( 's59dgo.si', 's59dgo.org' ) as $domena ) {
	foreach ( array( "www.{$domena}", $domena ) as $gostitelj ) {
		$zamenjave[] = "'https:\\/\\/{$gostitelj}' 'http:\\/\\/localhost:8059'";
		$zamenjave[] = "'http:\\/\\/{$gostitelj}' 'http:\\/\\/localhost:8059'";
		$zamenjave[] = "'\\/\\/{$gostitelj}' '\\/\\/localhost:8059'";
	}
}
$odmik = 0;
foreach ( $zamenjave as $par ) {
	$najdeno = strpos( $obnovi, $par, $odmik );
	preveri( false !== $najdeno, "obnovi.sh zamenja {$par} v pravem vrstnem redu" );
	$odmik = $najdeno + strlen( $par );
}
preveri( false !== strpos( $obnovi, 'wp search-replace "$od" "$na" --all-tables-with-prefix --precise --quiet' ), 'obnovi.sh uporablja wp search-replace prek vseh tabel s predpono' );
preveri( false !== strpos( $obnovi, 'plugin deactivate two-factor backuply' ), 'obnovi.sh izklopi two-factor in backuply' );
preveri( 1 !== preg_match( '#(cp|mv|tar)[^\n]*themes/s59dgo/#', $obnovi ), 'obnovi.sh ne kopira v themes/s59dgo/' );
foreach ( array( "--exclude='wp-content/themes/s59dgo'", "--exclude='wp-content/backuply'", "--exclude='wp-content/backups_*'" ) as $iskano ) {
	preveri( false !== strpos( $obnovi, $iskano ), "obnovi.sh vsebuje {$iskano}" );
}
preveri( false === strpos( $obnovi, "--exclude='wp-content/plugins/backuply'" ), 'obnovi.sh kopira vtičnik backuply (izklopi ga šele v bazi)' );
foreach ( array( "WP_DEBUG_LOG '/stanje/debug.log'", "WP_ENVIRONMENT_TYPE 'local'", 'WP_HTTP_BLOCK_EXTERNAL true', 'DISABLE_WP_CRON true', 'AUTOMATIC_UPDATER_DISABLED true', 'WP_DEBUG_DISPLAY false', '--dbprefix="$predpona"', 'rewrite flush --hard', 'eval-file /lokalno-wp/stanje-produkcije.php' ) as $iskano ) {
	preveri( false !== strpos( $obnovi, $iskano ), "obnovi.sh vsebuje {$iskano}" );
}
preveri( file_exists( $koren . 'lokalno/wp/stanje-produkcije.php' ), 'lokalno/wp/stanje-produkcije.php obstaja' );
$stanje = (string) @file_get_contents( $koren . 'lokalno/wp/stanje-produkcije.php' );
foreach ( array( "'arhiv'", "'cas_arhiva'", "'jedro'", "'predpona'", "'slike'", "'nastavitve'", "'php_v_uploads'", "'ima_kartica'", "'ima_deljenje'", "'posts_per_page'", "'meni_glavni'", "'logotip'", "'gradniki'", "'tema'" ) as $kljuc ) {
	preveri( false !== strpos( $stanje, $kljuc ), "stanje-produkcije.php izpiše ključ {$kljuc}" );
}
preveri( 1 === preg_match( "/'has_password'\\s*=>\\s*false/", $stanje ), 'stanje-produkcije.php izpusti objave z geslom (kot naslovi.php)' );
$bin = file_get_contents( $koren . 'bin/lokalno.sh' );
preveri( false === strpos( $bin, 'še ni izveden' ), 'bin/lokalno.sh izvede ukaz obnovi' );
preveri( 1 === preg_match( '/run --rm[^\n]* prenos wp core download[^\n]*--locale=sl_SI/', $bin ), 'bin/lokalno.sh prenese jedro v vsebniku prenos (sl_SI)' );

// Preverjanje (bin/preveri-lokalno.sh, Task 4).
$naslovi = (string) @file_get_contents( $koren . 'lokalno/wp/naslovi.php' );
preveri( 1 === preg_match( "/'post_status'\\s*=>\\s*'publish'/", $naslovi ), "naslovi.php vsebuje 'post_status' => 'publish'" );
preveri( substr_count( $naslovi, "'post_status'" ) === preg_match_all( "/'post_status'\\s*=>\\s*'publish'/", $naslovi ), 'naslovi.php: vsak post_status je publish' );
preveri( false === strpos( $naslovi, "'any'" ), 'naslovi.php ne jemlje neobjavljenih vsebin' );
$preveri_sh = (string) @file_get_contents( $koren . 'bin/preveri-lokalno.sh' );
$izprazni   = strpos( $preveri_sh, ': > /stanje/debug.log' );
$naslovi_k  = strpos( $preveri_sh, 'eval-file /lokalno-wp/naslovi.php' );
$kontrole   = strpos( $preveri_sh, 'preveri.mjs' );
preveri( false !== $izprazni && false !== $kontrole && $izprazni < $kontrole, 'bin/preveri-lokalno.sh izprazni debug.log pred zagonom kontrol' );
preveri( false !== $naslovi_k && $naslovi_k < $izprazni, 'bin/preveri-lokalno.sh požene WP-CLI (naslovi.php) pred praznjenjem debug.log' );
preveri( false !== strpos( $preveri_sh, 'preveri_pripravljenost' ), 'bin/preveri-lokalno.sh pokliče preveri_pripravljenost' );
preveri( false !== strpos( $preveri_sh, 'dc up -d db wp vrata' ), 'bin/preveri-lokalno.sh zažene tudi vrata' );
$pobrisi_por = strpos( $preveri_sh, 'rm -f dist/preverjanje/porocilo.html dist/preverjanje/najdbe.json' );
$prvi_pogoj  = strpos( $preveri_sh, 'preveri_docker' );
preveri( false !== $pobrisi_por && false !== $prvi_pogoj && $pobrisi_por < $prvi_pogoj, 'bin/preveri-lokalno.sh pobriše staro poročilo pred prvim preverjanjem' );
$gradnja = strpos( $preveri_sh, 'dc --profile preverjanje build brskalnik' );
$zagon   = strpos( $preveri_sh, 'run --rm -T brskalnik' );
preveri( false !== $gradnja && false !== $zagon && $gradnja < $zagon, 'bin/preveri-lokalno.sh zgradi brskalnik pred zagonom' );
preveri( false !== strpos( $preveri_sh, 'preveri_vrata' ), 'bin/preveri-lokalno.sh preveri port pred zagonom vrat' );
// Port preverjajo samo ukazi, ki zaženejo vrata; dol in pobrisi ne.
preveri( 1 === preg_match( '/^preveri_docker \|\| exit 1$/m', $bin ), 'bin/lokalno.sh preveri Docker za vse ukaze' );
foreach ( array( 'gor', 'odpri', 'obnovi' ) as $ukaz ) {
	preveri( 1 === preg_match( '/^  ' . $ukaz . '\)\n    preveri_vrata \|\| exit 1$/m', $bin ), "bin/lokalno.sh {$ukaz} preveri port" );
}
foreach ( array( 'dol', 'pobrisi' ) as $ukaz ) {
	preveri( 1 === preg_match( '/^  ' . $ukaz . '\)\n((?:    .*\n)*)/m', $bin, $veja ) && false === strpos( $veja[1], 'preveri_vrata' ), "bin/lokalno.sh {$ukaz} ne preverja porta" );
}
preveri( 1 === preg_match( '/^  odpri\)\n(?:    .*\n)*?    dc up -d db wp vrata\n(?:    .*\n)*?    open /m', $bin ), 'bin/lokalno.sh odpri zažene db, wp in vrata pred open' );
foreach ( array( 'stanje:/stanje:ro', '../dist/preverjanje:/porocilo', './preverjanje:/opt/preverjanje/src:ro' ) as $iskano ) {
	preveri( false !== strpos( $compose, $iskano ), "docker-compose.yml (brskalnik) vsebuje {$iskano}" );
}
// stanje-produkcije.json: staro se pobriše, novo gre v začasno datoteko, preveri se JSON, nato mv.
$brisi = strpos( $obnovi, 'rm -f /stanje/stanje-produkcije.json' );
$zacas = strpos( $obnovi, '> /stanje/stanje-produkcije.json.tmp' );
$json  = strpos( $obnovi, 'JSON_THROW_ON_ERROR' );
$mv    = strpos( $obnovi, 'mv /stanje/stanje-produkcije.json.tmp /stanje/stanje-produkcije.json' );
preveri( false !== $brisi && false !== $zacas && $brisi < $zacas, 'obnovi.sh na začetku pobriše staro stanje-produkcije.json' );
preveri( false !== $zacas && false !== $json && false !== $mv && $zacas < $json && $json < $mv, 'obnovi.sh zapiše stanje v .tmp, preveri JSON in ga premakne' );
preveri( false === strpos( $obnovi, '--path="$html" > /stanje/stanje-produkcije.json' . "\n" ), 'obnovi.sh ne piše stanja neposredno' );
// bin/preveri-lokalno.sh zažene validator (profil preverjanje); dol in pobrisi ga morata ustaviti.
preveri( false !== strpos( $bin, 'dc --profile preverjanje down' . "\n" ), 'bin/lokalno.sh dol ustavi tudi validator' );
preveri( false !== strpos( $bin, 'dc --profile preverjanje down -v' ), 'bin/lokalno.sh pobrisi ustavi tudi validator' );

// Izdana verzija za primerjavo in kontrola 1 (Task 5).
$cesta = $koren . 'lokalno/pripravi-izdano.sh';
preveri( file_exists( $cesta ), 'lokalno/pripravi-izdano.sh obstaja' );
$izdana = (string) @file_get_contents( $cesta );
preveri( false !== strpos( $izdana, 'git describe --tags --abbrev=0' ), 'pripravi-izdano.sh vzame zadnji git tag' );
preveri( false !== strpos( $izdana, 's59dgo-izdana' ), 'pripravi-izdano.sh namesti temo s59dgo-izdana' );
preveri( false === strpos( $izdana, 'themes/s59dgo/' ) && 1 !== preg_match( '#themes/s59dgo(["\'\s]|$)#m', $izdana ), 'pripravi-izdano.sh ne piše v wp-content/themes/s59dgo/' );
preveri( false !== strpos( $izdana, 'theme_mods_s59dgo-izdana' ) && false !== strpos( $izdana, 'option update' ), 'pripravi-izdano.sh kopira theme_mods na s59dgo-izdana' );
$priprava = strpos( $preveri_sh, 'lokalno/pripravi-izdano.sh' );
$regen_k  = strpos( $preveri_sh, '--image_size=s59dgo-kartica' );
$regen_d  = strpos( $preveri_sh, '--image_size=s59dgo-deljenje' );
preveri( false !== $priprava && $priprava < $izprazni, 'bin/preveri-lokalno.sh pripravi izdano temo pred praznjenjem debug.log' );
preveri( false !== $regen_k && false !== $regen_d && $regen_k < $izprazni && $regen_d < $izprazni, 'bin/preveri-lokalno.sh regenerira izreza pred praznjenjem debug.log' );
preveri( false !== $regen_k && $regen_k < $naslovi_k, 'bin/preveri-lokalno.sh regenerira izreza pred naslovi.php (URL-ji izrezov)' );
preveri( false === strpos( $naslovi, 'gmdate(' ), 'naslovi.php: datumski arhiv po lokalnem času' );
preveri( false !== strpos( $naslovi, "'slike'" ), 'naslovi.php izpiše URL-je naslovnih slik' );

// Dokumentacija in korak v skillu izdaje (Task 7).
$claude = (string) @file_get_contents( $koren . 'CLAUDE.md' );
$readme = (string) @file_get_contents( $koren . 'README.md' );
$skill  = (string) @file_get_contents( $koren . '.claude/skills/s59dgo-izdaja-teme/SKILL.md' );
foreach ( array( 'bin/preveri-lokalno.sh', 'bin/lokalno.sh', 'prod_backups/', 'http://localhost:8059' ) as $iskano ) {
	preveri( false !== strpos( $claude, $iskano ), "CLAUDE.md vsebuje {$iskano}" );
}
preveri( false !== strpos( $readme, 'bin/preveri-lokalno.sh' ) && false !== strpos( $readme, 'zasebne podatke' ), 'README.md opisuje lokalno preverjanje in zasebne podatke' );
preveri( false !== strpos( $skill, 'bin/preveri-lokalno.sh' ) && false !== strpos( $skill, 'prod_backups/' ), 'SKILL.md izdaje vsebuje bin/preveri-lokalno.sh in prod_backups/' );
preveri( strpos( $skill, 'bin/preveri-lokalno.sh' ) < strpos( $skill, '**Preverjanje in zip**' ), 'SKILL.md: lokalno preverjanje je pred korakom Preverjanje in zip' );
preveri( false !== strpos( $skill, 'izhodni kodi ≠ 0' ) && false === strpos( $skill, 'izhodni kodi 1' ), 'SKILL.md: izdaja se ustavi ob vsaki izhodni kodi ≠ 0' );
foreach ( array( 'CLAUDE.md' => $claude, 'README.md' => $readme ) as $ime => $besedilo ) {
	preveri( 1 === preg_match( '/^bin\/test\.sh .*tests\/lokalno\.test\.mjs.*tests\/lokalno\.test\.sh.*bash:5\.2/m', $besedilo ), "{$ime}: bin/test.sh omeni tests/lokalno.test.mjs in tests/lokalno.test.sh (bash:5.2)" );
}
preveri( false !== strpos( $claude, 'gradnja slike `brskalnik`' ) && false !== strpos( $claude, 'objava' ) && false !== strpos( $claude, 'wp:80' ), 'CLAUDE.md: internet le za prenos in gradnjo brskalnika, vrata na objava samo do wp:80' );
$spec = (string) @file_get_contents( $koren . 'docs/superpowers/specs/2026-10-17-s59dgo-lokalni-wordpress-design.md' );
$odd9 = (string) strstr( $spec, '## 9.' );
preveri( 1 === preg_match( '/[Kk]ontrola 8[^\n]*posnet[^\n]*`napaka`/', $odd9 ), 'specifikacija §9: kontrola 8 javi neuspel posnetek kot napaka' );
