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
`20260314_ZapisnikObcniZbor.docx`. Številka dokumenta je v obliki `03/2026-001`.

## Popravek podatkov

Vsi podatki društva so v `bin/dokumenti/podatki.py`. Po popravku:

```bash
bin/dokumenti.sh --test   # testi
bin/dokumenti.sh          # ponovno generiranje predlog in primerov
bin/dokumenti.sh --pdf    # neobvezno: PDF predogledi v dist/dokumenti-pdf
```

Logotipa in greben so v `viri/`; greben se upodobi iz SVG z `bin/dokumenti.sh --viri`.
