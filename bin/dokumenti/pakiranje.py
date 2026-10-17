"""Posegi v zip paket dokumenta: barvna tema in pretvorba v predlogo."""
import pathlib
import re
import shutil
import tempfile
import zipfile

import docx

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

# Fiksen čas za vse zapise v zip paketu (epoha ZIP formata, najstarejši
# veljavni w:date_time), da je generiranje ponovljivo: brez tega
# zipfile.writestr vsakemu delu zapiše trenutni čas, zato bi vsak ponovni
# tek prepisal vseh devet binarnih datotek, čeprav se vsebina ni spremenila.
CAS_ZAPISA = (1980, 1, 1, 0, 0, 0)


def _predelaj_zip(pot, ime_dela, predelava):
    with zipfile.ZipFile(pot) as stari:
        vsebine = {i.filename: stari.read(i.filename) for i in stari.infolist()}
        stiskanja = {i.filename: i.compress_type for i in stari.infolist()}
        zunanji_atributi = {i.filename: i.external_attr for i in stari.infolist()}
        vrstni_red = [i.filename for i in stari.infolist()]
    vsebine[ime_dela] = predelava(vsebine[ime_dela].decode("utf-8")).encode("utf-8")
    with zipfile.ZipFile(pot, "w", zipfile.ZIP_DEFLATED) as novi:
        for ime in vrstni_red:
            info = zipfile.ZipInfo(ime, date_time=CAS_ZAPISA)
            info.compress_type = stiskanja[ime]
            info.external_attr = zunanji_atributi[ime]
            novi.writestr(info, vsebine[ime])


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


def odpri(pot):
    """python-docx odpre samo vrsto dokumenta, ne predloge."""
    pot = pathlib.Path(pot)
    if pot.suffix.lower() != ".dotx":
        return docx.Document(str(pot))
    with tempfile.TemporaryDirectory() as zacasna_mapa:
        zacasna_pot = pathlib.Path(zacasna_mapa) / pot.name
        shutil.copyfile(pot, zacasna_pot)
        _predelaj_zip(
            zacasna_pot,
            "[Content_Types].xml",
            lambda vrste: vrste.replace(VRSTA_PREDLOGE, VRSTA_DOKUMENTA),
        )
        return docx.Document(str(zacasna_pot))
