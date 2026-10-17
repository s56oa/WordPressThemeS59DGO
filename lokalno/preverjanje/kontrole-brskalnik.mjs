// Kontrole v brskalniku (Playwright, Chromium): 2 (konzola JS), 7 (zunanji klici), 8 (primerjava posnetkov), 9 (dostopnost, axe-core).
// Vsaka kontrola: async (kontekst) → najdba[]; kontekst.brskalnik = Playwright Browser.
// V testih kontekst.obisci nadomesti obisci(), kontekst.slike = { beri, pisi, pixelmatch } pa pngjs in pixelmatch;
// odvisnosti iz node_modules se zato naložijo šele ob uporabi (dinamični import), ne ob uvozu modula.
import { createRequire } from 'node:module';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { najdba, razvrstiZahtevo, razvrstiKonzolo, noveNajdbe, razkodiEntitete, oblikujDelez } from './jedro.mjs';

const CAKAJ_MS = 30000;
const PISKOTEK = { name: 's59dgo_primerjava', value: 'izdana' };
export const VRSTE_POSNETKOV = ['domov', 'objava-s-sliko', 'stran', 'kategorija', 'iskanje', '404'];
const SIRINE = [390, 1280];
const VISINA = { 390: 844, 1280: 900 };
const SHEME = ['svetlo', 'temno'];
const SIRINA_AXE = 1280;
const PRAG_PIKSLOV = 0.1;

export function imePosnetka(vrsta, sirina, shema, del) {
  return `posnetki/${vrsta}-${sirina}-${shema}-${del}.png`;
}

// Bloki vsebine objav v HTML: elementi z razredom besedilo ali kartica__izvlecek, do ujemajoče zaključne oznake.
function blokiVsebine(html) {
  const s = String(html);
  const bloki = [];
  for (const z of s.matchAll(/<([a-z][a-z0-9]*)\b[^>]*?\sclass\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>/gi)) {
    const razredi = (z[2] ?? z[3]).split(/\s+/);
    if (!razredi.includes('besedilo') && !razredi.includes('kartica__izvlecek')) continue;
    const oznaka = new RegExp(`<(/?)${z[1]}\\b[^>]*>`, 'gi');
    oznaka.lastIndex = z.index + z[0].length;
    let globina = 1;
    let konec = s.length;
    for (let m = oznaka.exec(s); m; m = oznaka.exec(s)) {
      if (m[1]) {
        globina--;
        if (globina === 0) { konec = m.index; break; }
      } else if (!m[0].endsWith('/>')) {
        globina++;
      }
    }
    bloki.push(s.slice(z.index, konec));
  }
  return bloki;
}

// Absolutni URL-ji virov in povezav v vsebini objav (kontrola 7: klic iz vsebine, ne iz teme).
export function vsebinaUrlji(html, stranUrl) {
  const urlji = new Set();
  const dodaj = (v) => {
    const t = razkodiEntitete(v).trim();
    if (!t || /^(data|javascript|mailto|tel|about):/i.test(t)) return;
    try {
      // Zahteva brskalnika nima fragmenta (vdelave WP imajo src=…/embed/#?secret=…).
      const u = new URL(t, stranUrl);
      u.hash = '';
      urlji.add(u.href);
    } catch { /* neveljaven URL */ }
  };
  for (const blok of blokiVsebine(html)) {
    for (const [, ime, , v1, v2, v3] of blok.matchAll(/\s(src|href|srcset|data-src|data-srcset|poster|data)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/gi)) {
      const v = v1 ?? v2 ?? v3;
      if (/srcset$/i.test(ime)) for (const kos of v.split(',')) dodaj(kos.trim().split(/\s+/)[0]);
      else dodaj(v);
    }
    for (const [, v] of blok.matchAll(/url\(\s*(?:&quot;|["'])?([^"')&]+)/gi)) dodaj(v);
  }
  return [...urlji];
}

// Iniciator iz CDP Network.requestWillBeSent: URL dokumenta, slogovne datoteke ali skripte (prvi okvir sklada).
export function iniciatorCdp(iniciator) {
  if (!iniciator) return null;
  if (iniciator.url) return iniciator.url;
  for (let sklad = iniciator.stack; sklad; sklad = sklad.parent) {
    const okvir = (sklad.callFrames ?? []).find((o) => o.url);
    if (okvir) return okvir.url;
  }
  return null;
}

// URL prvega okvira sklada (vrstice »at …«; sporočilo napake v prvi vrstici lahko vsebuje tuj URL).
export function urlIzSklada(sklad) {
  const z = String(sklad ?? '').match(/^\s*at\s.*?(https?:\/\/[^\s)]+)/m)?.slice(1);
  return z ? z[0].replace(/(:\d+){1,2}$/, '') : null;
}

// »Failed to load resource« za zahtevo, ki jo je prekinilo preverjanje, ali za sam dokument (404/410 preveri kontrola 2 HTTP).
export function jeOdmevNalaganja({ besedilo, url }, { strani, blokirani }) {
  if (!/^Failed to load resource/.test(String(besedilo))) return false;
  return blokirani.has(url) || strani.includes(url);
}

export function obreziSliko(slika, sirina, visina) {
  if (slika.width === sirina && slika.height === visina) return slika;
  const data = Buffer.alloc(sirina * visina * 4);
  for (let y = 0; y < visina; y++) {
    const zacetek = y * slika.width * 4;
    Buffer.from(slika.data.buffer, slika.data.byteOffset, slika.data.length).copy(data, y * sirina * 4, zacetek, zacetek + sirina * 4);
  }
  return { width: sirina, height: visina, data };
}

// Primerja sliki na skupni (krajši) višini in širini; delež = spremenjeni piksli / piksli primerjanega dela.
export function primerjajSliki(a, b, pixelmatch, prag = PRAG_PIKSLOV) {
  const sirina = Math.min(a.width, b.width);
  const visina = Math.min(a.height, b.height);
  const razlika = { width: sirina, height: visina, data: Buffer.alloc(sirina * visina * 4) };
  const piksli = sirina * visina;
  const n = piksli ? pixelmatch(obreziSliko(a, sirina, visina).data, obreziSliko(b, sirina, visina).data, razlika.data, sirina, visina, { threshold: prag }) : 0;
  return { razlika, delez: piksli ? n / piksli : 0, visini: [a.height, b.height] };
}

const RESNE = new Set(['serious', 'critical']);

// 9: strani = [{ vrsta, shema, trenutne, izdane }], kršitve = [{ id, impact, target, help }] (en element na zapis).
// Nove resne (serious/critical) = napaka za vsak element; ostale združene po pravilu kot opozorilo.
export function razvrstiAxe(strani) {
  const najdbe = [];
  const skupine = new Map();
  for (const { vrsta, shema, trenutne, izdane } of strani) {
    const kljuc = (k) => `${k.id}: ${k.target}`;
    const po = new Map(trenutne.map((k) => [kljuc(k), k]));
    const nove = new Set(noveNajdbe([...po.keys()], izdane.map(kljuc)));
    for (const [k, krsitev] of po) {
      const nova = nove.has(k);
      if (nova && RESNE.has(krsitev.impact)) {
        najdbe.push(najdba(9, 'napaka', `${vrsta} (${shema}): nova kršitev ${k} [${krsitev.impact}] – ${krsitev.help}`,
          { vrsta, shema, id: krsitev.id, impact: krsitev.impact, target: krsitev.target }));
        continue;
      }
      const sk = `${krsitev.id}\u0000${nova}`;
      const s = skupine.get(sk) ?? { id: krsitev.id, impact: krsitev.impact, help: krsitev.help, nova, pojavitev: 0, strani: [] };
      s.pojavitev++;
      const opis = `${vrsta} (${shema})`;
      if (!s.strani.includes(opis)) s.strani.push(opis);
      skupine.set(sk, s);
    }
  }
  for (const s of skupine.values()) {
    const kako = s.nova ? 'nova kršitev' : 'kot v izdani verziji';
    najdbe.push(najdba(9, 'opozorilo', `${s.id} [${s.impact}], ${kako} (${s.pojavitev}×): ${s.help}`,
      { id: s.id, impact: s.impact, pojavitev: s.pojavitev, strani: s.strani }));
  }
  return najdbe;
}

const jeZunanji = (url, izvor) => /^(https?|wss?):/i.test(url) && new URL(url).origin !== izvor;

// Obišče naslov v svoji strani (zavihku) Playwrighta: zahteve na drug izvor zabeleži in prekine,
// zbere napake konzole, počaka na mirno omrežje in naredi posnetek cele strani; ob axe: true še axe.run().
export async function obisci(stran, url, { izdana = false, sirina = 1280, shema = 'svetlo', axe = false } = {}) {
  const izvor = new URL(url).origin;
  const ctx = stran.context();
  await ctx.clearCookies();
  if (izdana) await ctx.addCookies([{ ...PISKOTEK, url: izvor }]);
  await stran.setViewportSize({ width: sirina, height: VISINA[sirina] ?? 900 });
  await stran.emulateMedia({ colorScheme: shema === 'temno' ? 'dark' : 'light', reducedMotion: 'reduce' });

  const iniciatorji = new Map();
  const cdp = await ctx.newCDPSession(stran);
  cdp.on('Network.requestWillBeSent', (d) => {
    if (!iniciatorji.has(d.request.url)) iniciatorji.set(d.request.url, iniciatorCdp(d.initiator));
  });
  await cdp.send('Network.enable');

  const blokirani = new Set();
  await stran.route('**/*', (pot) => {
    const u = pot.request().url();
    if (jeZunanji(u, izvor)) {
      blokirani.add(u);
      return pot.abort('blockedbyclient');
    }
    return pot.continue();
  });
  const konzola = [];
  stran.on('console', (m) => { if (m.type() === 'error') konzola.push({ besedilo: m.text(), url: m.location()?.url ?? '' }); });
  stran.on('pageerror', (e) => konzola.push({ besedilo: e.message, url: urlIzSklada(e.stack) ?? '' }));

  await stran.goto(url, { waitUntil: 'networkidle', timeout: CAKAJ_MS });
  // Leno nalaganje bi pustilo slike pod pregibom prazne na posnetku cele strani; počakaj na vse slike
  // (waitForLoadState('networkidle') tu ne pomaga, ker je stanje že doseženo).
  await stran.evaluate(async (rok) => {
    for (const img of document.querySelectorAll('img[loading="lazy"]')) img.loading = 'eager';
    const slike = [...document.images].map((img) => (img.complete ? null : new Promise((r) => {
      img.addEventListener('load', r, { once: true });
      img.addEventListener('error', r, { once: true });
    })));
    await Promise.race([Promise.all(slike), new Promise((r) => { setTimeout(r, rok); })]);
    await Promise.all([...document.images].map((img) => img.decode().catch(() => {})));
    await document.fonts.ready;
  }, CAKAJ_MS - 5000);
  const html = await stran.content();
  const naslov = await stran.title();
  const posnetek = await stran.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide', timeout: CAKAJ_MS });
  let krsitve;
  if (axe) {
    await stran.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core') });
    const rezultat = await stran.evaluate(() => window.axe.run());
    krsitve = rezultat.violations.flatMap((v) => v.nodes.map((n) => ({ id: v.id, impact: v.impact, help: v.help, target: n.target.join(' ') })));
  }
  await cdp.detach().catch(() => {});

  const strani = [url, stran.url()];
  return {
    konzola: konzola.filter((k) => !jeOdmevNalaganja(k, { strani, blokirani })),
    zahteve: [...blokirani].map((u) => ({ url: u, iniciatorUrl: iniciatorji.get(u) ?? null })),
    posnetek,
    html,
    naslov,
    krsitve,
  };
}

// En obisk v sveži strani; napaka obiska se vrne kot { napaka }, da ena stran ne ustavi kontrole.
async function obisk(kontekst, url, moznosti) {
  try {
    if (kontekst.obisci) return await kontekst.obisci(null, url, moznosti);
    kontekst.brskalnikKontekst ??= await kontekst.brskalnik.newContext({ reducedMotion: 'reduce' });
    const stran = await kontekst.brskalnikKontekst.newPage();
    try {
      return await obisci(stran, url, moznosti);
    } finally {
      await stran.close();
    }
  } catch (e) {
    return { napaka: String(e.message).split('\n')[0] };
  }
}

// Obiski za kontroli 2 in 7 (vsi naslovi, trenutna tema, 1280, svetlo); enkrat na zagon.
function osnovniObiski(kontekst) {
  kontekst.osnovniObiski ??= (async () => {
    const obiski = [];
    for (const { vrsta, url } of kontekst.naslovi ?? []) {
      obiski.push({ vrsta, url, ...await obisk(kontekst, url, { izdana: false, sirina: 1280, shema: 'svetlo' }) });
    }
    return obiski;
  })();
  return kontekst.osnovniObiski;
}

// Obiski za kontroli 8 in 9: vrste × širine × sheme × obe temi; axe pri širini 1280.
function primerjalniObiski(kontekst) {
  kontekst.primerjalniObiski ??= (async () => {
    const obiski = [];
    for (const vrsta of VRSTE_POSNETKOV) {
      const naslov = (kontekst.naslovi ?? []).find((n) => n.vrsta === vrsta);
      if (!naslov) continue;
      for (const sirina of SIRINE) {
        for (const shema of SHEME) {
          const par = { vrsta, url: naslov.url, sirina, shema };
          for (const izdana of [true, false]) {
            par[izdana ? 'izdana' : 'trenutna'] = await obisk(kontekst, naslov.url, { izdana, sirina, shema, axe: sirina === SIRINA_AXE });
          }
          obiski.push(par);
        }
      }
    }
    return obiski;
  })();
  return kontekst.primerjalniObiski;
}

// 2 (konzola): napake JS v konzoli in neujete izjeme; iz teme = napaka, drugo = opozorilo.
export async function kontrola2Konzola(kontekst) {
  const najdbe = [];
  for (const o of await osnovniObiski(kontekst)) {
    if (o.napaka) {
      najdbe.push(najdba(2, 'napaka', `${o.vrsta}: brskalnik strani ni naložil (${o.napaka})`, { vrsta: o.vrsta, url: o.url }));
      continue;
    }
    const videne = new Set();
    for (const k of o.konzola) {
      if (videne.has(k.besedilo)) continue;
      videne.add(k.besedilo);
      const vir = razvrstiKonzolo(k);
      najdbe.push(najdba(2, vir === 'tema' ? 'napaka' : 'opozorilo', `${o.vrsta}: konzola JS: ${String(k.besedilo).slice(0, 300)}`,
        { vrsta: o.vrsta, url: o.url, vir, izvor: k.url }));
    }
  }
  return najdbe;
}

// 7: prekinjene zahteve na drug izvor iz istih obiskov; iz teme = napaka, iz vsebine objave = opozorilo z naslovom strani.
export async function kontrola7(kontekst) {
  const najdbe = [];
  for (const o of await osnovniObiski(kontekst)) {
    if (o.napaka) continue; // javi kontrola 2
    const izvorStrani = new URL(o.url).origin;
    const vsebina = vsebinaUrlji(o.html, o.url);
    const videne = new Set();
    for (const z of o.zahteve) {
      if (videne.has(z.url)) continue;
      videne.add(z.url);
      const vir = razvrstiZahtevo(z.url, { izvorStrani, iniciatorUrl: z.iniciatorUrl, vsebinaUrlji: vsebina });
      if (vir === 'tema') {
        najdbe.push(najdba(7, 'napaka', `${o.vrsta}: zunanji klic iz teme: ${z.url}`, { vrsta: o.vrsta, url: o.url, zahteva: z.url, iniciator: z.iniciatorUrl }));
      } else if (vir === 'vsebina') {
        najdbe.push(najdba(7, 'opozorilo', `${o.naslov || o.vrsta}: zunanji klic iz vsebine: ${z.url}`, { vrsta: o.vrsta, url: o.url, zahteva: z.url, iniciator: z.iniciatorUrl }));
      }
    }
  }
  return najdbe;
}

async function kodekSlik(kontekst) {
  if (kontekst.slike) return kontekst.slike;
  const { PNG } = (await import('pngjs')).default;
  const pixelmatch = (await import('pixelmatch')).default;
  return {
    beri: (b) => PNG.sync.read(b),
    pisi: (s) => {
      const png = new PNG({ width: s.width, height: s.height });
      Buffer.from(s.data.buffer, s.data.byteOffset, s.data.length).copy(png.data);
      return PNG.sync.write(png);
    },
    pixelmatch,
  };
}

const izrisanaIzdana = (html) => String(html).includes('/themes/s59dgo-izdana/');

// 8: posnetki izdane in trenutne teme v /porocilo/posnetki/, slika razlik in delež; vsak par z razliko = opozorilo.
// Pare doda v kontekst.posnetki za galerijo v poročilu.
export async function kontrola8(kontekst) {
  const { beri, pisi, pixelmatch } = await kodekSlik(kontekst);
  const mapa = kontekst.mapaPorocila;
  await rm(join(mapa, 'posnetki'), { recursive: true, force: true });
  await mkdir(join(mapa, 'posnetki'), { recursive: true });
  kontekst.posnetki = [];
  const najdbe = [];
  const neizrisana = [];
  for (const par of await primerjalniObiski(kontekst)) {
    const ime = `${par.vrsta}-${par.sirina}-${par.shema}`;
    const neuspel = par.izdana.napaka ?? par.trenutna.napaka;
    if (neuspel) {
      najdbe.push(najdba(8, 'napaka', `${ime}: posnetek ni uspel (${neuspel})`, { vrsta: par.vrsta, url: par.url }));
      continue;
    }
    if (!izrisanaIzdana(par.izdana.html)) {
      neizrisana.push(ime);
      continue;
    }
    const izdana = imePosnetka(par.vrsta, par.sirina, par.shema, 'izdana');
    const trenutna = imePosnetka(par.vrsta, par.sirina, par.shema, 'trenutna');
    const razlika = imePosnetka(par.vrsta, par.sirina, par.shema, 'razlika');
    await writeFile(join(mapa, izdana), par.izdana.posnetek);
    await writeFile(join(mapa, trenutna), par.trenutna.posnetek);
    const p = primerjajSliki(beri(par.izdana.posnetek), beri(par.trenutna.posnetek), pixelmatch);
    await writeFile(join(mapa, razlika), pisi(p.razlika));
    kontekst.posnetki.push({ ime, izdana, trenutna, razlika, delez: p.delez });
    const visini = p.visini[0] === p.visini[1] ? '' : `; višina strani ${p.visini[0]} → ${p.visini[1]} px`;
    if (p.delez > 0 || visini) {
      najdbe.push(najdba(8, 'opozorilo', `${ime}: ${oblikujDelez(p.delez)} spremenjenih pikslov${visini}`,
        { vrsta: par.vrsta, url: par.url, delez: p.delez, visini: p.visini }));
    }
  }
  if (neizrisana.length) {
    najdbe.push(najdba(8, 'napaka', `Izdana tema s59dgo-izdana se ne izriše (piškotek ${PISKOTEK.name}=${PISKOTEK.value} brez učinka; lokalno/pripravi-izdano.sh?)`,
      { posnetki: neizrisana }));
  }
  return najdbe;
}

// 9: axe-core pri 1280 v obeh shemah za obe temi (obiski kontrole 8); primerjava z izdano kot pri 3.
export async function kontrola9(kontekst) {
  const strani = [];
  const najdbe = [];
  for (const par of (await primerjalniObiski(kontekst)).filter((x) => x.sirina === SIRINA_AXE)) {
    const neuspel = par.izdana.napaka ?? par.trenutna.napaka;
    if (neuspel) {
      najdbe.push(najdba(9, 'napaka', `${par.vrsta} (${par.shema}): axe se ni izvedel (${neuspel})`, { vrsta: par.vrsta, url: par.url }));
      continue;
    }
    if (!izrisanaIzdana(par.izdana.html)) continue; // javi kontrola 8
    strani.push({ vrsta: par.vrsta, shema: par.shema, trenutne: par.trenutna.krsitve ?? [], izdane: par.izdana.krsitve ?? [] });
  }
  return [...najdbe, ...razvrstiAxe(strani)];
}
