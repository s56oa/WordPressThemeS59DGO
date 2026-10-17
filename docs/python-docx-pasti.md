# Pasti python-docx (izkušnje iz dokumentnih predlog)

Zapisano ob izdelavi `dokumenti/` (september 2026, `python-docx==1.1.2`). Vsaka
točka je napaka, na katero smo dejansko naleteli; večino zdaj lovi kakšen test v
`bin/dokumenti/`.

## Knjižnica

- **`.dotx` se z `docx.Document()` ne odpre.** Knjižnica sprejme samo vrsto
  vsebine dokumenta, ne predloge, in nima konstante za predlogo. Za branje
  predloge uporabi `pakiranje.odpri(pot)`, ki naredi začasno kopijo z vrnjeno
  vrsto dokumenta. Vrste vsebine v izdelku ne slabi — `.dotx` mora ostati prava
  predloga.
- **Mere se ob branju zaokrožijo na twipe.** `Mm(25)` zapisano v `w:ind`,
  `w:tab` ali robove strani se prebere nazaj kot druga vrednost v EMU, zato
  `razdelek.left_margin == Mm(25)` ne drži. V testih primerjaj `.twips`;
  v izvedbi še naprej piši `Mm(...)`. `Pt(...)` je točen.
- **`run.font.name` zapiše samo `w:ascii` in `w:hAnsi`.** Word zato za šumnike
  lahko vzame drugo pisavo. Uporabi `slog.pisava_arial(run)`, ki nastavi vse
  štiri atribute `w:rFonts` (tudi `w:eastAsia` in `w:cs`).
- **`_Cell.add_table()` ne sprejme `width`** in **gnezdene tabele se ne
  pojavijo v `dok.tables`.** Če potrebuješ postavitev v dveh stolpcih znotraj
  celice, je tabulator z obrobo preprostejši in bolje testljiv (glej
  `priznanje._vrstica_podpisa`).
- **Odstavek ima en sam `w:pBdr`.** Kdor ga zamenja, izbriše druge robove;
  `pomocniki.crta_pod` in `crta_levo` zato spreminjata samo svojo stran in
  ohranita vrstni red otrok (`top, left, bottom, right, between, bar`).
- **`zipfile.writestr` vpiše trenutni čas**, zato je vsak izdelek drugačen,
  tudi če se vsebina ni spremenila. `pakiranje._predelaj_zip` piše prek
  `ZipInfo` s fiksnim časom, da je generiranje ponovljivo in git ne raste po
  nepotrebnem.
- **Vgrajena slika nosi izvorno težo**, ne glede na to, kako majhna je na
  strani. Logotip pri 22 mm je tehtal 575 kB; po stiskanju 168 kB, datoteke so
  se razpolovile. Test `test_viri.py` zdaj pripenja tudi bajte, ne le piksle.

## Word in OOXML

- **`different_first_page_header_footer` nastavi pred polnjenjem glave**, sicer
  slike pristanejo v napačnem delu dokumenta.
- **Za zadnjo tabelo v glavi mora biti odstavek**, sicer Word datoteke ne odpre.
- **Obroba strani (`w:pgBorders`) ima `w:space` omejen na 31 pik** (≈11 mm od
  roba papirja). Večjega odmika ni mogoče doseči — spec je bilo treba popraviti,
  ne kode.
- **Tabela brez `w:tblLayout fixed`** pusti širino Wordovemu samodejnemu
  prilagajanju; kjer je širina del videza (okvir priznanja), jo pribij.

## LibreOffice ni Word

`bin/dokumenti.sh --pdf` upodobi predoglede z LibreOffice, kar je dovolj za
postavitev, ne pa za končno presojo:

- izrecen `space_after` na odstavku z obrobo nad nogo je pri izvozu v PDF
  **požrl vrstico o registru** (v Wordu je ni); zato je tam `None`, kar varuje
  test;
- podpisna vrstica zapisnika se je **lomila čez stran**, dokler odstavek ni
  dobil `keep_with_next`;
- razlike v višini praznega odstavka LibreOffice včasih sploh ne pokaže, čeprav
  je zapis v OOXML drugačen.

Pred razdelitvijo dokumentov jih odpri v pravem Wordu.
