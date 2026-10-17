# Spec: Lokalni WordPress za preverjanje teme S59DGO

Datum: 2026-10-17
Stanje: potrjen dizajn (2026-10-17), dopolnjen po pregledu izvajalca; pripravljeno za načrt implementacije

## 1. Namen

Današnji testi (`bin/test.sh`) tečejo brez WordPressa, s stubi funkcij. Ne
vidijo izrisane strani, zato jim je ušel nezaprt `<div>` v traku (od 1.1.0 v
produkciji), ne vidijo obrezanih naslovnih slik in ne nastavitev produkcije
(10 objav na stran namesto 9).

Cilj: lokalna kopija www.s59dgo.si v Dockerju, napolnjena iz backupa Backuply,
na kateri ena skripta pred vsako izdajo preveri temo iz repozitorija in izpiše
poročilo. Temo na produkcijo še naprej ročno namesti naročnik prek WP
administracije (Videz → Teme → Naloži temo); lokalno okolje produkcije nikoli
ne kontaktira.

## 2. Odločitve naročnika

- Backup produkcije: plugin **Backuply** (brezplačni), arhivi v `prod_backups/`
  (v `.gitignore`).
- Lokalni WordPress služi testiranju in preverjanju sprememb teme pred ročno
  namestitvijo na produkcijo.
- Namestitev na produkcijo ostane ročna, prek WP administracije. Brez SSH/SFTP
  avtomatizacije.
- Kontrole 1–9 iz seznama v razdelku 5 (brez preizkusa nadgradnje teme).
- Brez wp-env (zavrnjeno že ob prvi verziji teme).
- Pluginsi in mu-plugin se iz backupa skopirajo **takšni, kot so**, in lokalno
  izvajajo (ne sveže z wordpress.org).
- Zunanji klici so blokirani **strogo**: WordPress in baza v Docker omrežju brez
  interneta, brskalnik zunanje zahteve zabeleži in prekine (razdelek 4.1).

## 3. Cilji, ne-cilji, anti-cilji

**Cilji**
- `bin/lokalno.sh obnovi` iz najnovejšega arhiva v `prod_backups/` postavi
  delujočo kopijo strani na `http://localhost:8080` s temo iz `s59dgo/`
  (spremembe vidne takoj, brez ponovne obnove).
- `bin/preveri-lokalno.sh` izvede kontrole 1–9 in izpiše povzetek v terminal ter
  HTML poročilo; izhodna koda ≠ 0, če pade blokirajoča kontrola.
- Poročilo loči »napaka teme« od »ročni korak na produkciji« (npr. Regenerate
  Thumbnails, 9 objav na stran).

**Ne-cilji**
- Nalaganje teme ali česar koli na produkcijo; dostop do strežnika.
- CI na GitHubu (podatki produkcije ne smejo na GitHub).
- Preizkus nadgradnje s prejšnje verzije teme (kontrola 10).
- Preverjanje vsebine objav kot take (pravopis, slike v besedilu).

**Anti-cilji** (neuspeh, tudi če tehnično deluje)
- Podatki produkcije (baza, `wp-config.php`, uporabniki, komentarji, uploads)
  končajo v gitu, na GitHubu, v `dist/` zipu teme ali v mapi, ki jo sinhronizira
  Synology Drive (razen `prod_backups/`, ki ga je tja postavil naročnik).
- Lokalna kopija pošlje e-pošto uporabnikom, kliče www.s59dgo.si ali drugo
  zunanjo storitev (posodobitve, pingbacki, wp-cron opravila pluginov).
- Lokalna kopija spremeni produkcijo (npr. prek Backuply oddaljene shrambe).
- Preverjanje je tako počasno ali hrupno, da ga ne poganjamo (cilj: < 5 min po
  prvem prenosu slik Docker, poročilo bere človek v 1 minuti).

## 4. Lokalno okolje

### 4.1 Vsebniki (`lokalno/docker-compose.yml`)

| Storitev | Slika | Namen |
|---|---|---|
| `db` | `mariadb:10.11` (kot produkcija) | baza |
| `wp` | `wordpress:php8.5-apache` (produkcija teče na PHP 8.5) | spletni strežnik, port 8080 |
| `cli` | `wordpress:cli-php8.5` | WP-CLI za obnovo in poizvedbe |
| `validator` | `ghcr.io/validator/validator` | W3C Nu validator (kontrola 3), profil `preverjanje` |
| `brskalnik` | `mcr.microsoft.com/playwright` (pripeta verzija) | posnetki, konzola, omrežje, axe (kontrole 2, 7, 8, 9), profil `preverjanje` |

Vse slike tečejo na arm64 (preverjeno 2026-10-17). Ime projekta Compose:
`s59dgo-lokalno`.

**Omrežje.** `db`, `wp`, `cli`, `validator` in `brskalnik` so samo v notranjem
omrežju (`internal: true`), brez dostopa do interneta in DNS zunaj Dockerja.
Port 8080 je objavljen samo na `127.0.0.1` gostitelja. Edini korak z internetom
je prenos jedra WordPressa ob obnovi (4.3, korak 2), ki teče v ločenem
enkratnem vsebniku `prenos` na privzetem omrežju in piše samo v volumen jedra;
ta vsebnik nima dostopa do baze in ne izvaja kode iz backupa.

Brskalnik v vsebniku doseže WordPress prek notranjega imena (npr. `wp`), stran
pa mora delovati na `http://localhost:8080`: Playwright preslika `localhost:8080`
na `wp:80` (npr. `--host-resolver-rules` ali proxy v vsebniku), da so URL-ji v
HTML enaki kot v brskalniku na Macu. Vsaka zahteva na drug izvor se v Playwrightu
zabeleži in prekine (`route.abort`); kontroli 7 in 8 zato delata z
zabeleženimi poskusi, vdelave so na posnetkih prazne.

### 4.2 Kje so podatki

- Baza in celotna namestitev WordPressa (`/var/www/html`, vključno z
  `wp-content/uploads`) živita v **imenovanih Docker volumnih**, ne v mapi
  repozitorija – repozitorij je v Synology Drive in se sinhronizira.
- V `wp` je bind mount samo `s59dgo/` → `wp-content/themes/s59dgo` (read-only).
- Začasne datoteke obnove (razpakiran arhiv) gredo v volumen ali v sistemski
  temp, nikoli v repozitorij; po obnovi se pobrišejo.
- Poročilo preverjanja: `dist/preverjanje/` (že v `.gitignore` prek `dist/`).
  Posnetki zaslona vsebujejo samo javno vsebino: izbor naslovov v razdelku 5 upošteva le objavljene (`publish`) objave in strani.

### 4.3 Obnova iz backupa (`bin/lokalno.sh obnovi [arhiv]`)

Brez argumenta vzame najnovejši `prod_backups/*.tar.gz`.

1. Iz arhiva vzame `softsql.sql`, `wp-content/` (brez `themes/s59dgo` – to pride
   iz repozitorija – in brez map Backuply z arhivi) in
   `wp-includes/version.php` (samo za verzijo jedra).
2. **Ne vzame** `wp-config.php`, `.htaccess` in jedra WordPressa iz arhiva. Jedro
   naloži sveže v isti verziji, kot je na produkciji (iz `version.php`,
   2026-10-17: 7.1.3), v vsebniku `prenos` (4.1) – po vdoru 2026-09-03 ne zaupamo
   kopiji jedra s strežnika. Pluginsi, mu-plugin, `uploads/`, `languages/`,
   `custom_web_apps/` in ostale mape `wp-content/` se skopirajo takšne, kot so
   (odločitev naročnika). Vsaka `.php` datoteka pod `uploads/` se kljub temu
   skopira, a obnova jo izpiše, poročilo pa jo navede kot opozorilo
   »preveri na produkciji« (v `uploads/` PHP ne sodi).
3. `wp-config.php` je lokalen, ustvarjen ob obnovi: lokalni podatki za bazo,
   nove soli, `WP_DEBUG`/`WP_DEBUG_LOG` vklopljen, `WP_DEBUG_DISPLAY` izklopljen,
   `WP_ENVIRONMENT_TYPE=local`, `WP_HTTP_BLOCK_EXTERNAL=true`,
   `DISABLE_WP_CRON=true`, `AUTOMATIC_UPDATER_DISABLED=true`.
4. Uvozi bazo, nato `wp search-replace` za `https://www.s59dgo.si`,
   `http://www.s59dgo.si`, `//www.s59dgo.si` in stari `s59dgo.org` →
   `http://localhost:8080` (serializirani podatki prek WP-CLI).
5. Izklopi `two-factor` in `backuply` (Backuply ne sme dosegati oddaljenih
   shramb). `redirection` ostane vklopljen, ker vpliva na odzive strani.
   Mu-plugin `00-s59dgo-hardening.php` ostane, kot je.
6. Doda lokalni mu-plugin `lokalno/mu-plugins/s59dgo-lokalno.php` (bind mount):
   blokira `wp_mail` (zapiše v dnevnik namesto pošiljanja) in omogoči izbiro
   primerjalne teme za kontrolo 8 (razdelek 5).
7. Ustvari lokalnega skrbnika `lokalni` z naključnim geslom, ki ga izpiše enkrat;
   produkcijskih uporabnikov in njihovih hashov ne spreminja.
8. Pravila za permalinke (`.htaccess`) ustvari WP-CLI (`wp rewrite flush --hard`),
   struktura ostane `/%year%/%monthnum%/%day%/%postname%/`.
9. **Posnetek stanja produkcije.** Pred kakršno koli spremembo, ki jo naredijo
   kontrole, obnova zapiše `stanje-produkcije.json` v volumen: ime in čas
   arhiva, verzija jedra, predpona tabel, seznam slik brez izrezov
   `s59dgo-kartica`/`s59dgo-deljenje`, vrednosti nastavitev iz kontrole 5,
   seznam `.php` v `uploads/`. Ročni koraki v poročilu (kontroli 1 in 5) se
   berejo iz tega posnetka, ne iz trenutnega stanja, zato ostanejo pravilni
   tudi po lokalni regeneraciji slik.
10. Predpono tabel prebere iz `softsql.sql` (2026-10-17: `wp_`).
11. Zamenjava domen gre od najdaljšega vzorca proti krajšemu
    (`https://www.s59dgo.si` → `http://www.s59dgo.si` → `//www.s59dgo.si`, enako
    za `s59dgo.org`), da ne nastane `https://http://localhost:8080`; brez gole
    zamenjave `s59dgo.org`/`s59dgo.si` brez `//`.

Ostali ukazi: `gor`, `dol`, `odpri` (odpre brskalnik), `pobrisi` (odstrani
volumne – vse lokalne podatke produkcije).

**Ponovna uporaba.** `bin/preveri-lokalno.sh` ne obnavlja vsakič: dela na
obstoječih volumnih (cilj < 5 min velja brez obnove). Pred začetkom:
- če obnova še ni bila narejena → konča z navodilom `bin/lokalno.sh obnovi`;
- če je v `prod_backups/` novejši arhiv od tistega v `stanje-produkcije.json`
  → opozori in predlaga obnovo (ne obnovi sam);
- spremembe, ki jih naredijo kontrole (regenerirane slike, tema
  `s59dgo-izdana`, `theme_mods_s59dgo-izdana`, dnevnik 404 Redirection,
  `debug.log`), so dovoljene na lokalni kopiji; `debug.log` se pred vsakim
  zagonom izprazni, tema `s59dgo-izdana` in njeni `theme_mods` se vsakič
  pripravijo na novo.

## 5. Kontrole (`bin/preveri-lokalno.sh`)

Skripta najprej odkrije reprezentativne naslove z WP-CLI: domača stran, 2. stran
mreže, najnovejša objava z naslovno sliko, objava brez nje, stran, kategorija z
objavami, oznaka, datumski arhiv, iskanje z zadetki (beseda iz naslova objave),
iskanje brez zadetkov, neobstoječ naslov (404), avtorski arhiv (410 zaradi
hardening mu-plugina).

Vsaka najdba ima stopnjo: **napaka** (blokira, izhodna koda 1), **opozorilo**
(izpiše, ne blokira) ali **ročni korak** (navodilo za produkcijo, ne blokira).

| # | Kontrola | Kaj preveri | Stopnja |
|---|---|---|---|
| 1 | Naslovne slike | Vsaka objava z naslovno sliko ima izreza `s59dgo-kartica` 800×520 in `s59dgo-deljenje` 1200×630 v metapodatkih in na disku. Manjkajoči → ročni korak »Regenerate Thumbnails« s seznamom objav. Nato lokalno `wp media regenerate` za te slike in preveri, da kartica v mreži dobi sliko 800×520 (ne `full`/`large`). Seznam slik, katerih izvirnik ni 20:13 in se bo opazno obrezal (> 15 % višine ali širine), z miniaturami v poročilu. | kartica brez prave velikosti po regeneraciji = napaka; ostalo ročni korak / opozorilo |
| 2 | Vrste strani | Vsak odkrit naslov vrne pričakovano kodo (200, 404, 410); `debug.log` med preverjanjem ne dobi novih vrstic s poti `themes/s59dgo`; brskalnik ne javi napak JS v konzoli. | napaka za PHP s poti teme in JS napake iz `themes/s59dgo/` ali vrstičnih skript teme; PHP/JS iz pluginov, jedra ali vsebine = opozorilo |
| 3 | Veljaven HTML | Izrisan HTML vseh naslovov skozi Nu validator. Napake se primerjajo z izdano verzijo teme (primerjava kot pri 8): nove napake = napaka, enake kot prej (večinoma vsebina objav) = opozorilo. | napaka / opozorilo |
| 4 | Open Graph | Na objavah: `og:title`, `og:description` (ni prazen), `og:image` z `og:image:width/height`, za objave z izrezom 1200×630; vsaka oznaka največ enkrat; `twitter:card` prisoten. | napaka |
| 5 | Nastavitve | `posts_per_page` = 9, meni dodeljen lokaciji `glavni`, logotip nastavljen, gradniki v `noga-1..3`, aktivna tema `s59dgo`. Vrednosti so s produkcije. | ročni korak |
| 6 | Utrjevanje | `xmlrpc.php` ne sprejema klicev; `/wp-json/wp/v2/users` brez prijave ni na voljo; `/wp-json/batch/v1` ni na voljo; avtorski arhiv 410; `?author__not_in=1` 403; v `<head>` ni `generator`. | napaka |
| 7 | Zunanji klici | Brskalnik zabeleži vse poskuse zahtev na drug izvor (prekinjene, 4.1) na vseh naslovih. Zahteva na drugo domeno, ki izvira iz teme (head, CSS, JS teme) = napaka; iz vsebine objave (vdelava, slika v besedilu) = opozorilo z imenom objave. | napaka / opozorilo |
| 8 | Primerjava posnetkov | Posnetki domače strani, objave s sliko, strani, arhiva, iskanja in 404 pri širini 390 px in 1280 px, v svetlem in temnem načinu, za izdano verzijo teme (zadnji git tag) in za trenutno `s59dgo/`. Poročilo pokaže pare drug ob drugem s sliko razlik in deležem spremenjenih pikslov. | opozorilo (spremembe so lahko namerne) |
| 9 | Dostopnost | axe-core na istih naslovih in obeh barvnih načinih. Primerjava z izdano verzijo kot pri 3: nove kršitve stopnje `serious`/`critical` = napaka, ostale = opozorilo. | napaka / opozorilo |

**Izdana verzija za primerjavo (3, 8, 9):** skripta z `git archive <zadnji tag>
s59dgo` pripravi kopijo v volumen kot temo `s59dgo-izdana` (tema z istim
`Text Domain`, preimenovana mapa). Lokalni mu-plugin ob piškotku
`s59dgo_primerjava=izdana` prek filtrov `template`/`stylesheet` izriše to temo;
brez piškotka teče trenutna. Produkcijske nastavitve teme (`theme_mods_s59dgo`)
se za primerjavo kopirajo na `theme_mods_s59dgo-izdana`, da meni, logotip in
Customizer veljajo za obe.

**Poročilo:** `dist/preverjanje/porocilo.html` (en HTML z vdelanimi slikami ali
slikami v isti mapi; odpre se lokalno) in povzetek v terminalu: po kontroli
število napak/opozoril/ročnih korakov in na koncu seznam ročnih korakov za
produkcijo.

## 6. Povezava z obstoječimi orodji

- `bin/build-zip.sh` ostane nespremenjen (teče brez backupa in brez WP).
- Skill `s59dgo-izdaja-teme`: nov korak pred zipom – če obstaja arhiv v
  `prod_backups/`, poženi `bin/preveri-lokalno.sh`; ob napaki se izdaja ustavi;
  ročne korake iz poročila dodaj v sporočilo z navodili za namestitev. Če
  arhiva ni ali je starejši od 30 dni, to povej naročniku in predlagaj nov
  backup v Backuply.
- `CLAUDE.md` (razdelek Ukazi) in `README.md` dobita nova ukaza; v Pasteh skilla
  zapiši, da `prod_backups/` in Docker volumni vsebujejo zasebne podatke.
- Skill `s59dgo-pregled-zive-strani` ostane za pregled žive strani po namestitvi.

## 7. Omejitve

- Lokalno ni PHP ali Node; vse teče v Dockerju (kot ostala orodja v `bin/`).
- macOS, arm64, Docker Desktop. Skripte so bash, `set -euo pipefail`, v slogu
  obstoječih `bin/*.sh`, komentarji in izpis v slovenščini.
- Repozitorij je javen; nobena nova datoteka ne sme vsebovati podatkov
  produkcije, gesel ali naslovov uporabnikov.
- Playwright in axe tečeta v vsebniku `brskalnik`; JS koda preverjanj (npr.
  `lokalno/preverjanje/*.mjs`) brez `package.json` v korenu repozitorija;
  odvisnosti (axe-core, pixelmatch, pngjs) pripete in nameščene v sliki ali ob
  zagonu v volumen predpomnilnika.

## 8. Prepuščeno izvajalcu

- Natančna struktura datotek pod `lokalno/` in razdelitev logike med bash in JS.
- Izbira pripetih verzij slik in knjižnic (pripeti, ne `latest`, razen če
  verzija ni objavljena).
- Oblika HTML poročila (pregledno, v slogu teme ni potrebno).
- Kako zanesljivo ločiti zahteve iz teme od zahtev iz vsebine pri kontroli 7
  (npr. iniciator zahteve v Playwrightu ali iskanje URL-ja v `post_content`).
- Prag »opaznega obrezovanja« pri kontroli 1 lahko prilagodi, če 15 % daje
  preveč ali premalo zadetkov na pravih podatkih – zapiši izbrano vrednost.

## 9. Odločitve izvajalca (Claude), ne naročnika

- Imenovani Docker volumni namesto mape v repozitoriju (Synology Drive).
- Sveže jedro WP namesto jedra iz backupa; lokalni `wp-config.php`.
- Izklop `backuply` in `two-factor` lokalno, blokada pošte in zunanjih HTTP klicev.
- Lokalni skrbnik `lokalni` namesto spreminjanja produkcijskih gesel.
- Brez anonimizacije podatkov (ostanejo samo na tem računalniku).
- Primerjava z zadnjim git tagom kot »izdano verzijo«.
- Stopnje napaka/opozorilo/ročni korak v tabeli v razdelku 5; port 8080.
- Ločitev JS napak teme od ostalih pri kontroli 2 (po pregledu izvajalca).
- Preverjanje dela na obstoječih volumnih, ročni koraki iz posnetka
  `stanje-produkcije.json` (po pregledu izvajalca).
- `.php` v `uploads/` se skopira, a izpiše kot opozorilo.
- V poročilo (mapa v Synology Drive) gredo samo objavljene objave in strani.
