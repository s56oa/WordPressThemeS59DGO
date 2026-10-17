// Test jedra generatorja promptov: naloži #podatki in #jedro iz HTML in preveri sestavljanje.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../docs/orodja/s59dgo-prompti.html', import.meta.url), 'utf8');
const P = JSON.parse(html.match(/<script type="application\/json" id="podatki">([\s\S]*?)<\/script>/)[1]);
const ctx = {};
vm.createContext(ctx);
vm.runInContext(html.match(/<script id="jedro">([\s\S]*?)<\/script>/)[1], ctx);
const J = ctx.S59DGO_JEDRO;

let stevilo = 0;
function ok(pogoj, sporocilo) { assert.ok(pogoj, sporocilo); stevilo++; }
ok(J && typeof J === 'object', 'jedro je naloženo');

const nast = (jezik, orodje, dodatno = {}) => Object.assign({ jezik, orodje, tipo: true, ne: true }, dodatno);
const ORODJA = Object.keys(P.orodja);
const nezamenjano = s => /\{\{|\}\}|\[SLOG\]|\[TIPO\]|\[NE\]|undefined|null|\[object|NaN/.test(s);

// 1. Vse kombinacije predloga × jezik × orodje × (privzeto, primer): brez ostankov rež.
for (const p of P.predloge) {
  for (const jezik of ['en', 'sl']) {
    for (const orodje of ORODJA) {
      for (const [ime, v] of [['privzeto', J.privzeto(P, p)], ['primer', J.primer(P, p, jezik)]]) {
        const r = J.sestavi(P, p.id, v, nast(jezik, orodje));
        ok(!nezamenjano(r.pozitivni), `${p.id}/${jezik}/${orodje}/${ime}: brez nezamenjanih rež: ${r.pozitivni.match(/\{\{[^}]*\}\}/)}`);
        ok(!/""|\(\s*\)/.test(r.pozitivni), `${p.id}/${jezik}/${orodje}/${ime}: brez praznih narekovajev ali oklepajev`);
        ok(!/[{}]/.test(r.pozitivni), `${p.id}/${jezik}/${orodje}/${ime}: brez zavitih oklepajev`);
        ok(Array.isArray(r.opozorila), `${p.id}: opozorila so seznam`);
        if (orodje === 'sd') ok(typeof r.negativni === 'string' && r.negativni.includes('watermark'), `${p.id}/sd: negativni prompt`);
        else ok(r.negativni === null, `${p.id}/${orodje}: brez negativnega prompta`);
      }
    }
  }
}

// 2. Bloki in orodja.
const napoved = J.predloga(P, 'napoved');
const vNapoved = J.primer(P, napoved, 'en');
let r = J.sestavi(P, 'napoved', vNapoved, nast('en', 'univerzalno'));
ok(r.pozitivni.startsWith(P.bloki.slog.en), 'univerzalno: začne s SLOG');
ok(r.pozitivni.includes(P.bloki.tipo.en), 'predloga z besedilom: vsebuje TIPO');
ok(r.pozitivni.includes(P.bloki.ne.en), 'univerzalno: vsebuje NE');
ok(r.pozitivni.includes('"Field day na Sviščakih"'), 'besedilo uporabnika v narekovajih');
ok(r.opozorila.length === 0, 'primer napovedi brez opozoril: ' + r.opozorila.join(' | '));
r = J.sestavi(P, 'napoved', vNapoved, nast('en', 'univerzalno', { tipo: false, ne: false }));
ok(!r.pozitivni.includes(P.bloki.tipo.en) && !r.pozitivni.includes(P.bloki.ne.en), 'stikali TIPO in NE izklopita bloka');
r = J.sestavi(P, 'napoved', vNapoved, nast('en', 'midjourney'));
ok(/ --ar 1:1 --style raw --stylize 50$/.test(r.pozitivni), 'Midjourney: parametri na koncu');
const mjNo = r.pozitivni.split(' --no ')[1] || '';
ok(mjNo.startsWith('gradient') && !/\btext\b|\bletters\b/.test(mjNo) && !r.pozitivni.includes(P.bloki.ne.en), 'Midjourney: --no brez text/letters pri predlogi z besedilom, brez stavka NE');
ok(!r.pozitivni.includes('\n'), 'Midjourney: ena vrstica');
ok(r.opozorila.some(t => t.includes('Midjourney')), 'Midjourney: opozorilo o besedilu');
r = J.sestavi(P, 'pasica', J.privzeto(P, J.predloga(P, 'pasica')), nast('en', 'midjourney'));
ok(r.pozitivni.includes('--no gradient, shadow, glow, neon, photo, text, letters'), 'Midjourney: --no s text, letters pri predlogi brez besedila');
ok(r.pozitivni.includes('--ar 21:8'), 'Midjourney: --ar iz formata');
r = J.sestavi(P, 'napoved', vNapoved, nast('en', 'sd'));
ok(r.pozitivni.startsWith(P.orodja.sd.predpona), 'SD: predpona');
ok(r.negativni.startsWith(P.bloki.ne.en) && !/(^|, )text(,|$)/.test(r.negativni.slice(P.bloki.ne.en.length)), 'SD: negativni = NE + seznam brez "text" pri predlogi z besedilom');
r = J.sestavi(P, 'napoved', vNapoved, nast('sl', 'ideogram'));
ok(r.pozitivni.endsWith(P.orodja.ideogram.zakljucek.sl), 'Ideogram: zaključek s paleto');
r = J.sestavi(P, 'napoved', vNapoved, nast('sl', 'chatgpt'));
ok(r.pozitivni.endsWith(P.orodja.chatgpt.zakljucek.sl) && r.pozitivni.startsWith(P.bloki.slog.sl), 'ChatGPT SL: slovenski bloki in zaključek');

// 3. Elementi.
const naslovna = J.predloga(P, 'naslovna');
const vN = J.privzeto(P, naslovna);
vN.elementi.ozadje = 'svetlo'; vN.elementi.plasti = 3; vN.elementi.sonce = 'levo';
r = J.sestavi(P, 'naslovna', vN, nast('en', 'univerzalno'));
ok(r.pozitivni.includes(P.bloki.slog_svetlo.en), 'svetlo ozadje doda SLOG_SVETLO');
ok(r.pozitivni.includes(P.elementi.greben['3-svetlo'].en), 'greben: 3 plasti, svetlo');
ok(r.pozitivni.includes(P.elementi.sonce.levo.en), 'sonce levo');
ok(!r.pozitivni.includes(P.bloki.tipo.en), 'naslovna brez TIPO');
vN.elementi.sonce = 'brez';
ok(J.sestavi(P, 'naslovna', vN, nast('en', 'univerzalno')).pozitivni.includes('no sun'), 'sonce brez');
const ikone = J.predloga(P, 'ikone');
const vI = J.privzeto(P, ikone); vI.elementi.ozadje = 'prosojno';
r = J.sestavi(P, 'ikone', vI, nast('en', 'univerzalno'));
ok(r.pozitivni.includes(P.bloki.temno.en) && !r.pozitivni.includes(P.bloki.slog.en), 'ikone prosojno: TEMNO brez SLOG');
ok(r.pozitivni.includes('arranged in a 4×3 grid'), 'mreža 12 ikon = 4×3');
vI.polja.ikone = { izbrane: [], svoj: 'a satellite dish; a QSL card' };
r = J.sestavi(P, 'ikone', vI, nast('en', 'univerzalno'));
ok(r.pozitivni.includes('Icons: a satellite dish; a QSL card.') && r.pozitivni.includes('2×1 grid'), 'svoje ikone, ločene s podpičjem');
vI.polja.ikone = { izbrane: [], svoj: '' };
r = J.sestavi(P, 'ikone', vI, nast('en', 'univerzalno'));
ok(r.opozorila.some(t => t.includes('prazen')) && !nezamenjano(r.pozitivni), 'prazen seznam: opozorilo, prompt brez rež');
const koraki = J.predloga(P, 'koraki');
const vK = J.primer(P, koraki, 'en'); vK.elementi.format = 'navpicno';
r = J.sestavi(P, 'koraki', vK, nast('en', 'midjourney'));
ok(r.pozitivni.includes('arranged vertically') && r.pozitivni.endsWith('--ar 4:5 --style raw --stylize 50'), 'format koraki navpično');
ok(J.sestavi(P, 'koraki', vK, nast('en', 'univerzalno')).pozitivni.includes('in 4 steps'), 'N = število vrstic');
vK.elementi.poudarki = ['puscice', 'zadnja'];
ok(J.sestavi(P, 'koraki', vK, nast('en', 'univerzalno')).opozorila.some(t => t.includes('oranžn')), 'dva poudarka: opozorilo o oranžni');
const cestitka = J.predloga(P, 'cestitka');
ok(J.sestavi(P, 'cestitka', J.primer(P, cestitka, 'en'), nast('en', 'univerzalno')).opozorila.length === 0, 'privzeti poudarki čestitke brez opozorila');

// 4. Prazna polja in posebni znaki.
const vP = J.privzeto(P, napoved);
r = J.sestavi(P, 'napoved', vP, nast('en', 'univerzalno'));
ok(r.pozitivni.includes('an empty solid text bar') && r.pozitivni.includes('Leave every empty text bar'), 'prazna polja: prazen trak in stavek');
ok(r.opozorila.some(t => t.includes('»Naslov«')), 'opozorilo za prazen naslov');
const vD = J.primer(P, napoved, 'en');
vD.polja.naslov = 'Zelo dolg naslov dogodka, ki gotovo ne gre v tri vrstice na kvadratni sliki';
ok(J.sestavi(P, 'napoved', vD, nast('en', 'univerzalno')).opozorila.some(t => t.includes('predolg')), 'opozorilo za predolg naslov');
vD.polja.naslov = 'Tečaj "CW" <b>&</b> čšž';
r = J.sestavi(P, 'napoved', vD, nast('en', 'univerzalno'));
ok(r.pozitivni.includes('"Tečaj »CW« <b>&</b> čšž"'), 'narekovaji v »«, HTML in šumniki dobesedno');
ok(J.citati('a "b" c "d') === 'a »b« c »d', 'citati: pari in osamljen narekovaj');
const lestvica = J.predloga(P, 'lestvica');
const vL = J.primer(P, lestvica, 'en');
vL.polja.vrstice = [{ klic: '', rezultat: '' }, { klic: 'S50C', rezultat: '' }];
r = J.sestavi(P, 'lestvica', vL, nast('en', 'univerzalno'));
ok(r.pozitivni.includes('Rows in order: 1. "S50C".') && r.pozitivni.includes('with 1 rows'), 'prazne vrstice se izpustijo, prazne celice brez ""');
vL.polja.vrstice = [];
r = J.sestavi(P, 'lestvica', vL, nast('en', 'univerzalno'));
ok(!nezamenjano(r.pozitivni) && r.pozitivni.includes('Rows in order: an empty solid text bar'), 'brez vrstic: prazen trak');
const urnik = J.predloga(P, 'urnik');
const vU = J.primer(P, urnik, 'sl'); vU.polja.kljucna = 99;
ok(J.sestavi(P, 'urnik', vU, nast('sl', 'univerzalno')).pozitivni.includes('Ključna postavka "Postavitev anten"'), 'poudarek izven obsega → prva vrstica');
const motivSvoj = J.privzeto(P, naslovna);
motivSvoj.polja.motiv = { izbran: 'svoj', svoj: 'a satellite dish', dodatno: 'brez', dodatnoSvoj: '' };
r = J.sestavi(P, 'naslovna', motivSvoj, nast('en', 'univerzalno'));
ok(r.pozitivni.includes('Composition: a satellite dish as') && r.pozitivni.includes('no additional elements'), 'svoj motiv in brez dodatnega');

// 5. Uvoz.
ok(J.preveriUvoz(P, null).ok === false && J.preveriUvoz(P, { verzija: 2 }).ok === false, 'uvoz: zavrne napačno verzijo');
let u = J.preveriUvoz(P, { verzija: 1, predloga: 'neznana', jezik: 'de', orodje: 'toString', tipo: 'da' });
ok(u.ok && u.stanje.predloga === P.predloge[0].id && u.stanje.jezik === 'en' && u.stanje.orodje === 'univerzalno' && u.stanje.tipo === true, 'uvoz: neveljavne vrednosti → privzete');
u = J.preveriUvoz(P, { verzija: 1, predloga: 'lestvica', vrednosti: { lestvica: { polja: { naslov: 5, vrstice: ['x', { klic: 'S59DGO', rezultat: 7, tuje: 1 }] }, elementi: { plasti: 7, format: 'xx', poudarki: [1, 'prvo'] } } } });
ok(u.ok, 'uvoz: poškodovane vrednosti sprejete');
const vu = u.stanje.vrednosti.lestvica;
ok(vu.polja.naslov === '' && vu.polja.vrstice.length === 1 && vu.polja.vrstice[0].klic === 'S59DGO' && vu.polja.vrstice[0].rezultat === '' && !('tuje' in vu.polja.vrstice[0]), 'uvoz: tipi polj očiščeni');
ok(JSON.stringify(vu.elementi.poudarki) === '["prvo"]', 'uvoz: poudarki le nizi');
r = J.sestavi(P, 'lestvica', vu, nast('en', 'midjourney'));
ok(!nezamenjano(r.pozitivni) && r.pozitivni.includes('--ar 4:5'), 'uvoz: neveljaven format in plasti ne podreta sestavljanja');
const vNaslovna = J.privzeto(P, naslovna); vNaslovna.elementi.plasti = 7; vNaslovna.elementi.sonce = 'x'; vNaslovna.elementi.ozadje = 'x';
ok(!nezamenjano(J.sestavi(P, 'naslovna', vNaslovna, nast('sl', 'univerzalno')).pozitivni), 'neveljavni elementi → privzeti');

// 6. Midjourney: prelom vrstice v daljšem polju ne sme razbiti enovrstičnega prompta.
const plakat = J.predloga(P, 'plakat');
const vPl = J.primer(P, plakat, 'en'); vPl.polja.opis = 'Prva vrstica\nDruga vrstica';
r = J.sestavi(P, 'plakat', vPl, nast('en', 'midjourney'));
ok(!r.pozitivni.includes('\n') && r.pozitivni.includes('"Prva vrstica Druga vrstica"'), 'Midjourney: prelomi vrstic v vnosu postanejo presledki');

// 7. Naslovna slika: kartica 20:13 (privzeto) in 16:9 z varnim območjem.
const vNs = J.primer(P, naslovna, 'en');
r = J.sestavi(P, 'naslovna', vNs, nast('en', 'midjourney'));
ok(r.pozitivni.endsWith('--ar 3:2 --style raw --stylize 50') && r.pozitivni.includes('1600×1040'), 'naslovna privzeto: kartica 20:13 (3:2, obrez 1600×1040)');
vNs.elementi.format = '16:9';
r = J.sestavi(P, 'naslovna', vNs, nast('en', 'midjourney'));
ok(r.pozitivni.endsWith('--ar 16:9 --style raw --stylize 50') && r.pozitivni.includes('central 85 %'), 'naslovna 16:9: --ar 16:9 in varno območje');
ok(J.sestavi(P, 'naslovna', vNs, nast('sl', 'univerzalno')).pozitivni.includes('srednjih 85 %'), 'naslovna 16:9 SL: varno območje');
const f169 = J.poId(naslovna.formati, '16:9');
ok(f169 && f169.varno && f169.varno.length === 2 && f169.varno[0].w < 8, 'naslovna 16:9: predogled označi oba stranska pasova');
const plakatSl = J.sestavi(P, 'plakat', J.primer(P, J.predloga(P, 'plakat'), 'sl'), nast('sl', 'univerzalno')).pozitivni;
ok(plakatSl.includes('www.s59dgo.si') && !plakatSl.includes('s59dgo.org'), 'plakat: domena www.s59dgo.si');

// TESTI-NAPREJ (naslednje naloge dodajo teste nad to vrstico)
console.log('OK: prompti.test.mjs, ' + stevilo + ' preverjanj');
