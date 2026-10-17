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

// TESTI-NAPREJ (naslednje naloge dodajo teste nad to vrstico)
console.log('OK: prompti.test.mjs, ' + stevilo + ' preverjanj');
