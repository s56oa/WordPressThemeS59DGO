"""Sestavi vse predloge in primere ter preveri izdelke.

Uporaba: bin/dokumenti.sh
"""
import re
import sys
import zipfile

import dopis
import pakiranje
import podatki
import priznanje
import vabilo
import zapisnik

# (ime, tvorec, s_primerom, ima_nogo, stevilo_slik)
#   ima_nogo: predloga ima nogo s podatki društva (vse razen priznanja, ki je
#     ležeče in noge nima – glej deli.nov_dokument).
#   stevilo_slik: število slik v paketu (klubski emblem + ZRS + greben v
#     glavi za dopis/zapisnik/priznanje; brez ZRS logotipa v pasu vabila).
PREDLOGE = [
    (dopis.IME, lambda primer: dopis.zgradi(primer=primer), True, True, 3),
    (zapisnik.IME, lambda primer: zapisnik.zgradi(primer=primer), True, True, 3),
    (vabilo.IME, lambda primer: vabilo.zgradi(primer=primer), True, True, 2),
    (priznanje.IME, lambda primer: priznanje.zgradi(primer=primer, jezik="sl"), True, False, 3),
    (priznanje.IME_EN, lambda primer: priznanje.zgradi(primer=primer, jezik="en"), False, False, 3),
]

# Vsaj tri popolne pare »…« mora imeti vsaka predloga (polja za izpolnjevanje);
# šteje pare, ne le prisotnost enega samega narekovaja, ki bi ga zavajal
# osamljen odpiralni narekovaj brez zaključka.
POLJE_PAR = re.compile(r"»[^»«]+«")


def _besedilo_dokumenta(pot):
    dok = pakiranje.odpri(pot)
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


def _stevilo_slik(pot):
    """Šteje slikovne dele paketa (word/media/…).

    Neodvisno od tega, ali so slike v glavi (dopis, zapisnik, vabilo) ali v
    telesu strani (ležeče priznanje, ki glave sploh ne uporablja).
    """
    with zipfile.ZipFile(pot) as z:
        return sum(1 for ime in z.namelist() if ime.startswith("word/media/"))


def preveri(pot, ima_nogo=True, stevilo_slik=3):
    besedilo = _besedilo_dokumenta(pot)
    assert "s59dgo.org" not in besedilo, f"{pot.name}: stara domena s59dgo.org"

    dok = pakiranje.odpri(pot)
    assert len(dok.sections) == 1, (
        f"{pot.name}: pričakovan 1 razdelek, najdenih {len(dok.sections)}"
    )

    slike = _stevilo_slik(pot)
    assert slike == stevilo_slik, (
        f"{pot.name}: pričakovanih {stevilo_slik} slik, najdenih {slike}"
    )

    if pot.suffix == ".dotx":
        with zipfile.ZipFile(pot) as z:
            vrste = z.read("[Content_Types].xml").decode("utf-8")
        assert pakiranje.VRSTA_PREDLOGE in vrste, f"{pot.name}: ni vrste predloge"
        stevilo_polj = len(POLJE_PAR.findall(besedilo))
        assert stevilo_polj >= 3, (
            f"{pot.name}: premalo polj za izpolnjevanje (najdenih {stevilo_polj} parov »…«)"
        )
    else:
        assert "»" not in besedilo, f"{pot.name}: primer ima neizpolnjena polja"

    if ima_nogo:
        for podatek in ("epota", "splet", "trr", "maticna", "davcna"):
            vrednost = podatki.DRUSTVO[podatek]
            assert vrednost in besedilo, f"{pot.name}: v nogi manjka {vrednost}"


def zgradi_vse(mapa_predlog=None, mapa_primerov=None):
    mapa_predlog = mapa_predlog or podatki.PREDLOGE
    mapa_primerov = mapa_primerov or podatki.PRIMERI
    mapa_predlog.mkdir(parents=True, exist_ok=True)
    mapa_primerov.mkdir(parents=True, exist_ok=True)
    nastale = []

    for ime, tvorec, s_primerom, ima_nogo, stevilo_slik in PREDLOGE:
        zacasna = mapa_predlog / f"{ime}.docx"
        tvorec(False).save(zacasna)
        pakiranje.nastavi_barvno_temo(zacasna)
        dotx = pakiranje.v_dotx(zacasna, mapa_predlog / f"{ime}.dotx")
        zacasna.unlink()
        preveri(dotx, ima_nogo=ima_nogo, stevilo_slik=stevilo_slik)
        nastale.append(dotx)

        if s_primerom:
            primer = mapa_primerov / f"{ime}-primer.docx"
            tvorec(True).save(primer)
            pakiranje.nastavi_barvno_temo(primer)
            preveri(primer, ima_nogo=ima_nogo, stevilo_slik=stevilo_slik)
            nastale.append(primer)

    return nastale


def main():
    nastale = zgradi_vse()
    for pot in nastale:
        print(f"{pot.relative_to(podatki.KOREN)}  ({pot.stat().st_size // 1024} kB)")
    print(f"\nVse v redu: {len(nastale)} datotek.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
