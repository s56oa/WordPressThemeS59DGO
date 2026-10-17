// Test jedra preverjanja lokalnega WordPressa (lokalno/preverjanje/jedro.mjs): čista logika brez I/O.
import assert from 'node:assert/strict';
import {
  najdba, odkrijNaslove, delezObreza, razvrstiSliko, jeIzrezKartice, preveriOg,
  razvrstiZahtevo, razvrstiKonzolo, noveNajdbe, povzetek, porociloHtml,
} from '../lokalno/preverjanje/jedro.mjs';
import {
  razcleniMeta, razvrstiDnevnik, kontrola2, kontrola4, kontrola5, kontrola6,
} from '../lokalno/preverjanje/kontrole-streznik.mjs';

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
ok(r.length === 0, 'kontrola6: xmlrpc s samimi metodami system.* ne sprejema klicev');
r = await kontrola6({ osnova: O, stanje: { php_v_uploads: [] }, fetch: navidezen({ ...varno, 'POST /xmlrpc.php': odziv(200, samoSystem.replace('system.multicall', 'pingback.ping')) }) });
ok(r.length === 1 && r[0].sporocilo.includes('pingback.ping'), 'kontrola6: xmlrpc z metodo pingback.ping = napaka z imenom metode');
let xmlrpcTelo = '';
await kontrola6({ osnova: O, stanje: { php_v_uploads: [] }, fetch: navidezen({ ...varno, 'POST /xmlrpc.php': (o) => { xmlrpcTelo = o.body; return odziv(403); } }) });
ok(xmlrpcTelo.includes('<methodName>system.listMethods</methodName>'), 'kontrola6: klic system.listMethods');

console.log(`lokalno.test.mjs: ${stevilo} preverjanj OK`);
