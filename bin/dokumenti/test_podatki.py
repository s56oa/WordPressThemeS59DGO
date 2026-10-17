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
        "besedilo_2": "46586C",
    }


def test_poti_kazejo_na_repozitorij():
    assert podatki.VIRI.is_dir()
    assert podatki.VIRI.name == "viri"
    assert podatki.PREDLOGE.name == "predloge"
    assert podatki.PRIMERI.name == "primeri"


def test_polje_ali_primer_vrne_vrednost():
    assert podatki.polje_ali(True, "13. 9. 2026", "datum") == "13. 9. 2026"


def test_polje_ali_predloga_vrne_polje():
    assert podatki.polje_ali(False, "13. 9. 2026", "datum") == podatki.polje("datum")
