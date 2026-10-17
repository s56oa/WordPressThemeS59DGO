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


def test_crta_pod_in_crta_levo_sobivata():
    dok = docx.Document()
    odstavek = dok.add_paragraph("sklep")
    pomocniki.crta_pod(odstavek, "D3DFEB", 4)
    pomocniki.crta_levo(odstavek, "D9702A", 16)
    pBdr_vsi = odstavek._p.pPr.findall(qn("w:pBdr"))
    assert len(pBdr_vsi) == 1
    pBdr = pBdr_vsi[0]
    spodaj = pBdr.find(qn("w:bottom"))
    levo = pBdr.find(qn("w:left"))
    assert spodaj is not None and spodaj.get(qn("w:color")) == "D3DFEB"
    assert levo is not None and levo.get(qn("w:color")) == "D9702A"


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
    # w:space je edini vzvod za razmik med zunanjim okvirom in robom papirja;
    # OOXML ga omeji na 31 pik, zato 3 mm iz specifikacije niso dosegljivi
    # (glej popravek v spec §5.4) – ta test je slepa pega, skozi katero je
    # šla ugotovitev.
    assert okvir.find(qn("w:top")).get(qn("w:space")) == "24"


def test_obrobe_tabele():
    dok = docx.Document()
    tabela = dok.add_table(rows=2, cols=2)
    pomocniki.obrobe_tabele(tabela, "D3DFEB", 4)
    obrobe = tabela._tbl.tblPr.find(qn("w:tblBorders"))
    assert obrobe.find(qn("w:insideH")).get(qn("w:color")) == "D3DFEB"
