// Strežniške kontrole (HTTP brez brskalnika): 2 (kode in debug.log), 4 (Open Graph), 5 (nastavitve), 6 (utrjevanje).
// Vsaka kontrola: async (kontekst) → najdba[]; kontekst.fetch nadomesti globalni fetch v testih.
import { najdba, preveriOg } from './jedro.mjs';

const CAKAJ_MS = 30000;
const NOGA = { 'noga-1': 'Noga – Kontakt', 'noga-2': 'Noga – Uradne ure', 'noga-3': 'Noga – Podpora' };
const POT_TEME = /themes\/s59dgo\//;
// Vrstice, ki jih v debug.log pusti WP-CLI sam (PHP 8.5 deprecations), niso del preverjanja.
const WP_CLI = /wp-cli|WP_CLI|\/usr\/local\/bin\/wp|Colors\.php/;
const E_POSTA = /[^\s@<>"',;:]+@[^\s@<>"',;:]+\.[a-z]{2,}/gi;

const entitete = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
function razkodiraj(s) {
  return String(s).replace(/&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi, (cel, d, h, ime) => {
    if (d || h) {
      const koda = d ? parseInt(d, 10) : parseInt(h, 16);
      return koda > 0 && koda <= 0x10ffff ? String.fromCodePoint(koda) : cel;
    }
    return Object.hasOwn(entitete, ime.toLowerCase()) ? entitete[ime.toLowerCase()] : cel;
  });
}

// Oznake <meta> v <head> kot [{kljuc, vrednost}]; ključ je property ali name.
export function razcleniMeta(html) {
  const s = String(html);
  const konec = s.search(/<\/head\s*>/i);
  const glava = konec === -1 ? s : s.slice(0, konec);
  const meta = [];
  for (const [oznaka] of glava.matchAll(/<meta\b[^>]*>/gi)) {
    const atributi = {};
    for (const [, ime, , v1, v2, v3] of oznaka.matchAll(/([a-z:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/gi)) {
      atributi[ime.toLowerCase()] = v1 ?? v2 ?? v3;
    }
    const kljuc = atributi.property ?? atributi.name;
    if (kljuc) meta.push({ kljuc, vrednost: razkodiraj(atributi.content ?? '') });
  }
  return meta;
}

// Razvrsti debug.log: zapis se začne z »[čas]«, nadaljevalne vrstice (sled sklada) sodijo k njemu.
export function razvrstiDnevnik(besedilo) {
  const zapisi = [];
  for (const vrstica of String(besedilo).split('\n')) {
    if (vrstica.trim() === '') continue;
    if (/^\[[^\]]+\]/.test(vrstica) || zapisi.length === 0) zapisi.push(vrstica);
    else zapisi[zapisi.length - 1] += `\n${vrstica}`;
  }
  const po = new Map();
  for (const zapis of zapisi) {
    if (WP_CLI.test(zapis)) continue;
    const prva = zapis.split('\n')[0].replace(/^\[[^\]]+\]\s*/, '').replace(E_POSTA, '[e-pošta]').slice(0, 500);
    const stopnja = POT_TEME.test(zapis) ? 'napaka' : 'opozorilo';
    const kljuc = `${stopnja}\u0000${prva}`;
    if (po.has(kljuc)) po.get(kljuc).podrobnosti.ponovitev++;
    else po.set(kljuc, najdba(2, stopnja, `debug.log: ${prva}`, { ponovitev: 1, vir: stopnja === 'napaka' ? 'tema' : 'drugo' }));
  }
  return [...po.values()];
}

async function zahteva(kontekst, url, moznosti = {}) {
  const f = kontekst.fetch ?? fetch;
  const odziv = await f(url, { redirect: 'follow', signal: AbortSignal.timeout(CAKAJ_MS), ...moznosti });
  return { koda: odziv.status, telo: await odziv.text() };
}

// 2 (HTTP): vsak naslov vrne pričakovano kodo po preusmeritvah.
export async function kontrola2(kontekst) {
  const najdbe = [];
  for (const { vrsta, url, pricakovano } of kontekst.naslovi) {
    try {
      const { koda } = await zahteva(kontekst, url);
      if (koda !== pricakovano) {
        najdbe.push(najdba(2, 'napaka', `${vrsta}: koda ${koda}, pričakovano ${pricakovano}`, { vrsta, url, koda, pricakovano }));
      }
    } catch (e) {
      najdbe.push(najdba(2, 'napaka', `${vrsta}: zahteva ni uspela (${e.message})`, { vrsta, url }));
    }
  }
  return najdbe;
}

// 2 (debug.log): pokliči po vseh zahtevah; kontekst.dnevnik = vsebina /stanje/debug.log.
export async function kontrola2Dnevnik(kontekst) {
  return razvrstiDnevnik(kontekst.dnevnik ?? '');
}

// 4: oznake Open Graph na objavah; velikost 1200×630 samo, če ima naslovna slika izrez s59dgo-deljenje.
export async function kontrola4(kontekst) {
  const najdbe = [];
  const idji = { 'objava-s-sliko': kontekst.podatki?.objava_s_sliko_id, 'objava-brez-slike': kontekst.podatki?.objava_brez_slike_id };
  for (const { vrsta, url } of kontekst.naslovi.filter((n) => Object.hasOwn(idji, n.vrsta))) {
    const slika = (kontekst.stanje?.slike ?? []).find((s) => s.objava_id === idji[vrsta]);
    try {
      const { telo } = await zahteva(kontekst, url);
      for (const n of preveriOg(razcleniMeta(telo), { imaIzrez: Boolean(slika?.ima_deljenje) })) {
        najdbe.push(najdba(4, n.stopnja, `${vrsta}: ${n.sporocilo}`, { ...n.podrobnosti, vrsta, url }));
      }
    } catch (e) {
      najdbe.push(najdba(4, 'napaka', `${vrsta}: zahteva ni uspela (${e.message})`, { vrsta, url }));
    }
  }
  return najdbe;
}

// 5: nastavitve s produkcije, ki jih tema pričakuje (ročni koraki v administraciji).
export async function kontrola5(kontekst) {
  const n = kontekst.stanje?.nastavitve ?? {};
  const najdbe = [];
  const korak = (sporocilo, podrobnosti = {}) => najdbe.push(najdba(5, 'rocni-korak', sporocilo, podrobnosti));
  if (n.posts_per_page !== 9) korak(`Nastavitve → Branje → 9 objav na stran (zdaj: ${n.posts_per_page})`);
  if (!n.meni_glavni) korak('Videz → Meniji → dodeli meni lokaciji »Glavni meni«');
  if (!n.logotip) korak('Videz → Prilagodi → Identiteta spletišča → nastavi logotip');
  for (const [obmocje, ime] of Object.entries(NOGA)) {
    if (!(n.gradniki?.[obmocje] ?? []).length) korak(`Videz → Gradniki → napolni območje »${ime}« (${obmocje})`, { obmocje });
  }
  if (n.tema !== 's59dgo') korak(`Videz → Teme → aktiviraj s59dgo (zdaj: ${n.tema})`);
  return najdbe;
}

const XMLRPC = '<?xml version="1.0"?><methodCall><methodName>system.listMethods</methodName><params></params></methodCall>';

// xmlrpc.php ne sprejema klicev: zavrnjen (≥ 400 ali <fault>) ali pa ponuja samo vgrajene
// metode system.* (mu-plugin izprazni xmlrpc_methods; .htaccess s produkcije lokalno ne velja).
// Vrne null, če je v redu, sicer opis kršitve.
function presodiXmlrpc({ koda, telo }) {
  if (koda >= 400 || /<fault>/i.test(telo)) return null;
  if (!/<methodResponse/i.test(telo)) return 'odziv ni XML-RPC';
  const metode = [...telo.matchAll(/<string>\s*([^<]+?)\s*<\/string>/g)].map((z) => z[1]);
  const tuje = metode.filter((m) => !m.startsWith('system.'));
  return tuje.length ? `ponuja metode ${tuje.slice(0, 5).join(', ')}${tuje.length > 5 ? ' …' : ''}` : null;
}

// 6: utrjevanje (mu-plugin 00-s59dgo-hardening.php s produkcije) in PHP v uploads/.
export async function kontrola6(kontekst) {
  const o = kontekst.osnova;
  const najdbe = [];
  const preizkusi = [
    ['xmlrpc.php ne sprejema klicev', `${o}/xmlrpc.php`, { method: 'POST', headers: { 'Content-Type': 'text/xml' }, body: XMLRPC },
      presodiXmlrpc],
    ['/wp-json/wp/v2/users brez prijave ni na voljo (404)', `${o}/wp-json/wp/v2/users`, {}, ({ koda }) => (koda === 404 ? null : '')],
    ['/wp-json/batch/v1 ni na voljo (404)', `${o}/wp-json/batch/v1`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"requests":[]}' },
      ({ koda }) => (koda === 404 ? null : '')],
    ['avtorski arhiv vrne 410', `${o}/?author=1`, {}, ({ koda }) => (koda === 410 ? null : '')],
    ['?author__not_in=1 vrne 403', `${o}/?author__not_in=1`, {}, ({ koda }) => (koda === 403 ? null : '')],
    ['domača stran nima <meta name="generator">', `${o}/`, {}, ({ telo }) => (/<meta[^>]+name\s*=\s*["']?generator/i.test(telo) ? '' : null)],
  ];
  // presodi(odziv) → null (v redu) ali opis kršitve (lahko prazen).
  for (const [opis, url, moznosti, presodi] of preizkusi) {
    try {
      const odziv = await zahteva(kontekst, url, moznosti);
      const krsitev = presodi(odziv);
      if (krsitev !== null) {
        najdbe.push(najdba(6, 'napaka', `Ni izpolnjeno: ${opis} (koda ${odziv.koda}${krsitev ? `; ${krsitev}` : ''})`, { url, koda: odziv.koda }));
      }
    } catch (e) {
      najdbe.push(najdba(6, 'napaka', `${opis}: zahteva ni uspela (${e.message})`, { url }));
    }
  }
  for (const pot of kontekst.stanje?.php_v_uploads ?? []) {
    najdbe.push(najdba(6, 'opozorilo', `PHP v uploads/ – preveri na produkciji: ${pot}`, { pot }));
  }
  return najdbe;
}
