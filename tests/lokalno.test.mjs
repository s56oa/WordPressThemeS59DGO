// Test jedra preverjanja lokalnega WordPressa (lokalno/preverjanje/jedro.mjs): čista logika brez I/O.
import assert from 'node:assert/strict';
import {
  najdba, odkrijNaslove, delezObreza, razvrstiSliko, jeIzrezKartice, preveriOg,
  razvrstiZahtevo, razvrstiKonzolo, noveNajdbe, povzetek, porociloHtml, razkodiEntitete, oblikujDelez,
} from '../lokalno/preverjanje/jedro.mjs';
import {
  razcleniMeta, razvrstiDnevnik, kontrola2, kontrola4, kontrola5, kontrola6,
} from '../lokalno/preverjanje/kontrole-streznik.mjs';
import { pridobiHtml, slikeKartic, kontrola1, kontrola3 } from '../lokalno/preverjanje/kontrole-vsebina.mjs';
import {
  imePosnetka, vsebinaUrlji, iniciatorCdp, urlIzSklada, jeOdmevNalaganja, obreziSliko, primerjajSliki, razvrstiAxe,
  kontrola2Konzola, kontrola7, kontrola8, kontrola9,
} from '../lokalno/preverjanje/kontrole-brskalnik.mjs';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let stevilo = 0;
function ok(pogoj, sporocilo) { assert.ok(pogoj, sporocilo); stevilo++; }
const blizu = (a, b) => Math.abs(a - b) < 1e-9;
const O = 'http://localhost:8059';

// najdba
const n0 = najdba(1, 'napaka', 'x');
ok(n0.kontrola === 1 && n0.stopnja === 'napaka' && n0.sporocilo === 'x' && typeof n0.podrobnosti === 'object', 'najdba: oblika');

// delezObreza
ok(delezObreza(800, 520) === 0, 'obrez 800x520 = 0');
ok(delezObreza(1600, 1040) === 0, 'obrez 1600x1040 = 0');
ok(blizu(delezObreza(1000, 1000), 0.35), 'obrez 1000x1000 = 0,35');
ok(blizu(delezObreza(1600, 900), 1 - (900 * 800 / 520) / 1600), 'obrez 1600x900');

// razvrstiSliko
const slika = (o) => ({ objava_id: 1, naslov: 'Objava', priponka_id: 2, sirina: 1, visina: 1, ima_kartica: true, ima_deljenje: true, ...o });
const imaStopnjo = (r, s) => r.filter(x => x.stopnja === s);
let r = razvrstiSliko(slika({ sirina: 640, visina: 427, ima_kartica: false, ima_deljenje: false }));
ok(imaStopnjo(r, 'opozorilo').some(x => /izvirnik premajhen/.test(x.sporocilo)), 'premajhen: opozorilo');
ok(imaStopnjo(r, 'rocni-korak').length === 0, 'premajhen: brez rocnega koraka');
r = razvrstiSliko(slika({ sirina: 2000, visina: 1300, ima_kartica: false, ima_deljenje: true }));
ok(imaStopnjo(r, 'rocni-korak').length === 1 && /Regenerate Thumbnails/.test(imaStopnjo(r, 'rocni-korak')[0].sporocilo), 'manjka izrez: en rocni korak');
r = razvrstiSliko(slika({ sirina: 1000, visina: 1000 }));
ok(imaStopnjo(r, 'opozorilo').some(x => /opazno obrezana/.test(x.sporocilo)), 'obrezana: opozorilo');
r = razvrstiSliko(slika({ sirina: 800, visina: 520, ima_kartica: false, ima_deljenje: false }));
ok(imaStopnjo(r, 'rocni-korak').length === 0, '800x520: brez rocnega koraka');
ok(imaStopnjo(r, 'opozorilo').filter(x => /izvirnik premajhen/.test(x.sporocilo)).length === 1, '800x520: deljenje premajhno');
ok(!r.some(x => /kartic/i.test(x.sporocilo) && /premajhen/.test(x.sporocilo)), '800x520: kartica ni premajhna');
r = razvrstiSliko(slika({ sirina: 1200, visina: 630, ima_kartica: false, ima_deljenje: false }));
ok(imaStopnjo(r, 'rocni-korak').length === 1, '1200x630: kartica manjka, deljenje je tocno');
r = razvrstiSliko(slika({ sirina: 1600, visina: 1040 }));
ok(r.length === 0, 'popolna slika: brez najdb');

// jeIzrezKartice
ok(jeIzrezKartice(`${O}/wp-content/uploads/2026/09/a-800x520.jpeg?v=1`) === true, 'izrez kartice');
ok(jeIzrezKartice(`${O}/wp-content/uploads/2026/09/a-1024x683.jpeg`) === false, 'ni izrez kartice');

// odkrijNaslove
const podatki = { domov: `${O}/`, objava_s_sliko: `${O}/a/`, objava_brez_slike: `${O}/b/`, stran: `${O}/o-klubu/`, kategorija: `${O}/category/c/`, oznaka: null, datum: `${O}/2026/09/`, iskalni_niz: 'repetitor' };
let o = odkrijNaslove(podatki);
ok(!o.naslovi.some(x => x.vrsta === 'oznaka'), 'brez oznake');
ok(o.najdbe.length === 1 && o.najdbe[0].stopnja === 'opozorilo' && /oznaka/.test(o.najdbe[0].sporocilo), 'opozorilo za oznako');
ok(o.naslovi.find(x => x.vrsta === 'avtor').pricakovano === 410, 'avtor 410');
ok(o.naslovi.find(x => x.vrsta === '404').pricakovano === 404, '404');
ok(o.naslovi.some(x => x.url === `${O}/page/2/`), 'stran 2 mreze');
ok(o.naslovi.some(x => x.url === `${O}/?s=repetitor`), 'iskanje z zadetki');
ok(o.naslovi.some(x => x.url === `${O}/?s=zzqx-ni-zadetkov`), 'iskanje brez zadetkov');
ok(o.naslovi.some(x => x.url === `${O}/?author=1`), 'avtor url');
ok(o.naslovi.some(x => x.url === `${O}/ta-stran-ne-obstaja-s59dgo/` && x.pricakovano === 404), '404 url');
ok(o.naslovi.filter(x => x.vrsta === 'domov')[0].pricakovano === 200, 'domov 200');
o = odkrijNaslove({ domov: `${O}/` });
ok(o.najdbe.length === 7 && o.najdbe.every(x => x.stopnja === 'opozorilo'), 'delni podatki: opozorila, brez izjeme');

// preveriOg
const og = [
  ['og:title', 'Naslov'], ['og:description', 'Opis'], ['og:image', `${O}/s.jpg`],
  ['og:image:width', '1200'], ['og:image:height', '630'], ['twitter:card', 'summary_large_image'],
].map(([kljuc, vrednost]) => ({ kljuc, vrednost }));
ok(preveriOg(og, { imaIzrez: true }).length === 0, 'og: popoln nabor');
let p = preveriOg([...og, { kljuc: 'og:title', vrednost: 'Drugi' }], { imaIzrez: true });
ok(p.length === 1 && p[0].stopnja === 'napaka' && /podvojena/.test(p[0].sporocilo), 'og: podvojena');
p = preveriOg(og.map(m => m.kljuc === 'og:description' ? { ...m, vrednost: ' ' } : m), { imaIzrez: true });
ok(p.length === 1 && p[0].stopnja === 'napaka', 'og: prazen opis');
p = preveriOg(og.map(m => m.kljuc === 'og:image:width' ? { ...m, vrednost: '1024' } : m), { imaIzrez: true });
ok(p.length === 1 && p[0].stopnja === 'napaka', 'og: napacna sirina');
ok(preveriOg(og.map(m => m.kljuc === 'og:image:width' ? { ...m, vrednost: '1024' } : m), { imaIzrez: false }).length === 0, 'og: brez izreza ni pravila za velikost');
ok(preveriOg(og.filter(m => m.kljuc !== 'twitter:card'), { imaIzrez: true }).length === 1, 'og: manjka twitter:card');

// razvrstiZahtevo
const tema = `${O}/wp-content/themes/s59dgo/style.css`;
ok(razvrstiZahtevo('https://fonts.googleapis.com/x', { izvorStrani: O, iniciatorUrl: tema, vsebinaUrlji: [] }) === 'tema', 'zahteva iz teme');
ok(razvrstiZahtevo('https://www.youtube.com/embed/x', { izvorStrani: O, iniciatorUrl: `${O}/a/`, vsebinaUrlji: ['https://www.youtube.com/embed/x'] }) === 'vsebina', 'zahteva iz vsebine');
ok(razvrstiZahtevo(`${O}/x.css`, { izvorStrani: O, iniciatorUrl: `${O}/a/`, vsebinaUrlji: [] }) === 'notranja', 'notranja zahteva');
ok(razvrstiZahtevo('https://x.example/y', { izvorStrani: O, iniciatorUrl: null, vsebinaUrlji: [] }) === 'tema', 'brez iniciatorja, ni v vsebini = tema');
ok(razvrstiZahtevo('https://fonts.googleapis.com/x', { izvorStrani: O, iniciatorUrl: `${O}/a/`, vsebinaUrlji: [] }) === 'tema', 'iniciator je dokument strani, ni v vsebini = tema');
ok(razvrstiZahtevo('https://fonts.googleapis.com/x', { izvorStrani: O, iniciatorUrl: `${O}/a/`, vsebinaUrlji: ['https://fonts.googleapis.com/x'] }) === 'vsebina', 'iniciator je dokument strani, v vsebini = vsebina');
ok(razvrstiZahtevo('https://x.example/y', { izvorStrani: O, iniciatorUrl: `${O}/wp-content/plugins/redirection/x.js`, vsebinaUrlji: [] }) === 'vsebina', 'iniciator vtičnik = vsebina');
ok(razvrstiZahtevo('https://x.example/y', { izvorStrani: O, iniciatorUrl: `${O}/wp-includes/js/a.js`, vsebinaUrlji: [] }) === 'vsebina', 'iniciator jedro = vsebina');
ok(razvrstiZahtevo('https://x.example/y', { izvorStrani: O, iniciatorUrl: null, vsebinaUrlji: ['https://x.example/y'] }) === 'vsebina', 'brez iniciatorja, v vsebini');

// razvrstiKonzolo
ok(razvrstiKonzolo({ besedilo: 'x', url: tema }) === 'tema', 'konzola: url teme');
ok(razvrstiKonzolo({ besedilo: 'Uncaught brez-js', url: `${O}/` }) === 'tema', 'konzola: vrstična skripta teme');
ok(razvrstiKonzolo({ besedilo: 'x', url: `${O}/wp-includes/js/a.js` }) === 'drugo', 'konzola: drugo');

// noveNajdbe
const nn = noveNajdbe(['Napaka: x vrstica 12', 'B'], ['Napaka: x vrstica 40']);
ok(nn.length === 1 && nn[0] === 'B', 'noveNajdbe');
ok(noveNajdbe(['Error at line 3, column 9: z'], ['Error at line 8, column 1: z']).length === 0, 'noveNajdbe: line/column');
ok(noveNajdbe(['domov: Napaka … stolpec 5'], ['domov: Napaka … stolpec 9']).length === 0, 'noveNajdbe: stolpec');

// povzetek
ok(povzetek([najdba(1, 'opozorilo', 'a')]).izhod === 0, 'povzetek: opozorilo ne blokira');
const pv = povzetek([najdba(1, 'napaka', 'a'), najdba(2, 'opozorilo', 'b'), najdba(3, 'rocni-korak', 'c')]);
ok(pv.izhod === 1 && pv.napake === 1 && pv.opozorila === 1 && pv.rocni === 1, 'povzetek: stevila');

// porociloHtml
const osnova = { cas: '2026-10-17 12:00', arhiv: 'a<b>.tar', posnetki: [] };
let h = porociloHtml({ ...osnova, najdbe: [najdba(2, 'napaka', '<script>alert(1)</script>')] });
ok(!h.includes('<script>alert') && h.includes('&lt;script&gt;'), 'porocilo: ubezanje');
ok(!h.includes('a<b>.tar') && h.includes('a&lt;b&gt;.tar'), 'porocilo: ubezan arhiv');
h = porociloHtml({ ...osnova, najdbe: [najdba(1, 'opozorilo', 'Objava Radio &#8211; klub: izvirnik premajhen')] });
ok(h.includes('Radio – klub') && !h.includes('&amp;#8211;'), 'porocilo: entitete brez dvojnega ubezanja');
h = porociloHtml({ ...osnova, najdbe: [najdba(1, 'rocni-korak', 'Poženi Regenerate Thumbnails')],
  posnetki: [{ ime: 'domov "390"', izdana: 'a.png', trenutna: 'b.png', razlika: 'c.png', delez: 0.0123 }] });
ok(h.includes('Regenerate Thumbnails') && h.includes('src="a.png"') && h.includes('domov &quot;390&quot;'), 'porocilo: ročni koraki in galerija');
ok(h.indexOf('Ročni koraki za produkcijo') > -1 && h.indexOf('Ročni koraki za produkcijo') < h.indexOf('1. Naslovne slike'), 'porocilo: ročni koraki pred razdelki kontrol');
ok(h.indexOf('Regenerate Thumbnails') < h.indexOf('1. Naslovne slike'), 'porocilo: seznam ročnih korakov vsebuje korak pred razdelki');

// kontrole-streznik.mjs: navidezen fetch po poti in metodi
const odziv = (status, telo = '') => ({ status, ok: status < 400, text: async () => telo });
const navidezen = (tabela) => async (url, o = {}) => {
  const u = new URL(url);
  const kljuc = `${o.method || 'GET'} ${u.pathname}${u.search}`;
  if (!(kljuc in tabela)) throw new Error(`ni v tabeli: ${kljuc}`);
  const v = tabela[kljuc];
  return typeof v === 'function' ? v(o) : v;
};
const stopnje = (r, k) => r.filter((x) => x.stopnja === k);

// razcleniMeta: samo <head>, property ali name, entitete v content
const glava = `<html><head><meta charset="utf-8"><meta property="og:title" content="Radio &amp; klub">
<meta name='twitter:card' content='summary_large_image' /><META PROPERTY="og:image:width" CONTENT="1200"></head>
<body><meta property="og:title" content="v telesu"></body></html>`;
const m = razcleniMeta(glava);
ok(m.length === 3, 'razcleniMeta: samo oznake s ključem v <head>');
ok(m[0].kljuc === 'og:title' && m[0].vrednost === 'Radio & klub', 'razcleniMeta: property in entitete');
ok(m.some((x) => x.kljuc === 'twitter:card' && x.vrednost === 'summary_large_image'), 'razcleniMeta: name z enojnimi narekovaji');
ok(m.some((x) => x.kljuc === 'og:image:width' && x.vrednost === '1200'), 'razcleniMeta: velike črke');

// razvrstiDnevnik: tema = napaka, WP-CLI = prezrto, drugo = opozorilo, e-pošta zakrita
const dnevnik = [
  '[17-Oct-2026 10:00:00 UTC] PHP Warning:  Undefined variable $x in /var/www/html/wp-content/themes/s59dgo/inc/template-tags.php on line 12',
  '[17-Oct-2026 10:00:01 UTC] PHP Deprecated:  x in phar:///usr/local/bin/wp/vendor/wp-cli/php-cli-tools/lib/cli/Colors.php on line 5',
  '[17-Oct-2026 10:00:02 UTC] PHP Deprecated:  y in /var/www/html/wp-content/plugins/redirection/a.php on line 3',
  'PHP Stack trace:',
  '#0 /var/www/html/wp-includes/plugin.php(1): x()',
  '[17-Oct-2026 10:00:03 UTC] s59dgo-lokalno: pošta ni poslana – za: ime@primer.si, zadeva: Test',
  '[17-Oct-2026 10:00:04 UTC] PHP Warning:  z in /var/www/html/wp-content/themes/s59dgo-izdana/a.php on line 1',
  '',
].join('\n');
r = razvrstiDnevnik(dnevnik);
ok(stopnje(r, 'napaka').length === 1 && /template-tags\.php/.test(stopnje(r, 'napaka')[0].sporocilo), 'dnevnik: vrstica teme = napaka');
ok(!r.some((x) => /Colors\.php/.test(x.sporocilo)), 'dnevnik: WP-CLI prezrt');
ok(stopnje(r, 'opozorilo').length === 3, 'dnevnik: vtičnik, pošta in izdana tema = opozorilo');
ok(r.every((x) => x.kontrola === 2), 'dnevnik: kontrola 2');
ok(!JSON.stringify(r).includes('ime@primer.si'), 'dnevnik: e-pošta zakrita');
ok(razvrstiDnevnik('').length === 0, 'dnevnik: prazen');
r = razvrstiDnevnik(`${dnevnik.split('\n')[0]}\n${dnevnik.split('\n')[0].replace('10:00:00', '10:05:00')}\n`);
ok(r.length === 1 && r[0].podrobnosti.ponovitev === 2, 'dnevnik: ponovitve združene');

// kontrola2: koda po preusmeritvah
const naslovi2 = [
  { vrsta: 'domov', url: `${O}/`, pricakovano: 200 },
  { vrsta: '404', url: `${O}/ni/`, pricakovano: 404 },
  { vrsta: 'avtor', url: `${O}/?author=1`, pricakovano: 410 },
];
r = await kontrola2({ naslovi: naslovi2, fetch: navidezen({ 'GET /': odziv(200), 'GET /ni/': odziv(404), 'GET /?author=1': odziv(200) }) });
ok(r.length === 1 && r[0].stopnja === 'napaka' && r[0].podrobnosti.vrsta === 'avtor' && r[0].podrobnosti.koda === 200, 'kontrola2: napačna koda = napaka');
r = await kontrola2({ naslovi: naslovi2.slice(0, 1), fetch: async () => { throw new Error('ECONNREFUSED'); } });
ok(r.length === 1 && r[0].stopnja === 'napaka' && /ECONNREFUSED/.test(r[0].sporocilo), 'kontrola2: neuspela zahteva = napaka');
let redirect = null;
await kontrola2({ naslovi: naslovi2.slice(0, 1), fetch: async (u, o) => { redirect = o.redirect; return odziv(200); } });
ok(redirect === 'follow', 'kontrola2: sledi preusmeritvam');

// kontrola4: Open Graph na objavah
const ogHtml = (sirina) => `<head><meta property="og:title" content="A"><meta property="og:description" content="B">
<meta property="og:image" content="${O}/x.jpg"><meta property="og:image:width" content="${sirina}"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"></head>`;
const naslovi4 = [
  { vrsta: 'domov', url: `${O}/`, pricakovano: 200 },
  { vrsta: 'objava-s-sliko', url: `${O}/a/`, pricakovano: 200 },
  { vrsta: 'objava-brez-slike', url: `${O}/b/`, pricakovano: 200 },
];
const podatki4 = { objava_s_sliko_id: 7, objava_brez_slike_id: 8 };
const stanje4 = (ima) => ({ slike: [{ objava_id: 7, ima_deljenje: ima }] });
r = await kontrola4({ naslovi: naslovi4, podatki: podatki4, stanje: stanje4(true), fetch: navidezen({ 'GET /a/': odziv(200, ogHtml(1024)), 'GET /b/': odziv(200, ogHtml(1200)) }) });
ok(r.length === 1 && r[0].kontrola === 4 && r[0].stopnja === 'napaka' && /1200/.test(r[0].sporocilo) && r[0].podrobnosti.url === `${O}/a/`, 'kontrola4: izrez 1200×630, širina 1024 = napaka z naslovom');
r = await kontrola4({ naslovi: naslovi4, podatki: podatki4, stanje: stanje4(false), fetch: navidezen({ 'GET /a/': odziv(200, ogHtml(1024)), 'GET /b/': odziv(200, '<head></head>') }) });
ok(r.length === 6 && r.every((x) => x.podrobnosti.url === `${O}/b/`), 'kontrola4: brez izreza ne preverja velikosti; objava brez oznak = 6 napak');

// kontrola5: nastavitve s produkcije
const nastavitve = { posts_per_page: 9, meni_glavni: 'Glavni', logotip: 12, gradniki: { 'noga-1': ['text-2'], 'noga-2': ['text-3'], 'noga-3': ['text-4'] }, tema: 's59dgo' };
ok((await kontrola5({ stanje: { nastavitve } })).length === 0, 'kontrola5: vse nastavljeno');
r = await kontrola5({ stanje: { nastavitve: { posts_per_page: 10, meni_glavni: null, logotip: 0, gradniki: { 'noga-1': [], 'noga-2': ['a'], 'noga-3': [] }, tema: 'twentytwentyfive' } } });
ok(r.length === 6 && r.every((x) => x.stopnja === 'rocni-korak' && x.kontrola === 5), 'kontrola5: šest ročnih korakov');
ok(r.some((x) => x.sporocilo.includes('9 objav na stran (zdaj: 10)')), 'kontrola5: objave na stran');
ok(r.some((x) => x.sporocilo.includes('Glavni meni')), 'kontrola5: meni');
ok(r.some((x) => /logotip/i.test(x.sporocilo)), 'kontrola5: logotip');
ok(r.some((x) => x.sporocilo.includes('Noga – Kontakt')) && r.some((x) => x.sporocilo.includes('Noga – Podpora')), 'kontrola5: območja noge');
ok(r.some((x) => x.sporocilo.includes('twentytwentyfive')), 'kontrola5: tema');

// kontrola6: utrjevanje
const varno = {
  'POST /xmlrpc.php': odziv(200, '<methodResponse><fault><value>x</value></fault></methodResponse>'),
  'GET /wp-json/wp/v2/users': odziv(404),
  'POST /wp-json/batch/v1': odziv(404),
  'GET /?author=1': odziv(410),
  'GET /?author__not_in=1': odziv(403),
  'GET /': odziv(200, '<head><title>x</title></head>'),
};
r = await kontrola6({ osnova: O, stanje: { php_v_uploads: [] }, fetch: navidezen(varno) });
ok(r.length === 0, 'kontrola6: utrjena stran brez najdb');
r = await kontrola6({ osnova: O, stanje: { php_v_uploads: ['wp-content/uploads/a.php'] }, fetch: navidezen({ ...varno, 'POST /xmlrpc.php': odziv(405) }) });
ok(r.length === 1 && r[0].stopnja === 'opozorilo' && r[0].sporocilo.includes('PHP v uploads/ – preveri na produkciji') && r[0].sporocilo.includes('wp-content/uploads/a.php'), 'kontrola6: xmlrpc 405 je v redu; PHP v uploads = opozorilo');
r = await kontrola6({ osnova: O, stanje: { php_v_uploads: [] }, fetch: navidezen({
  'POST /xmlrpc.php': odziv(200, '<methodResponse><params><param><value><array><data><value><string>system.listMethods</string></value><value><string>wp.getUsersBlogs</string></value></data></array></value></param></params></methodResponse>'),
  'GET /wp-json/wp/v2/users': odziv(200, '[]'),
  'POST /wp-json/batch/v1': odziv(207),
  'GET /?author=1': odziv(200),
  'GET /?author__not_in=1': odziv(200),
  'GET /': odziv(200, '<head><meta name="generator" content="WordPress 7.1.3"></head>'),
}) });
ok(r.length === 6 && r.every((x) => x.stopnja === 'napaka' && x.kontrola === 6), 'kontrola6: vsaka kršitev = napaka');
// Brez .htaccess s produkcije ostanejo samo vgrajene metode system.* (mu-plugin izprazni xmlrpc_methods).
const samoSystem = '<methodResponse><params><param><value><array><data><value><string>system.multicall</string></value><value><string>system.listMethods</string></value><value><string>system.getCapabilities</string></value></data></array></value></param></params></methodResponse>';
r = await kontrola6({ osnova: O, stanje: { php_v_uploads: [] }, fetch: navidezen({ ...varno, 'POST /xmlrpc.php': odziv(200, samoSystem) }) });
ok(r.length === 0, 'kontrola6: xmlrpc s samimi metodami system.* ne sprejema klicev (brez najdb)');
r = await kontrola6({ osnova: O, stanje: { php_v_uploads: [] }, fetch: navidezen({ ...varno, 'POST /xmlrpc.php': odziv(200, samoSystem.replace('system.multicall', 'pingback.ping')) }) });
ok(r.length === 1 && r[0].sporocilo.includes('pingback.ping'), 'kontrola6: xmlrpc z metodo pingback.ping = napaka z imenom metode');
let xmlrpcTelo = '';
await kontrola6({ osnova: O, stanje: { php_v_uploads: [] }, fetch: navidezen({ ...varno, 'POST /xmlrpc.php': (o) => { xmlrpcTelo = o.body; return odziv(403); } }) });
ok(xmlrpcTelo.includes('<methodName>system.listMethods</methodName>'), 'kontrola6: klic system.listMethods');
// Opomba ob xmlrpc s samimi metodami system.*: ni najdba, ampak opomba v kontekst.opombe.
const opombe6 = [];
r = await kontrola6({ osnova: O, stanje: { php_v_uploads: [] }, opombe: opombe6, fetch: navidezen({ ...varno, 'POST /xmlrpc.php': odziv(200, samoSystem) }) });
ok(r.length === 0 && !r.some((x) => x.stopnja === 'opomba'), 'kontrola6: system.* brez najdb (ni stopnje opomba)');
ok(opombe6.length === 1 && opombe6[0].kontrola === 6 && opombe6[0].besedilo.includes('.htaccess'), 'kontrola6: system.* doda opombo o .htaccess v opombe');
const opombe6b = [];
await kontrola6({ osnova: O, stanje: { php_v_uploads: [] }, opombe: opombe6b, fetch: navidezen(varno) });
ok(opombe6b.length === 0, 'kontrola6: xmlrpc 403 brez opombe');
h = porociloHtml({ ...osnova, najdbe: r, opombe: [...opombe6, { kontrola: 6, besedilo: '<b>x</b>' }] });
const razdelek6 = h.slice(h.indexOf('<h2>6. Utrjevanje</h2>'), h.indexOf('</section>', h.indexOf('<h2>6. Utrjevanje</h2>')));
ok(razdelek6.includes('Brez najdb.') && razdelek6.includes('.htaccess'), 'porocilo: razdelek 6 = Brez najdb. in opomba');
ok(!h.includes('<b>x</b>') && h.includes('&lt;b&gt;x&lt;/b&gt;'), 'porocilo: opomba ubezana');
ok(!h.slice(h.indexOf('<h2>5.'), h.indexOf('<h2>6.')).includes('.htaccess'), 'porocilo: opomba samo pod svojo kontrolo');
ok(povzetek(r).izhod === 0, 'povzetek: opombe ne štejejo');

// razkodiEntitete
ok(razkodiEntitete('Marko Kranjc &#8211; S5xABC &amp; klub') === 'Marko Kranjc – S5xABC & klub', 'razkodiEntitete');

// kontrole-vsebina.mjs
let piskotek = 'ni klica';
const zapomni = async (u, o = {}) => { piskotek = o.headers?.Cookie ?? null; return odziv(200, '<p>x</p>'); };
ok(await pridobiHtml(`${O}/`, { izdana: true, fetch: zapomni }) === '<p>x</p>' && piskotek === 's59dgo_primerjava=izdana', 'pridobiHtml: piškotek za izdano');
await pridobiHtml(`${O}/`, { izdana: false, fetch: zapomni });
ok(piskotek === null, 'pridobiHtml: brez piškotka za trenutno');

const mreza = (src7, src8) => `<main><div class="mreza">
<article id="objava-7" class="post-7 post kartica"><a class="kartica__slika" href="${O}/a/" tabindex="-1" aria-hidden="true"><img width="800" height="520" src="${src7}" class="attachment-s59dgo-kartica" alt="" loading="lazy" srcset="x 800w"></a><h2>A</h2></article>
<article id="objava-8" class="post-8 post kartica"><a class="kartica__slika" href="${O}/b/"><img src="${src8}" alt=""></a></article>
<article id="objava-9" class="post-9 post kartica"><a class="kartica__slika" href="${O}/c/"><img class="kartica__nadomestna" src="${O}/wp-content/themes/s59dgo/assets/img/greben.svg" alt=""></a></article>
</div></main>`;
const k = slikeKartic(mreza(`${O}/u/a-800x520.jpg`, `${O}/u/b.jpg`));
ok(k.length === 3 && k[0].objava_id === 7 && k[0].src === `${O}/u/a-800x520.jpg` && k[1].objava_id === 8 && k[1].src === `${O}/u/b.jpg`, 'slikeKartic: objava in src');

const naslovi1 = [{ vrsta: 'domov', url: `${O}/`, pricakovano: 200 }, { vrsta: 'stran', url: `${O}/o/`, pricakovano: 200 }];
const stanje1 = { slike: [
  { objava_id: 7, naslov: 'A', priponka_id: 70, sirina: 1600, visina: 1040, ima_kartica: true, ima_deljenje: true },
  { objava_id: 8, naslov: 'B', priponka_id: 80, sirina: 1000, visina: 1000, ima_kartica: false, ima_deljenje: false },
] };
const podatki1 = { slike: { 80: { izvirnik: `${O}/u/b.jpg`, predogled: `${O}/u/b-300x300.jpg`, kartica: `${O}/u/b-800x520.jpg` } } };
const slikaOdziv = () => ({ status: 200, ok: true, text: async () => '', arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer });
const fetch1 = (domov) => async (url) => (url === `${O}/` ? odziv(200, domov) : slikaOdziv());
const mapa = await mkdtemp(join(tmpdir(), 's59dgo-k1-'));
r = await kontrola1({ naslovi: naslovi1, podatki: podatki1, stanje: stanje1, mapaPorocila: mapa, fetch: fetch1(mreza(`${O}/u/a-800x520.jpg`, `${O}/u/b.jpg`)) });
ok(r.every((x) => x.kontrola === 1), 'kontrola1: vse najdbe kontrole 1');
ok(stopnje(r, 'rocni-korak').length === 1 && stopnje(r, 'rocni-korak')[0].podrobnosti.objava_id === 8, 'kontrola1: ročni korak iz posnetka (objava 8)');
const nap1 = stopnje(r, 'napaka');
ok(nap1.length === 1 && nap1[0].podrobnosti.objava_id === 8 && nap1[0].sporocilo.includes('800×520'), 'kontrola1: kartica brez izreza po regeneraciji = napaka');
const obrez = r.find((x) => /opazno obrezana/.test(x.sporocilo));
ok(obrez && obrez.podrobnosti.miniature?.izrez_url === `${O}/u/b-800x520.jpg` && obrez.podrobnosti.miniature?.izvirnik_url === `${O}/u/b.jpg`, 'kontrola1: opazno obrezana z URL-jema izreza in izvirnika');
ok(obrez.podrobnosti.miniature.izrez.startsWith('slike/') && (await readdir(join(mapa, 'slike'))).length === 2, 'kontrola1: miniaturi shranjeni v slike/');
h = porociloHtml({ ...osnova, najdbe: r });
ok(h.includes(`src="${obrez.podrobnosti.miniature.izrez}"`) && h.includes(`src="${obrez.podrobnosti.miniature.izvirnik}"`), 'porocilo: miniaturi obrezane slike');
r = await kontrola1({ naslovi: naslovi1, podatki: podatki1, stanje: stanje1, mapaPorocila: mapa, fetch: fetch1(mreza(`${O}/u/a-800x520.jpg`, `${O}/u/b-800x520.jpg`)) });
ok(stopnje(r, 'napaka').length === 0, 'kontrola1: vse kartice z izrezom = brez napake');
// Premajhen izvirnik ali točno 800×520: kartica sme imeti izvirnik.
r = await kontrola1({ naslovi: naslovi1, podatki: {}, stanje: { slike: [
  { objava_id: 7, naslov: 'A', priponka_id: 70, sirina: 640, visina: 400, ima_kartica: false, ima_deljenje: false },
  { objava_id: 8, naslov: 'B', priponka_id: 80, sirina: 800, visina: 520, ima_kartica: false, ima_deljenje: false },
] }, fetch: fetch1(mreza(`${O}/u/a.jpg`, `${O}/u/b.jpg`)) });
ok(stopnje(r, 'napaka').length === 0, 'kontrola1: premajhen ali točen izvirnik ni napaka');
await rm(mapa, { recursive: true, force: true });

// kontrola3: validator prek navideznega fetch
const vrste3 = [{ vrsta: 'domov', url: `${O}/`, pricakovano: 200 }, { vrsta: 'stran', url: `${O}/o/`, pricakovano: 200 }];
const strani3 = {
  trenutna: { [`${O}/`]: '<html>T-domov /themes/s59dgo/</html>', [`${O}/o/`]: '<html>T-stran /themes/s59dgo/</html>' },
  izdana: { [`${O}/`]: '<html>I-domov /themes/s59dgo-izdana/</html>', [`${O}/o/`]: '<html>I-stran /themes/s59dgo-izdana/</html>' },
};
const napakeNu = {
  'T-domov': ['Stray end tag “div”.', 'Bad value “x” for attribute “rel” on element “a”.', 'Bad value “x” for attribute “rel” on element “a”.'],
  'T-stran': ['Bad value “x” for attribute “rel” on element “a”.'],
  'I-domov': ['Bad value “x” for attribute “rel” on element “a”.', 'Unclosed element “div”.'],
  'I-stran': ['Bad value “x” for attribute “rel” on element “a”.'],
};
let validacije = [];
const fetch3 = (strani) => async (url, o = {}) => {
  if (url.startsWith('http://validator:8888/')) {
    validacije.push({ url, tip: o.headers['Content-Type'] });
    const kljuc = String(o.body).match(/[TI]-\w+/)[0];
    return { status: 200, ok: true, json: async () => ({ messages: [...napakeNu[kljuc].map((m) => ({ type: 'error', message: m, lastLine: 3 })), { type: 'info', subType: 'warning', message: 'Opozorilo' }] }) };
  }
  return odziv(200, strani[o.headers?.Cookie ? 'izdana' : 'trenutna'][url]);
};
r = await kontrola3({ naslovi: vrste3, cakajValidator: 0, fetch: fetch3(strani3) });
ok(validacije.length === 4 && validacije.every((v) => v.url === 'http://validator:8888/?out=json' && v.tip === 'text/html; charset=utf-8'), 'kontrola3: POST na validator z text/html');
ok(r.every((x) => x.kontrola === 3), 'kontrola3: najdbe kontrole 3');
const nap3 = stopnje(r, 'napaka');
ok(nap3.length === 1 && nap3[0].sporocilo.includes('domov') && nap3[0].sporocilo.includes('Stray end tag'), 'kontrola3: nova napaka = napaka');
const opo3 = stopnje(r, 'opozorilo');
ok(opo3.length === 1 && opo3[0].sporocilo.includes('rel') && opo3[0].podrobnosti.pojavitev === 3, 'kontrola3: enake kot v izdani = eno opozorilo s številom pojavitev');
ok(!r.some((x) => x.sporocilo.includes('Opozorilo')), 'kontrola3: samo sporočila tipa error');
// Izdana tema se ne izriše (piškotek brez učinka) → napaka, ne lažno »brez novih napak«.
r = await kontrola3({ naslovi: vrste3.slice(0, 1), cakajValidator: 0, fetch: fetch3({ trenutna: strani3.trenutna, izdana: strani3.trenutna }) });
ok(stopnje(r, 'napaka').some((x) => x.sporocilo.includes('s59dgo-izdana')), 'kontrola3: izdana tema ni izrisana = napaka');
// Validator ni dosegljiv → napaka z razlogom.
r = await kontrola3({ naslovi: vrste3.slice(0, 1), cakajValidator: 0, fetch: async (url, o) => { if (url.startsWith('http://validator')) throw new Error('ECONNREFUSED'); return fetch3(strani3)(url, o); } });
ok(stopnje(r, 'napaka').length === 1 && stopnje(r, 'napaka')[0].sporocilo.includes('ECONNREFUSED'), 'kontrola3: validator nedosegljiv = napaka');

// porociloHtml: galerija posnetkov z deležem v slovenski obliki
h = porociloHtml({ ...osnova, najdbe: [], posnetki: [{ ime: 'domov-390-temno', izdana: 'a.png', trenutna: 'b.png', razlika: 'c.png', delez: 0.031 }] });
ok(h.includes('domov-390-temno') && h.includes('src="b.png"') && h.includes('3,1 %'), 'porocilo: posnetek z deležem 3,1 %');
ok(oblikujDelez(0) === '0 %' && oblikujDelez(0.031) === '3,1 %' && oblikujDelez(0.00001) === '< 0,01 %' && oblikujDelez(0.0042) === '0,42 %', 'oblikujDelez');

// kontrole-brskalnik.mjs: čista logika
ok(imePosnetka('domov', 390, 'temno', 'izdana') === 'posnetki/domov-390-temno-izdana.png', 'imePosnetka');
const vu = vsebinaUrlji(`<html><head><link href="https://fonts.example/f.css"></head><body>
<div class="ovoj ovoj--besedilo"><img src="https://tuje.example/t.png"></div>
<div class="besedilo"><div><iframe src="https://www.youtube.com/embed/x"></iframe></div>
<img srcset="https://a.example/1.jpg 1x, https://a.example/2.jpg 2x" src="/u/a.jpg"><br/>
<p style="background:url('https://ozadje.example/o.png')">x</p></div>
<img src="https://za.example/z.png">
<article><div class='kartica__izvlecek'><p><a href="https://b.example/?a=1&amp;b=2">x</a><a href="mailto:x@y.si">m</a></p></div></article></body></html>`, `${O}/objava/`);
ok(['https://www.youtube.com/embed/x', 'https://a.example/1.jpg', 'https://a.example/2.jpg', `${O}/u/a.jpg`, 'https://ozadje.example/o.png', 'https://b.example/?a=1&b=2'].every((u) => vu.includes(u)), 'vsebinaUrlji: URL-ji iz .besedilo in .kartica__izvlecek');
ok(!vu.some((u) => /tuje|za\.example|fonts|mailto/.test(u)), 'vsebinaUrlji: brez URL-jev zunaj vsebine');
ok(vsebinaUrlji('<div class="besedilo"><iframe class="wp-embedded-content" src="https://x.example/a/embed/#?secret=ab#?secret=cd"></iframe></div>', `${O}/`)[0] === 'https://x.example/a/embed/', 'vsebinaUrlji: brez fragmenta (vdelava WP s #?secret=)');
ok(iniciatorCdp({ type: 'parser', url: 'X' }) === 'X', 'iniciatorCdp: parser');
ok(iniciatorCdp({ type: 'script', stack: { callFrames: [{ url: '' }], parent: { callFrames: [{ url: 'Y' }] } } }) === 'Y', 'iniciatorCdp: sklad s staršem');
ok(iniciatorCdp({ type: 'other' }) === null && iniciatorCdp(undefined) === null, 'iniciatorCdp: brez vira');
ok(urlIzSklada(`TypeError: x\n    at f (${O}/wp-content/themes/s59dgo/a.js:3:9)`) === `${O}/wp-content/themes/s59dgo/a.js`, 'urlIzSklada');
ok(urlIzSklada('Error: x') === null, 'urlIzSklada: brez URL');
ok(urlIzSklada(`Error: https://tuje.example/x ni na voljo\n    at ${O}/wp-includes/js/a.js:1:2`) === `${O}/wp-includes/js/a.js`, 'urlIzSklada: URL v sporočilu se ne šteje');
const blok = new Set(['https://x.example/a.js']);
ok(jeOdmevNalaganja({ besedilo: 'Failed to load resource: net::ERR_BLOCKED_BY_CLIENT', url: 'https://x.example/a.js' }, { strani: [`${O}/`], blokirani: blok }), 'odmev: blokirana zahteva');
ok(jeOdmevNalaganja({ besedilo: 'Failed to load resource: the server responded with a status of 404 (Not Found)', url: `${O}/x/` }, { strani: [`${O}/x/`], blokirani: blok }), 'odmev: dokument 404');
ok(!jeOdmevNalaganja({ besedilo: 'Failed to load resource: the server responded with a status of 404 (Not Found)', url: `${O}/wp-content/themes/s59dgo/a.js` }, { strani: [`${O}/`], blokirani: blok }), 'odmev: manjkajoča datoteka teme ni odmev');
ok(!jeOdmevNalaganja({ besedilo: 'Uncaught TypeError', url: 'https://x.example/a.js' }, { strani: [], blokirani: blok }), 'odmev: prava napaka');
const slikaPx = (w, h, px) => ({ width: w, height: h, data: Buffer.from(px.flatMap((v) => [v, v, v, 255])) });
const obr = obreziSliko(slikaPx(3, 2, [1, 2, 3, 4, 5, 6]), 2, 1);
ok(obr.width === 2 && obr.height === 1 && obr.data.length === 8 && obr.data[0] === 1 && obr.data[4] === 2, 'obreziSliko');
const lazniPm = (a, b, d, w, h, o) => { let n = 0; for (let i = 0; i < w * h; i++) if (a[i * 4] !== b[i * 4]) { n++; d[i * 4] = 255; } lazniPm.prag = o.threshold; return n; };
const pr = primerjajSliki(slikaPx(2, 2, [1, 1, 1, 1]), slikaPx(2, 3, [1, 9, 1, 1, 7, 7]), lazniPm);
ok(blizu(pr.delez, 0.25) && pr.razlika.width === 2 && pr.razlika.height === 2 && lazniPm.prag === 0.1, 'primerjajSliki: višina krajše slike, prag 0,1');
ok(pr.visini[0] === 2 && pr.visini[1] === 3, 'primerjajSliki: višini obeh slik');
const krs = (id, impact, target) => ({ id, impact, target, help: `pomoč ${id}` });
r = razvrstiAxe([
  { vrsta: 'domov', shema: 'svetlo', trenutne: [krs('color-contrast', 'serious', '.a'), krs('color-contrast', 'serious', '.b'), krs('region', 'moderate', '.c'), krs('image-alt', 'critical', 'img')], izdane: [krs('color-contrast', 'serious', '.a'), krs('image-alt', 'critical', 'img')] },
  { vrsta: 'stran', shema: 'temno', trenutne: [krs('image-alt', 'critical', 'img')], izdane: [krs('image-alt', 'critical', 'img')] },
]);
ok(r.every((x) => x.kontrola === 9), 'razvrstiAxe: kontrola 9');
ok(stopnje(r, 'napaka').length === 1 && stopnje(r, 'napaka')[0].sporocilo.includes('color-contrast: .b') && stopnje(r, 'napaka')[0].sporocilo.includes('domov'), 'razvrstiAxe: nova serious = napaka');
ok(stopnje(r, 'opozorilo').some((x) => x.sporocilo.includes('region') && x.sporocilo.includes('nova')), 'razvrstiAxe: nova moderate = opozorilo');
const ia = stopnje(r, 'opozorilo').find((x) => x.sporocilo.includes('image-alt'));
ok(ia && ia.podrobnosti.pojavitev === 2 && !stopnje(r, 'napaka').some((x) => x.sporocilo.includes('image-alt')), 'razvrstiAxe: kot v izdani = eno opozorilo s pojavitvami');

// kontrole v brskalniku z navideznim obiskom
const tema7 = `${O}/wp-content/themes/s59dgo/`;
let obiski = [];
const obisk = (rez) => async (stran, url, mozn) => { obiski.push({ url, ...mozn }); const v = typeof rez === 'function' ? rez(url, mozn) : rez; if (v instanceof Error) throw v; return { konzola: [], zahteve: [], posnetek: Buffer.alloc(0), html: '', naslov: 'Naslov', ...v }; };
const naslovi7 = [{ vrsta: 'domov', url: `${O}/` }, { vrsta: 'objava-s-sliko', url: `${O}/a/` }];
const k7 = (rez) => ({ naslovi: naslovi7, osnova: O, obisci: obisk(rez) });
let kt = k7((url) => (url === `${O}/` ? {
  konzola: [{ besedilo: 'Uncaught TypeError: x', url: `${tema7}glavni.js` }, { besedilo: 'Uncaught TypeError: x', url: `${tema7}glavni.js` }, { besedilo: 'jQuery napaka', url: `${O}/wp-includes/js/a.js` }],
  zahteve: [{ url: 'https://fonts.googleapis.com/css', iniciatorUrl: `${tema7}style.css` }, { url: 'https://www.youtube.com/embed/x', iniciatorUrl: `${O}/` }],
  html: '<div class="kartica__izvlecek"><iframe src="https://www.youtube.com/embed/x"></iframe></div>', naslov: 'Domov – S59DGO',
} : new Error('Timeout 30000ms')));
obiski = [];
r = await kontrola2Konzola(kt);
const r7 = await kontrola7(kt);
ok(obiski.length === 2 && obiski.every((x) => x.sirina === 1280 && x.shema === 'svetlo' && !x.izdana), 'kontrola2Konzola/7: en obisk na naslov (trenutna, 1280, svetlo), skupen');
ok(r.every((x) => x.kontrola === 2), 'kontrola2Konzola: kontrola 2');
ok(stopnje(r, 'napaka').filter((x) => x.sporocilo.includes('TypeError')).length === 1, 'kontrola2Konzola: JS teme = ena napaka');
ok(stopnje(r, 'opozorilo').length === 1 && stopnje(r, 'opozorilo')[0].sporocilo.includes('jQuery'), 'kontrola2Konzola: JS drugo = opozorilo');
ok(stopnje(r, 'napaka').some((x) => x.sporocilo.includes('objava-s-sliko') && x.sporocilo.includes('Timeout')), 'kontrola2Konzola: neuspel obisk = napaka');
ok(r7.every((x) => x.kontrola === 7), 'kontrola7: kontrola 7');
ok(stopnje(r7, 'napaka').length === 1 && stopnje(r7, 'napaka')[0].sporocilo.includes('fonts.googleapis.com'), 'kontrola7: klic iz teme = napaka');
ok(stopnje(r7, 'opozorilo').length === 1 && stopnje(r7, 'opozorilo')[0].sporocilo.includes('Domov – S59DGO') && stopnje(r7, 'opozorilo')[0].sporocilo.includes('youtube'), 'kontrola7: klic iz vsebine = opozorilo z naslovom strani');

// kontrola8 in kontrola9: navidezni posnetki (JSON) in navidezen pixelmatch
const kodek = { beri: (b) => { const o = JSON.parse(b.toString()); return slikaPx(o.w, o.h, o.px); }, pisi: (s) => Buffer.from(JSON.stringify({ w: s.width, h: s.height })) };
const posn = (px, h = 1) => Buffer.from(JSON.stringify({ w: 2, h, px }));
const naslovi8 = [{ vrsta: 'domov', url: `${O}/` }, { vrsta: 'stran', url: `${O}/o-klubu/` }, { vrsta: 'avtor', url: `${O}/?author=1` }];
const mapa8 = await mkdtemp(join(tmpdir(), 's59dgo-k8-'));
const rez8 = (url, { izdana, sirina, shema }) => ({
  html: izdana ? '<link href="/wp-content/themes/s59dgo-izdana/style.css">' : '<link href="/wp-content/themes/s59dgo/style.css">',
  posnetek: url === `${O}/` && sirina === 390 && shema === 'temno' && !izdana ? posn([1, 9]) : posn([1, 1]),
  krsitve: url === `${O}/` && !izdana ? [krs('color-contrast', 'serious', '.nova')] : [],
});
obiski = [];
const k8 = { naslovi: naslovi8, osnova: O, mapaPorocila: mapa8, obisci: obisk(rez8), slike: { ...kodek, pixelmatch: lazniPm } };
r = await kontrola8(k8);
ok(obiski.length === 2 * 2 * 2 * 2, 'kontrola8: 2 vrsti × 2 širini × 2 shemi × 2 temi (vrsta brez naslova izpuščena, avtor ni na seznamu)');
ok(k8.posnetki.length === 8 && k8.posnetki.every((s) => s.izdana.startsWith('posnetki/') && s.razlika.endsWith('-razlika.png')), 'kontrola8: 8 parov v kontekst.posnetki');
const datoteke8 = await readdir(join(mapa8, 'posnetki'));
ok(datoteke8.length === 24 && datoteke8.includes('domov-390-temno-trenutna.png'), 'kontrola8: PNG izdana, trenutna, razlika za vsak par');
ok(r.length === 1 && r[0].stopnja === 'opozorilo' && r[0].kontrola === 8 && r[0].sporocilo.includes('domov-390-temno') && r[0].sporocilo.includes('50,0 %'), 'kontrola8: par z razliko = opozorilo z deležem');
r = await kontrola9(k8);
ok(obiski.length === 16, 'kontrola9: brez dodatnih obiskov (axe pri 1280 med obiski kontrole 8)');
ok(obiski.filter((x) => x.axe).length === 8 && obiski.filter((x) => x.axe).every((x) => x.sirina === 1280), 'kontrola9: axe samo pri 1280');
ok(stopnje(r, 'napaka').length === 2 && stopnje(r, 'napaka').every((x) => x.sporocilo.includes('.nova')), 'kontrola9: nova kršitev v obeh shemah = napaka');
await rm(mapa8, { recursive: true, force: true });
// Izdana tema se ne izriše → napaka, brez lažne primerjave.
r = await kontrola8({ naslovi: naslovi8.slice(0, 1), osnova: O, mapaPorocila: await mkdtemp(join(tmpdir(), 's59dgo-k8-')), obisci: obisk({ html: '<link href="/wp-content/themes/s59dgo/style.css">', posnetek: posn([1, 1]) }), slike: { ...kodek, pixelmatch: lazniPm } });
ok(r.length === 1 && r[0].stopnja === 'napaka' && r[0].sporocilo.includes('s59dgo-izdana'), 'kontrola8: izdana tema ni izrisana = napaka');

console.log(`lokalno.test.mjs: ${stevilo} preverjanj OK`);
