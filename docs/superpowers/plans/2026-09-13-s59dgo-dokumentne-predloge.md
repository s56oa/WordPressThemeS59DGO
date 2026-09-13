# Dokumentne predloge S59DGO – načrt izvedbe

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Komplet Wordovih predlog društva S59DGO (dopis, zapisnik, vabilo, priznanje SL/EN), generiran iz skripte, vizualno izpeljan iz teme `s59dgo`.

**Architecture:** Python skripta s `python-docx` sestavi vsak dokument iz skupnih gradnikov (barvna tema, imenovani slogi, glava, noga), ga shrani kot `.docx`, nato pretvori v `.dotx` s spremembo vrste vsebine v `[Content_Types].xml`. Vse teče v Dockerju prek `bin/dokumenti.sh`; podatki društva so na enem mestu v `podatki.py`. Testi so pytest in preverjajo zgrajene dokumente prek `python-docx`, brez odpiranja Worda.

**Tech Stack:** Python 3.12 (`python:3.12-slim`), `python-docx==1.1.2`, `pytest==8.3.3`, `rsvg-convert` (alpine) za upodobitev grebena, `libreoffice-writer` (debian) za PDF predoglede. Brez lokalnih namestitev – vse prek Dockerja.

**Spec:** `docs/superpowers/specs/2026-09-13-s59dgo-dokumentne-predloge-design.md`

## Global Constraints

- Jezik vsebine in imen: **slovenščina**. Imena modulov, funkcij in spremenljivk so slovenska (`podatki`, `glava`, `noga`, `zgradi_dopis`), enako kot razredi CSS v temi.
- Pisava v vseh dokumentih: **Arial** (tudi `w:eastAsia` in `w:cs`). Nobene druge pisave.
- Barve (točne vrednosti, prepisane iz speca): glava/naslovi `15304F`, poudarek `D9702A`, podlaga noge `EEF3F8`, črte `D3DFEB`, greben `CFE0F0`, besedilo `172433`, tiho besedilo `5F7590`, pas vabila – besedilo `F0C9A8`.
- Stran A4 pokončno (210 × 297 mm), robovi: levo 25 mm, desno 20 mm, zgoraj 42 mm, spodaj 25 mm; glava 12 mm od vrha, noga 8 mm od dna. Priznanje: A4 ležeče, robovi 15 mm.
- Podatki društva: Radio klub Snežnik Ilirska Bistrica, Bazoviška cesta 19A, 6250 Ilirska Bistrica, e-pošta `test@s59dgo.si`, splet `www.s59dgo.si`, telefon `070 123 456`, TRR `SI56 1915 0500 8035 824`, matična `5136407000`, davčna `16799852`, register: »Društvo je vpisano v register društev pri UE Ilirska Bistrica pod zaporedno številko 21 z dne 30. 09. 1976.«
- Podpisnik: `Ognjen Antonič – S56OA`, `predsednik društva`, `test@s59dgo.si`.
- Polja za izpolnjevanje so **besedilo v obliki** `»Naziv prejemnika«` (znaka U+00BB in U+00AB), barva `5F7590`. Nobenih Wordovih vsebinskih polj (content controls).
- Vsak ukaz teče v Dockerju. Skripte se poganjajo iz korena repozitorija.
- Sporočila commitov so v slovenščini, kot ostala zgodovina repozitorija.
- Nobenih zunanjih klicev med generiranjem: logotipa in greben so datoteke v `dokumenti/viri/`.

## Struktura datotek

| Datoteka | Odgovornost |
|---|---|
| `bin/dokumenti.sh` | Docker ovoj: `--test` (pytest), `--viri` (upodobi greben), `--pdf` (predogledi), brez zastavice generira predloge in primere |
| `bin/dokumenti/zahteve.txt` | pripeti različici `python-docx` in `pytest` |
| `bin/dokumenti/podatki.py` | podatki društva in podpisnika; edino mesto za popravke |
| `bin/dokumenti/pomocniki.py` | nizkonivojski OOXML pripomočki (obrobe, senčenje, razmik znakov, polja PAGE, zamik tabele, okvir strani) |
| `bin/dokumenti/slog.py` | barvna tema dokumenta in imenovani slogi `S59DGO …` |
| `bin/dokumenti/deli.py` | glava prve strani, glava nadaljnjih strani, noga, nastavitev strani |
| `bin/dokumenti/pakiranje.py` | barvna tema dokumenta in pretvorba `.docx` → `.dotx` |
| `bin/dokumenti/dopis.py` | telo dopisa |
| `bin/dokumenti/zapisnik.py` | telo zapisnika |
| `bin/dokumenti/vabilo.py` | modri pas in telo vabila |
| `bin/dokumenti/priznanje.py` | priznanje, slovensko in angleško |
| `bin/dokumenti/generiraj.py` | ukazna vrstica: sestavi vse predloge in primere, na koncu preveri izdelke |
| `bin/dokumenti/test_*.py` | pytest testi ob vsakem modulu |
| `dokumenti/viri/` | `logo-klub.png`, `logo-zrs.png`, `greben.svg`, `greben.png` |
| `dokumenti/predloge/`, `dokumenti/primeri/` | izdelki skripte |
| `dokumenti/README.md` | namestitev in uporaba predlog |

Vsi moduli v `bin/dokumenti/` se uvažajo ploščato (`import podatki`), ker pytest in `generiraj.py` tečeta z delovnim imenikom `bin/dokumenti`.

---

### Task 1: Ogrodje, Docker ovoj in viri

**Files:**
- Create: `bin/dokumenti.sh`, `bin/dokumenti/zahteve.txt`, `dokumenti/viri/greben.svg`, `dokumenti/viri/logo-klub.png`, `dokumenti/viri/logo-zrs.png`, `dokumenti/viri/greben.png`
- Test: `bin/dokumenti/test_viri.py`
- Modify: `.gitignore` (dodaj `dist/dokumenti-pdf/`)

**Interfaces:**
- Consumes: nič
- Produces: `bin/dokumenti.sh` z zastavicami `--test`, `--viri`, `--pdf`; mapa `dokumenti/viri/` s štirimi datotekami; konstanta poti `VIRI = pathlib.Path(__file__).resolve().parents[2] / 'dokumenti' / 'viri'` (uporabljena v poznejših nalogah)

- [ ] **Step 1: Pripravi vire iz obstoječih logotipov**

```bash
cd "$(git rev-parse --show-toplevel)"
mkdir -p dokumenti/viri dokumenti/predloge dokumenti/primeri
sips -Z 600 trenutni_logotipi/s59dgo_logo_cropped.png --out dokumenti/viri/logo-klub.png
sips -Z 600 "trenutni_logotipi/Logo ZRS/ZRS_Logo_2024 OK_blue.png" --out dokumenti/viri/logo-zrs.png
```

- [ ] **Step 2: Zapiši `dokumenti/viri/greben.svg`**

Pot je prepisana iz `s59dgo/template-parts/trak.php:23`, da je motiv na papirju enak kot na spletu. Datoteka nima ozadja, ker se v dokument vstavi kot slika s prosojnostjo.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 90" width="1440" height="90">
  <path d="M0 90 L0 62 L120 48 L230 60 L340 30 L420 44 L520 18 L610 40 L700 8 L790 36 L880 22 L980 50 L1080 30 L1180 52 L1280 38 L1380 58 L1440 46 L1440 90 Z" fill="#CFE0F0"/>
</svg>
```

- [ ] **Step 3: Zapiši `bin/dokumenti/zahteve.txt`**

```
python-docx==1.1.2
pytest==8.3.3
```

- [ ] **Step 4: Zapiši `bin/dokumenti.sh`**

```bash
#!/usr/bin/env bash
# Generira Wordove predloge društva v dokumenti/predloge in primere v dokumenti/primeri.
#   bin/dokumenti.sh          generiraj predloge in primere
#   bin/dokumenti.sh --test   poženi pytest
#   bin/dokumenti.sh --viri   upodobi dokumenti/viri/greben.png iz greben.svg
#   bin/dokumenti.sh --pdf    pretvori izdelke v PDF predoglede (dist/dokumenti-pdf)
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p dist/.pip dokumenti/predloge dokumenti/primeri

python_v_dockerju() {
  docker run --rm \
    -v "$PWD:/delo" -v "$PWD/dist/.pip:/root/.cache/pip" \
    -w /delo/bin/dokumenti python:3.12-slim \
    sh -c "pip install -q -r zahteve.txt && $1"
}

case "${1:-}" in
  --test)
    python_v_dockerju "python -m pytest -q"
    ;;
  --viri)
    docker run --rm -v "$PWD/dokumenti/viri:/viri" -w /viri alpine:3.20 sh -c '
      apk add --no-cache rsvg-convert >/dev/null &&
      for svg in *.svg; do rsvg-convert -w 1600 "$svg" -o "${svg%.svg}.png"; done'
    ;;
  --pdf)
    mkdir -p dist/dokumenti-pdf
    docker run --rm -v "$PWD:/delo" -w /delo debian:bookworm-slim sh -c '
      apt-get update -qq >/dev/null &&
      apt-get install -y -qq libreoffice-writer fonts-liberation >/dev/null &&
      soffice --headless --convert-to pdf --outdir dist/dokumenti-pdf dokumenti/primeri/*.docx >/dev/null'
    ls -1 dist/dokumenti-pdf
    ;;
  "")
    python_v_dockerju "python generiraj.py"
    ;;
  *)
    echo "Neznana zastavica: $1" >&2
    exit 2
    ;;
esac
```

- [ ] **Step 5: Naredi skripto izvedljivo in upodobi greben**

```bash
chmod +x bin/dokumenti.sh
bin/dokumenti.sh --viri
```

Pričakovano: nastane `dokumenti/viri/greben.png`, širok 1600 px.

- [ ] **Step 6: Napiši test virov**

`bin/dokumenti/test_viri.py`:

```python
"""Preveri, da so viri za dokumente na mestu in v pričakovanih mejah."""
import pathlib
import struct

VIRI = pathlib.Path(__file__).resolve().parents[2] / "dokumenti" / "viri"


def velikost_png(pot):
    glava = pot.read_bytes()[:24]
    assert glava[:8] == b"\x89PNG\r\n\x1a\n", f"{pot.name} ni PNG"
    return struct.unpack(">II", glava[16:24])


def test_vsi_viri_obstajajo():
    for ime in ("logo-klub.png", "logo-zrs.png", "greben.svg", "greben.png"):
        assert (VIRI / ime).is_file(), f"manjka {ime}"


def test_logotipa_nista_prevelika():
    for ime in ("logo-klub.png", "logo-zrs.png"):
        sirina, visina = velikost_png(VIRI / ime)
        assert max(sirina, visina) <= 600, f"{ime} je prevelik: {sirina}x{visina}"


def test_greben_je_sirok_trak():
    sirina, visina = velikost_png(VIRI / "greben.png")
    assert sirina == 1600
    assert visina == 100, "greben.png mora ohraniti razmerje 1440:90"


def test_greben_svg_ima_barvo_teme():
    besedilo = (VIRI / "greben.svg").read_text(encoding="utf-8")
    assert "#CFE0F0" in besedilo
```

- [ ] **Step 7: Poženi test**

Run: `bin/dokumenti.sh --test`
Expected: 4 testi PASS. Če `test_greben_je_sirok_trak` pade zaradi zaokroževanja višine, popravi pričakovano višino na dejansko vrednost iz sporočila (`rsvg-convert` zaokroži 90 × 1600/1440 = 100).

- [ ] **Step 8: Dopolni `.gitignore`**

Dodaj vrstico `dist/dokumenti-pdf/` pod obstoječi `dist/` (če `dist/` že pokriva vse, korak preskoči in to zabeleži v commitu).

- [ ] **Step 9: Commit**

```bash
git add bin/dokumenti.sh bin/dokumenti/zahteve.txt bin/dokumenti/test_viri.py dokumenti/viri .gitignore
git commit -m "Dokumenti: ogrodje skripte in viri (logotipa, greben)"
```

---

### Task 2: Podatki društva

**Files:**
- Create: `bin/dokumenti/podatki.py`
- Test: `bin/dokumenti/test_podatki.py`

**Interfaces:**
- Consumes: nič
- Produces: `DRUSTVO` (dict s ključi `ime`, `ulica`, `posta`, `epota`, `splet`, `telefon`, `trr`, `maticna`, `davcna`, `register`), `PODPISNIK` (dict s ključi `ime`, `funkcija`, `epota`), `BARVE` (dict s ključi `glava`, `poudarek`, `podlaga`, `crta`, `greben`, `besedilo`, `tiho`, `pas_besedilo`), `VIRI` (pathlib.Path do `dokumenti/viri`), `PREDLOGE`, `PRIMERI` (pathlib.Path do izhodnih map)

- [ ] **Step 1: Napiši test**

`bin/dokumenti/test_podatki.py`:

```python
"""Podatki društva so na enem mestu in se ujemajo s potrjenim specom."""
import podatki


def test_kontaktni_podatki():
    d = podatki.DRUSTVO
    assert d["ime"] == "Radio klub Snežnik Ilirska Bistrica"
    assert d["ulica"] == "Bazoviška cesta 19A"
    assert d["posta"] == "6250 Ilirska Bistrica"
    assert d["epota"] == "test@s59dgo.si"
    assert d["splet"] == "www.s59dgo.si"
    assert d["telefon"] == "070 123 456"
    assert d["trr"] == "SI56 1915 0500 8035 824"
    assert d["maticna"] == "5136407000"
    assert d["davcna"] == "16799852"
    assert "zaporedno številko 21" in d["register"]


def test_podpisnik():
    assert podatki.PODPISNIK["ime"] == "Ognjen Antonič – S56OA"
    assert podatki.PODPISNIK["funkcija"] == "predsednik društva"
    assert podatki.PODPISNIK["epota"] == "test@s59dgo.si"


def test_stare_domene_ni_nikjer():
    vse = " ".join(str(v) for v in podatki.DRUSTVO.values())
    vse += " " + " ".join(str(v) for v in podatki.PODPISNIK.values())
    assert "s59dgo.org" not in vse


def test_barve_teme():
    assert podatki.BARVE == {
        "glava": "15304F",
        "poudarek": "D9702A",
        "podlaga": "EEF3F8",
        "crta": "D3DFEB",
        "greben": "CFE0F0",
        "besedilo": "172433",
        "tiho": "5F7590",
        "pas_besedilo": "F0C9A8",
    }


def test_poti_kazejo_na_repozitorij():
    assert podatki.VIRI.is_dir()
    assert podatki.VIRI.name == "viri"
    assert podatki.PREDLOGE.name == "predloge"
    assert podatki.PRIMERI.name == "primeri"
```

- [ ] **Step 2: Poženi test in preveri, da pade**

Run: `bin/dokumenti.sh --test`
Expected: FAIL, `ModuleNotFoundError: No module named 'podatki'`

- [ ] **Step 3: Napiši `bin/dokumenti/podatki.py`**

```python
"""Podatki društva S59DGO za dokumentne predloge.

Tu je edino mesto, kjer se popravijo kontaktni podatki ali podpisnik;
predloge se nato ponovno generirajo z `bin/dokumenti.sh`.
"""
import pathlib

KOREN = pathlib.Path(__file__).resolve().parents[2]
VIRI = KOREN / "dokumenti" / "viri"
PREDLOGE = KOREN / "dokumenti" / "predloge"
PRIMERI = KOREN / "dokumenti" / "primeri"

DRUSTVO = {
    "ime": "Radio klub Snežnik Ilirska Bistrica",
    "ulica": "Bazoviška cesta 19A",
    "posta": "6250 Ilirska Bistrica",
    "epota": "test@s59dgo.si",
    "splet": "www.s59dgo.si",
    "telefon": "070 123 456",
    "trr": "SI56 1915 0500 8035 824",
    "maticna": "5136407000",
    "davcna": "16799852",
    "register": (
        "Društvo je vpisano v register društev pri UE Ilirska Bistrica "
        "pod zaporedno številko 21 z dne 30. 09. 1976."
    ),
}

PODPISNIK = {
    "ime": "Ognjen Antonič – S56OA",
    "funkcija": "predsednik društva",
    "epota": "test@s59dgo.si",
}

BARVE = {
    "glava": "15304F",
    "poudarek": "D9702A",
    "podlaga": "EEF3F8",
    "crta": "D3DFEB",
    "greben": "CFE0F0",
    "besedilo": "172433",
    "tiho": "5F7590",
    "pas_besedilo": "F0C9A8",
}

KLUB_VRSTICI = ("RADIO KLUB SNEŽNIK", "ILIRSKA BISTRICA")
KLUB_OZNAKA = "S59DGO · ČLAN ZRS"


def polje(besedilo):
    """Mesto za izpolnjevanje, npr. polje('Naziv prejemnika') -> »Naziv prejemnika«."""
    return f"»{besedilo}«"
```

- [ ] **Step 4: Poženi test**

Run: `bin/dokumenti.sh --test`
Expected: vsi testi PASS.

- [ ] **Step 5: Commit**

```bash
git add bin/dokumenti/podatki.py bin/dokumenti/test_podatki.py
git commit -m "Dokumenti: podatki društva na enem mestu"
```

---

### Task 3: OOXML pripomočki

**Files:**
- Create: `bin/dokumenti/pomocniki.py`
- Test: `bin/dokumenti/test_pomocniki.py`

**Interfaces:**
- Consumes: nič
- Produces:
  - `brez_obrob(tabela)` – odstrani vse obrobe tabele
  - `osenci(celica, barva_hex)` – barvna podlaga celice
  - `crta_pod(odstavek, barva_hex, osmine_pike)` – spodnja obroba odstavka (`osmine_pike=4` je 0,5 pt, `8` je 1 pt, `16` je 2 pt)
  - `crta_levo(odstavek, barva_hex, osmine_pike)` – leva obroba odstavka (za sklepe v zapisniku)
  - `razmik_znakov(run, pike)` – razmik med znaki v pikah (float)
  - `stevilka_strani(odstavek)` – doda niz »Stran X od Y« s poljema PAGE in NUMPAGES
  - `zamik_tabele(tabela, mm)` – vodoravni zamik tabele, dovoljene tudi negativne vrednosti
  - `okvir_strani(razdelek, barva_hex, osmine_pike, odmik_pt)` – obroba strani
  - `obrobe_tabele(tabela, barva_hex, osmine_pike)` – enotne obrobe okoli in znotraj tabele

- [ ] **Step 1: Napiši test**

`bin/dokumenti/test_pomocniki.py`:

```python
"""Pripomočki pišejo pričakovani OOXML."""
import docx
from docx.oxml.ns import qn

import pomocniki


def test_brez_obrob_postavi_none():
    dok = docx.Document()
    tabela = dok.add_table(rows=1, cols=2)
    pomocniki.brez_obrob(tabela)
    obrobe = tabela._tbl.tblPr.find(qn("w:tblBorders"))
    assert obrobe is not None
    assert all(rob.get(qn("w:val")) == "none" for rob in obrobe)


def test_osenci_zapise_barvo():
    dok = docx.Document()
    celica = dok.add_table(rows=1, cols=1).cell(0, 0)
    pomocniki.osenci(celica, "EEF3F8")
    senca = celica._tc.tcPr.find(qn("w:shd"))
    assert senca.get(qn("w:fill")) == "EEF3F8"


def test_crta_pod_odstavkom():
    dok = docx.Document()
    odstavek = dok.add_paragraph("besedilo")
    pomocniki.crta_pod(odstavek, "D3DFEB", 4)
    spodaj = odstavek._p.pPr.find(qn("w:pBdr")).find(qn("w:bottom"))
    assert spodaj.get(qn("w:color")) == "D3DFEB"
    assert spodaj.get(qn("w:sz")) == "4"


def test_crta_levo_ob_odstavku():
    dok = docx.Document()
    odstavek = dok.add_paragraph("sklep")
    pomocniki.crta_levo(odstavek, "D9702A", 16)
    levo = odstavek._p.pPr.find(qn("w:pBdr")).find(qn("w:left"))
    assert levo.get(qn("w:color")) == "D9702A"
    assert levo.get(qn("w:sz")) == "16"


def test_razmik_znakov_v_dvajsetinkah_pike():
    dok = docx.Document()
    run = dok.add_paragraph().add_run("S59DGO")
    pomocniki.razmik_znakov(run, 1.2)
    assert run._r.rPr.find(qn("w:spacing")).get(qn("w:val")) == "24"


def test_stevilka_strani_vstavi_polji():
    dok = docx.Document()
    odstavek = dok.add_paragraph()
    pomocniki.stevilka_strani(odstavek)
    navodila = [el.text for el in odstavek._p.iter(qn("w:instrText"))]
    assert any("PAGE" in n for n in navodila)
    assert any("NUMPAGES" in n for n in navodila)
    assert "Stran" in odstavek.text


def test_zamik_tabele_sprejme_negativno():
    dok = docx.Document()
    tabela = dok.add_table(rows=1, cols=1)
    pomocniki.zamik_tabele(tabela, -5)
    zamik = tabela._tbl.tblPr.find(qn("w:tblInd"))
    assert int(zamik.get(qn("w:w"))) == -283  # 5 mm v dvajsetinkah pike


def test_okvir_strani():
    dok = docx.Document()
    pomocniki.okvir_strani(dok.sections[0], "15304F", 16, 24)
    okvir = dok.sections[0]._sectPr.find(qn("w:pgBorders"))
    assert okvir.find(qn("w:top")).get(qn("w:color")) == "15304F"
    assert okvir.find(qn("w:top")).get(qn("w:sz")) == "16"


def test_obrobe_tabele():
    dok = docx.Document()
    tabela = dok.add_table(rows=2, cols=2)
    pomocniki.obrobe_tabele(tabela, "D3DFEB", 4)
    obrobe = tabela._tbl.tblPr.find(qn("w:tblBorders"))
    assert obrobe.find(qn("w:insideH")).get(qn("w:color")) == "D3DFEB"
```

- [ ] **Step 2: Poženi test in preveri, da pade**

Run: `bin/dokumenti.sh --test`
Expected: FAIL, `ModuleNotFoundError: No module named 'pomocniki'`

- [ ] **Step 3: Napiši `bin/dokumenti/pomocniki.py`**

```python
"""Nizkonivojski OOXML pripomočki, ki jih python-docx ne ponuja neposredno."""
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROBOVI = ("top", "left", "bottom", "right", "insideH", "insideV")


def _element(ime, **atributi):
    el = OxmlElement(f"w:{ime}")
    for kljuc, vrednost in atributi.items():
        el.set(qn(f"w:{kljuc}"), str(vrednost))
    return el


def _tblPr(tabela):
    return tabela._tbl.tblPr


def _pPr(odstavek):
    return odstavek._p.get_or_add_pPr()


def _rPr(run):
    return run._r.get_or_add_rPr()


def _zamenjaj(starsi, ime, nov):
    star = starsi.find(qn(f"w:{ime}"))
    if star is not None:
        starsi.remove(star)
    starsi.append(nov)


def brez_obrob(tabela):
    obrobe = _element("tblBorders")
    for rob in ROBOVI:
        obrobe.append(_element(rob, val="none", sz=0, space=0, color="auto"))
    _zamenjaj(_tblPr(tabela), "tblBorders", obrobe)


def obrobe_tabele(tabela, barva_hex, osmine_pike):
    obrobe = _element("tblBorders")
    for rob in ROBOVI:
        obrobe.append(
            _element(rob, val="single", sz=osmine_pike, space=0, color=barva_hex)
        )
    _zamenjaj(_tblPr(tabela), "tblBorders", obrobe)


def osenci(celica, barva_hex):
    tcPr = celica._tc.get_or_add_tcPr()
    _zamenjaj(tcPr, "shd", _element("shd", val="clear", color="auto", fill=barva_hex))


def crta_pod(odstavek, barva_hex, osmine_pike):
    obroba = _element("pBdr")
    obroba.append(
        _element("bottom", val="single", sz=osmine_pike, space=4, color=barva_hex)
    )
    _zamenjaj(_pPr(odstavek), "pBdr", obroba)


def crta_levo(odstavek, barva_hex, osmine_pike):
    obroba = _element("pBdr")
    obroba.append(
        _element("left", val="single", sz=osmine_pike, space=8, color=barva_hex)
    )
    _zamenjaj(_pPr(odstavek), "pBdr", obroba)


def razmik_znakov(run, pike):
    _zamenjaj(_rPr(run), "spacing", _element("spacing", val=int(round(pike * 20))))


def _polje(odstavek, koda):
    run = odstavek.add_run()
    run._r.append(_element("fldChar", fldCharType="begin"))
    navodilo = OxmlElement("w:instrText")
    navodilo.set(qn("xml:space"), "preserve")
    navodilo.text = f" {koda} "
    run._r.append(navodilo)
    run._r.append(_element("fldChar", fldCharType="separate"))
    run._r.append(_element("fldChar", fldCharType="end"))


def stevilka_strani(odstavek):
    odstavek.add_run("Stran ")
    _polje(odstavek, "PAGE")
    odstavek.add_run(" od ")
    _polje(odstavek, "NUMPAGES")


def zamik_tabele(tabela, mm):
    dvajsetinke = int(round(mm * 56.6929))
    _zamenjaj(_tblPr(tabela), "tblInd", _element("tblInd", w=dvajsetinke, type="dxa"))


def okvir_strani(razdelek, barva_hex, osmine_pike, odmik_pt):
    okvir = _element("pgBorders", offsetFrom="page")
    for rob in ("top", "left", "bottom", "right"):
        okvir.append(
            _element(
                rob,
                val="single",
                sz=osmine_pike,
                space=int(round(odmik_pt)),
                color=barva_hex,
            )
        )
    _zamenjaj(razdelek._sectPr, "pgBorders", okvir)
```

- [ ] **Step 4: Poženi test**

Run: `bin/dokumenti.sh --test`
Expected: vsi testi PASS. Če `test_stevilka_strani_vstavi_polji` pade, ker `odstavek.text` ne vsebuje »Stran«, preveri, da se besedilo doda z `add_run`, ne prek `w:t` v polju.

- [ ] **Step 5: Commit**

```bash
git add bin/dokumenti/pomocniki.py bin/dokumenti/test_pomocniki.py
git commit -m "Dokumenti: OOXML pripomočki za obrobe, senčenje in polja"
```

---

### Task 4: Slogi in barvna tema

**Files:**
- Create: `bin/dokumenti/slog.py`
- Test: `bin/dokumenti/test_slog.py`

**Interfaces:**
- Consumes: `podatki.BARVE`, `pomocniki.razmik_znakov`
- Produces:
  - `barva(ime)` → `RGBColor` iz `podatki.BARVE`
  - `dodaj_sloge(dok)` – v dokument doda sloge `S59DGO telo`, `S59DGO meta`, `S59DGO naslovnik`, `S59DGO zadeva`, `S59DGO naslov`, `S59DGO podnaslov`, `S59DGO sklep`, `S59DGO noga` in nastavi slog `Normal` na Arial 11 pt
  - konstanta `SLOGI` – seznam imen dodanih slogov

- [ ] **Step 1: Napiši test**

`bin/dokumenti/test_slog.py`:

```python
"""Imenovani slogi ustrezajo potrjenemu specu."""
import docx
import pytest
from docx.shared import Pt

import slog


@pytest.fixture
def dok():
    d = docx.Document()
    slog.dodaj_sloge(d)
    return d


def test_vsi_slogi_dodani(dok):
    for ime in slog.SLOGI:
        assert ime in [s.name for s in dok.styles]


def test_normal_je_arial_11(dok):
    normal = dok.styles["Normal"]
    assert normal.font.name == "Arial"
    assert normal.font.size == Pt(11)


def test_telo(dok):
    s = dok.styles["S59DGO telo"]
    assert s.font.size == Pt(11)
    assert s.font.color.rgb == slog.barva("besedilo")
    assert s.paragraph_format.line_spacing == 1.15
    assert s.paragraph_format.space_after == Pt(6)
    assert s.font.bold is False


def test_zadeva_je_krepka_in_modra(dok):
    s = dok.styles["S59DGO zadeva"]
    assert s.font.bold is True
    assert s.font.color.rgb == slog.barva("glava")
    assert s.paragraph_format.space_after == Pt(12)


def test_naslov_je_velik_in_v_velikih_crkah(dok):
    s = dok.styles["S59DGO naslov"]
    assert s.font.size == Pt(14)
    assert s.font.bold is True
    assert s.font.all_caps is True


def test_podnaslov(dok):
    s = dok.styles["S59DGO podnaslov"]
    assert s.font.size == Pt(10)
    assert s.font.all_caps is True
    assert s.font.color.rgb == slog.barva("tiho")


def test_noga_je_drobna(dok):
    s = dok.styles["S59DGO noga"]
    assert s.font.size == Pt(7.5)
    assert s.font.color.rgb.__str__() == "46586C"


def test_sklep_ima_zamik(dok):
    from docx.shared import Mm

    s = dok.styles["S59DGO sklep"]
    assert s.paragraph_format.left_indent == Mm(8)


def test_meta_ima_desni_tabulator(dok):
    from docx.shared import Mm

    tabulatorji = list(dok.styles["S59DGO meta"].paragraph_format.tab_stops)
    assert len(tabulatorji) == 1
    assert tabulatorji[0].position == Mm(165)


def test_vsi_slogi_uporabljajo_arial(dok):
    for ime in slog.SLOGI:
        assert dok.styles[ime].font.name == "Arial", ime
```

- [ ] **Step 2: Poženi test in preveri, da pade**

Run: `bin/dokumenti.sh --test`
Expected: FAIL, `ModuleNotFoundError: No module named 'slog'`

- [ ] **Step 3: Napiši `bin/dokumenti/slog.py`**

```python
"""Barvna tema in imenovani slogi za dokumente društva."""
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_TAB_ALIGNMENT
from docx.oxml.ns import qn
from docx.shared import Mm, Pt, RGBColor

import podatki

SLOGI = [
    "S59DGO telo",
    "S59DGO meta",
    "S59DGO naslovnik",
    "S59DGO zadeva",
    "S59DGO naslov",
    "S59DGO podnaslov",
    "S59DGO sklep",
    "S59DGO noga",
]


def barva(ime):
    return RGBColor.from_string(podatki.BARVE[ime])


def _arial(slog_dokumenta):
    """Arial nastavi za vse štiri skripte, sicer Word zamenja pisavo."""
    rPr = slog_dokumenta.element.get_or_add_rPr()
    rFonts = rPr.get_or_add_rFonts()
    for atribut in ("w:ascii", "w:hAnsi", "w:eastAsia", "w:cs"):
        rFonts.set(qn(atribut), "Arial")


def _nov(dok, ime, velikost, barva_ime, krepko=False, velike=False):
    s = dok.styles.add_style(ime, WD_STYLE_TYPE.PARAGRAPH)
    s.base_style = dok.styles["Normal"]
    s.quick_style = True
    s.font.name = "Arial"
    s.font.size = Pt(velikost)
    s.font.bold = krepko
    s.font.all_caps = velike
    s.font.color.rgb = (
        barva(barva_ime) if barva_ime in podatki.BARVE else RGBColor.from_string(barva_ime)
    )
    _arial(s)
    oblika = s.paragraph_format
    oblika.space_before = Pt(0)
    oblika.space_after = Pt(0)
    oblika.line_spacing = 1.0
    return s


def dodaj_sloge(dok):
    normal = dok.styles["Normal"]
    normal.font.name = "Arial"
    normal.font.size = Pt(11)
    normal.font.color.rgb = barva("besedilo")
    _arial(normal)

    telo = _nov(dok, "S59DGO telo", 11, "besedilo")
    telo.paragraph_format.line_spacing = 1.15
    telo.paragraph_format.space_after = Pt(6)

    meta = _nov(dok, "S59DGO meta", 10, "46586C")
    meta.paragraph_format.space_after = Pt(12)
    meta.paragraph_format.tab_stops.add_tab_stop(Mm(165), WD_TAB_ALIGNMENT.RIGHT)

    naslovnik = _nov(dok, "S59DGO naslovnik", 11, "46586C")
    naslovnik.paragraph_format.space_after = Pt(0)

    zadeva = _nov(dok, "S59DGO zadeva", 11, "glava", krepko=True)
    zadeva.paragraph_format.space_after = Pt(12)
    zadeva.paragraph_format.space_before = Pt(12)

    naslov = _nov(dok, "S59DGO naslov", 14, "glava", krepko=True, velike=True)
    naslov.paragraph_format.space_after = Pt(10)

    podnaslov = _nov(dok, "S59DGO podnaslov", 10, "tiho", velike=True)
    podnaslov.paragraph_format.space_after = Pt(6)

    sklep = _nov(dok, "S59DGO sklep", 11, "besedilo")
    sklep.paragraph_format.left_indent = Mm(8)
    sklep.paragraph_format.space_after = Pt(8)
    sklep.paragraph_format.line_spacing = 1.15

    noga = _nov(dok, "S59DGO noga", 7.5, "46586C")
    noga.paragraph_format.space_after = Pt(0)
```

- [ ] **Step 4: Poženi test**

Run: `bin/dokumenti.sh --test`
Expected: vsi testi PASS. Razmik znakov pri `S59DGO naslov` in `S59DGO podnaslov` se nastavi ob uporabi (`pomocniki.razmik_znakov` na run), ne v slogu – slog ga v python-docx ne izpostavlja.

- [ ] **Step 5: Commit**

```bash
git add bin/dokumenti/slog.py bin/dokumenti/test_slog.py
git commit -m "Dokumenti: imenovani slogi S59DGO"
```

---

### Task 5: Glava, noga in nastavitev strani

**Files:**
- Create: `bin/dokumenti/deli.py`
- Test: `bin/dokumenti/test_deli.py`

**Interfaces:**
- Consumes: `podatki`, `pomocniki`, `slog`
- Produces:
  - `nastavi_stran(razdelek, lezece=False)` – A4, robovi in odmiki glave/noge iz speca
  - `dodaj_glavo(dok)` – glava prve strani (emblem 22 mm, ime kluba, ZRS 18 mm, greben 7 mm, oranžna črta)
  - `dodaj_glavo_nadaljevanja(dok)` – nižja glava z oznako kluba in »Stran X od Y«
  - `dodaj_nogo(dok)` – noga na prvi in nadaljnjih straneh
  - `nov_dokument(lezece=False, z_glavo=True)` – prazen dokument s stranjo, slogi, glavo in nogo; z `z_glavo=False` izpusti glavo prve strani (vabilo si jo zgradi samo), z `lezece=True` izpusti glavo in nogo v celoti; vrne `docx.Document`
  - konstanta `SIRINA_BESEDILA = Mm(165)`

- [ ] **Step 1: Napiši test**

`bin/dokumenti/test_deli.py`:

```python
"""Glava in noga sta na obeh vrstah strani in nosita prave podatke."""
import pytest
from docx.enum.section import WD_ORIENT
from docx.shared import Mm

import deli
import podatki


@pytest.fixture
def dok():
    return deli.nov_dokument()


def besedilo_dela(del_dokumenta):
    vrstice = [o.text for o in del_dokumenta.paragraphs]
    for tabela in del_dokumenta.tables:
        for vrstica in tabela.rows:
            vrstice += [c.text for c in vrstica.cells]
    return "\n".join(vrstice)


def test_stran_je_a4_s_specificnimi_robovi(dok):
    r = dok.sections[0]
    assert (r.page_width, r.page_height) == (Mm(210), Mm(297))
    assert r.left_margin == Mm(25)
    assert r.right_margin == Mm(20)
    assert r.top_margin == Mm(42)
    assert r.bottom_margin == Mm(25)
    assert r.header_distance == Mm(12)
    assert r.footer_distance == Mm(8)


def test_lezeca_stran():
    d = deli.nov_dokument(lezece=True)
    r = d.sections[0]
    assert r.orientation == WD_ORIENT.LANDSCAPE
    assert r.page_width > r.page_height
    assert r.left_margin == Mm(15)


def test_glava_prve_strani_ima_ime_kluba(dok):
    besedilo = besedilo_dela(dok.sections[0].first_page_header)
    assert "RADIO KLUB SNEŽNIK" in besedilo
    assert "ILIRSKA BISTRICA" in besedilo
    assert podatki.KLUB_OZNAKA in besedilo


def test_glava_prve_strani_ima_tri_slike(dok):
    glava = dok.sections[0].first_page_header
    slike = [
        del_ for del_ in glava.part.related_parts.values()
        if del_.content_type.startswith("image/")
    ]
    assert len(slike) == 3, "emblem, ZRS in greben"


def test_glava_nadaljevanja_ima_stevilko_strani(dok):
    besedilo = besedilo_dela(dok.sections[0].header)
    assert "S59DGO" in besedilo
    assert "Stran" in besedilo
    assert "RADIO KLUB SNEŽNIK\nILIRSKA BISTRICA" not in besedilo


def test_noga_je_na_obeh_vrstah_strani(dok):
    for noga in (dok.sections[0].footer, dok.sections[0].first_page_footer):
        besedilo = besedilo_dela(noga)
        assert podatki.DRUSTVO["epota"] in besedilo
        assert podatki.DRUSTVO["splet"] in besedilo
        assert podatki.DRUSTVO["trr"] in besedilo
        assert podatki.DRUSTVO["maticna"] in besedilo
        assert podatki.DRUSTVO["davcna"] in besedilo
        assert "zaporedno številko 21" in besedilo


def test_noga_nima_stare_domene(dok):
    besedilo = besedilo_dela(dok.sections[0].footer)
    assert "s59dgo.org" not in besedilo


def test_noga_ima_tri_stolpce(dok):
    tabela = dok.sections[0].footer.tables[0]
    assert len(tabela.columns) == 3
```

- [ ] **Step 2: Poženi test in preveri, da pade**

Run: `bin/dokumenti.sh --test`
Expected: FAIL, `ModuleNotFoundError: No module named 'deli'`

- [ ] **Step 3: Napiši `bin/dokumenti/deli.py`**

```python
"""Skupni gradniki dokumentov: nastavitev strani, glava in noga."""
import docx
from docx.enum.section import WD_ORIENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT
from docx.shared import Mm, Pt

import podatki
import pomocniki
import slog

SIRINA_BESEDILA = Mm(165)


def nastavi_stran(razdelek, lezece=False):
    if lezece:
        razdelek.orientation = WD_ORIENT.LANDSCAPE
        razdelek.page_width, razdelek.page_height = Mm(297), Mm(210)
        for rob in ("left_margin", "right_margin", "top_margin", "bottom_margin"):
            setattr(razdelek, rob, Mm(15))
    else:
        razdelek.orientation = WD_ORIENT.PORTRAIT
        razdelek.page_width, razdelek.page_height = Mm(210), Mm(297)
        razdelek.left_margin = Mm(25)
        razdelek.right_margin = Mm(20)
        razdelek.top_margin = Mm(42)
        razdelek.bottom_margin = Mm(25)
    razdelek.header_distance = Mm(12)
    razdelek.footer_distance = Mm(8)
    razdelek.different_first_page_header_footer = True


def dodaj_glavo(dok):
    glava = dok.sections[0].first_page_header
    glava.paragraphs[0].text = ""
    tabela = glava.add_table(rows=1, cols=3, width=SIRINA_BESEDILA)
    pomocniki.brez_obrob(tabela)
    for celica, sirina in zip(tabela.rows[0].cells, (Mm(26), Mm(109), Mm(30))):
        celica.width = sirina

    emblem = tabela.cell(0, 0).paragraphs[0]
    emblem.add_run().add_picture(str(podatki.VIRI / "logo-klub.png"), width=Mm(22))

    ime = tabela.cell(0, 1).paragraphs[0]
    ime.paragraph_format.space_after = Pt(0)
    ime.paragraph_format.line_spacing = 1.1
    for zaporedna, vrstica in enumerate(podatki.KLUB_VRSTICI):
        run = ime.add_run(("\n" if zaporedna else "") + vrstica)
        run.bold = True
        run.font.size = Pt(12)
        run.font.color.rgb = slog.barva("glava")
        run.font.name = "Arial"

    oznaka = tabela.cell(0, 1).add_paragraph()
    oznaka.paragraph_format.space_before = Pt(2)
    run = oznaka.add_run(podatki.KLUB_OZNAKA)
    run.font.size = Pt(8)
    run.font.name = "Arial"
    run.font.color.rgb = slog.barva("tiho")
    pomocniki.razmik_znakov(run, 1.2)

    zrs = tabela.cell(0, 2).paragraphs[0]
    zrs.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    zrs.add_run().add_picture(str(podatki.VIRI / "logo-zrs.png"), width=Mm(18))

    greben = glava.add_paragraph()
    greben.paragraph_format.space_before = Pt(6)
    greben.paragraph_format.space_after = Pt(0)
    greben.add_run().add_picture(str(podatki.VIRI / "greben.png"), width=SIRINA_BESEDILA)
    pomocniki.crta_pod(greben, podatki.BARVE["poudarek"], 8)


def dodaj_glavo_nadaljevanja(dok):
    glava = dok.sections[0].header
    odstavek = glava.paragraphs[0]
    odstavek.paragraph_format.tab_stops.add_tab_stop(SIRINA_BESEDILA, WD_TAB_ALIGNMENT.RIGHT)
    run = odstavek.add_run("RADIO KLUB SNEŽNIK · S59DGO\t")
    run.font.size = Pt(8)
    run.font.name = "Arial"
    run.font.color.rgb = slog.barva("tiho")
    pomocniki.stevilka_strani(odstavek)
    for run in odstavek.runs:
        run.font.size = Pt(8)
        run.font.name = "Arial"
        run.font.color.rgb = slog.barva("tiho")
    pomocniki.crta_pod(odstavek, podatki.BARVE["crta"], 4)


def _napolni_nogo(noga):
    noga.paragraphs[0].text = ""
    d = podatki.DRUSTVO
    stolpci = (
        (d["ime"], d["ulica"], d["posta"]),
        (f"E-pošta: {d['epota']}", f"Splet: {d['splet']}", f"Telefon: {d['telefon']}"),
        (
            f"Matična številka: {d['maticna']}",
            f"Davčna številka: {d['davcna']}",
            f"TRR: {d['trr']}",
        ),
    )
    tabela = noga.add_table(rows=1, cols=3, width=SIRINA_BESEDILA)
    pomocniki.brez_obrob(tabela)
    for stolpec, vrstice in enumerate(stolpci):
        celica = tabela.cell(0, stolpec)
        celica.width = Mm(55)
        pomocniki.osenci(celica, podatki.BARVE["podlaga"])
        for zaporedna, vrstica in enumerate(vrstice):
            odstavek = celica.paragraphs[0] if zaporedna == 0 else celica.add_paragraph()
            odstavek.style = "S59DGO noga"
            odstavek.text = vrstica

    register = noga.add_paragraph(podatki.DRUSTVO["register"])
    register.style = "S59DGO noga"
    register.paragraph_format.space_before = Pt(3)


def dodaj_nogo(dok):
    razdelek = dok.sections[0]
    crta = razdelek.first_page_footer.paragraphs[0]
    pomocniki.crta_pod(crta, podatki.BARVE["crta"], 4)
    _napolni_nogo(razdelek.first_page_footer)
    crta = razdelek.footer.paragraphs[0]
    pomocniki.crta_pod(crta, podatki.BARVE["crta"], 4)
    _napolni_nogo(razdelek.footer)


def nov_dokument(lezece=False, z_glavo=True):
    dok = docx.Document()
    nastavi_stran(dok.sections[0], lezece=lezece)
    slog.dodaj_sloge(dok)
    if not lezece:
        if z_glavo:
            dodaj_glavo(dok)
        dodaj_glavo_nadaljevanja(dok)
        dodaj_nogo(dok)
    return dok
```

- [ ] **Step 4: Poženi test**

Run: `bin/dokumenti.sh --test`
Expected: vsi testi PASS. Če `test_glava_prve_strani_ima_tri_slike` pade s številom 0, preveri, da se slike dodajajo v `first_page_header` in ne v telo dokumenta – `different_first_page_header_footer` mora biti nastavljen **pred** dodajanjem.

- [ ] **Step 5: Ročni pregled videza**

```bash
bin/dokumenti.sh --test && python3 - <<'PY'
print("Vizualni pregled pride v Task 11 z zastavico --pdf.")
PY
```

- [ ] **Step 6: Commit**

```bash
git add bin/dokumenti/deli.py bin/dokumenti/test_deli.py
git commit -m "Dokumenti: glava z logotipoma in grebenom ter noga s podatki"
```

---

### Task 6: Pakiranje – barvna tema in `.dotx`

**Files:**
- Create: `bin/dokumenti/pakiranje.py`
- Test: `bin/dokumenti/test_pakiranje.py`

**Interfaces:**
- Consumes: `podatki.BARVE`
- Produces:
  - `nastavi_barvno_temo(pot_docx)` – v `word/theme/theme1.xml` zapiše barve teme (accent1 `15304F`, accent2 `D9702A`, accent3 `5F7590`, accent4 `CFE0F0`, accent5 `D3DFEB`, accent6 `172433`)
  - `v_dotx(pot_docx, pot_dotx)` – shrani kopijo z vrsto vsebine predloge in vrne `pot_dotx`
  - konstanta `VRSTA_PREDLOGE` – niz vrste vsebine `.dotx`

- [ ] **Step 1: Napiši test**

`bin/dokumenti/test_pakiranje.py`:

```python
"""Pretvorba v .dotx in vpis barvne teme delujeta na pravem zip paketu."""
import zipfile

import docx
import pytest

import pakiranje


@pytest.fixture
def docx_pot(tmp_path):
    pot = tmp_path / "poskus.docx"
    dok = docx.Document()
    dok.add_paragraph("besedilo")
    dok.save(pot)
    return pot


def test_barvna_tema_zapise_barve(docx_pot):
    pakiranje.nastavi_barvno_temo(docx_pot)
    with zipfile.ZipFile(docx_pot) as z:
        tema = z.read("word/theme/theme1.xml").decode("utf-8")
    assert '<a:srgbClr val="15304F"/>' in tema
    assert '<a:srgbClr val="D9702A"/>' in tema
    assert docx.Document(docx_pot).paragraphs[0].text == "besedilo"


def test_v_dotx_zamenja_vrsto_vsebine(docx_pot, tmp_path):
    dotx = pakiranje.v_dotx(docx_pot, tmp_path / "poskus.dotx")
    with zipfile.ZipFile(dotx) as z:
        vrste = z.read("[Content_Types].xml").decode("utf-8")
    assert pakiranje.VRSTA_PREDLOGE in vrste
    assert "wordprocessingml.document.main+xml" not in vrste


def test_dotx_se_se_vedno_odpre(docx_pot, tmp_path):
    dotx = pakiranje.v_dotx(docx_pot, tmp_path / "poskus.dotx")
    assert docx.Document(dotx).paragraphs[0].text == "besedilo"


def test_izvirni_docx_ostane_nespremenjen(docx_pot, tmp_path):
    pakiranje.v_dotx(docx_pot, tmp_path / "poskus.dotx")
    with zipfile.ZipFile(docx_pot) as z:
        assert "wordprocessingml.document.main+xml" in z.read(
            "[Content_Types].xml"
        ).decode("utf-8")
```

- [ ] **Step 2: Poženi test in preveri, da pade**

Run: `bin/dokumenti.sh --test`
Expected: FAIL, `ModuleNotFoundError: No module named 'pakiranje'`

- [ ] **Step 3: Napiši `bin/dokumenti/pakiranje.py`**

```python
"""Posegi v zip paket dokumenta: barvna tema in pretvorba v predlogo."""
import re
import shutil
import zipfile

import podatki

VRSTA_DOKUMENTA = (
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"
)
VRSTA_PREDLOGE = (
    "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml"
)

TEMA_BARVE = {
    "accent1": "glava",
    "accent2": "poudarek",
    "accent3": "tiho",
    "accent4": "greben",
    "accent5": "crta",
    "accent6": "besedilo",
}


def _predelaj_zip(pot, ime_dela, predelava):
    with zipfile.ZipFile(pot) as stari:
        vsebine = {i.filename: stari.read(i.filename) for i in stari.infolist()}
        vrstni_red = [i.filename for i in stari.infolist()]
    vsebine[ime_dela] = predelava(vsebine[ime_dela].decode("utf-8")).encode("utf-8")
    with zipfile.ZipFile(pot, "w", zipfile.ZIP_DEFLATED) as novi:
        for ime in vrstni_red:
            novi.writestr(ime, vsebine[ime])


def nastavi_barvno_temo(pot_docx):
    def predelaj(tema):
        for oznaka, barva_ime in TEMA_BARVE.items():
            tema = re.sub(
                rf"<a:{oznaka}>.*?</a:{oznaka}>",
                f'<a:{oznaka}><a:srgbClr val="{podatki.BARVE[barva_ime]}"/></a:{oznaka}>',
                tema,
                flags=re.S,
            )
        return tema

    _predelaj_zip(pot_docx, "word/theme/theme1.xml", predelaj)


def v_dotx(pot_docx, pot_dotx):
    shutil.copyfile(pot_docx, pot_dotx)
    _predelaj_zip(
        pot_dotx,
        "[Content_Types].xml",
        lambda vrste: vrste.replace(VRSTA_DOKUMENTA, VRSTA_PREDLOGE),
    )
    return pot_dotx
```

- [ ] **Step 4: Poženi test**

Run: `bin/dokumenti.sh --test`
Expected: vsi testi PASS.

- [ ] **Step 5: Commit**

```bash
git add bin/dokumenti/pakiranje.py bin/dokumenti/test_pakiranje.py
git commit -m "Dokumenti: barvna tema dokumenta in pretvorba v .dotx"
```

---

### Task 7: Predloga dopisa

**Files:**
- Create: `bin/dokumenti/dopis.py`
- Test: `bin/dokumenti/test_dopis.py`

**Interfaces:**
- Consumes: `deli.nov_dokument`, `podatki.polje`, `pomocniki.crta_pod`
- Produces: `IME = "S59DGO-dopis"`, `zgradi(primer=False) -> docx.Document`; z `primer=True` je dokument izpolnjen z vzorčno vsebino, sicer vsebuje polja `»…«`. Isti podpis (`IME`, `zgradi`) imajo tudi moduli `zapisnik`, `vabilo` in `priznanje`.

- [ ] **Step 1: Napiši test**

`bin/dokumenti/test_dopis.py`:

```python
"""Dopis ima predpisano zaporedje elementov in pravilna polja."""
from docx.shared import Mm

import dopis
import podatki


def test_ime_predloge():
    assert dopis.IME == "S59DGO-dopis"


def test_prazna_predloga_ima_polja():
    besedilo = "\n".join(o.text for o in dopis.zgradi().paragraphs)
    for oznaka in ("Naziv prejemnika", "Ulica in hišna številka", "Poštna številka in kraj", "datum"):
        assert podatki.polje(oznaka) in besedilo, oznaka


def test_zaporedje_slogov():
    slogi = [o.style.name for o in dopis.zgradi().paragraphs if o.text.strip()]
    assert slogi[0] == "S59DGO meta"
    assert slogi[1] == "S59DGO naslovnik"
    assert "S59DGO zadeva" in slogi


def test_zadeva_je_oznacena():
    zadeva = [o for o in dopis.zgradi().paragraphs if o.style.name == "S59DGO zadeva"][0]
    assert zadeva.text.startswith("ZADEVA:")


def test_podpisni_blok():
    besedilo = "\n".join(o.text for o in dopis.zgradi().paragraphs)
    assert podatki.PODPISNIK["ime"] in besedilo
    assert podatki.PODPISNIK["funkcija"] in besedilo
    assert podatki.PODPISNIK["epota"] in besedilo


def test_podpisna_crta_je_siroka_55_mm():
    crte = [
        o for o in dopis.zgradi().paragraphs
        if o.paragraph_format.right_indent == Mm(110)
    ]
    assert len(crte) == 1


def test_primer_je_izpolnjen():
    besedilo = "\n".join(o.text for o in dopis.zgradi(primer=True).paragraphs)
    assert "»" not in besedilo, "primer ne sme vsebovati praznih polj"
    assert "Občina Ilirska Bistrica" in besedilo


def test_dopis_ima_pozdrav():
    besedilo = "\n".join(o.text for o in dopis.zgradi().paragraphs)
    assert "73" in besedilo, "radioamaterski pozdrav"
```

- [ ] **Step 2: Poženi test in preveri, da pade**

Run: `bin/dokumenti.sh --test`
Expected: FAIL, `ModuleNotFoundError: No module named 'dopis'`

- [ ] **Step 3: Napiši `bin/dokumenti/dopis.py`**

```python
"""Predloga uradnega dopisa društva."""
from docx.shared import Mm, Pt

import deli
import podatki
import pomocniki
import slog

IME = "S59DGO-dopis"

VZOREC_NASLOVNIK = ("Občina Ilirska Bistrica", "Bazoviška cesta 14", "6250 Ilirska Bistrica")
VZOREC_ZADEVA = "Vloga za sofinanciranje obnove klubskih antenskih naprav na Snežniku"
VZOREC_ODSTAVKA = (
    "Radio klub Snežnik Ilirska Bistrica od leta 1964 vzdržuje radioamatersko "
    "dejavnost na območju Ilirske Bistrice in upravlja klubske naprave na Snežniku, "
    "ki so v uporabi tudi ob intervencijah in zvezah v sili.",
    "Antenski sistem je po zimi poškodovan. Za obnovo potrebujemo 4.800 EUR, od tega "
    "društvo zagotavlja polovico iz članarine in prostovoljnega dela. Ponudbe in "
    "fotografije stanja so priložene tej vlogi.",
)


def _polje_ali(primer, vrednost, oznaka):
    return vrednost if primer else podatki.polje(oznaka)


def zgradi(primer=False):
    dok = deli.nov_dokument()

    meta = dok.add_paragraph(style="S59DGO meta")
    datum = _polje_ali(primer, "13. 9. 2026", "datum")
    stevilka = _polje_ali(primer, "04/2026-003", "03/2026-001")
    meta.add_run(f"Ilirska Bistrica, {datum}\tŠt.: {stevilka}")

    naslovnik = (
        VZOREC_NASLOVNIK
        if primer
        else tuple(
            podatki.polje(o)
            for o in ("Naziv prejemnika", "Ulica in hišna številka", "Poštna številka in kraj")
        )
    )
    for zaporedna, vrstica in enumerate(naslovnik):
        odstavek = dok.add_paragraph(style="S59DGO naslovnik")
        run = odstavek.add_run(vrstica)
        if zaporedna == 0:
            run.font.color.rgb = slog.barva("besedilo")

    zadeva = dok.add_paragraph(style="S59DGO zadeva")
    oznaka = zadeva.add_run("ZADEVA: ")
    oznaka.font.color.rgb = slog.barva("tiho")
    pomocniki.razmik_znakov(oznaka, 0.6)
    zadeva.add_run(_polje_ali(primer, VZOREC_ZADEVA, "Predmet dopisa"))

    if primer:
        odstavki = VZOREC_ODSTAVKA
    else:
        odstavki = (podatki.polje("Prvi odstavek"), podatki.polje("Drugi odstavek"))
    for besedilo in odstavki:
        dok.add_paragraph(besedilo, style="S59DGO telo")

    pozdrav = dok.add_paragraph("Lep pozdrav in 73!", style="S59DGO telo")
    pozdrav.paragraph_format.space_after = Pt(24)

    crta = dok.add_paragraph(style="S59DGO telo")
    crta.paragraph_format.right_indent = Mm(110)
    crta.paragraph_format.space_after = Pt(2)
    pomocniki.crta_pod(crta, podatki.BARVE["tiho"], 4)

    ime = dok.add_paragraph(style="S59DGO telo")
    ime.paragraph_format.space_after = Pt(0)
    ime.add_run(podatki.PODPISNIK["ime"]).bold = True
    for vrstica in (podatki.PODPISNIK["funkcija"], podatki.PODPISNIK["epota"]):
        odstavek = dok.add_paragraph(vrstica, style="S59DGO naslovnik")
        odstavek.paragraph_format.space_after = Pt(0)

    priloge = dok.add_paragraph(style="S59DGO telo")
    priloge.paragraph_format.space_before = Pt(18)
    priloge.add_run("Priloge: ").bold = True
    priloge.add_run(_polje_ali(primer, "ponudbi dveh izvajalcev, fotografije stanja", "seznam prilog"))

    return dok
```

- [ ] **Step 4: Poženi test**

Run: `bin/dokumenti.sh --test`
Expected: vsi testi PASS.

- [ ] **Step 5: Commit**

```bash
git add bin/dokumenti/dopis.py bin/dokumenti/test_dopis.py
git commit -m "Dokumenti: predloga dopisa"
```

---

### Task 8: Predloga zapisnika

**Files:**
- Create: `bin/dokumenti/zapisnik.py`
- Test: `bin/dokumenti/test_zapisnik.py`

**Interfaces:**
- Consumes: `deli.nov_dokument`, `pomocniki.crta_levo`, `pomocniki.brez_obrob`, `podatki.polje`
- Produces: `IME = "S59DGO-zapisnik"`, `zgradi(primer=False) -> docx.Document`

- [ ] **Step 1: Napiši test**

`bin/dokumenti/test_zapisnik.py`:

```python
"""Zapisnik ima podatke seje, dnevni red, sklepe in tri podpise."""
from docx.oxml.ns import qn

import podatki
import zapisnik


def test_ime_predloge():
    assert zapisnik.IME == "S59DGO-zapisnik"


def test_naslov_je_v_slogu_naslov():
    dok = zapisnik.zgradi()
    naslovi = [o for o in dok.paragraphs if o.style.name == "S59DGO naslov"]
    assert naslovi and "ZAPISNIK" in naslovi[0].text.upper()


def test_tabela_podatkov_seje():
    tabela = zapisnik.zgradi().tables[0]
    oznake = [tabela.cell(v, 0).text for v in range(len(tabela.rows))]
    for pricakovana in ("Datum", "Kraj", "Začetek", "Konec", "Prisotni", "Opravičeno odsotni"):
        assert pricakovana in oznake, pricakovana


def test_dnevni_red_je_ostevilcen():
    besedilo = "\n".join(o.text for o in zapisnik.zgradi().paragraphs)
    assert "DNEVNI RED" in besedilo
    assert "1. " in besedilo


def test_sklep_ima_oranzno_obrobo():
    dok = zapisnik.zgradi()
    sklepi = [o for o in dok.paragraphs if o.style.name == "S59DGO sklep"]
    assert sklepi, "vsaj en vzorčni sklep"
    obroba = sklepi[0]._p.pPr.find(qn("w:pBdr")).find(qn("w:left"))
    assert obroba.get(qn("w:color")) == podatki.BARVE["poudarek"]
    assert sklepi[0].text.startswith("SKLEP")


def test_trije_podpisi():
    tabela = zapisnik.zgradi().tables[-1]
    assert len(tabela.columns) == 3
    besedilo = " ".join(c.text for c in tabela.rows[-1].cells)
    assert "zapisnikar" in besedilo
    assert "predsedujoči" in besedilo
    assert "overitelj" in besedilo


def test_primer_je_izpolnjen():
    besedilo = "\n".join(o.text for o in zapisnik.zgradi(primer=True).paragraphs)
    assert "»" not in besedilo
```

- [ ] **Step 2: Poženi test in preveri, da pade**

Run: `bin/dokumenti.sh --test`
Expected: FAIL, `ModuleNotFoundError: No module named 'zapisnik'`

- [ ] **Step 3: Napiši `bin/dokumenti/zapisnik.py`**

```python
"""Predloga zapisnika seje ali občnega zbora."""
from docx.shared import Mm, Pt

import deli
import podatki
import pomocniki
import slog

IME = "S59DGO-zapisnik"

OZNAKE_SEJE = ("Datum", "Kraj", "Začetek", "Konec", "Prisotni", "Opravičeno odsotni")
VZOREC_SEJE = (
    "sobota, 14. marca 2026",
    "klubski prostori, Bazoviška cesta 19A",
    "17.00",
    "19.15",
    "Ognjen Antonič – S56OA, Marko Kranjc, Ana Horvat",
    "en član",
)
VZOREC_TOCK = (
    "Ugotovitev sklepčnosti in potrditev dnevnega reda",
    "Poročilo o delu v letu 2025",
    "Finančno poročilo in načrt za leto 2026",
    "Obnova klubskih naprav na Snežniku",
    "Razno",
)
VZOREC_SKLEPA = "SKLEP 1/1: Upravni odbor potrjuje poročilo o delu za leto 2025."


def zgradi(primer=False):
    dok = deli.nov_dokument()

    naslov = dok.add_paragraph(style="S59DGO naslov")
    stevilka = "4." if primer else podatki.polje("4.")
    run = naslov.add_run(f"ZAPISNIK {stevilka} SEJE UPRAVNEGA ODBORA")
    pomocniki.razmik_znakov(run, 1.0)

    tabela = dok.add_table(rows=len(OZNAKE_SEJE), cols=2)
    pomocniki.brez_obrob(tabela)
    for vrstica, oznaka in enumerate(OZNAKE_SEJE):
        leva = tabela.cell(vrstica, 0)
        leva.width = Mm(42)
        leva.paragraphs[0].style = "S59DGO naslovnik"
        run = leva.paragraphs[0].add_run(oznaka)
        run.font.color.rgb = slog.barva("tiho")
        desna = tabela.cell(vrstica, 1)
        desna.width = Mm(123)
        desna.paragraphs[0].style = "S59DGO naslovnik"
        desna.paragraphs[0].add_run(
            VZOREC_SEJE[vrstica] if primer else podatki.polje(oznaka.lower())
        )

    dnevni_red = dok.add_paragraph("DNEVNI RED", style="S59DGO podnaslov")
    dnevni_red.paragraph_format.space_before = Pt(18)
    tocke = VZOREC_TOCK if primer else tuple(
        podatki.polje(f"točka {i}") for i in range(1, 4)
    )
    for zaporedna, tocka in enumerate(tocke, start=1):
        dok.add_paragraph(f"{zaporedna}. {tocka}", style="S59DGO telo")

    for zaporedna, tocka in enumerate(tocke, start=1):
        naslov_tocke = dok.add_paragraph(style="S59DGO zadeva")
        naslov_tocke.add_run(f"K {zaporedna}. točki: {tocka}")
        dok.add_paragraph(
            "Razprava in ugotovitve." if primer else podatki.polje("zapis razprave"),
            style="S59DGO telo",
        )
        if zaporedna == 1:
            sklep = dok.add_paragraph(
                VZOREC_SKLEPA if primer else f"SKLEP {podatki.polje('1/1')}: "
                + podatki.polje("besedilo sklepa"),
                style="S59DGO sklep",
            )
            pomocniki.crta_levo(sklep, podatki.BARVE["poudarek"], 16)

    podpisi = dok.add_table(rows=2, cols=3)
    pomocniki.brez_obrob(podpisi)
    for stolpec, vloga in enumerate(("zapisnikar", "predsedujoči", "overitelj zapisnika")):
        crta = podpisi.cell(0, stolpec).paragraphs[0]
        crta.paragraph_format.space_before = Pt(30)
        pomocniki.crta_pod(crta, podatki.BARVE["tiho"], 4)
        vloga_odstavek = podpisi.cell(1, stolpec).paragraphs[0]
        vloga_odstavek.style = "S59DGO naslovnik"
        vloga_odstavek.add_run(vloga)

    return dok
```

- [ ] **Step 4: Poženi test**

Run: `bin/dokumenti.sh --test`
Expected: vsi testi PASS. Če `test_primer_je_izpolnjen` pade zaradi znaka `»` v sklepu, preveri, da veja `primer=True` uporabi `VZOREC_SKLEPA`.

- [ ] **Step 5: Commit**

```bash
git add bin/dokumenti/zapisnik.py bin/dokumenti/test_zapisnik.py
git commit -m "Dokumenti: predloga zapisnika s sklepi in podpisi"
```

---

### Task 9: Predloga vabila z modrim pasom

**Files:**
- Create: `bin/dokumenti/vabilo.py`, `dokumenti/viri/greben-bel.svg`, `dokumenti/viri/greben-bel.png`
- Test: `bin/dokumenti/test_vabilo.py`
- Modify: `bin/dokumenti/test_viri.py` (dodaj beli greben med pričakovane vire)

**Interfaces:**
- Consumes: `deli.nov_dokument`, `pomocniki.zamik_tabele`, `pomocniki.osenci`, `podatki.polje`
- Produces: `IME = "S59DGO-vabilo"`, `zgradi(primer=False) -> docx.Document`, `OZNAKE_DOGODKA = ("Kdaj", "Kje", "Dnevni red", "Prijava")`

- [ ] **Step 1: Zapiši beli greben in ga upodobi**

`dokumenti/viri/greben-bel.svg` je enak `greben.svg`, le `fill` je `#FFFFFF`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 90" width="1440" height="90">
  <path d="M0 90 L0 62 L120 48 L230 60 L340 30 L420 44 L520 18 L610 40 L700 8 L790 36 L880 22 L980 50 L1080 30 L1180 52 L1280 38 L1380 58 L1440 46 L1440 90 Z" fill="#FFFFFF"/>
</svg>
```

Nato: `bin/dokumenti.sh --viri` (skripta upodobi vse `*.svg` v mapi virov).

V `bin/dokumenti/test_viri.py` dopolni `test_vsi_viri_obstajajo` s `"greben-bel.svg"` in `"greben-bel.png"`.

- [ ] **Step 2: Napiši test**

`bin/dokumenti/test_vabilo.py`:

```python
"""Vabilo ima modri pas, podatke dogodka in običajno nogo."""
from docx.oxml.ns import qn
from docx.shared import Mm

import podatki
import vabilo


def test_ime_predloge():
    assert vabilo.IME == "S59DGO-vabilo"


def test_pas_je_moder_in_sega_cez_robove():
    glava = vabilo.zgradi().sections[0].first_page_header
    pas = glava.tables[0]
    senca = pas.cell(0, 0)._tc.tcPr.find(qn("w:shd"))
    assert senca.get(qn("w:fill")) == podatki.BARVE["glava"]
    zamik = int(pas._tbl.tblPr.find(qn("w:tblInd")).get(qn("w:w")))
    assert zamik < 0, "pas mora segati čez levi rob besedila"


def test_pas_ima_emblem_in_beli_greben():
    glava = vabilo.zgradi().sections[0].first_page_header
    slike = [
        d for d in glava.part.related_parts.values() if d.content_type.startswith("image/")
    ]
    assert len(slike) == 2, "emblem in beli greben"


def test_podatki_dogodka():
    tabela = vabilo.zgradi().tables[0]
    oznake = [tabela.cell(v, 0).text for v in range(len(tabela.rows))]
    assert oznake == list(vabilo.OZNAKE_DOGODKA)


def test_noga_ostane_klubska():
    noga = vabilo.zgradi().sections[0].first_page_footer
    besedilo = " ".join(c.text for t in noga.tables for v in t.rows for c in v.cells)
    assert podatki.DRUSTVO["epota"] in besedilo


def test_primer_je_izpolnjen():
    dok = vabilo.zgradi(primer=True)
    besedilo = "\n".join(o.text for o in dok.paragraphs)
    besedilo += " ".join(c.text for t in dok.tables for v in t.rows for c in v.cells)
    assert "»" not in besedilo
    assert "OBČNI ZBOR" in "\n".join(
        o.text for o in dok.sections[0].first_page_header.tables[0].cell(0, 0).paragraphs
    ).upper()
```

- [ ] **Step 3: Poženi test in preveri, da pade**

Run: `bin/dokumenti.sh --test`
Expected: FAIL, `ModuleNotFoundError: No module named 'vabilo'`

- [ ] **Step 4: Napiši `bin/dokumenti/vabilo.py`**

```python
"""Predloga vabila na dogodek društva."""
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Mm, Pt, RGBColor

import deli
import podatki
import pomocniki
import slog

IME = "S59DGO-vabilo"

OZNAKE_DOGODKA = ("Kdaj", "Kje", "Dnevni red", "Prijava")
VZOREC_DOGODKA = (
    "sobota, 14. marca 2026, ob 17.00",
    "klubski prostori, Bazoviška cesta 19A, Ilirska Bistrica",
    "poročila, finančni načrt, volitve upravnega odbora",
    "test@s59dgo.si do 10. marca 2026",
)
BELA = RGBColor(0xFF, 0xFF, 0xFF)


def _pocisti(del_dokumenta):
    for element in list(del_dokumenta._element):
        del_dokumenta._element.remove(element)


def _pas(dok, naslov, podnaslov):
    glava = dok.sections[0].first_page_header
    _pocisti(glava)
    tabela = glava.add_table(rows=1, cols=1, width=Mm(200))
    pomocniki.brez_obrob(tabela)
    pomocniki.zamik_tabele(tabela, -20)
    celica = tabela.cell(0, 0)
    celica.width = Mm(200)
    pomocniki.osenci(celica, podatki.BARVE["glava"])

    emblem = celica.paragraphs[0]
    emblem.alignment = WD_ALIGN_PARAGRAPH.CENTER
    emblem.paragraph_format.space_before = Pt(10)
    emblem.add_run().add_picture(str(podatki.VIRI / "logo-klub.png"), width=Mm(28))

    vrstica = celica.add_paragraph()
    vrstica.alignment = WD_ALIGN_PARAGRAPH.CENTER
    vrstica.paragraph_format.space_before = Pt(8)
    run = vrstica.add_run(naslov)
    run.bold = True
    run.font.size = Pt(20)
    run.font.name = "Arial"
    run.font.color.rgb = BELA

    pod = celica.add_paragraph()
    pod.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = pod.add_run(podnaslov)
    run.font.size = Pt(11)
    run.font.name = "Arial"
    run.font.color.rgb = slog.barva("pas_besedilo")
    pomocniki.razmik_znakov(run, 1.5)

    greben = celica.add_paragraph()
    greben.alignment = WD_ALIGN_PARAGRAPH.CENTER
    greben.paragraph_format.space_before = Pt(8)
    greben.paragraph_format.space_after = Pt(0)
    greben.add_run().add_picture(str(podatki.VIRI / "greben-bel.png"), width=Mm(200))

    glava.add_paragraph()  # Word zahteva odstavek za zadnjo tabelo v glavi


def zgradi(primer=False):
    dok = deli.nov_dokument(z_glavo=False)
    naslov = "OBČNI ZBOR 2026" if primer else podatki.polje("NASLOV DOGODKA")
    _pas(dok, naslov, "Radio klub Snežnik · S59DGO")

    nagovor = "Spoštovani član, vabimo te na redni letni občni zbor društva."
    dok.add_paragraph(
        nagovor if primer else podatki.polje("nagovor"), style="S59DGO telo"
    )

    tabela = dok.add_table(rows=len(OZNAKE_DOGODKA), cols=2)
    pomocniki.brez_obrob(tabela)
    for vrstica, oznaka in enumerate(OZNAKE_DOGODKA):
        leva = tabela.cell(vrstica, 0)
        leva.width = Mm(38)
        leva.paragraphs[0].style = "S59DGO telo"
        run = leva.paragraphs[0].add_run(oznaka)
        run.bold = True
        run.font.color.rgb = slog.barva("glava")
        desna = tabela.cell(vrstica, 1)
        desna.width = Mm(127)
        desna.paragraphs[0].style = "S59DGO telo"
        desna.paragraphs[0].add_run(
            VZOREC_DOGODKA[vrstica] if primer else podatki.polje(oznaka.lower())
        )
        pomocniki.crta_pod(desna.paragraphs[0], podatki.BARVE["crta"], 4)

    zakljucek = (
        "Če se dogodka ne moreš udeležiti, nam to sporoči; za potrditev poročil "
        "potrebujemo sklepčnost."
    )
    odstavek = dok.add_paragraph(
        zakljucek if primer else podatki.polje("zaključno besedilo"), style="S59DGO telo"
    )
    odstavek.paragraph_format.space_before = Pt(12)

    ime = dok.add_paragraph(style="S59DGO telo")
    ime.paragraph_format.space_before = Pt(18)
    ime.paragraph_format.space_after = Pt(0)
    ime.add_run(podatki.PODPISNIK["ime"]).bold = True
    dok.add_paragraph(podatki.PODPISNIK["funkcija"], style="S59DGO naslovnik")

    return dok
```

- [ ] **Step 5: Poženi test**

Run: `bin/dokumenti.sh --test`
Expected: vsi testi PASS. Če `test_pas_ima_emblem_in_beli_greben` našteje več kot dve sliki, preveri, da `zgradi` kliče `deli.nov_dokument(z_glavo=False)` – sicer ostanejo povezave na slike privzete glave.

- [ ] **Step 6: Commit**

```bash
git add bin/dokumenti/vabilo.py bin/dokumenti/test_vabilo.py bin/dokumenti/test_viri.py dokumenti/viri
git commit -m "Dokumenti: predloga vabila z modrim pasom"
```

---

### Task 10: Priznanje v slovenščini in angleščini

**Files:**
- Create: `bin/dokumenti/priznanje.py`
- Test: `bin/dokumenti/test_priznanje.py`

**Interfaces:**
- Consumes: `deli.nov_dokument(lezece=True)`, `pomocniki.okvir_strani`, `pomocniki.obrobe_tabele`
- Produces: `IME = "S59DGO-priznanje"`, `IME_EN = "S59DGO-certificate-en"`, `zgradi(primer=False, jezik="sl") -> docx.Document`, `BESEDILA` (slovar z jezikoma `sl` in `en`)

- [ ] **Step 1: Napiši test**

`bin/dokumenti/test_priznanje.py`:

```python
"""Priznanje je ležeče, v dvojnem okviru in obstaja v obeh jezikih."""
from docx.enum.section import WD_ORIENT
from docx.oxml.ns import qn

import podatki
import priznanje


def test_imeni_predlog():
    assert priznanje.IME == "S59DGO-priznanje"
    assert priznanje.IME_EN == "S59DGO-certificate-en"


def test_lezeca_usmeritev():
    razdelek = priznanje.zgradi().sections[0]
    assert razdelek.orientation == WD_ORIENT.LANDSCAPE
    assert razdelek.page_width > razdelek.page_height


def test_modri_okvir_strani():
    razdelek = priznanje.zgradi().sections[0]
    okvir = razdelek._sectPr.find(qn("w:pgBorders"))
    assert okvir.find(qn("w:top")).get(qn("w:color")) == podatki.BARVE["glava"]


def test_oranzni_notranji_okvir():
    tabela = priznanje.zgradi().tables[0]
    obrobe = tabela._tbl.tblPr.find(qn("w:tblBorders"))
    assert obrobe.find(qn("w:top")).get(qn("w:color")) == podatki.BARVE["poudarek"]


def test_slovensko_besedilo():
    besedilo = "\n".join(o.text for t in priznanje.zgradi().tables for v in t.rows for c in v.cells for o in c.paragraphs)
    assert "PRIZNANJE" in besedilo
    assert "RADIO KLUB SNEŽNIK ILIRSKA BISTRICA" in besedilo.upper()
    assert podatki.PODPISNIK["funkcija"] in besedilo


def test_anglesko_besedilo():
    dok = priznanje.zgradi(jezik="en")
    besedilo = "\n".join(o.text for t in dok.tables for v in t.rows for c in v.cells for o in c.paragraphs)
    assert "CERTIFICATE OF ACHIEVEMENT" in besedilo
    assert "President of the club" in besedilo
    assert "PRIZNANJE" not in besedilo


def test_oba_logotipa():
    dok = priznanje.zgradi()
    slike = [d for d in dok.part.related_parts.values() if d.content_type.startswith("image/")]
    assert len(slike) == 3, "klubski emblem, ZRS in greben"


def test_primer_je_izpolnjen():
    dok = priznanje.zgradi(primer=True)
    besedilo = "\n".join(o.text for t in dok.tables for v in t.rows for c in v.cells for o in c.paragraphs)
    assert "»" not in besedilo
```

- [ ] **Step 2: Poženi test in preveri, da pade**

Run: `bin/dokumenti.sh --test`
Expected: FAIL, `ModuleNotFoundError: No module named 'priznanje'`

- [ ] **Step 3: Napiši `bin/dokumenti/priznanje.py`**

```python
"""Predloga priznanja: ležeča stran z dvojnim okvirom, slovensko in angleško."""
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Mm, Pt

import deli
import podatki
import pomocniki
import slog

IME = "S59DGO-priznanje"
IME_EN = "S59DGO-certificate-en"

BESEDILA = {
    "sl": {
        "klub": "RADIO KLUB SNEŽNIK ILIRSKA BISTRICA",
        "naslov": "PRIZNANJE",
        "polje_ime": "ime in priimek – klicni znak",
        "polje_utemeljitev": "utemeljitev",
        "primer_ime": "Janez Novak – S5xABC",
        "primer_utemeljitev": (
            "za uspešno opravljen tečaj za radioamaterja razreda A in izkazano znanje "
            "na izpitu pri Agenciji za komunikacijska omrežja in storitve."
        ),
        "kraj": "Ilirska Bistrica",
        "primer_datum": "14. 3. 2026",
        "polje_datum": "datum",
        "funkcija": podatki.PODPISNIK["funkcija"],
    },
    "en": {
        "klub": "RADIO CLUB SNEŽNIK ILIRSKA BISTRICA",
        "naslov": "CERTIFICATE OF ACHIEVEMENT",
        "polje_ime": "name – callsign",
        "polje_utemeljitev": "reason",
        "primer_ime": "John Smith – G0ABC",
        "primer_utemeljitev": (
            "for outstanding results in the VHF contest organised by Radio Club "
            "Snežnik Ilirska Bistrica."
        ),
        "kraj": "Ilirska Bistrica, Slovenia",
        "primer_datum": "14 March 2026",
        "polje_datum": "date",
        "funkcija": "President of the club",
    },
}


def _sredinski(celica, besedilo, velikost, barva_ime, krepko=False, razmik=None):
    odstavek = celica.add_paragraph()
    odstavek.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = odstavek.add_run(besedilo)
    run.bold = krepko
    run.font.name = "Arial"
    run.font.size = Pt(velikost)
    run.font.color.rgb = slog.barva(barva_ime)
    if razmik:
        pomocniki.razmik_znakov(run, razmik)
    return odstavek


def zgradi(primer=False, jezik="sl"):
    besedila = BESEDILA[jezik]
    dok = deli.nov_dokument(lezece=True)
    pomocniki.okvir_strani(dok.sections[0], podatki.BARVE["glava"], 16, 24)

    okvir = dok.add_table(rows=1, cols=1)
    okvir.alignment = WD_TABLE_ALIGNMENT.CENTER
    pomocniki.obrobe_tabele(okvir, podatki.BARVE["poudarek"], 6)
    celica = okvir.cell(0, 0)
    celica.width = Mm(255)
    celica.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    celica.paragraphs[0].paragraph_format.space_before = Pt(18)

    logotipa = celica.paragraphs[0]
    logotipa.add_run().add_picture(str(podatki.VIRI / "logo-klub.png"), width=Mm(26))
    logotipa.add_run("    ")
    logotipa.add_run().add_picture(str(podatki.VIRI / "logo-zrs.png"), width=Mm(20))

    _sredinski(celica, besedila["klub"], 10, "tiho", razmik=1.2)
    naslov = _sredinski(celica, besedila["naslov"], 30, "glava", krepko=True, razmik=3.0)
    naslov.paragraph_format.space_before = Pt(14)

    ime = _sredinski(
        celica,
        besedila["primer_ime"] if primer else podatki.polje(besedila["polje_ime"]),
        20,
        "glava",
    )
    ime.paragraph_format.space_before = Pt(16)
    ime.paragraph_format.left_indent = Mm(60)
    ime.paragraph_format.right_indent = Mm(60)
    pomocniki.crta_pod(ime, podatki.BARVE["tiho"], 4)

    utemeljitev = _sredinski(
        celica,
        besedila["primer_utemeljitev"] if primer else podatki.polje(besedila["polje_utemeljitev"]),
        11,
        "besedilo",
    )
    utemeljitev.paragraph_format.space_before = Pt(10)
    utemeljitev.paragraph_format.left_indent = Mm(45)
    utemeljitev.paragraph_format.right_indent = Mm(45)

    datum = besedila["primer_datum"] if primer else podatki.polje(besedila["polje_datum"])
    podpisi = celica.add_table(rows=2, cols=2, width=Mm(230))
    pomocniki.brez_obrob(podpisi)
    podpisi.cell(0, 0).paragraphs[0].paragraph_format.space_before = Pt(34)
    levo = podpisi.cell(1, 0).paragraphs[0]
    levo.add_run(f"{besedila['kraj']}, {datum}").font.size = Pt(10)
    crta = podpisi.cell(0, 1).paragraphs[0]
    crta.paragraph_format.space_before = Pt(34)
    pomocniki.crta_pod(crta, podatki.BARVE["tiho"], 4)
    desno = podpisi.cell(1, 1).paragraphs[0]
    desno.alignment = WD_ALIGN_PARAGRAPH.CENTER
    desno.add_run(besedila["funkcija"]).font.size = Pt(10)

    greben = celica.add_paragraph()
    greben.alignment = WD_ALIGN_PARAGRAPH.CENTER
    greben.paragraph_format.space_before = Pt(10)
    greben.add_run().add_picture(str(podatki.VIRI / "greben.png"), width=Mm(255))

    return dok
```

- [ ] **Step 4: Poženi test**

Run: `bin/dokumenti.sh --test`
Expected: vsi testi PASS. Če `test_oranzni_notranji_okvir` najde napačno tabelo, preveri, da je okvirna tabela prva v dokumentu (`dok.tables[0]`) in podpisna gnezdena v njej.

- [ ] **Step 5: Commit**

```bash
git add bin/dokumenti/priznanje.py bin/dokumenti/test_priznanje.py
git commit -m "Dokumenti: priznanje v slovenščini in angleščini"
```

---

### Task 11: Generiranje vseh predlog in preverjanje izdelkov

**Files:**
- Create: `bin/dokumenti/generiraj.py`
- Test: `bin/dokumenti/test_generiraj.py`

**Interfaces:**
- Consumes: `dopis.zgradi`, `zapisnik.zgradi`, `vabilo.zgradi`, `priznanje.zgradi`, `pakiranje.nastavi_barvno_temo`, `pakiranje.v_dotx`, `podatki.PREDLOGE`, `podatki.PRIMERI`
- Produces:
  - `PREDLOGE` – seznam trojic `(ime, tvorec, s_primerom)`
  - `zgradi_vse(mapa_predlog=None, mapa_primerov=None) -> list[pathlib.Path]` – vrne poti vseh nastalih datotek
  - `preveri(pot) -> None` – sproži `AssertionError`, če datoteka ni v redu
  - `preveri_vse(poti) -> None`

- [ ] **Step 1: Napiši test**

`bin/dokumenti/test_generiraj.py`:

```python
"""Generiranje naredi vseh pet predlog in štiri primere ter jih preveri."""
import zipfile

import docx

import generiraj
import pakiranje
import podatki


def zgradi_v(tmp_path):
    predloge = tmp_path / "predloge"
    primeri = tmp_path / "primeri"
    predloge.mkdir()
    primeri.mkdir()
    return generiraj.zgradi_vse(predloge, primeri), predloge, primeri


def test_nastanejo_vse_datoteke(tmp_path):
    poti, predloge, primeri = zgradi_v(tmp_path)
    imena = sorted(p.name for p in poti)
    assert imena == sorted(
        [
            "S59DGO-dopis.dotx",
            "S59DGO-zapisnik.dotx",
            "S59DGO-vabilo.dotx",
            "S59DGO-priznanje.dotx",
            "S59DGO-certificate-en.dotx",
            "S59DGO-dopis-primer.docx",
            "S59DGO-zapisnik-primer.docx",
            "S59DGO-vabilo-primer.docx",
            "S59DGO-priznanje-primer.docx",
        ]
    )
    assert len(list(predloge.glob("*.docx"))) == 0, "začasne datoteke morajo biti pobrisane"
    assert len(list(primeri.glob("*.dotx"))) == 0


def test_predloge_so_prave_vrste(tmp_path):
    _, predloge, _ = zgradi_v(tmp_path)
    for pot in predloge.glob("*.dotx"):
        with zipfile.ZipFile(pot) as z:
            assert pakiranje.VRSTA_PREDLOGE in z.read("[Content_Types].xml").decode("utf-8")


def test_barvna_tema_je_vpisana(tmp_path):
    _, predloge, _ = zgradi_v(tmp_path)
    with zipfile.ZipFile(predloge / "S59DGO-dopis.dotx") as z:
        tema = z.read("word/theme/theme1.xml").decode("utf-8")
    assert podatki.BARVE["glava"] in tema


def test_predloge_imajo_polja_primeri_pa_ne(tmp_path):
    _, predloge, primeri = zgradi_v(tmp_path)
    predloga = "\n".join(o.text for o in docx.Document(predloge / "S59DGO-dopis.dotx").paragraphs)
    primer = "\n".join(o.text for o in docx.Document(primeri / "S59DGO-dopis-primer.docx").paragraphs)
    assert "»" in predloga
    assert "»" not in primer


def test_preveri_zazna_staro_domeno(tmp_path):
    poti, _, _ = zgradi_v(tmp_path)
    generiraj.preveri_vse(poti)  # ne sme sprožiti izjeme

    pokvarjena = tmp_path / "pokvarjena.docx"
    dok = docx.Document()
    dok.add_paragraph("info@s59dgo.org")
    dok.save(pokvarjena)
    try:
        generiraj.preveri(pokvarjena)
    except AssertionError as napaka:
        assert "s59dgo.org" in str(napaka)
    else:
        raise AssertionError("preveri() bi morala zavrniti staro domeno")
```

- [ ] **Step 2: Poženi test in preveri, da pade**

Run: `bin/dokumenti.sh --test`
Expected: FAIL, `ModuleNotFoundError: No module named 'generiraj'`

- [ ] **Step 3: Napiši `bin/dokumenti/generiraj.py`**

```python
"""Sestavi vse predloge in primere ter preveri izdelke.

Uporaba: bin/dokumenti.sh
"""
import sys
import zipfile

import docx

import dopis
import pakiranje
import podatki
import priznanje
import vabilo
import zapisnik

PREDLOGE = [
    (dopis.IME, lambda primer: dopis.zgradi(primer=primer), True),
    (zapisnik.IME, lambda primer: zapisnik.zgradi(primer=primer), True),
    (vabilo.IME, lambda primer: vabilo.zgradi(primer=primer), True),
    (priznanje.IME, lambda primer: priznanje.zgradi(primer=primer, jezik="sl"), True),
    (priznanje.IME_EN, lambda primer: priznanje.zgradi(primer=primer, jezik="en"), False),
]


def _besedilo_dokumenta(pot):
    dok = docx.Document(pot)
    deli_besedila = [o.text for o in dok.paragraphs]
    for tabela in dok.tables:
        for vrstica in tabela.rows:
            deli_besedila += [c.text for c in vrstica.cells]
    for razdelek in dok.sections:
        for del_dokumenta in (
            razdelek.header,
            razdelek.first_page_header,
            razdelek.footer,
            razdelek.first_page_footer,
        ):
            deli_besedila += [o.text for o in del_dokumenta.paragraphs]
            for tabela in del_dokumenta.tables:
                for vrstica in tabela.rows:
                    deli_besedila += [c.text for c in vrstica.cells]
    return "\n".join(deli_besedila)


def preveri(pot):
    besedilo = _besedilo_dokumenta(pot)
    assert "s59dgo.org" not in besedilo, f"{pot.name}: stara domena s59dgo.org"
    if pot.suffix == ".dotx":
        with zipfile.ZipFile(pot) as z:
            vrste = z.read("[Content_Types].xml").decode("utf-8")
        assert pakiranje.VRSTA_PREDLOGE in vrste, f"{pot.name}: ni vrste predloge"
        assert "»" in besedilo, f"{pot.name}: predloga nima polj za izpolnjevanje"
    else:
        assert "»" not in besedilo, f"{pot.name}: primer ima neizpolnjena polja"
    if "certificate" not in pot.name and "priznanje" not in pot.name:
        for podatek in ("epota", "splet", "trr", "maticna", "davcna"):
            vrednost = podatki.DRUSTVO[podatek]
            assert vrednost in besedilo, f"{pot.name}: v nogi manjka {vrednost}"


def preveri_vse(poti):
    for pot in poti:
        preveri(pot)


def zgradi_vse(mapa_predlog=None, mapa_primerov=None):
    mapa_predlog = mapa_predlog or podatki.PREDLOGE
    mapa_primerov = mapa_primerov or podatki.PRIMERI
    mapa_predlog.mkdir(parents=True, exist_ok=True)
    mapa_primerov.mkdir(parents=True, exist_ok=True)
    nastale = []

    for ime, tvorec, s_primerom in PREDLOGE:
        zacasna = mapa_predlog / f"{ime}.docx"
        tvorec(False).save(zacasna)
        pakiranje.nastavi_barvno_temo(zacasna)
        nastale.append(pakiranje.v_dotx(zacasna, mapa_predlog / f"{ime}.dotx"))
        zacasna.unlink()

        if s_primerom:
            primer = mapa_primerov / f"{ime}-primer.docx"
            tvorec(True).save(primer)
            pakiranje.nastavi_barvno_temo(primer)
            nastale.append(primer)

    return nastale


def main():
    nastale = zgradi_vse()
    preveri_vse(nastale)
    for pot in nastale:
        print(f"{pot.relative_to(podatki.KOREN)}  ({pot.stat().st_size // 1024} kB)")
    print(f"\nVse v redu: {len(nastale)} datotek.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: Poženi test**

Run: `bin/dokumenti.sh --test`
Expected: vsi testi PASS.

- [ ] **Step 5: Generiraj izdelke**

Run: `bin/dokumenti.sh`
Expected: izpis devetih datotek in vrstica »Vse v redu: 9 datotek.«

- [ ] **Step 6: Commit**

```bash
git add bin/dokumenti/generiraj.py bin/dokumenti/test_generiraj.py dokumenti/predloge dokumenti/primeri
git commit -m "Dokumenti: generiranje vseh predlog in primerov s preverjanjem"
```

---

### Task 12: Vizualni pregled, navodila in dokumentacija

**Files:**
- Create: `dokumenti/README.md`
- Modify: `CLAUDE.md` (razdelka »Ukazi« in »Arhitektura«)
- Test: vizualni pregled PDF predogledov (ročno, opisano spodaj)

**Interfaces:**
- Consumes: `bin/dokumenti.sh --pdf`
- Produces: `dist/dokumenti-pdf/*.pdf` (ni v gitu), `dokumenti/README.md`

- [ ] **Step 1: Naredi PDF predoglede**

Run: `bin/dokumenti.sh --pdf`
Expected: v `dist/dokumenti-pdf/` nastanejo štirje PDF-ji (dopis, zapisnik, vabilo, priznanje).

- [ ] **Step 2: Preglej vsak PDF**

Odpri vsak PDF (orodje Read podpira PDF) in preveri:

- glava: klubski emblem levo, ime kluba v dveh vrsticah, ZRS desno, pod njima greben in oranžna črta;
- besedilo se ne prekriva z glavo in ne teče čez nogo;
- noga: trije stolpci podatkov na svetlo modri podlagi, pod njimi vrstica o registru, e-pošta `test@s59dgo.si`, splet `www.s59dgo.si`;
- vabilo: modri pas sega čez robove besedila, a ne do roba lista; beli greben na dnu pasu;
- priznanje: ležeče, moder okvir strani in oranžni notranji okvir se ne prekrivata, greben na dnu.

Če kaj ne drži, popravi ustrezni modul, poženi `bin/dokumenti.sh --test`, `bin/dokumenti.sh` in ta korak ponovi.

- [ ] **Step 3: Napiši `dokumenti/README.md`**

````markdown
# Dokumentne predloge S59DGO

Wordove predloge društva, oblikovane po spletni temi `s59dgo`: bela glava z
logotipoma kluba in ZRS, greben Snežnika, noga s podatki društva. Pisava je
Arial, zato so dokumenti videti enako na vsakem računalniku.

| Datoteka | Za kaj |
|---|---|
| `predloge/S59DGO-dopis.dotx` | uradni dopisi, vloge, dopisi ustanovam |
| `predloge/S59DGO-zapisnik.dotx` | zapisniki sej in občnih zborov |
| `predloge/S59DGO-vabilo.dotx` | vabila na dogodke in obvestila članom |
| `predloge/S59DGO-priznanje.dotx` | priznanja in potrdila (ležeče) |
| `predloge/S59DGO-certificate-en.dotx` | isto priznanje v angleščini |
| `primeri/` | izpolnjeni primeri, da se vidi, kako naj bo videti |

## Namestitev

Predlogo lahko uporabiš tudi brez namestitve: **dvoklik na `.dotx`** odpre nov,
neimenovan dokument; izvirnik ostane nedotaknjen.

Za stalno rabo skopiraj vse `.dotx` v mapo predlog:

- **macOS:** `~/Library/Group Containers/UBF8T346G9.Office/User Content/Templates`
- **Windows:** `%APPDATA%\Microsoft\Templates`

Nato v Wordu: Datoteka → Novo iz predloge → Osebne.

## Uporaba

Mesta za izpolnjevanje so zapisana v obliki »Naziv prejemnika«. Označi besedilo
skupaj z narekovaji in piši čez.

Shranjuj po dogovoru: `LLLLMMDD_KratekOpis.docx`, na primer
`20260314_ZapisnikObcniZbor.docx`. Številka dokumenta je v obliki `04/2026-003`.

## Popravek podatkov

Vsi podatki društva so v `bin/dokumenti/podatki.py`. Po popravku:

```bash
bin/dokumenti.sh --test   # testi
bin/dokumenti.sh          # ponovno generiranje predlog in primerov
bin/dokumenti.sh --pdf    # neobvezno: PDF predogledi v dist/dokumenti-pdf
```

Logotipa in greben so v `viri/`; greben se upodobi iz SVG z `bin/dokumenti.sh --viri`.
````

- [ ] **Step 4: Dopolni `CLAUDE.md`**

V razdelek »Ukazi« dodaj za vrstico `bin/grafika-referenca.sh`:

```
bin/dokumenti.sh     # Wordove predloge društva v dokumenti/ (--test, --viri, --pdf)
```

V razdelek »Arhitektura« dodaj odstavek:

```
- **Dokumentne predloge** (`dokumenti/`) so ločen sklop: `bin/dokumenti.sh` s
  `python-docx` v Dockerju sestavi `.dotx` predloge in `.docx` primere iz
  modulov v `bin/dokumenti/`. Podatki društva so samo v
  `bin/dokumenti/podatki.py`, barve in greben pa so prepisani iz teme, da sta
  papir in splet skladna. Dizajn: `docs/superpowers/specs/2026-09-13-s59dgo-dokumentne-predloge-design.md`.
```

- [ ] **Step 5: Zadnji pregled celote**

```bash
bin/dokumenti.sh --test
bin/dokumenti.sh
git status --short
```

Expected: vsi testi PASS, devet datotek, v `git status` samo pričakovane spremembe.

- [ ] **Step 6: Commit**

```bash
git add dokumenti/README.md CLAUDE.md dokumenti/predloge dokumenti/primeri
git commit -m "Dokumenti: navodila za uporabo predlog in zapis v CLAUDE.md"
```

---

## Po koncu

Predaja naročniku: `dokumenti/predloge/*.dotx` in `dokumenti/primeri/*.docx`,
po želji skupaj s PDF predogledi iz `dist/dokumenti-pdf/`. Mapa
`trenutni_logotipi/` ostane kot arhiv in se ne uporablja več; stari dopis z
nogo podjetja GE, d.o.o. se opusti.
