// Kontroli vsebine izrisanih strani: 1 (naslovne slike in izrezi kartic) in 3 (veljaven HTML, primerjava z izdano temo).
// Vsaka kontrola: async (kontekst) → najdba[]; kontekst.fetch nadomesti globalni fetch v testih.
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { najdba, razvrstiSliko, jeIzrezKartice, noveNajdbe } from './jedro.mjs';

const CAKAJ_MS = 30000;
const PISKOTEK_IZDANE = 's59dgo_primerjava=izdana';
const MREZA = new Set(['domov', 'domov-2']);

// HTML naslova; ob izdana: true s piškotkom, ob katerem mu-plugin izriše temo s59dgo-izdana.
export async function pridobiHtml(url, { izdana = false, fetch: f = fetch } = {}) {
  const headers = izdana ? { Cookie: PISKOTEK_IZDANE } : {};
  const odziv = await f(url, { redirect: 'follow', headers, signal: AbortSignal.timeout(CAKAJ_MS) });
  return odziv.text();
}

const atribut = (oznaka, ime) => {
  const z = oznaka.match(new RegExp(`\\s${ime}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i'));
  return z ? (z[2] ?? z[3] ?? z[4]).replace(/&amp;/g, '&') : null;
};

// Slike kartic v mreži: [{ objava_id, src }] za vsak <article id="objava-N"> z <a class="kartica__slika"><img>.
export function slikeKartic(html) {
  const kartice = [];
  for (const [, id, telo] of String(html).matchAll(/<article\b[^>]*\bid\s*=\s*["']objava-(\d+)["'][^>]*>([\s\S]*?)<\/article>/gi)) {
    for (const [povezava] of telo.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)) {
      const odpiranje = povezava.match(/^<a\b[^>]*>/i)[0];
      if (!/\bkartica__slika\b/.test(atribut(odpiranje, 'class') ?? '')) continue;
      const img = povezava.match(/<img\b[^>]*>/i);
      if (img) kartice.push({ objava_id: Number(id), src: atribut(img[0], 'src') ?? '' });
      break;
    }
  }
  return kartice;
}

const pripona = (url) => (String(url).split(/[?#]/)[0].match(/\.(jpe?g|png|webp|gif|avif)$/i)?.[0] ?? '.img').toLowerCase();

// Prenese sliko v <mapa>/slike/; vrne relativno pot ali null.
async function shraniSliko(f, url, mapa, ime) {
  try {
    const odziv = await f(url, { signal: AbortSignal.timeout(CAKAJ_MS) });
    if (!odziv.ok) return null;
    const pot = `slike/${ime}${pripona(url)}`;
    await writeFile(join(mapa, pot), Buffer.from(await odziv.arrayBuffer()));
    return pot;
  } catch {
    return null;
  }
}

// 1: izreza iz posnetka produkcije (stanje.slike) in kartice v mreži po lokalni regeneraciji.
// kontekst.podatki.slike = { <priponka_id>: { izvirnik, predogled, kartica } } (naslovi.php),
// kontekst.mapaPorocila = mapa poročila za miniature opazno obrezanih slik (brez nje samo URL-ji).
export async function kontrola1(kontekst) {
  const f = kontekst.fetch ?? fetch;
  const najdbe = [];
  const slike = kontekst.stanje?.slike ?? [];
  const urlji = kontekst.podatki?.slike ?? {};
  const mapa = kontekst.mapaPorocila;
  if (mapa) {
    await rm(join(mapa, 'slike'), { recursive: true, force: true });
    await mkdir(join(mapa, 'slike'), { recursive: true });
  }
  for (const slika of slike) {
    for (const n of razvrstiSliko(slika)) {
      const u = urlji[String(slika.priponka_id)];
      if (n.podrobnosti.delez !== undefined && u) {
        const m = { izrez_url: u.kartica, izvirnik_url: u.izvirnik };
        if (mapa) {
          const izrez = await shraniSliko(f, u.kartica, mapa, `${slika.priponka_id}-izrez`);
          const izvirnik = await shraniSliko(f, u.predogled || u.izvirnik, mapa, `${slika.priponka_id}-izvirnik`);
          if (izrez) m.izrez = izrez;
          if (izvirnik) m.izvirnik = izvirnik;
        }
        n.podrobnosti.miniature = m;
      }
      najdbe.push(n);
    }
  }
  const po = new Map(slike.map((s) => [s.objava_id, s]));
  for (const { vrsta, url } of (kontekst.naslovi ?? []).filter((n) => MREZA.has(n.vrsta))) {
    let html;
    try {
      html = await pridobiHtml(url, { fetch: f });
    } catch (e) {
      najdbe.push(najdba(1, 'napaka', `${vrsta}: zahteva ni uspela (${e.message})`, { vrsta, url }));
      continue;
    }
    for (const { objava_id, src } of slikeKartic(html)) {
      const s = po.get(objava_id);
      // Premajhen ali točno 800×520 izvirnik nima izreza; kartica tedaj upravičeno pokaže izvirnik.
      if (!s || s.sirina < 800 || s.visina < 520 || (s.sirina === 800 && s.visina === 520)) continue;
      if (!jeIzrezKartice(src)) {
        najdbe.push(najdba(1, 'napaka',
          `${s.naslov} (objava ${objava_id}): kartica v mreži (${vrsta}) nima izreza 800×520 po regeneraciji`,
          { objava_id, priponka_id: s.priponka_id, vrsta, src }));
      }
    }
  }
  return najdbe;
}

const pocakaj = (ms) => new Promise((r) => { setTimeout(r, ms); });

// 3: Nu validator za vsak naslov v trenutni in izdani temi; nove napake = napaka, ostale = opozorilo.
// kontekst.validator (privzeto http://validator:8888), kontekst.cakajValidator = ms čakanja na zagon validatorja.
export async function kontrola3(kontekst) {
  const f = kontekst.fetch ?? fetch;
  const validator = kontekst.validator ?? 'http://validator:8888';
  let rok = Date.now() + (kontekst.cakajValidator ?? 120000);
  const napakeHtml = async (html) => {
    for (;;) {
      try {
        const odziv = await f(`${validator}/?out=json`, {
          method: 'POST', headers: { 'Content-Type': 'text/html; charset=utf-8' }, body: html, signal: AbortSignal.timeout(CAKAJ_MS),
        });
        if (!odziv.ok) throw new Error(`validator: koda ${odziv.status}`);
        const sporocila = (await odziv.json()).messages ?? [];
        const tuja = sporocila.find((m) => m.type === 'non-document-error');
        if (tuja) throw new Error(`validator: ${tuja.message}`);
        rok = 0; // validator teče; naprej brez čakanja
        return sporocila.filter((m) => m.type === 'error');
      } catch (e) {
        if (Date.now() >= rok) throw e;
        await pocakaj(2000);
      }
    }
  };

  const najdbe = [];
  const izdane = [];
  const opis = new Map(); // ključ → { vrsta, url, sporocilo, vrstica, izsek, pojavitev }
  for (const { vrsta, url } of kontekst.naslovi ?? []) {
    let html;
    let htmlIzdana;
    try {
      html = await pridobiHtml(url, { fetch: f });
      htmlIzdana = await pridobiHtml(url, { izdana: true, fetch: f });
    } catch (e) {
      najdbe.push(najdba(3, 'napaka', `${vrsta}: zahteva ni uspela (${e.message})`, { vrsta, url }));
      continue;
    }
    if (html.includes('/themes/s59dgo/') && !htmlIzdana.includes('/themes/s59dgo-izdana/')) {
      najdbe.push(najdba(3, 'napaka', `${vrsta}: izdana tema s59dgo-izdana se ne izriše (piškotek ${PISKOTEK_IZDANE} brez učinka; lokalno/pripravi-izdano.sh?)`, { vrsta, url }));
      continue;
    }
    let t;
    let i;
    try {
      t = await napakeHtml(html);
      i = await napakeHtml(htmlIzdana);
    } catch (e) {
      najdbe.push(najdba(3, 'napaka', `Validator HTML ni odgovoril (${e.message})`, { vrsta, url }));
      break;
    }
    for (const m of t) {
      const kljuc = `${vrsta}: ${m.message}`;
      if (opis.has(kljuc)) opis.get(kljuc).pojavitev++;
      else opis.set(kljuc, { vrsta, url, sporocilo: m.message, vrstica: m.lastLine, izsek: String(m.extract ?? '').slice(0, 200), pojavitev: 1 });
    }
    for (const m of i) izdane.push(`${vrsta}: ${m.message}`);
  }

  const nove = new Set(noveNajdbe([...opis.keys()], izdane));
  const enake = new Map(); // sporočilo → { pojavitev, vrste }
  for (const [kljuc, o] of opis) {
    if (nove.has(kljuc)) {
      najdbe.push(najdba(3, 'napaka', `Nova napaka HTML – ${kljuc}`,
        { vrsta: o.vrsta, url: o.url, pojavitev: o.pojavitev, vrstica: o.vrstica, izsek: o.izsek }));
      continue;
    }
    const e = enake.get(o.sporocilo) ?? { pojavitev: 0, vrste: [] };
    e.pojavitev += o.pojavitev;
    if (!e.vrste.includes(o.vrsta)) e.vrste.push(o.vrsta);
    enake.set(o.sporocilo, e);
  }
  for (const [sporocilo, e] of enake) {
    najdbe.push(najdba(3, 'opozorilo', `HTML kot v izdani verziji (${e.pojavitev}×): ${sporocilo}`, e));
  }
  return najdbe;
}
