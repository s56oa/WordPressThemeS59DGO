"""Že generirani in v git commitani izdelki morajo odsevati trenutne podatke.

Testi v tem modulu ne gradijo ničesar v začasno mapo (kot generiraj.zgradi_vse
za druge teste) – odprejo devet datotek, ki dejansko ležijo v
`dokumenti/predloge/` in `dokumenti/primeri/`. To je edini test, ki bi ujel
primer, ko nekdo popravi `podatki.py` in pozabi pognati `bin/dokumenti.sh`:
brez tega testa bi commit pustil zastarele binarne datoteke, testni izpis pa
bi bil kljub temu zelen.
"""
import generiraj
import pakiranje
import podatki

SPOROCILO = (
    "{ime}: ne vsebuje trenutnega {kaj} – izdelke je treba na novo "
    "generirati z bin/dokumenti.sh in commitati spremembe v dokumenti/"
)

PREDLOGE_DOTX = sorted(podatki.PREDLOGE.glob("*.dotx"))
PRIMERI_DOCX = sorted(podatki.PRIMERI.glob("*.docx"))
VSI_IZDELKI = PREDLOGE_DOTX + PRIMERI_DOCX

# Priznanje je ležeče in glave (deli.dodaj_glavo) sploh ne uporablja, zato
# nima niti noge (deli.dodaj_nogo se pokliče samo, če stran ni ležeča) – ti
# trije izdelki torej ne morejo vsebovati podatkov društva iz noge.
BREZ_NOGE = {
    "S59DGO-priznanje.dotx",
    "S59DGO-certificate-en.dotx",
    "S59DGO-priznanje-primer.docx",
}

# Ime podpisnika (podatki.PODPISNIK["ime"]) je v izvorni kodi statično
# besedilo samo v dopisu in vabilu (dopis.py, vabilo.py); zapisnik navaja v
# podpisnem bloku le vloge (zapisnikar/predsedujoči/overitelj), priznanje pa
# le funkcijo (BESEDILA[…]["funkcija"]), nikoli imena. Preverjanje imena je
# zato omejeno na dokumente, ki ga dejansko izpišejo.
IMA_IME_PODPISNIKA = {
    "S59DGO-dopis.dotx",
    "S59DGO-dopis-primer.docx",
    "S59DGO-vabilo.dotx",
    "S59DGO-vabilo-primer.docx",
}


def test_obstaja_vseh_devet_izdelkov():
    assert len(PREDLOGE_DOTX) == 5, sorted(p.name for p in PREDLOGE_DOTX)
    assert len(PRIMERI_DOCX) == 4, sorted(p.name for p in PRIMERI_DOCX)


def test_izdelki_se_odprejo_s_python_docx():
    for pot in VSI_IZDELKI:
        assert pakiranje.odpri(pot).paragraphs is not None, pot.name


def test_izdelki_vsebujejo_trenutne_kontaktne_podatke_drustva():
    for pot in VSI_IZDELKI:
        if pot.name in BREZ_NOGE:
            continue
        besedilo = generiraj._besedilo_dokumenta(pot)
        for kljuc in ("epota", "splet", "trr"):
            vrednost = podatki.DRUSTVO[kljuc]
            assert vrednost in besedilo, SPOROCILO.format(ime=pot.name, kaj=f"podatka {kljuc}")


def test_izdelki_vsebujejo_trenutno_ime_podpisnika():
    for pot in VSI_IZDELKI:
        if pot.name not in IMA_IME_PODPISNIKA:
            continue
        besedilo = generiraj._besedilo_dokumenta(pot)
        assert podatki.PODPISNIK["ime"] in besedilo, SPOROCILO.format(
            ime=pot.name, kaj="imena podpisnika"
        )
