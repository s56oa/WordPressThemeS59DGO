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
    "besedilo_2": "46586C",
}

KLUB_VRSTICI = ("RADIO KLUB SNEŽNIK", "ILIRSKA BISTRICA")
KLUB_OZNAKA = "S59DGO · ČLAN ZRS"


def polje(besedilo):
    """Mesto za izpolnjevanje, npr. polje('Naziv prejemnika') -> »Naziv prejemnika«."""
    return f"»{besedilo}«"


def polje_ali(primer, vrednost, oznaka):
    """Za primer=True vrne vrednost, sicer polje(oznaka) za izpolnjevanje."""
    return vrednost if primer else polje(oznaka)
