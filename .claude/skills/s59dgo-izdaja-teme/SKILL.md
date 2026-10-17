---
name: s59dgo-izdaja-teme
description: Izdaja nove verzije WordPress teme s59dgo (www.s59dgo.si) – dvig verzije, changelog, zip, združitev, push, git tag in GitHub release ter navodila za namestitev na strežnik. Uporabi vedno, ko uporabnik reče »izdaja«, »nova verzija«, »release«, »objavi temo«, »naredi zip«, »združi in potisni« za spremembe v mapi s59dgo/, ali ko je sprememba teme končana in jo je treba spraviti v produkcijo.
---

# Izdaja teme s59dgo

Tema je v produkciji na www.s59dgo.si (prej .org, preusmeritev od 2026-09-13). Namešča se ročno kot zip v WP administraciji, zato je »izdaja« = preverjen zip + GitHub release, namestitev pa naredi uporabnik.

## Pred začetkom

1. `git fetch && git status` – uporabnik včasih ureja neposredno na GitHubu; lokalni `main` mora biti posodobljen (`git pull --ff-only`) preden združuješ.
2. Docker mora teči (`docker info`; sicer `open -a Docker` in počakaj). Vsa orodja (`bin/*.sh`) tečejo v Dockerju, lokalno ni PHP.
3. Delo naj bo na veji, ne na `main`. Push, tag in release so zunanji učinki na javnem repozitoriju `s56oa/WordPressThemeS59DGO` – pred njimi uporabnika vprašaj, razen če je to v istem sporočilu izrecno zahteval.

## Koraki

1. **Verzija** (semver: nova funkcija = minor, popravek = patch):
   - `s59dgo/style.css` → `Version: X.Y.Z`
   - `s59dgo/readme.txt` → `Stable tag: X.Y.Z` in nov blok na vrhu `== Changelog ==` (`= X.Y.Z =`, alineje v slovenščini, napisane za urednika strani, ne za razvijalca).
2. **Lokalno preverjanje**: če v `prod_backups/` obstaja arhiv, zaženi `bin/lokalno.sh obnovi` (če je arhiv novejši od zadnje obnove) in `bin/preveri-lokalno.sh`; poročilo je v `dist/preverjanje/porocilo.html`. Ob izhodni kodi 1 (najdbe `napaka`) izdaje ne nadaljuj. Če je arhiv starejši od 30 dni ali ga ni, to povej naročniku in predlagaj nov backup v Backuply. Najdbe `ročni korak` iz poročila dodaj v navodila za namestitev.
3. **Preverjanje in zip**: `bin/build-zip.sh` požene lint, `bin/test.sh` (PHP testi + Node test generatorja promptov), PHPCS in ustvari `dist/s59dgo.zip`. Izpis preusmeri v datoteko in preberi rep; ob napaki popravi vzrok, ne testa.
4. **Commit** na veji (sporočilo v slovenščini, npr. `Tema X.Y.Z: …`), nato združitev: `git checkout main && git pull --ff-only && git merge --ff-only <veja>`; po združitvi še enkrat `bin/test.sh`.
5. **Push in release** (po potrditvi):
   ```bash
   git push origin main
   git tag -a vX.Y.Z -m "s59dgo X.Y.Z"
   git push origin vX.Y.Z
   gh release create vX.Y.Z dist/s59dgo.zip --title "s59dgo X.Y.Z" --notes "<changelog alineje>"
   ```
   `gh` je prijavljen kot s56oa. Nikoli `--force`; zavrnjen push pomeni, da se je remote premaknil – razišči.
6. Pobriši združeno vejo (`git branch -d`).

## Kar sporočiš uporabniku na koncu

- Povezavo na release in pot do `dist/s59dgo.zip`.
- Namestitev: Videz → Teme → Dodaj novo → Naloži temo → izberi zip → »Zamenjaj trenutno z naloženo«. Nastavitve teme (meni, logotip, Customizer) ostanejo.
- Ročne korake po namestitvi, ki jih izdaja zahteva – npr. ob novi velikosti slike (`add_image_size`) enkrat pognati vtičnik »Regenerate Thumbnails«, sicer obstoječe slike nimajo novih izrezov.
- Kratek seznam, kaj preveriti na živi strani (za pregled uporabi skill `s59dgo-pregled-zive-strani`).

## Pasti

- Ne dodajaj nesledenih datotek v korenu (`AGENTS.md`, `trenutni_logotipi/`, `bin/dokumenti/`): niso del teme, `trenutni_logotipi/` vsebuje pravo korespondenco društva, repozitorij pa je javen.
- `prod_backups/` in Dockerjevi volumni `s59dgo-lokalno_*` vsebujejo zasebne podatke produkcije (uporabniki, komentarji, wp-config): nikoli `git add` iz teh poti, poročila in posnetke iz `dist/preverjanje/` ne prilagaj izdaji.
- Ne predlagaj wp-env, Sass, FSE, child teme ali spremembe števila stolpcev – uporabnik je to že zavrnil.
- Veja `dokumenti` (Wordove predloge) je ločen sklop; ne združuj je skupaj s temo brez izrecne zahteve.
