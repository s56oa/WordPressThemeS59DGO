# Načrt implementacije: Lokalni WordPress za preverjanje teme S59DGO

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `bin/lokalno.sh obnovi` iz backupa Backuply postavi kopijo www.s59dgo.si na `http://localhost:8059` s temo iz `s59dgo/`; `bin/preveri-lokalno.sh` na njej izvede kontrole 1–9 in zapiše `dist/preverjanje/porocilo.html`.

**Architecture:** Docker Compose projekt `s59dgo-lokalno` v `lokalno/` z notranjim omrežjem brez interneta (db, wp, cli, validator, brskalnik) in enkratnim vsebnikom `prenos` za jedro. Bash v `bin/` orkestrira; podatke iz WordPressa dajejo PHP skripte za `wp eval-file` (izpis JSON); vse preverjanje strani teče v Node (Playwright) v vsebniku `brskalnik`, čista logika (razvrščanje, primerjava z izdano verzijo, stopnje, poročilo) je v enem modulu brez I/O, ki ga testira Node test v `bin/test.sh`.

**Tech Stack:** bash, Docker Compose, `mariadb:10.11`, `wordpress:php8.5-apache`, `wordpress:cli-php8.5`, `ghcr.io/validator/validator`, `mcr.microsoft.com/playwright` (pripeta verzija) z `axe-core`, `pixelmatch`, `pngjs` (pripete verzije), PHP za `wp eval-file`, Node ESM.

**Spec:** `docs/superpowers/specs/2026-10-17-s59dgo-lokalni-wordpress-design.md`

## Global Constraints

- Veja `lokalni-wordpress`, ustvarjena iz `naslovne-slike`. Nič se ne potisne na GitHub brez odobritve.
- Podatki produkcije nikoli v git, `dist/s59dgo.zip` ali mapo repozitorija: samo v imenovanih volumnih Docker (`s59dgo-lokalno_html`, `_baza`, `_stanje`) in v `prod_backups/` (ignorirano). Izjema: `dist/preverjanje/` s posnetki samo objavljenih (`publish`) objav in strani.
- Notranje omrežje `internal: true`; port samo `127.0.0.1:8059:80`. Internet ima samo vsebnik `prenos` (jedro WP) in gradnja slike `brskalnik`.
- Tema: bind mount `../s59dgo` → `/var/www/html/wp-content/themes/s59dgo:ro` v `wp` in `cli`. Obnova ne piše v `themes/s59dgo`.
- Jedro WP sveže v verziji iz `wp-includes/version.php` backupa (2026-10-17: 7.1.3), `--locale=sl_SI`. `wp-config.php` in `.htaccess` iz backupa se ne uporabita.
- Lokalni `wp-config.php` (prek `wp config create`): `WP_DEBUG=true`, `WP_DEBUG_LOG='/stanje/debug.log'`, `WP_DEBUG_DISPLAY=false`, `WP_ENVIRONMENT_TYPE='local'`, `WP_HTTP_BLOCK_EXTERNAL=true`, `DISABLE_WP_CRON=true`, `AUTOMATIC_UPDATER_DISABLED=true`, sveže soli.
- Lokalno izklopljena: `two-factor`, `backuply`. `redirection` in mu-plugin `00-s59dgo-hardening.php` ostaneta.
- Stopnje najdb: `napaka` (izhodna koda 1), `opozorilo`, `rocni-korak`.
- Izdana verzija za primerjavo = zadnji git tag (`git describe --tags --abbrev=0`), tema `s59dgo-izdana`, piškotek `s59dgo_primerjava=izdana`.
- Bash: `#!/usr/bin/env bash`, `set -euo pipefail`, `cd "$(dirname "$0")/.."`, komentar v prvi vrstici kot v obstoječih `bin/*.sh`; izpis in komentarji slovensko; identifikatorji slovensko.
- Commit sporočila slovensko, z vrsticama `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` in `Claude-Session: https://claude.ai/code/session_015ueCL8xcJei9gjNoVfRkW4`.

## Review Focus

1. **Več arhivov ali presledki v imenu v `prod_backups/`** – vzame se najnovejši po času spremembe, poti so pravilno citirane. Test v Task 1 (`najnovejsi_arhiv`).
2. **Docker ne teče ali je port 8059 zaseden** – jasno slovensko sporočilo in izhod 1, ne sled napake Compose. Test v Task 1 (`preveri_docker` z navideznim `docker`).
3. **Ponovna obnova na obstoječih volumnih** – baza in `html` se počistita, rezultat je enak kot ob prvi obnovi; tema iz repozitorija ostane nedotaknjena. Ročni preizkus v Task 2 (dvakratni zagon).
4. **Manjkajoče vrste strani** (ni oznak, ni objave brez slike, ni strani) – odkrivanje naslovov jih izpusti z opozorilom, kontrole ne padejo. Test v Task 3 (`odkrijNaslove` z delnimi podatki).
5. **Izvirnik naslovne slike manjši od 800×520 ali 1200×630** – WordPress izreza ne ustvari; to je `opozorilo` »izvirnik premajhen«, ne `rocni-korak` »Regenerate Thumbnails«, ki ga nikoli ne bi odpravil. Test v Task 3 (`razvrstiSliko`).

---

### Task 1: Ogrodje Compose in `bin/lokalno.sh` (gor, dol, odpri, pobrisi)

**Files:**
- Create: `lokalno/docker-compose.yml`
- Create: `bin/lokalno.sh`
- Create: `lokalno/lib.sh` (skupne bash funkcije za `bin/lokalno.sh` in `bin/preveri-lokalno.sh`)
- Create: `tests/test-lokalno.php` (statični testi datotek, idiom kot `tests/test-mreza.php`)
- Create: `tests/lokalno.test.sh`
- Modify: `bin/test.sh` (doda zagon `tests/lokalno.test.sh` v `bash:5.2`, za Node testom)

**Interfaces:**
- Produces (`lokalno/lib.sh`): `najnovejsi_arhiv <mapa>` → izpiše pot najnovejšega `*.tar.gz` ali vrne 1; `preveri_docker` → vrne 1 s sporočilom »Docker ne teče – zaženi Docker Desktop.« ali »Port 8059 je zaseden.«; `dc …` → `docker compose -p s59dgo-lokalno -f lokalno/docker-compose.yml …`; `wpcli …` → `dc run --rm --user 33:33 cli wp …`.
- Produces (Compose): storitve `db`, `wp`, `cli`, `prenos`, `validator`, `brskalnik`; volumni `html` (`/var/www/html`), `baza`, `stanje` (`/stanje`); omrežji `notranje` (`internal: true`) in `zunanje` (samo `prenos`); profil `preverjanje` za `validator` in `brskalnik`; profil `orodja` za `cli` in `prenos`. `prod_backups/` je v `cli` priklopljen `ro` na `/backup`.

- [ ] **Step 1: Ustvari vejo** `git checkout naslovne-slike && git checkout -b lokalni-wordpress`.

- [ ] **Step 2: Napiši padajoči statični test `tests/test-lokalno.php`**

Preveri v `lokalno/docker-compose.yml`: niz `internal: true`; `127.0.0.1:8059:80`; `../s59dgo:/var/www/html/wp-content/themes/s59dgo:ro`; `mariadb:10.11`; `wordpress:php8.5-apache`; `wordpress:cli-php8.5`; `../prod_backups:/backup:ro`; da se `zunanje` pojavi samo v bloku storitve `prenos` (in definiciji omrežij); da noben `image:` ne konča z `:latest` razen `ghcr.io/validator/validator` (dovoljeno, ker ni verzij). V `.gitignore`: `prod_backups/`.

- [ ] **Step 3: Napiši padajoči `tests/lokalno.test.sh`**

`source lokalno/lib.sh` in preveri:
- `najnovejsi_arhiv` v začasni mapi s `star arhiv.tar.gz` (`touch -d '2026-01-01'`) in `nov.tar.gz` izpiše `…/nov.tar.gz`; v prazni mapi vrne 1.
- `preveri_docker` z navideznim `docker` (funkcija, ki za `info` vrne 1) vrne 1 in izpiše »Docker ne teče«.

Zaženi `bin/test.sh` → pričakovano: pade na `test-lokalno.php` (datoteke ne obstajajo).

- [ ] **Step 4: Napiši `lokalno/docker-compose.yml`, `lokalno/lib.sh` in `bin/lokalno.sh`**

`bin/lokalno.sh <ukaz>`: `gor` (`dc up -d db wp`), `dol` (`dc down`), `odpri` (`open http://localhost:8059`), `pobrisi` (vpraša »Pobrišem vse lokalne podatke produkcije? [d/N]«, nato `dc down -v`), `obnovi` (Task 2), brez ukaza ali neznan → navodilo za uporabo in izhod 1. Vsak ukaz najprej `preveri_docker`. `brskalnik` ima `build: ./preverjanje` (Task 3), `validator` sliko validatorja; obe le v profilu `preverjanje`.

- [ ] **Step 5: Zaženi teste** `bin/test.sh` → pričakovano: vsi OK, izhod 0. Nato `bin/lokalno.sh gor && curl -sI http://localhost:8059 | head -1` → `HTTP/1.1` odziv (namestitveni zaslon WP je pričakovan), `bin/lokalno.sh dol`.

- [ ] **Step 6: Commit** `lokalno/ bin/lokalno.sh tests/ bin/test.sh` – »Lokalni WordPress: Compose ogrodje in bin/lokalno.sh«.

---

### Task 2: Obnova iz backupa in lokalni mu-plugin

**Files:**
- Create: `lokalno/obnovi.sh` (teče v vsebniku `cli`, POSIX `sh`, ker je slika alpine)
- Create: `lokalno/wp/stanje-produkcije.php` (za `wp eval-file`)
- Create: `lokalno/mu-plugins/s59dgo-lokalno.php`
- Modify: `bin/lokalno.sh` (ukaz `obnovi [arhiv]`), `lokalno/docker-compose.yml` (bind mount `./mu-plugins/s59dgo-lokalno.php` v `wp` in `cli`, `./wp` → `/lokalno-wp:ro` v `cli`)
- Test: `tests/test-lokalno-mu.php`, `tests/test-lokalno.php`

**Interfaces:**
- Consumes: `najnovejsi_arhiv`, `preveri_docker`, `dc`, `wpcli` (Task 1).
- Produces: `/stanje/stanje-produkcije.json` z ključi `arhiv` (ime), `cas_arhiva` (ISO), `jedro` (npr. `"7.1.3"`), `predpona`, `slike` (seznam `{objava_id, naslov, priponka_id, sirina, visina, ima_kartica, ima_deljenje}` za objavljene objave z naslovno sliko), `nastavitve` (`{posts_per_page, meni_glavni, logotip, gradniki: {noga-1, noga-2, noga-3}, tema}`), `php_v_uploads` (seznam relativnih poti). Mu-plugin: funkciji `s59dgo_lokalno_primerjalna_tema( string $tema ): string` (vrne `'s59dgo-izdana'`, če `$_COOKIE['s59dgo_primerjava'] === 'izdana'` in mapa teme obstaja, sicer `$tema`) in `s59dgo_lokalno_posta( $null, array $atributi )` (filter `pre_wp_mail`, zapiše prejemnika in zadevo v `error_log`, vrne `false`).

- [ ] **Step 1: Padajoči testi**

`tests/test-lokalno-mu.php` (lastni stubi `add_filter`, `error_log` prek `ini_set('error_log', …)`): brez piškotka `s59dgo_lokalno_primerjalna_tema('s59dgo') === 's59dgo'`; s piškotkom in obstoječo mapo (`WP_CONTENT_DIR` na začasno mapo z `themes/s59dgo-izdana/`) → `'s59dgo-izdana'`; s piškotkom brez mape → `'s59dgo'`; `s59dgo_lokalno_posta(null, ['to' => 'a@b.si', 'subject' => 'Test'])` vrne `false` in dnevnik vsebuje `a@b.si`. Datoteka nima zaključne `?>`.
V `tests/test-lokalno.php` dodaj za `lokalno/obnovi.sh`: zaporedje zamenjav domen je točno
`https://www.s59dgo.si`, `http://www.s59dgo.si`, `//www.s59dgo.si`, `https://s59dgo.si`, `http://s59dgo.si`, `//s59dgo.si`, nato enako za `s59dgo.org` (prvi trije → `http://localhost:8059`, `//…` → `//localhost:8059`; preveri z `strpos` zaporedje); vsebuje `plugin deactivate two-factor backuply`; ne vsebuje `themes/s59dgo/` kot cilja kopiranja; vsebuje `--exclude` za `wp-content/themes/s59dgo` in mape Backuply (`backuply`, `backups_*`).

- [ ] **Step 2: Zaženi** `bin/test.sh` → pade na novih preverjanjih.

- [ ] **Step 3: Implementiraj obnovo**

`bin/lokalno.sh obnovi [arhiv]`: arhiv = argument ali `najnovejsi_arhiv prod_backups`; verzijo jedra prebere z `dc run --rm cli tar -xzOf "/backup/<ime>" wp-includes/version.php` (grep `wp_version`); `dc up -d db wp`; `dc run --rm prenos wp core download --version=<v> --locale=sl_SI --force --skip-content --path=/var/www/html`; nato `dc run --rm --user 33:33 cli sh /lokalno/obnovi.sh "/backup/<ime>"`; na koncu izpiše URL, uporabnika `lokalni` in geslo.
`lokalno/obnovi.sh` (koraki 4.3 speca, v tem vrstnem redu): razpakira v `/tmp/obnova` (v vsebniku), predpono prebere iz `softsql.sql` (prvi `CREATE TABLE \`(\w+?)options\``); počisti `/var/www/html/wp-content` razen `themes/s59dgo` in `mu-plugins/s59dgo-lokalno.php`; kopira `wp-content/` iz arhiva z izključitvami; izpiše `.php` pod `uploads/`; `wp config create … --force` s konstantami iz Global Constraints in `--dbprefix=<predpona>`; `wp db reset --yes`, `wp db import`; zamenjave domen (`wp search-replace <od> <do> --all-tables-with-prefix --precise --quiet`); `wp plugin deactivate two-factor backuply`; `wp user create lokalni lokalni@localhost.invalid --role=administrator --user_pass=<naključno>` (če obstaja: `wp user update … --user_pass`); `wp rewrite flush --hard`; `wp eval-file /lokalno-wp/stanje-produkcije.php "<ime arhiva>" "<čas>" > /stanje/stanje-produkcije.json`; pobriše `/tmp/obnova`; `: > /stanje/debug.log`.
`lokalno/wp/stanje-produkcije.php`: izpiše JSON z ključi iz Interfaces; `ima_kartica`/`ima_deljenje` iz `wp_get_attachment_metadata()['sizes']` in obstoja datoteke na disku.

- [ ] **Step 4: Testi** `bin/test.sh` → vsi OK.

- [ ] **Step 5: Preizkus na pravem backupu**

`bin/lokalno.sh obnovi` → izpis z geslom. Preveri:
- `curl -s -o /dev/null -w '%{http_code}' http://localhost:8059/` → `200`; HTML vsebuje `themes/s59dgo/style.css` in ne vsebuje `www.s59dgo.si`.
- `bin/lokalno.sh` prek `wpcli plugin list --status=active --field=name` → `redirection` (brez `two-factor`, `backuply`).
- `dc exec wp curl -sS -m 5 https://wordpress.org` → napaka (ni povezave).
- `dc run --rm --user 33:33 cli wp eval 'var_dump(wp_mail("a@b.si","T","x"));'` → `bool(false)`.
- `dc run --rm cli cat /stanje/stanje-produkcije.json | head -c 300` → JSON z `"jedro":"7.1.3"` in `"posts_per_page":10`.
- Ponovi `bin/lokalno.sh obnovi` → enak rezultat, brez napak (Review Focus 3).
- Prijava na `http://localhost:8059/wp-admin` z `lokalni` dela brez kode 2FA.

- [ ] **Step 6: Commit** – »Lokalni WordPress: obnova iz backupa Backuply, lokalni mu-plugin«.

---

### Task 3: Vsebnik `brskalnik` in jedro preverjanja (čista logika)

**Files:**
- Create: `lokalno/preverjanje/Dockerfile` (`FROM mcr.microsoft.com/playwright:v1.56.0-noble`, `npm install` pripetih `playwright@1.56.0`, `axe-core`, `pixelmatch`, `pngjs` v `/opt/preverjanje/node_modules`; verzije zapiši v Dockerfile)
- Create: `lokalno/preverjanje/jedro.mjs` (brez I/O, brez uvozov iz `node_modules`)
- Create: `tests/lokalno.test.mjs`
- Modify: `bin/test.sh` (zagon `tests/lokalno.test.mjs` v `node:22-alpine`, kot `prompti.test.mjs`)

**Interfaces (vse izvozi `jedro.mjs`):**
- `najdba(kontrola: number, stopnja: 'napaka'|'opozorilo'|'rocni-korak', sporocilo: string, podrobnosti?: object) → {kontrola, stopnja, sporocilo, podrobnosti}`
- `odkrijNaslove(podatki) → {naslovi: Array<{vrsta, url, pricakovano: 200|404|410}>, najdbe}`; `podatki` je izpis `lokalno/wp/naslovi.php` (Task 4): `{domov, objava_s_sliko, objava_brez_slike, stran, kategorija, oznaka, datum, iskalni_niz}`, vsak ključ URL ali `null`. Doda vedno `domov/page/2/`, `/?s=<iskalni_niz>`, `/?s=zzqx-ni-zadetkov`, `/ta-stran-ne-obstaja-s59dgo/` (404), `/?author=1` (410). Manjkajoč ključ → izpusti in `opozorilo` »Ni primera za vrsto X«.
- `delezObreza(sirina, visina, ciljSirina = 800, ciljVisina = 520) → number` (delež izvirnika, ki se odreže, 0–1).
- `razvrstiSliko(slika, prag = 0.15) → najdba[]` – `slika` iz `stanje-produkcije.json`: izvirnik manjši od cilja v kateri koli meri → `opozorilo` »izvirnik premajhen« (za tisti izrez); manjka izrez, izvirnik dovolj velik → `rocni-korak` »Regenerate Thumbnails«; `delezObreza > prag` → `opozorilo` »opazno obrezana«.
- `jeIzrezKartice(src) → boolean` – `/-800x520\.(jpe?g|png|webp|avif)$/i` na poti brez poizvedbe.
- `preveriOg(meta: Array<{kljuc, vrednost}>, {imaIzrez}) → najdba[]` – pravila kontrole 4.
- `razvrstiZahtevo(url, {izvorStrani, iniciatorUrl, vsebinaUrlji: string[]}) → 'notranja'|'tema'|'vsebina'` – isti izvor = notranja; iniciator pod `/wp-content/themes/s59dgo/` ali `iniciatorUrl === null` z URL-jem, ki ga ni v `vsebinaUrlji` = tema; sicer vsebina.
- `razvrstiKonzolo({besedilo, url}) → 'tema'|'drugo'` – `url` pod `/wp-content/themes/s59dgo/` ali vrstična skripta teme (besedilo vsebuje `brez-js`) = tema.
- `noveNajdbe(trenutne: string[], izdane: string[]) → string[]` – primerja normalizirane ključe (številke vrstic in stolpcev odstranjene).
- `povzetek(najdbe) → {napake, opozorila, rocni, izhod: 0|1}`
- `porociloHtml({cas, arhiv, najdbe, posnetki}) → string` – vsa besedila skozi `ubezi(s)` (`& < > " '`).

- [ ] **Step 1: Padajoči testi v `tests/lokalno.test.mjs`** (idiom `ok(pogoj, sporocilo)` kot `prompti.test.mjs`; uvozi `../lokalno/preverjanje/jedro.mjs`):
- `delezObreza(800, 520) === 0`; `delezObreza(1600, 1040) === 0`; `Math.abs(delezObreza(1000, 1000) - 0.35) < 1e-9`; `delezObreza(1600, 900)` ≈ `1 - (900*800/520)/1600` (≈ 0.1346).
- `razvrstiSliko({sirina: 640, visina: 427, ima_kartica: false, ima_deljenje: false, …})` vsebuje `opozorilo` »izvirnik premajhen« in **ne** vsebuje `rocni-korak` (Review Focus 5); `{sirina: 2000, visina: 1300, ima_kartica: false, ima_deljenje: true}` → točno en `rocni-korak` z »Regenerate Thumbnails«; `{sirina: 1000, visina: 1000, oba true}` → `opozorilo` »opazno obrezana«.
- `jeIzrezKartice('http://localhost:8059/wp-content/uploads/2026/09/a-800x520.jpeg?v=1') === true`; `…/a-1024x683.jpeg` → `false`.
- `odkrijNaslove({domov: 'http://localhost:8059/', oznaka: null, …ostali URL})` – ni naslova vrste `oznaka`, ena najdba `opozorilo` z »oznaka«, ni izjeme (Review Focus 4); vsebuje vrsto `avtor` s `pricakovano === 410` in `404` s `pricakovano === 404`.
- `preveriOg` z dvema `og:title` → `napaka` »podvojena«; prazen `og:description` → `napaka`; `imaIzrez: true` in `og:image:width` 1024 → `napaka`; popoln nabor → `[]`.
- `razvrstiZahtevo('https://fonts.googleapis.com/x', {izvorStrani: 'http://localhost:8059', iniciatorUrl: 'http://localhost:8059/wp-content/themes/s59dgo/style.css', vsebinaUrlji: []}) === 'tema'`; `'https://www.youtube.com/embed/x'` z iniciatorjem strani in URL v `vsebinaUrlji` → `'vsebina'`; `http://localhost:8059/x.css` → `'notranja'`.
- `noveNajdbe(['Napaka: x vrstica 12', 'B'], ['Napaka: x vrstica 40'])` → `['B']`.
- `povzetek([najdba(1,'opozorilo','a')]).izhod === 0`; z eno `napaka` → `1`.
- `porociloHtml({…, najdbe: [najdba(2, 'napaka', '<script>alert(1)</script>')]})` ne vsebuje `<script>alert` in vsebuje `&lt;script&gt;`.

- [ ] **Step 2: Zaženi** `bin/test.sh` → pade (modul ne obstaja).

- [ ] **Step 3: Implementiraj `lokalno/preverjanje/jedro.mjs`** po Interfaces. Poročilo: ena HTML stran, slovenski naslovi kontrol 1–9, tabela najdb po kontroli, na vrhu povzetek in seznam ročnih korakov, galerija posnetkov (`posnetki`: `{ime, izdana, trenutna, razlika, delez}` z relativnimi potmi PNG v isti mapi).

- [ ] **Step 4: Zaženi** `bin/test.sh` → vsi OK. `dc --profile preverjanje build brskalnik` → uspe.

- [ ] **Step 5: Commit** – »Lokalni WordPress: jedro preverjanja in vsebnik brskalnik«.

---

### Task 4: `bin/preveri-lokalno.sh` in strežniške kontrole 2, 4, 5, 6

**Files:**
- Create: `bin/preveri-lokalno.sh`
- Create: `lokalno/wp/naslovi.php` (za `wp eval-file`; izpiše JSON za `odkrijNaslove`, samo `post_status = publish`)
- Create: `lokalno/preverjanje/preveri.mjs` (vstopna točka v `brskalnik`; uvozi `jedro.mjs`)
- Create: `lokalno/preverjanje/kontrole-streznik.mjs` (kontrole 2-HTTP, 4, 5, 6)
- Modify: `lokalno/docker-compose.yml` (`brskalnik`: volumen `stanje` ro na `/stanje`, mapa `../dist/preverjanje` rw na `/porocilo`, `./preverjanje` ro na `/opt/preverjanje/src`)
- Test: `tests/lokalno.test.sh` (preverjanja pred zagonom), `tests/test-lokalno.php`

**Interfaces:**
- Consumes: `jedro.mjs` (Task 3), `stanje-produkcije.json` (Task 2), `dc`, `wpcli`, `preveri_docker`, `najnovejsi_arhiv` (Task 1).
- Produces: `bin/preveri-lokalno.sh` → izhod 0/1 po `povzetek().izhod`; pred zagonom `preveri_pripravljenost` v `lokalno/lib.sh` (ni `stanje-produkcije.json` → »Najprej poženi bin/lokalno.sh obnovi« in izhod 1; novejši arhiv v `prod_backups/` od `arhiv` v stanju → opozorilo, nadaljuje). `preveri.mjs` prebere `/stanje/naslovi.json`, `/stanje/stanje-produkcije.json`, zapiše `/porocilo/porocilo.html` in `/porocilo/najdbe.json`, natisne povzetek. Vsaka kontrola: `async function kontrolaN(kontekst) → najdba[]`, `kontekst = {naslovi, stanje, osnova: 'http://localhost:8059', brskalnik?, izdana?}`.
- Brskalnik doseže strežnik kot `http://localhost:8059` z `--host-resolver-rules=MAP localhost:8059 wp:80`; Node `fetch` v `kontrole-streznik.mjs` uporablja `http://wp` z glavo `Host: localhost:8059`.

- [ ] **Step 1: Padajoči testi** – v `tests/lokalno.test.sh`: `preveri_pripravljenost` z navideznim `dc`, ki ne najde stanja, vrne 1 in izpiše »bin/lokalno.sh obnovi«. V `tests/test-lokalno.php`: `lokalno/wp/naslovi.php` vsebuje `'post_status' => 'publish'`; `bin/preveri-lokalno.sh` vsebuje `: > /stanje/debug.log` pred zagonom kontrol.

- [ ] **Step 2: Zaženi** `bin/test.sh` → pade.

- [ ] **Step 3: Implementiraj**

`bin/preveri-lokalno.sh`: `preveri_docker`, `preveri_pripravljenost`, `dc up -d db wp`, izprazni `debug.log`, `wpcli eval-file /lokalno-wp/naslovi.php > /stanje/naslovi.json` (prek `dc run … sh -c`), `mkdir -p dist/preverjanje`, `dc --profile preverjanje up -d validator`, `dc --profile preverjanje run --rm brskalnik node /opt/preverjanje/src/preveri.mjs`, izhodna koda iz Node.
Kontrole v `kontrole-streznik.mjs`:
- 2 (HTTP del): vsak naslov → koda mora biti `pricakovano` (sledi preusmeritvam) → sicer `napaka`; po vseh zahtevah vrstice `debug.log` s `themes/s59dgo` → `napaka`, ostale → `opozorilo`.
- 4: na vsakem naslovu vrste `objava_*` razčleni `<meta>` v `<head>` in kliče `preveriOg` (`imaIzrez` iz `stanje.slike`).
- 5: iz `stanje.nastavitve`: `posts_per_page !== 9`, ni menija `glavni`, ni logotipa, prazno območje `noga-1..3`, tema ni `s59dgo` → vsak `rocni-korak` z navodilom (npr. »Nastavitve → Branje → 9 objav na stran (zdaj: 10)«).
- 6: `POST /xmlrpc.php` z `system.listMethods` → odziv vsebuje `<fault>` ali koda ≥ 400; `GET /wp-json/wp/v2/users` → 404; `POST /wp-json/batch/v1` → 404; `GET /?author=1` → končno 410; `GET /?author__not_in=1` → 403; domača stran brez `<meta name="generator"`. Vsaka kršitev `napaka`. Poleg tega vsaka pot iz `stanje.php_v_uploads` → `opozorilo` »PHP v uploads/ – preveri na produkciji«.

- [ ] **Step 4: Zaženi** `bin/test.sh` → OK. Nato `bin/preveri-lokalno.sh` na obnovljeni kopiji → poročilo obstaja, med ročnimi koraki je »9 objav na stran (zdaj: 10)«, kontrola 6 brez napak, izhod 0 ali 1 s smiselnimi najdbami (preberi `dist/preverjanje/najdbe.json`).

- [ ] **Step 5: Commit** – »Lokalni WordPress: bin/preveri-lokalno.sh, kontrole 2, 4, 5, 6«.

---

### Task 5: Izdana verzija za primerjavo, kontroli 1 in 3

**Files:**
- Create: `lokalno/pripravi-izdano.sh` (gostitelj: `git archive "$(git describe --tags --abbrev=0)" s59dgo | tar -x` v začasno mapo, preimenuje v `s59dgo-izdana`, `dc cp`/`dc run` v `html` volumen pod `wp-content/themes/`; kopira `theme_mods_s59dgo` → `theme_mods_s59dgo-izdana` z `wp option get --format=json | wp option update --format=json`)
- Create: `lokalno/preverjanje/kontrole-vsebina.mjs` (kontroli 1 in 3)
- Modify: `bin/preveri-lokalno.sh` (pokliče `lokalno/pripravi-izdano.sh` pred Node; ob izdelavi kontrole 1 lokalno regenerira slike iz `stanje.slike` z `ima_kartica|ima_deljenje === false` prek `wp media regenerate <id…> --image_size=s59dgo-kartica` in `s59dgo-deljenje`), `lokalno/preverjanje/preveri.mjs`
- Test: `tests/test-lokalno.php`, `tests/lokalno.test.mjs`

**Interfaces:**
- Consumes: `razvrstiSliko`, `jeIzrezKartice`, `noveNajdbe`, `najdba` (Task 3); mu-plugin `s59dgo_lokalno_primerjalna_tema` (Task 2); `kontekst` (Task 4).
- Produces: `async function pridobiHtml(url, {izdana: boolean}) → string` v `kontrole-vsebina.mjs` (piškotek `s59dgo_primerjava=izdana` ob `izdana: true`), uporabljata ga tudi Task 6 in kontrola 3.

- [ ] **Step 1: Padajoči testi** – `tests/test-lokalno.php`: `lokalno/pripravi-izdano.sh` vsebuje `git describe --tags --abbrev=0` in `s59dgo-izdana`; ne piše v `wp-content/themes/s59dgo/`. `tests/lokalno.test.mjs`: dodaj primer, da `noveNajdbe` ignorira razliko v stolpcu (`'… stolpec 5'` vs `'… stolpec 9'`).

- [ ] **Step 2: Zaženi** `bin/test.sh` → pade.

- [ ] **Step 3: Implementiraj**
- Kontrola 1: najdbe iz `razvrstiSliko` za vsako `stanje.slike` (iz posnetka, ne iz trenutnega stanja); nato HTML domače strani – vsaka `<img>` v `.kartica__slika` za objavo z naslovno sliko, katere izvirnik je dovolj velik, mora imeti `jeIzrezKartice(src)`; sicer `napaka`. Miniature »opazno obrezanih« v poročilu (URL izreza in izvirnika).
- Kontrola 3: za vsak naslov HTML trenutne in izdane teme → `POST http://validator:8888/?out=json` (`Content-Type: text/html; charset=utf-8`); sporočila tipa `error` → ključ `"<vrsta>: <message>"`; `noveNajdbe(trenutne, izdane)` → `napaka`, preostale → `opozorilo` (strnjeno po sporočilu s številom pojavitev).

- [ ] **Step 4: Zaženi** `bin/test.sh` → OK. `bin/preveri-lokalno.sh` → kontrola 3 brez `napaka` na trenutni veji (izdana `v1.1.0` ima nezaprt `<div>` – v trenutni ga ni, zato ne sme biti nove napake); začasno odstrani `</div>` iz `s59dgo/template-parts/trak.php` in ponovi → kontrola 3 javi `napaka`; vrni spremembo (`git checkout s59dgo/template-parts/trak.php`).

- [ ] **Step 5: Commit** – »Lokalni WordPress: primerjava z izdano verzijo, kontroli 1 in 3«.

---

### Task 6: Kontrole v brskalniku 2 (konzola), 7, 8, 9

**Files:**
- Create: `lokalno/preverjanje/kontrole-brskalnik.mjs`
- Modify: `lokalno/preverjanje/preveri.mjs`
- Test: `tests/lokalno.test.mjs`

**Interfaces:**
- Consumes: `razvrstiZahtevo`, `razvrstiKonzolo`, `noveNajdbe`, `najdba`, `porociloHtml` (Task 3); `pridobiHtml` (Task 5); `kontekst` (Task 4).
- Produces: `async function obisci(stran, url, {izdana, sirina, shema}) → {konzola: Array<{besedilo, url}>, zahteve: Array<{url, iniciatorUrl}>, posnetek: Buffer}`. Kontekst Playwright: `route('**/*')` – zahteve na drug izvor zabeleži in `abort()`; `colorScheme: 'light'|'dark'`; `viewport` 390×844 ali 1280×900; `fullPage: true`; počakaj `networkidle`; animacije izklopljene (`reducedMotion: 'reduce'`).

- [ ] **Step 1: Padajoči test** – `tests/lokalno.test.mjs`: `porociloHtml` s `posnetki: [{ime: 'domov-390-temno', izdana: 'a.png', trenutna: 'b.png', razlika: 'c.png', delez: 0.031}]` vsebuje `domov-390-temno`, `src="b.png"` in `3,1 %`.

- [ ] **Step 2: Zaženi** `bin/test.sh` → pade (oblika deleža).

- [ ] **Step 3: Implementiraj**
- 2 (konzola): `console` tipa `error` in `pageerror` na vseh naslovih (trenutna tema, 1280, svetlo); `razvrstiKonzolo` → `tema` = `napaka`, `drugo` = `opozorilo`.
- 7: iz `zahteve` istih obiskov; `vsebinaUrlji` = URL-ji iz HTML `.besedilo` / `.kartica__izvlecek` strani; `razvrstiZahtevo` → `tema` = `napaka`, `vsebina` = `opozorilo` z naslovom strani.
- 8: vrste `domov`, `objava_s_sliko`, `stran`, `kategorija`, `iskanje`, `404` × širini 390/1280 × shemi svetlo/temno × izdana/trenutna; PNG v `/porocilo/posnetki/<vrsta>-<sirina>-<shema>-{izdana,trenutna,razlika}.png`; `pixelmatch` (prag 0.1) na višini krajše slike, delež = razlika / piksli; vsak par s `delez > 0` → `opozorilo` z deležem.
- 9: axe-core (`page.addScriptTag({path: require.resolve('axe-core')})`, `axe.run()`) na istih straneh pri 1280 v obeh shemah za obe temi; ključ `"<id>: <target>"`; `noveNajdbe` za vpliv `serious`/`critical` → `napaka`, ostalo → `opozorilo`.

- [ ] **Step 4: Preveri** `bin/test.sh` → OK. `bin/preveri-lokalno.sh` → poročilo vsebuje 6 vrst × 2 × 2 parov posnetkov; pri kontroli 7 ni najdb `tema` (tema nima zunanjih klicev); čas celotnega zagona brez obnove < 5 min (izmeri z `time`; če preseže, zapiši čas v poročilo naročniku in predlagaj zmanjšanje vrst). Odpri `dist/preverjanje/porocilo.html` in preglej, da se posnetki prikažejo.

- [ ] **Step 5: Commit** – »Lokalni WordPress: kontrole v brskalniku (konzola, zunanji klici, posnetki, dostopnost)«.

---

### Task 7: Dokumentacija, skill izdaje in končni pregled

**Files:**
- Modify: `CLAUDE.md` (Ukazi: `bin/lokalno.sh gor|dol|obnovi|odpri|pobrisi`, `bin/preveri-lokalno.sh`; Arhitektura: ena alineja o `lokalno/` in volumnih s podatki produkcije)
- Modify: `README.md` (razdelek Razvoj: lokalno preverjanje, opomba, da backup in volumni vsebujejo zasebne podatke)
- Modify: `.claude/skills/s59dgo-izdaja-teme/SKILL.md` (nov korak pred »Preverjanje in zip«: če obstaja arhiv v `prod_backups/` → `bin/preveri-lokalno.sh`, ob izhodu 1 izdaja stoj; arhiv starejši od 30 dni ali ga ni → povej naročniku in predlagaj nov backup v Backuply; ročne korake iz poročila dodaj v navodila za namestitev. Pasti: `prod_backups/` in volumni `s59dgo-lokalno_*` vsebujejo zasebne podatke; nikoli `git add` iz teh poti.)
- Test: `tests/test-lokalno.php` (CLAUDE.md vsebuje `bin/preveri-lokalno.sh`; SKILL.md vsebuje `bin/preveri-lokalno.sh` in `prod_backups/`)

- [ ] **Step 1: Padajoči test** v `tests/test-lokalno.php` (zgornja preverjanja) → `bin/test.sh` pade.
- [ ] **Step 2: Posodobi dokumente.**
- [ ] **Step 3: Končno preverjanje** – `bin/lint.sh`, `bin/test.sh`, `bin/phpcs.sh` (PHPCS pregleda samo `s59dgo/`; če `phpcs.xml.dist` zajame `lokalno/`, ga izključi), `bin/build-zip.sh` in `unzip -l dist/s59dgo.zip | grep -E 'lokalno|prod_backups|\.sql'` → prazno. `git status --short` ne kaže nič iz `prod_backups/`, `dist/`.
- [ ] **Step 4: Commit** – »Lokalni WordPress: dokumentacija in korak v skillu izdaje«.
