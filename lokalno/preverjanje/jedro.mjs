// Jedro preverjanja lokalnega WordPressa: čista logika brez I/O in brez uvozov iz node_modules.
// Uporabljajo ga skripte v lokalno/preverjanje/ in test tests/lokalno.test.mjs.

const POT_TEME = '/wp-content/themes/s59dgo/';
const KARTICA = { sirina: 800, visina: 520 };
const DELJENJE = { sirina: 1200, visina: 630 };

export const NASLOVI_KONTROL = {
  1: 'Naslovne slike',
  2: 'Vrste strani',
  3: 'Veljaven HTML',
  4: 'Open Graph',
  5: 'Nastavitve',
  6: 'Utrjevanje',
  7: 'Zunanji klici',
  8: 'Primerjava posnetkov',
  9: 'Dostopnost',
};

export function najdba(kontrola, stopnja, sporocilo, podrobnosti = {}) {
  return { kontrola, stopnja, sporocilo, podrobnosti };
}

export function ubezi(s) {
  return String(s).replace(/[&<>"']/g, (z) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[z]));
}

// Razkodira entitete iz WordPressovih naslovov (npr. &#8211;); izpis gre nato spet skozi ubezi().
function razkodiEntitete(s) {
  const imena = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return String(s).replace(/&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi, (cel, d, h, ime) => {
    if (d || h) {
      const koda = d ? parseInt(d, 10) : parseInt(h, 16);
      return koda > 0 && koda <= 0x10ffff ? String.fromCodePoint(koda) : cel;
    }
    return Object.hasOwn(imena, ime.toLowerCase()) ? imena[ime.toLowerCase()] : cel;
  });
}

export function odkrijNaslove(podatki) {
  const naslovi = [];
  const najdbe = [];
  const osnova = podatki.domov || 'http://localhost:8059/';
  const koren = new URL(osnova).origin;
  const dodaj = (vrsta, url, pricakovano = 200) => naslovi.push({ vrsta, url, pricakovano });
  const manjka = (vrsta) => najdbe.push(najdba(2, 'opozorilo', `Ni primera za vrsto ${vrsta}`, { vrsta }));

  const opisi = {
    domov: 'domov', objava_s_sliko: 'objava s sliko', objava_brez_slike: 'objava brez slike',
    stran: 'stran', kategorija: 'kategorija', oznaka: 'oznaka', datum: 'datum',
  };
  for (const [kljuc, opis] of Object.entries(opisi)) {
    if (podatki[kljuc]) dodaj(kljuc.replace(/_/g, '-'), podatki[kljuc]);
    else manjka(opis);
  }
  dodaj('domov-2', `${koren}/page/2/`);
  if (podatki.iskalni_niz) dodaj('iskanje', `${koren}/?s=${encodeURIComponent(podatki.iskalni_niz)}`);
  else manjka('iskanje z zadetki');
  dodaj('iskanje-brez-zadetkov', `${koren}/?s=zzqx-ni-zadetkov`);
  dodaj('404', `${koren}/ta-stran-ne-obstaja-s59dgo/`, 404);
  dodaj('avtor', `${koren}/?author=1`, 410);
  return { naslovi, najdbe };
}

// Delež izvirnika (0–1), ki ga object-fit: cover odreže pri ciljnem razmerju.
export function delezObreza(sirina, visina, ciljSirina = 800, ciljVisina = 520) {
  const cilj = ciljSirina / ciljVisina;
  const izvirnik = sirina / visina;
  if (izvirnik > cilj) return 1 - (visina * cilj) / sirina;
  if (izvirnik < cilj) return 1 - sirina / cilj / visina;
  return 0;
}

export function razvrstiSliko(slika, prag = 0.15) {
  const najdbe = [];
  const ime = `${slika.naslov} (objava ${slika.objava_id})`;
  const manjkajoci = [];
  const izreza = [
    ['kartica', KARTICA, slika.ima_kartica],
    ['deljenje', DELJENJE, slika.ima_deljenje],
  ];
  for (const [vrsta, cilj, ima] of izreza) {
    const tocno = slika.sirina === cilj.sirina && slika.visina === cilj.visina;
    if (slika.sirina < cilj.sirina || slika.visina < cilj.visina) {
      najdbe.push(najdba(1, 'opozorilo',
        `${ime}: izvirnik premajhen za izrez ${vrsta} ${cilj.sirina}×${cilj.visina} (${slika.sirina}×${slika.visina})`,
        { vrsta, objava_id: slika.objava_id, priponka_id: slika.priponka_id }));
    } else if (!ima && !tocno) {
      manjkajoci.push(vrsta);
    }
  }
  if (manjkajoci.length) {
    najdbe.push(najdba(1, 'rocni-korak',
      `${ime}: manjka izrez ${manjkajoci.join(', ')}; na produkciji poženi vtičnik Regenerate Thumbnails`,
      { manjkajoci, objava_id: slika.objava_id, priponka_id: slika.priponka_id }));
  }
  if (slika.sirina >= KARTICA.sirina && slika.visina >= KARTICA.visina) {
    const delez = delezObreza(slika.sirina, slika.visina);
    if (delez > prag) {
      najdbe.push(najdba(1, 'opozorilo',
        `${ime}: opazno obrezana na kartici (${Math.round(delez * 100)} %)`,
        { delez, objava_id: slika.objava_id, priponka_id: slika.priponka_id }));
    }
  }
  return najdbe;
}

export function jeIzrezKartice(src) {
  return /-800x520\.(jpe?g|png|webp|avif)$/i.test(String(src).split(/[?#]/)[0]);
}

export function preveriOg(meta, { imaIzrez }) {
  const najdbe = [];
  const napaka = (s, p) => najdbe.push(najdba(4, 'napaka', s, p));
  const po = (k) => meta.filter((m) => m.kljuc === k);
  const kljuci = ['og:title', 'og:description', 'og:image', 'og:image:width', 'og:image:height', 'twitter:card'];
  for (const k of kljuci) {
    const pojavitve = po(k);
    if (pojavitve.length === 0) napaka(`Manjka oznaka ${k}`, { kljuc: k });
    else if (pojavitve.length > 1) napaka(`Oznaka ${k} je podvojena (${pojavitve.length}×)`, { kljuc: k });
  }
  for (const k of ['og:title', 'og:description', 'og:image']) {
    const m = po(k);
    if (m.length === 1 && String(m[0].vrednost ?? '').trim() === '') napaka(`Oznaka ${k} je prazna`, { kljuc: k });
  }
  if (imaIzrez) {
    const sirina = po('og:image:width')[0];
    const visina = po('og:image:height')[0];
    if (sirina && String(sirina.vrednost).trim() !== '1200') napaka(`og:image:width je ${sirina.vrednost}, pričakovano 1200`, { kljuc: 'og:image:width' });
    if (visina && String(visina.vrednost).trim() !== '630') napaka(`og:image:height je ${visina.vrednost}, pričakovano 630`, { kljuc: 'og:image:height' });
  }
  return najdbe;
}

export function razvrstiZahtevo(url, { izvorStrani, iniciatorUrl, vsebinaUrlji }) {
  let izvor = null;
  try { izvor = new URL(url).origin; } catch { /* neveljaven URL šteje kot zunanji */ }
  if (izvor === izvorStrani) return 'notranja';
  if (iniciatorUrl === null || iniciatorUrl === undefined) return vsebinaUrlji.includes(url) ? 'vsebina' : 'tema';
  if (iniciatorUrl.includes(POT_TEME)) return 'tema';
  return 'vsebina';
}

export function razvrstiKonzolo({ besedilo, url }) {
  if (String(url || '').includes(POT_TEME)) return 'tema';
  if (String(besedilo || '').includes('brez-js')) return 'tema';
  return 'drugo';
}

const normaliziraj = (s) => String(s)
  .replace(/\b(vrstica|line|column|stolpec)\s*\d+/gi, '$1')
  .replace(/:\d+(?::\d+)?/g, '')
  .replace(/\s+/g, ' ')
  .trim();

export function noveNajdbe(trenutne, izdane) {
  const znane = new Set(izdane.map(normaliziraj));
  return trenutne.filter((s) => !znane.has(normaliziraj(s)));
}

export function povzetek(najdbe) {
  const stej = (s) => najdbe.filter((n) => n.stopnja === s).length;
  const napake = stej('napaka');
  return { napake, opozorila: stej('opozorilo'), rocni: stej('rocni-korak'), izhod: napake > 0 ? 1 : 0 };
}

const ST_OZNAKA = { 'napaka': 'Napaka', 'opozorilo': 'Opozorilo', 'rocni-korak': 'Ročni korak' };

export function porociloHtml({ cas, arhiv, najdbe, posnetki = [] }) {
  const u = (s) => ubezi(razkodiEntitete(s));
  const p = povzetek(najdbe);
  const rocni = [...new Set(najdbe.filter((n) => n.stopnja === 'rocni-korak').map((n) => n.sporocilo))];
  const razdelki = Object.entries(NASLOVI_KONTROL).map(([k, naslov]) => {
    const vrstice = najdbe.filter((n) => n.kontrola === Number(k));
    const telo = vrstice.length
      ? `<table><thead><tr><th>Stopnja</th><th>Sporočilo</th><th>Podrobnosti</th></tr></thead><tbody>${vrstice.map((n) => {
        const pod = n.podrobnosti && Object.keys(n.podrobnosti).length ? `<code>${u(JSON.stringify(n.podrobnosti))}</code>` : '';
        return `<tr class="${ubezi(n.stopnja)}"><td>${u(ST_OZNAKA[n.stopnja] || n.stopnja)}</td><td>${u(n.sporocilo)}</td><td>${pod}</td></tr>`;
      }).join('')}</tbody></table>`
      : '<p class="ok">Brez najdb.</p>';
    return `<section><h2>${k}. ${ubezi(naslov)}</h2>${telo}</section>`;
  }).join('\n');
  const galerija = posnetki.length
    ? `<section><h2>Posnetki</h2><div class="galerija">${posnetki.map((s) => `<figure><figcaption>${u(s.ime)}: ${ubezi((s.delez * 100).toFixed(2))} % spremenjenih pikslov</figcaption>`
      + `<div class="trojica"><img src="${ubezi(s.izdana)}" alt="Izdana: ${u(s.ime)}"><img src="${ubezi(s.trenutna)}" alt="Trenutna: ${u(s.ime)}"><img src="${ubezi(s.razlika)}" alt="Razlika: ${u(s.ime)}"></div></figure>`).join('')}</div></section>`
    : '';
  return `<!doctype html>
<html lang="sl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Preverjanje lokalnega WordPressa</title>
<style>
body{font:15px/1.5 system-ui,sans-serif;margin:0 auto;max-width:72rem;padding:1rem;color:#1a1a1a;background:#fff}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:.3rem .5rem;text-align:left;vertical-align:top}
tr.napaka td:first-child{color:#b00020;font-weight:700}tr.opozorilo td:first-child{color:#8a5a00;font-weight:700}tr.rocni-korak td:first-child{color:#0b5394;font-weight:700}
.trojica{display:flex;gap:.5rem}.trojica img{max-width:32%;height:auto}code{font-size:12px;word-break:break-all}
@media (prefers-color-scheme:dark){body{background:#111;color:#eee}td,th{border-color:#444}}
</style></head><body>
<h1>Preverjanje lokalnega WordPressa</h1>
<p>${u(cas)} · arhiv: ${u(arhiv)}</p>
<p><strong>Napake: ${p.napake}</strong> · opozorila: ${p.opozorila} · ročni koraki: ${p.rocni}</p>
<h2>Ročni koraki za produkcijo</h2>
${rocni.length ? `<ul>${rocni.map((s) => `<li>${u(s)}</li>`).join('')}</ul>` : '<p class="ok">Ni ročnih korakov.</p>'}
${razdelki}
${galerija}
</body></html>
`;
}
