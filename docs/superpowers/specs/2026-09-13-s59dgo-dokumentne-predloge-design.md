# Spec: Dokumentne predloge društva S59DGO

Datum: 2026-09-13
Stanje: potrjen dizajn, pripravljeno za načrt implementacije

## 1. Namen in cilji

Društvo za uradno pošto uporablja en sam dokument `.docx`, ki je bil nekoč
prevzet od drugod: v njem je poleg klubske noge ostala tudi neuporabljena noga
podjetja GE, d.o.o. iz Ptuja (`footer3.xml`), pisava je Times New Roman,
oblikovanje pa nima nobene zveze s spletno stranjo.

Cilj je komplet Wordovih predlog, ki:

1. so vizualno izpeljane iz teme `s59dgo` (temno modra, greben Snežnika,
   oranžna sončnega zahoda), a ostanejo uradni dokumenti, ne letaki;
2. so ponovljivo generirane iz skripte, da je popravek podatka (TRR, naslov,
   e-pošta) sprememba ene vrstice in ne ročno urejanje petih datotek;
3. delujejo na vsakem računalniku brez nameščanja pisav.

Izbrana vizualna smer je **B – »Greben«** z oblikovalske table
https://claude.ai/code/artifact/d24ea87e-7741-4a04-8d35-468627148a2a
(bel papir, logotipa v vrsti, greben kot svetla silhueta z oranžno nitko).

## 2. Odločitve (potrjene z naročnikom)

| Področje | Odločitev |
|---|---|
| Smer glave | B – »Greben«; modri pas samo na vabilu |
| Pisava | Arial povsod (naslovi in besedilo); brez pisav teme |
| Oblika datotek | `.dotx` predloge + izpolnjeni `.docx` primeri |
| Logotip ZRS | v glavi, desno zgoraj |
| Podatki v nogi | sedanji podatki društva, brez ostankov tujega podjetja |
| Tisk | dopis in zapisnik čitljiva črno-belo; vabilo in priznanje barvna |
| Jezik | slovenščina; priznanje dodatno v angleščini |
| Polja za izpolnjevanje | označeno besedilo v obliki »Naziv prejemnika« |
| Mesto v repozitoriju | nova mapa `dokumenti/` v tem repozitoriju |
| E-pošta | `test@s59dgo.si`, podpis `test@s59dgo.si` |
| Spletni naslov v nogi | `www.s59dgo.si` |
| Izdelava | skripta s `python-docx` v Dockerju (`bin/dokumenti.sh`) |

Opomba: tema in `CLAUDE.md` navajata `www.s59dgo.org`; dokumenti odslej
navajajo `www.s59dgo.si`. Naročnik je bil na razliko opozorjen in jo je potrdil.

## 3. Struktura

```
dokumenti/
├── predloge/
│   ├── S59DGO-dopis.dotx
│   ├── S59DGO-zapisnik.dotx
│   ├── S59DGO-vabilo.dotx
│   ├── S59DGO-priznanje.dotx
│   └── S59DGO-certificate-en.dotx
├── primeri/
│   ├── S59DGO-dopis-primer.docx
│   ├── S59DGO-zapisnik-primer.docx
│   ├── S59DGO-vabilo-primer.docx
│   └── S59DGO-priznanje-primer.docx
├── viri/
│   ├── logo-klub.png          (iz trenutni_logotipi/s59dgo_logo_cropped.png)
│   ├── logo-zrs.png           (iz »Logo ZRS«/ZRS_Logo_2024 OK_blue.png)
│   ├── greben.svg             (pot iz s59dgo/template-parts/trak.php)
│   └── greben.png             (upodobljen iz greben.svg, 300 dpi)
└── README.md                  namestitev predlog in način uporabe

bin/dokumenti.sh               generira vse; --pdf naredi še PDF predoglede
bin/dokumenti/generiraj.py     skripta s python-docx
bin/dokumenti/podatki.py       podatki društva na enem mestu
```

Mapa `trenutni_logotipi/` ni v gitu. Izvorne datoteke logotipov se prekopirajo
v `dokumenti/viri/` in commitajo; `trenutni_logotipi/` ostane kot arhiv in se
ne uporablja več.

## 4. Skupna oblikovna pravila

### Stran

- A4 (210 × 297 mm), pokončno; priznanje ležeče.
- Robovi: levo 25 mm, desno 20 mm, **zgoraj 42 mm**, spodaj 25 mm.
- Glava 12 mm od vrha, noga 8 mm od dna.
- Zgornji rob 42 mm je odmerjen po glavi prve strani (vrsta z logotipoma
  22 mm + greben pribl. 10 mm). Nadaljnje strani imajo nižjo glavo, zato
  ostane nad besedilom nekaj več zraka; to je sprejeto, ker Word robov ne
  določa po posamezni strani, ampak po razdelku.

### Barve (iste vrednosti kot `--barva-*` v temi)

| Vloga | Hex |
|---|---|
| Glava, naslovi | `15304F` |
| Poudarek, nitka | `D9702A` |
| Podlaga noge | `EEF3F8` |
| Črte | `D3DFEB` |
| Greben (svetli) | `CFE0F0` |
| Besedilo | `172433` |
| Tiho besedilo | `5F7590` |

Vrednosti se zapišejo tudi v barvno temo dokumenta (Accent1 `15304F`,
Accent2 `D9702A`, Accent3 `5F7590`, Accent4 `CFE0F0`, Background2 `EEF3F8`),
da so na voljo v Wordovem izbirniku barv.

### Imenovani slogi

| Slog | Določilo |
|---|---|
| `S59DGO telo` | Arial 11 pt, `172433`, razmik 1,15, 6 pt za odstavkom, levo poravnano, brez zamika |
| `S59DGO meta` | Arial 10 pt, `46586C`, desni tabulator na desnem robu (datum levo, številka desno) |
| `S59DGO naslovnik` | Arial 11 pt, prva vrstica `172433`, ostale `46586C`, razmik 1,0 |
| `S59DGO zadeva` | Arial 11 pt krepko, `15304F`, 12 pt za odstavkom; oznaka »ZADEVA:« v `5F7590`, razmik znakov 0,6 pt |
| `S59DGO naslov` | Arial 14 pt krepko, velike črke, razmik znakov 1 pt, `15304F`, 10 pt za odstavkom |
| `S59DGO podnaslov` | Arial 10 pt, velike črke, razmik znakov 1,2 pt, `5F7590` |
| `S59DGO sklep` | Arial 11 pt, levi zamik 8 mm, leva obroba 2 pt `D9702A`, 8 pt za odstavkom |
| `S59DGO noga` | Arial 7,5 pt, `46586C`, razmik 1,0 |

Slogi so v predlogi vidni v Wordovi galeriji slogov, da jih urednik lahko
uporabi tudi v besedilu, ki ga doda sam.

### Glava (vse predloge razen priznanja)

Tabela treh stolpcev brez obrob:

1. klubski emblem, širina 22 mm;
2. ime kluba: »RADIO KLUB SNEŽNIK« / »ILIRSKA BISTRICA«, Arial 12 pt krepko
   `15304F`, razmik 1,1; pod njim »S59DGO · ČLAN ZRS«, Arial 8 pt `5F7590`,
   razmik znakov 1,2 pt;
3. logotip ZRS, širina 18 mm, poravnan desno in navpično na sredino.

Pod tabelo greben (`greben.png`, barva `CFE0F0`) v širini besedilnega bloka
(165 mm), višina pri tej širini pribl. 10 mm – sledi iz razmerja grebena v
temi (1440:90) –, pod njim oranžna črta 1 pt `D9702A`.

Glava nadaljnjih strani (Wordova »drugačna prva stran«): »RADIO KLUB SNEŽNIK ·
S59DGO« Arial 8 pt `5F7590` levo, »Stran X od Y« desno, pod tem črta 0,5 pt
`D3DFEB`.

### Noga (vse predloge razen priznanja)

Nad nogo črta 0,5 pt `D3DFEB`, podlaga `EEF3F8`, vsebina v treh stolpcih,
slog `S59DGO noga`:

| Stolpec 1 | Stolpec 2 | Stolpec 3 |
|---|---|---|
| Radio klub Snežnik Ilirska Bistrica | E-pošta: test@s59dgo.si | Matična številka: 5136407000 |
| Bazoviška cesta 19A | Splet: www.s59dgo.si | Davčna številka: 16799852 |
| 6250 Ilirska Bistrica | Telefon: 070 123 456 | TRR: SI56 1915 0500 8035 824 |

Pod tem ena vrstica čez celotno širino: »Društvo je vpisano v register društev
pri UE Ilirska Bistrica pod zaporedno številko 21 z dne 30. 09. 1976.«

Odstavki s podatki v nogi imajo velikost in barvo zapisani neposredno na
runu, ne prek imenovanega sloga »S59DGO noga« – zaradi hrošča LibreOffice-ovega
izvoza v PDF, ki je pri zadnjem odstavku noge znal izpustiti besedilo, če je
uporabljal imenovan slog (glej `deli._odstavek_noge`).

## 5. Predloge

### 5.1 Dopis (`S59DGO-dopis.dotx`)

Zaporedje: glava · vrstica meta (»Ilirska Bistrica, »datum«« levo, »Št.:
»03/2026-001«« desno) · prazna vrstica · blok naslovnika (»Naziv prejemnika«,
»Ulica in hišna številka«, »Poštna številka in kraj«) · zadeva · dva odstavka
vzorčnega besedila · pozdrav · podpisni blok (podpisna črta 55 mm, »Ognjen
Antonič – S56OA«, »predsednik društva«, »test@s59dgo.si«) · po potrebi
»Priloge:« kot seznam.

### 5.2 Zapisnik (`S59DGO-zapisnik.dotx`)

Glava · naslov »ZAPISNIK »4.« SEJE UPRAVNEGA ODBORA« · tabela podatkov seje
(datum, kraj, začetek, konec, prisotni, opravičeno odsotni; oznake v levem
stolpcu `5F7590`, vrednosti desno) · »DNEVNI RED« kot oštevilčen seznam ·
razdelki po točkah dnevnega reda · sklepi v slogu `S59DGO sklep` z oznako
»SKLEP 4/1:« · podpisni blok s tremi podpisi v vrsti (zapisnikar, predsedujoči,
overitelj).

### 5.3 Vabilo (`S59DGO-vabilo.dotx`)

Namesto svetle glave modri pas `15304F` čez celotno širino strani: emblem na
sredini (28 mm), naslov dogodka Arial 20 pt krepko belo, pod njim »Radio klub
Snežnik · S59DGO« 11 pt `F0C9A8`, na spodnjem robu pasu greben v beli barvi.
Sledi nagovor, tabela podatkov dogodka (Kdaj, Kje, Dnevni red, Prijava),
odstavek s pojasnilom, podpisni blok in običajna noga.

Pas je izveden kot tabela v glavi z negativnim levim zamikom, razširjena do
5 mm od roba papirja na vsaki strani. Do samega roba ne sega, ker večina
tiskalnikov zadnjih nekaj milimetrov ne natisne; bel rob okoli pasu je
namerna odločitev in ne napaka postavitve.

### 5.4 Priznanje (`S59DGO-priznanje.dotx`, `S59DGO-certificate-en.dotx`)

A4 ležeče, robovi 15 mm. Dvojni okvir: zunanji 2 pt `15304F`, notranji 0,75 pt
`D9702A`, med njima pribl. 6,5 mm (ne 3 mm: `w:space` zunanjega okvira je
omejen na 31 pik, znotraj 15 mm robu papirja pa 3 mm ni dosegljivih). Vsebina
po sredini: oba logotipa v vrsti (klubski
26 mm, ZRS 20 mm) · »RADIO KLUB SNEŽNIK ILIRSKA BISTRICA« v slogu
`S59DGO podnaslov` · »PRIZNANJE« Arial 30 pt krepko `15304F`, razmik znakov
3 pt · ime prejemnika Arial 20 pt s podčrtano linijo · utemeljitev Arial 11 pt
v širini 60 % strani · spodaj levo »Ilirska Bistrica, »datum««, desno podpisna
črta »predsednik društva« · nad spodnjim robom greben `CFE0F0`, višina 6 mm.

Angleška različica ima isto postavitev; besedila: »CERTIFICATE OF
ACHIEVEMENT«, »Radio Club Snežnik Ilirska Bistrica«, »President of the club«,
datum v obliki »14 March 2026«.

## 6. Izdelava

`bin/dokumenti.sh` v Dockerju (`python:3.12-slim`, `python-docx`) požene
`bin/dokumenti/generiraj.py`, ta pa:

1. prebere podatke društva iz `bin/dokumenti/podatki.py` (naslov, e-pošta,
   telefon, TRR, matična in davčna številka, register, ime in funkcija
   podpisnika) – to je edino mesto, kjer se podatki popravljajo;
2. sestavi vsako predlogo: barvna tema, slogi, glava, noga, telo;
3. shrani `.docx`, nato ga pretvori v `.dotx` tako, da v `[Content_Types].xml`
   zamenja vrsto glavnega dela dokumenta v
   `…wordprocessingml.template.main+xml`;
4. iz istih gradnikov shrani še izpolnjene primere v `dokumenti/primeri/`.

Greben se upodobi iz `dokumenti/viri/greben.svg` z `rsvg-convert` v Dockerju
(enak pristop kot `bin/grafika-referenca.sh`), v širini 1600 px pri 300 dpi.
Logotipa se pomanjšata na največ 600 px daljše stranice, da predloge ostanejo
majhne.

### Preverjanje

Skripta po generiranju vsako datoteko odpre nazaj in preveri:

- da se odpre s `python-docx` in ima pričakovano število razdelkov;
- da sta v glavi obe sliki in v nogi vsi trije stolpci s pravilnimi podatki;
- da je e-pošta `test@s59dgo.si` in spletni naslov `www.s59dgo.si`;
- da so vsa polja v obliki »…« prisotna;
- da ima `.dotx` pravilno vrsto vsebine.

`bin/dokumenti.sh --pdf` dodatno pretvori vse datoteke v PDF z LibreOffice v
Dockerju (`debian:bookworm-slim`, `libreoffice-writer`, `fonts-liberation`;
Liberation Sans je metrično združljiv z Arialom, zato je predogled verodostojen)
in jih shrani v `dist/dokumenti-pdf/`. Ta korak služi pregledu pred predajo in
ni pogoj za generiranje.

## 7. Predaja

`dokumenti/README.md` opiše:

- namestitev predlog: macOS
  `~/Library/Group Containers/UBF8T346G9.Office/User Content/Templates`,
  Windows `%APPDATA%\Microsoft\Templates`; nato Datoteka → Novo iz predloge;
- uporabo brez namestitve: dvoklik na `.dotx` odpre nov, neimenovan dokument;
- dogovor o poimenovanju shranjenih dokumentov, kot je v rabi doslej:
  `LLLLMMDD_KratekOpis.docx` (npr. `20260314_ZapisnikObcniZbor.docx`);
- obliko številke dokumenta `NN/LLLL-NNN`, kot je v rabi doslej;
- kje se popravijo podatki društva in kako se predloge ponovno generirajo.

## 8. Izven obsega

Ovojnice in nalepke, vizitke, QSL kartice, PowerPoint predloge, različice za
Google Docs, prava Wordova vsebinska polja (content controls), makri in
elektronski podpis. Tema `s59dgo` in spletna stran se s tem delom ne spreminjata.
