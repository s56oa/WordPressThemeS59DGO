// Vstopna točka preverjanja v vsebniku brskalnik (bin/preveri-lokalno.sh).
// Prebere /stanje/naslovi.json in /stanje/stanje-produkcije.json, požene kontrole,
// zapiše /porocilo/porocilo.html in /porocilo/najdbe.json ter natisne povzetek.
import { readFile, writeFile } from 'node:fs/promises';
import { odkrijNaslove, povzetek, porociloHtml, NASLOVI_KONTROL } from './jedro.mjs';
import { kontrola2, kontrola2Dnevnik, kontrola4, kontrola5, kontrola6 } from './kontrole-streznik.mjs';

const OSNOVA = 'http://localhost:8059';
const beri = async (pot) => JSON.parse(await readFile(pot, 'utf8'));

const podatki = await beri('/stanje/naslovi.json');
const stanje = await beri('/stanje/stanje-produkcije.json');
const { naslovi, najdbe } = odkrijNaslove(podatki);
const kontekst = { naslovi, podatki, stanje, osnova: OSNOVA };

for (const [ime, kontrola] of [['2', kontrola2], ['4', kontrola4], ['5', kontrola5], ['6', kontrola6]]) {
  try {
    najdbe.push(...await kontrola(kontekst));
  } catch (e) {
    najdbe.push({ kontrola: Number(ime), stopnja: 'napaka', sporocilo: `Kontrola ${ime} se ni izvedla: ${e.message}`, podrobnosti: {} });
  }
}
// debug.log šele po vseh zahtevah.
let dnevnik = '';
try { dnevnik = await readFile('/stanje/debug.log', 'utf8'); } catch { /* ni dnevnika = ni vrstic */ }
najdbe.push(...await kontrola2Dnevnik({ ...kontekst, dnevnik }));

const cas = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
await writeFile('/porocilo/najdbe.json', `${JSON.stringify({ cas, arhiv: stanje.arhiv, najdbe }, null, 2)}\n`);
await writeFile('/porocilo/porocilo.html', porociloHtml({ cas, arhiv: stanje.arhiv, najdbe }));

const p = povzetek(najdbe);
console.log(`\nPreverjanje lokalne kopije (arhiv: ${stanje.arhiv})`);
for (const [k, naslov] of Object.entries(NASLOVI_KONTROL)) {
  const v = najdbe.filter((n) => n.kontrola === Number(k));
  if (!v.length) continue;
  const st = (s) => v.filter((n) => n.stopnja === s).length;
  console.log(`  ${k}. ${naslov}: napake ${st('napaka')}, opozorila ${st('opozorilo')}, ročni koraki ${st('rocni-korak')}`);
}
for (const n of najdbe.filter((x) => x.stopnja === 'napaka')) console.log(`  NAPAKA [${n.kontrola}] ${n.sporocilo}`);
const rocni = [...new Set(najdbe.filter((n) => n.stopnja === 'rocni-korak').map((n) => n.sporocilo))];
if (rocni.length) {
  console.log('\nRočni koraki za produkcijo:');
  for (const s of rocni) console.log(`  - ${s}`);
}
console.log(`\nSkupaj: napake ${p.napake}, opozorila ${p.opozorila}, ročni koraki ${p.rocni}`);
console.log('Poročilo: dist/preverjanje/porocilo.html');
process.exit(p.izhod);
