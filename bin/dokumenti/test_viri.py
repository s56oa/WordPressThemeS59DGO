"""Preveri, da so viri za dokumente na mestu in v pričakovanih mejah."""
import pathlib
import re
import struct

VIRI = pathlib.Path(__file__).resolve().parents[2] / "dokumenti" / "viri"
TEMA = pathlib.Path(__file__).resolve().parents[2] / "s59dgo" / "template-parts" / "trak.php"

ISKANJE_D = re.compile(r'\bd="([^"]+)"')


def _pot_grebena(besedilo):
    """Prvi w:d/svg d atribut v besedilu – greben je pri vseh treh vedno prva pot."""
    najdba = ISKANJE_D.search(besedilo)
    assert najdba, "d atribut ni najden"
    return najdba.group(1)


def velikost_png(pot):
    glava = pot.read_bytes()[:24]
    assert glava[:8] == b"\x89PNG\r\n\x1a\n", f"{pot.name} ni PNG"
    return struct.unpack(">II", glava[16:24])


def test_vsi_viri_obstajajo():
    for ime in (
        "logo-klub.png",
        "logo-zrs.png",
        "greben.svg",
        "greben.png",
        "greben-bel.svg",
        "greben-bel.png",
    ):
        assert (VIRI / ime).is_file(), f"manjka {ime}"


def test_logotipa_nista_prevelika():
    for ime in ("logo-klub.png", "logo-zrs.png"):
        sirina, visina = velikost_png(VIRI / ime)
        assert max(sirina, visina) <= 600, f"{ime} je prevelik: {sirina}x{visina}"


def test_logo_kluba_ni_prevelik_v_bajtih():
    # logo-klub.png je bil nekomprimiran 575 kB (pri istih piksel merah);
    # meja s prostorom nad stisnjenimi 168 kB prepreči, da bi nesitisnjena
    # zamenjava spet napihnila vseh devet izdelkov.
    velikost = (VIRI / "logo-klub.png").stat().st_size
    assert velikost <= 250_000, f"logo-klub.png je prevelik: {velikost} B"


def test_greben_je_sirok_trak():
    sirina, visina = velikost_png(VIRI / "greben.png")
    assert sirina == 1600
    assert visina == 100, "greben.png mora ohraniti razmerje 1440:90"


def test_greben_svg_ima_barvo_teme():
    besedilo = (VIRI / "greben.svg").read_text(encoding="utf-8")
    assert "#CFE0F0" in besedilo


def test_greben_bel_svg_ima_belo_barvo():
    besedilo = (VIRI / "greben-bel.svg").read_text(encoding="utf-8")
    assert "#FFFFFF" in besedilo


def test_pot_grebena_je_enaka_na_vseh_treh_mestih():
    # Pot grebena je podvojena na treh mestih (dokumenti/viri/greben.svg,
    # greben-bel.svg in s59dgo/template-parts/trak.php, od koder naj bi bila
    # po specu prevzeta) brez ničesar, kar bi jih vezalo skupaj – ta test
    # uveljavi trditev iz speca, namesto da ostane le trditev.
    d_greben = _pot_grebena((VIRI / "greben.svg").read_text(encoding="utf-8"))
    d_greben_bel = _pot_grebena((VIRI / "greben-bel.svg").read_text(encoding="utf-8"))
    d_trak = _pot_grebena(TEMA.read_text(encoding="utf-8"))
    assert d_greben == d_greben_bel == d_trak
