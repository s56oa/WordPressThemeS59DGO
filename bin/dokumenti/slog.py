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


# Velikost in barva noge: v isti vrednosti potrebuje tudi deli.py, ki jih
# zapiše kot neposredno oblikovanje na runu (glej _odstavek_noge tam za
# razlog), zato sta tu imenovani konstanti in ne dve ločeni trditvi iste
# številke/barve.
VELIKOST_NOGE = Pt(7.5)
BARVA_NOGE = barva("besedilo_2")


def _nastavi_pisave(rPr):
    """Arial zapiše v vse štiri w:rFonts atribute danega rPr."""
    rFonts = rPr.get_or_add_rFonts()
    for atribut in ("w:ascii", "w:hAnsi", "w:eastAsia", "w:cs"):
        rFonts.set(qn(atribut), "Arial")


def _arial(slog_dokumenta):
    """Arial nastavi za vse štiri skripte, sicer Word zamenja pisavo."""
    _nastavi_pisave(slog_dokumenta.element.get_or_add_rPr())


def pisava_arial(run):
    """Arial nastavi na vseh štirih w:rFonts atributih runa, ne le na ascii/hAnsi."""
    _nastavi_pisave(run._r.get_or_add_rPr())


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

    meta = _nov(dok, "S59DGO meta", 10, "besedilo_2")
    meta.paragraph_format.space_after = Pt(12)
    meta.paragraph_format.tab_stops.add_tab_stop(Mm(165), WD_TAB_ALIGNMENT.RIGHT)

    naslovnik = _nov(dok, "S59DGO naslovnik", 11, "besedilo_2")
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

    noga = _nov(dok, "S59DGO noga", VELIKOST_NOGE.pt, "besedilo_2")
    noga.paragraph_format.space_after = Pt(0)
