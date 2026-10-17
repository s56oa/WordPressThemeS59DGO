// Test jedra preverjanja lokalnega WordPressa (lokalno/preverjanje/jedro.mjs): čista logika brez I/O.
import assert from 'node:assert/strict';
import {
  najdba, odkrijNaslove, delezObreza, razvrstiSliko, jeIzrezKartice, preveriOg,
  razvrstiZahtevo, razvrstiKonzolo, noveNajdbe, povzetek, porociloHtml,
} from '../lokalno/preverjanje/jedro.mjs';

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
ok(/<h2[^>]*>[^<]*Naslovne slike/.test(h) || h.includes('Naslovne slike'), 'porocilo: naslovi kontrol');

console.log(`lokalno.test.mjs: ${stevilo} preverjanj OK`);
