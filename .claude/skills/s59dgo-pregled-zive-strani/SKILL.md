---
name: s59dgo-pregled-zive-strani
description: Pregled žive strani www.s59dgo.si s Claude in Chrome – naslovne slike in njihovi izrezi na karticah, razmerja (20:13, 16:9 …), manjkajoče velikosti slik, število objav na stran, oznake Open Graph, prikaz posamezne objave – in primerjava z nastavitvami teme in generatorja promptov. Uporabi vedno, ko uporabnik želi »crosscheck«, »preveri na strani«, »kako izgleda v živo«, pregled po namestitvi nove verzije teme, ali sprašuje, zakaj je slika na uvodni strani obrezana.
---

# Pregled žive strani s59dgo

Cilj je primerjati, kar tema in orodja predvidevajo, s tem, kar je dejansko na strani, in uporabniku dati seznam ukrepov, ki jih naredi sam v WP administraciji (Claude se v WP ne prijavlja in ne ureja vsebine).

Večino tega (izrezi slik, Open Graph, nastavitve, posnetki, dostopnost) samodejno preveri `bin/preveri-lokalno.sh` na lokalni kopiji iz backupa Backuply (`prod_backups/`); poročilo `dist/preverjanje/porocilo.html` in njegov seznam ročnih korakov uporabi kot izhodišče. Pregled v Chromu je potreben za to, česar lokalna kopija nima: stanje po namestitvi (ali je nova verzija res aktivna, ali je bil pognan Regenerate Thumbnails), `.htaccess` in nastavitve strežnika, vsebina, objavljena po zadnjem backupu.

## Kaj tema predvideva

- Kartice (domača stran, arhivi, iskanje): velikost `s59dgo-kartica` 800×520 (20:13), CSS `aspect-ratio: 800/520; object-fit: cover` → slika se vedno obreže na sredini.
- Posamezna objava: `large` (1024 px) v celotnem razmerju, širina do 1100 px.
- Od 1.2.0: `og:*`/`twitter:*` iz `inc/druzbena.php`, slika `s59dgo-deljenje` 1200×630 (sicer `large` ali logotip).
- Priporočeno 9 objav na stran (3 stolpci).

## Postopek v Chromu

1. Naloži orodja v enem `ToolSearch` (tabs_context, navigate, computer, javascript_tool, tabs_create/close), odpri nov zavihek na `https://www.s59dgo.si/`.
2. Podatke beri z `javascript_tool` in jih vrni kot **JSON polje** (`JSON.stringify([...])`). Izpis z vzorci `ključ=vrednost` orodje blokira kot »cookie/query string data«.
3. Ne čakaj na `img.decode()` lenih slik – skripta zamrzne. Beri atribute `src`, `width`, `height`, `srcset`:
   ```js
   JSON.stringify([...document.querySelectorAll('.kartica')].map(k=>{const i=k.querySelector('.kartica__slika img');
     return [k.querySelector('h2,h3').textContent.trim(), k.querySelector('a').getAttribute('href'),
       i.getAttribute('src').split('/').pop(), i.getAttribute('width')+'x'+i.getAttribute('height')]}))
   ```
   Kartica brez `-800x520` v imenu datoteke = WordPress izreza ni naredil (izvirnik je manjši od 800×520 ali so slike starejše od teme) → obreže le CSS.
4. Vizualno preveri sumljive kartice: pomakni z `window.scrollTo({top: …, behavior:'instant'})`, počakaj ~800 ms, nato posnetek zaslona.
5. Posamezna objava: `.objava__slika img` (velikost, `sizes`) in meta oznake `meta[property^="og:"], meta[name^="twitter:"]`.
6. Okna Chroma pogosto ni mogoče pomanjšati; mobilni pogled preveri v `<iframe>` širine 375 px na isti strani.
7. Na koncu zapri zavihke, ki si jih odprl.

## Poročilo uporabniku

Kratko, v slovenščini: kaj tema predvideva, kaj je na strani, odstopanja. Za slike tabela:

| Objava | Izvirnik | Ukrep |
|---|---|---|

Ukrepi so konkretni in izvedljivi v WP (npr. »infografiko premakni v vsebino, za naslovno naredi ilustracijo 20:13 v generatorju«, »naloži večji izvirnik ≥1600×1040«, »po namestitvi 1.2.0 poženi Regenerate Thumbnails«, »Nastavitve → Branje → 9 objav«). Če odstopanje zahteva spremembo kode (tema ali generator), pred spremembo zastavi vprašanja s priporočeno možnostjo.
