# Modul Radnici & Plate — stranice i navigacija

## Sve stranice modula (prema module-radnici.md)

| Ruta | Naziv u meniju | Opis |
|------|----------------|------|
| `/radnici` | Radnici | Lista radnika (tabela, filter, KPI kartice) |
| `/radnici/novi` | — | Dodavanje novog radnika (dostupno preko dugmeta na listi) |
| `/radnici/[id]` | — | Profil radnika (dostupan preko "Otvori profil" na listi) |
| `/radnici/[id]/uredi` | — | Izmena radnika (dostupna sa profila) |
| `/radnici/podesavanja` | Podešavanja satnica | Satnice (redovni, prekovremeno, subota, nedelja, praznik, topli obrok) — samo Admin |
| `/sati` | Unos sati | Mesečni unos radnih sati (kalendar, akontacije, bonusi) |
| `/plate` | Plate | Lista platnih izveštaja |
| `/plate/novi` | — | Generisanje novog izveštaja (dostupno sa liste plate ili sa profila radnika) |
| `/plate/[id]` | — | Prikaz/štampa platnog listića (dostupan sa liste plate) |

Stranice bez naziva u meniju su **detaljne/akcione** (otvaraju se sa liste ili profila), ne treba ih posebno u navigaciji.

---

## Prikaz u navigacionom meniju

Preporuka: **jedna grupa "Radnici & Plate"** sa podstavkama u sidebaru:

```
Navigacija
  Dashboard
  Radnici & Plate        ← grupa (ikona Users)
    Radnici              → /radnici
    Unos sati            → /sati
    Plate                → /plate
    Podešavanja satnica  → /radnici/podesavanja
  Cash Flow
  Proizvodnja
  Podešavanja
```

- **Radnici** — lista radnika (glavni ulaz u modul).
- **Unos sati** — mesečni unos sati.
- **Plate** — lista platnih izveštaja.
- **Podešavanja satnica** — satnice (vidljivo samo Adminu; može se sakriti po pravima kasnije).

Na taj način su sve glavne stranice modula u meniju, a novi radnik, profil, uređivanje i novi platni izveštaj ostaju akcije (dugmad/linkovi).
