# module-radnici.md — Radnici & Plate

## Stranice
```
/radnici                  → Lista svih aktivnih radnika (tabela)
/radnici/novi             → Dodavanje novog radnika (Sheet forma)
/radnici/[id]             → Profil radnika + kartice statistike
/radnici/[id]/uredi       → Izmena podataka radnika
/radnici/podesavanja      → Satnice i globalna podešavanja (samo Admin)
/sati                     → Mesečni unos radnih sati (kalendar grid)
/plate                    → Lista svih platnih izveštaja
/plate/novi               → Generisanje novog platnog izveštaja
/plate/[id]               → Prikaz i štampa platnog listića (PDF)
```

---

## Prava Pristupa

| Akcija                        | Admin | Menadžer | Radnik |
|-------------------------------|-------|----------|--------|
| Lista i profili radnika       | ✅    | ✅       | ❌     |
| Dodaj / izmeni radnika        | ✅    | ❌       | ❌     |
| Unos radnih sati              | ✅    | ✅       | ❌     |
| Unos akontacija               | ✅    | ✅       | ❌     |
| Unos bonusa                   | ✅    | ✅       | ❌     |
| Generisanje platnih izveštaja | ✅    | ❌       | ❌     |
| Podešavanja satnica           | ✅    | ❌       | ❌     |

---

## Tipovi Sati i Logika

### Osnovni Tipovi
- `'redovni'` — pon-pet radni dani
- `'prekovremeno'` — dodatni sati iznad redovnih (bilo koji dan)
- `'subota'` — rad subotom
- `'nedelja'` — rad nedeljom
- `'praznik'` — rad na državni praznik
- `'topli_obrok'` — dnevna nadoknada (u rate_settings)

### Evidencija (ne utiče na obračun sati)
- **Godišnji odmor (GO)** — checkbox, ne menja sate, samo evidentira dan
- **Bolovanje (B)** — checkbox, ne menja sate, samo evidentira dan

**Važno:** Radnik na GO PRIMA PLATU kao da je radio (unose mu se redovni sati 8h), checkbox je samo za evidenciju broja dana GO.

---

## Baza Podataka

### `employees`
```sql
id                    uuid PK
ime                   text NOT NULL
prezime               text NOT NULL
jmbg                  text
pozicija              text
datum_zaposlenja      date
godisnji_fond         integer DEFAULT 20    -- broj dana GO godišnje
nadoknada_prevoz      numeric DEFAULT 0     -- mesečni prevoz (0 = nema)
aktivan               boolean DEFAULT true
napomena              text
created_at            timestamp
```

### `rate_settings` — Satnice (sa istorijom)
```sql
id          uuid PK
tip         text NOT NULL  -- 'redovni' | 'prekovremeno' | 'subota' | 'nedelja' | 'praznik' | 'topli_obrok'
iznos       numeric NOT NULL
vazi_od     date NOT NULL
napomena    text
created_at  timestamp
```

Primeri:
```
tip: 'redovni',      iznos: 450,  vazi_od: '2025-01-01'
tip: 'prekovremeno', iznos: 675,  vazi_od: '2025-01-01'
tip: 'subota',       iznos: 560,  vazi_od: '2025-01-01'
tip: 'nedelja',      iznos: 700,  vazi_od: '2025-01-01'
tip: 'praznik',      iznos: 900,  vazi_od: '2025-01-01'
tip: 'topli_obrok',  iznos: 600,  vazi_od: '2025-01-01'
```

### `work_logs` — Dnevni unosi
```sql
id              uuid PK
employee_id     uuid REFERENCES employees NOT NULL
datum           date NOT NULL
sati            numeric NOT NULL
tip_sata        text NOT NULL  -- 'redovni' | 'prekovremeno' | 'subota' | 'nedelja' | 'praznik'
je_godisnji     boolean DEFAULT false  -- evidencija GO
je_bolovanje    boolean DEFAULT false  -- evidencija bolovanja
napomena        text
uneo_user_id    uuid REFERENCES auth.users
created_at      timestamp
```

**Važno:** Svaki dan može imati više redova (npr. jedan za redovne sate, drugi za prekovremene).

### `advances` — Akontacije
```sql
id              uuid PK
employee_id     uuid REFERENCES employees NOT NULL
datum           date NOT NULL
iznos           numeric NOT NULL
mesec           integer NOT NULL
godina          integer NOT NULL
napomena        text
uneo_user_id    uuid REFERENCES auth.users
created_at      timestamp
```

### `bonuses` — Bonusi
```sql
id              uuid PK
employee_id     uuid REFERENCES employees NOT NULL
mesec           integer NOT NULL
godina          integer NOT NULL
iznos           numeric NOT NULL
opis            text NOT NULL
uneo_user_id    uuid REFERENCES auth.users
created_at      timestamp
```

### `payroll_reports` — Generisani izveštaji
```sql
id                      uuid PK
employee_id             uuid REFERENCES employees NOT NULL
mesec                   integer NOT NULL
godina                  integer NOT NULL

-- Sati i obračuni
redovni_sati            numeric DEFAULT 0
prekovremeni_sati       numeric DEFAULT 0
subota_sati             numeric DEFAULT 0
nedelja_sati            numeric DEFAULT 0
praznik_sati            numeric DEFAULT 0
bruto_redovni           numeric DEFAULT 0
bruto_prekovremeno      numeric DEFAULT 0
bruto_subota            numeric DEFAULT 0
bruto_nedelja           numeric DEFAULT 0
bruto_praznik           numeric DEFAULT 0

-- Dodaci
broj_radnih_dana        integer DEFAULT 0    -- broj dana kada je radio (sati > 0, nije GO/bolovanje)
topli_obrok_iznos       numeric DEFAULT 0    -- broj_radnih_dana × cena_toplog_obroka
prevoz_iznos            numeric DEFAULT 0    -- iz employees.nadoknada_prevoz
bonusi_ukupno           numeric DEFAULT 0    -- suma bonusa za mesec

-- Totali
ukupno_bruto            numeric DEFAULT 0    -- sati + dodaci
ukupni_avans            numeric DEFAULT 0    -- suma akontacija
neto_za_isplatu         numeric DEFAULT 0    -- bruto - avans

status                  text DEFAULT 'nacrt'  -- 'nacrt' | 'finalizovan' | 'isplacen'
created_at              timestamp
```

---

## Logika Obračuna

### Satnice — Uzimanje Za Datum
Za svaki datum rada uzima se **poslednja važeća satnica**:
```typescript
async function getSatnicaZaDatum(tip_sata: string, datum: string) {
  const { data } = await supabase
    .from('rate_settings')
    .select('iznos')
    .eq('tip', tip_sata)
    .lte('vazi_od', datum)
    .order('vazi_od', { ascending: false })
    .limit(1)
    .single()
  
  return data.iznos
}
```

### Broj Radnih Dana (za topli obrok)
Brojimo sve dane kada je radnik **radio** (ima sate > 0), osim GO i bolovanja:
```sql
SELECT COUNT(DISTINCT datum) 
FROM work_logs
WHERE employee_id = $1
  AND datum >= '2025-01-01'
  AND datum <= '2025-01-31'
  AND sati > 0
  AND je_godisnji = false
  AND je_bolovanje = false
```

### Finalna Formula
```
UKUPNO BRUTO =
  (redovni_sati × satnica_redovni)
+ (prekovremeni_sati × satnica_prekovremeno)
+ (subota_sati × satnica_subota)
+ (nedelja_sati × satnica_nedelja)
+ (praznik_sati × satnica_praznik)
+ (broj_radnih_dana × cena_toplog_obroka)
+ nadoknada_prevoz
+ suma_bonusa

UKUPNI AVANS = Σ(akontacije za mesec)

NETO ZA ISPLATU = UKUPNO BRUTO - UKUPNI AVANS
```

---

## Izgled platnog listića (ISPLATNI IZVEŠTAJ)

Referentni izgled za štampu i PDF:

```
═══════════════════════════════════════════════════════════
              [LOGO]
           ISPLATNI IZVEŠTAJ ZA ZAPOSLENOG
           ═══════════════════════════════

Radnik: Marko Petrović
Pozicija: Operater mašine
Period: Januar 2025
Datum izdavanja: 05.02.2025
═══════════════════════════════════════════════════════════

┌─────────────────────────────────┬─────────────────────┐
│  OBRAČUN RADNIH SATI            │  AKONTACIJE         │
├─────────────────────────────────┼─────────────────────┤
│ Tip          Sati  Cena  Iznos  │ Datum       Iznos   │
│ ──────────────────────────────  │ ─────────────────── │
│ Redovni      168h  450   75.600 │ 05.01.      15.000  │
│ Prekovremeni   8h  675    5.400 │ 15.01.      20.000  │
│ Subota        16h  560    8.960 │ 25.01.      10.000  │
│ Nedelja        0h  700        0 │                     │
│ Praznik        8h  900    7.200 │ ─────────────────── │
│ ──────────────────────────────  │ UKUPNO:     45.000  │
│ UKUPNO SATI:          97.160    │                     │
│                                 │                     │
│ DODACI                          │                     │
│ ──────────────────────────────  │                     │
│ Topli obrok  22 × 600   13.200  │                     │
│ Prevoz                   5.500  │                     │
│ Bonus (Projekat X)       5.000  │                     │
│ ──────────────────────────────  │                     │
│ UKUPNO DODACI:          23.700  │                     │
│                                 │                     │
│ Broj radnih dana: 22            │                     │
└─────────────────────────────────┴─────────────────────┘

═══════════════════════════════════════════════════════════
 UKUPNO BRUTO:                             120.860 RSD
 ISPLAĆENO (akontacije):                  - 45.000 RSD
 ─────────────────────────────────────────────────────
 ✅ NETO ZA ISPLATU:                        75.860 RSD
═══════════════════════════════════════════════════════════

Datum: ______________

___________________        ___________________
Potpis poslodavca          Potpis radnika


[Štampaj]  [Export PDF]  [Označi kao isplaćen]
```

### DIZAJN (A4, štampa)
- A4 format (portrait), margine 20mm
- Font: Inter
- Header: centriran, 20px bold
- Tabela: brojevi right-aligned, monospace za iznose
- Neto za isplatu: zelena pozadina (#D1FAE5), 18px bold
- Print-friendly (crno-belo)

### DATA
- Fetch: employee, work_logs (za mesec), advances, bonuses, rate_settings
- Grupiši sate po tipu; obračun bruto = sati × cena (cena iz rate_settings važeća za mesec)
- Dodaci: topli obrok (broj_radnih_dana × cena_topli_obrok) + prevoz (employees.nadoknada_prevoz) + bonusi
- Neto = (ukupno bruto iz sati + dodaci) − akontacije

### FUNKCIONALNOST
- **Štampaj** → `window.print()`
- **Export PDF** → export stranice u PDF
- **Označi kao isplaćen** → update `payroll_reports.status` na `'isplacen'`

---

### Godišnji Odmor — Period Jul-Jun
```typescript
function getGOPeriod(today: Date) {
  const year = today.getFullYear()
  const month = today.getMonth()  // 0-indexed
  
  if (month < 6) {  // pre jula
    return { 
      start: new Date(year - 1, 6, 1),  // prošli jul
      end: new Date(year, 5, 30)        // ovaj jun
    }
  } else {  // posle jula
    return { 
      start: new Date(year, 6, 1),      // ovaj jul
      end: new Date(year + 1, 5, 30)    // sledeći jun
    }
  }
}

// Iskorišćeni GO dani
SELECT COUNT(*) FROM work_logs
WHERE employee_id = $1
  AND je_godisnji = true
  AND datum BETWEEN $period_start AND $period_end
```

**Prenos neiskorišćenih dana:**
```
Fond 2024/2025: 20 dana
Iskorišćeno: 15 dana
Preostalo: 5 dana

→ Fond 2025/2026: 20 (novi) + 5 (prenos) = 25 dana
```

---

## Ekran: /radnici — Lista Radnika

Tabela sa kolonama:
- Ime i prezime
- Pozicija
- Prevoz (ikona ✓ ako ima, prazno ako nema)
- Status (Aktivan / Neaktivan)
- Akcije (Otvori profil, Uredi)

Filter: Svi / Aktivni / Neaktivni
Dugme: + Novi radnik (otvara Sheet)

---

## Ekran: /radnici/[id] — Profil Radnika

```
┌──────────────────────────────────────────┐
│  📋 Lični Podaci                          │
│  Ime: Marko Petrović                     │
│  Pozicija: Operater                      │
│  Zaposlenje: 15.03.2023                  │
│  Godišnji fond:  [20] dana  ✏️           │
│  Prevoz:  [5.500] RSD  ✏️                │
│  └─ 0 = nema pravo na prevoz             │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  🏖️ Godišnji Odmor (Jul 2024 - Jun 2025) │
│  Fond (osnovna):        20 dana          │
│  + Prenos iz prethodnog: 3 dana          │
│  ──────────────────────────────────────  │
│  Ukupan fond:           23 dana          │
│  Iskorišćeno:           12 dana  ████░░░ │
│  Preostalo:             11 dana          │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  🏥 Bolovanje (2025)                      │
│  Ukupno dana:  3                         │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  📊 Statistika Januar 2025               │
│  Redovni sati:     168h                  │
│  Prekovremeni:       8h                  │
│  Subota/nedelja:    16h                  │
└──────────────────────────────────────────┘

[Generiši platni izveštaj za Januar 2025]
```

---

## Ekran: /sati — Mesečni Unos Sati

**Struktura ekrana:**
```
┌──────────────────────────────────────────────────────────┐
│  Unos Radnih Sati                                        │
├──────────────────────────────────────────────────────────┤
│  Radnik: [Marko Petrović ▼]   Mesec: [Januar 2025 ▼]    │
│  [⚡ Automatski popuni 8h radni dani]                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  KALENDAR SATI                                           │
│                                                          │
│  PON     UTO     SRE     ČET     PET     SUB     NED     │
│  ──────────────────────────────────────────────────────  │
│           1       2       3       4       5       6      │
│         [ 8 ]   [ 8 ]   [ 8 ]   [ 8 ]   [ 0 ]   [ 0 ]   │
│         [+0 ]   [+2 ]   [+0 ]   [+0 ]   [+0 ]   [+0 ]   │
│         ☐GO☐B   ☑GO☐B   ☐GO☐B   ☐GO☐B   ☐GO☐B   ☐GO☐B   │
│                  └─ GO dan, ali 8h uneseno (plaća se)   │
│                                                          │
│   7       8       9      10      11      12      13      │
│  [ 0 ]  [ 8 ]   [ 8 ]   [ 8 ]   [ 8 ]   [ 0 ]   [ 0 ]   │
│  [+0 ]  [+0 ]   [+0 ]   [+0 ]   [+0 ]   [+0 ]   [+0 ]   │
│  ☐GO☐B  ☐GO☐B   ☐GO☐B   ☐GO☐B   ☐GO☐B   ☐GO☐B   ☐GO☐B   │
│                                                          │
│  ... (svi dani meseca)                                   │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  📊 PREGLED MESECA                                       │
│  Redovni:      168h   │  Radnih dana:  22               │
│  Prekovremeni:   8h   │  GO dana:       2               │
│  Subota/Ned:    16h   │  Bolovanje:     0               │
│  UKUPNO:       192h   │                                 │
├──────────────────────────────────────────────────────────┤
│  💰 AKONTACIJE ZA JANUAR 2025                            │
│  Datum       │  Iznos      │  Napomena    │  Akcija     │
│  05.01.2025  │  15.000 RSD │  Avans       │  [🗑️]      │
│  15.01.2025  │  20.000 RSD │  Avans       │  [🗑️]      │
│  UKUPNO:        35.000 RSD                               │
│  [+ Dodaj akontaciju]                                    │
├──────────────────────────────────────────────────────────┤
│  🎁 BONUSI ZA JANUAR 2025                                │
│  Iznos       │  Opis                      │  Akcija     │
│  5.000 RSD   │  Bonus za projekat X       │  [🗑️]      │
│  UKUPNO:        5.000 RSD                                │
│  [+ Dodaj bonus]                                         │
├──────────────────────────────────────────────────────────┤
│  [Otkaži]                          [Sačuvaj sve unose]  │
└──────────────────────────────────────────────────────────┘
```

**Logika unosa:**
- Svaki dan ima 2 input polja (redovni/prekovremeni) + 2 checkboxa (GO/B)
- Tip sata se određuje automatski po danu u nedelji:
  - Pon-Pet → `'redovni'`
  - Subota → `'subota'`
  - Nedelja → `'nedelja'`
  - Prekovremeni su uvek `'prekovremeno'`
- GO i Bolovanje checkboxi ne utiču na sate — samo evidencija
- **Automatski popuni** dugme: popunjava sve radne dane (pon-pet) sa 8h

**Čuvanje:**
```typescript
// Briši sve postojeće work_logs za taj mesec
await supabase
  .from('work_logs')
  .delete()
  .eq('employee_id', employeeId)
  .gte('datum', `${godina}-${mesec}-01`)
  .lte('datum', `${godina}-${mesec}-31`)

// Kreiraj nove redove za sve dane sa satima > 0
for (const dan of unos) {
  if (dan.redovni_sati > 0) {
    await insert({ sati: dan.redovni_sati, tip_sata: getTipZaDan(dan.datum) })
  }
  if (dan.prekovremeni > 0) {
    await insert({ sati: dan.prekovremeni, tip_sata: 'prekovremeno' })
  }
}
```

---

## Ekran: /radnici/podesavanja — Satnice

```
┌─────────────────────────────────────────────┐
│  ⚙️ Podešavanja — Satnice                    │
├─────────────────────────────────────────────┤
│  Redovni sat          [ 450 RSD ]  ✏️ Izmeni │
│  Poslednja izmena: 01.01.2025.               │
│                                             │
│  Prekovremeno         [ 675 RSD ]  ✏️ Izmeni │
│  Poslednja izmena: 01.01.2025.               │
│                                             │
│  Subota               [ 560 RSD ]  ✏️ Izmeni │
│  Nedelja              [ 700 RSD ]  ✏️ Izmeni │
│  Praznik              [ 900 RSD ]  ✏️ Izmeni │
│                                             │
│  Topli obrok          [ 600 RSD ]  ✏️ Izmeni │
│  Poslednja izmena: 01.01.2025.               │
├─────────────────────────────────────────────┤
│  📋 Istorija promena satnica        [Prikaži]│
└─────────────────────────────────────────────┘
```

Modal za izmenu:
```
┌─────────────────────────────┐
│  Izmena satnice: Subota      │
│  Nova cena:  [ _______ ] RSD │
│  Važi od:    [ 01.06.2025 ]  │
│  Napomena:   [ __________ ]  │
│  [ Otkaži ]    [ Sačuvaj ]   │
└─────────────────────────────┘
```

---

## Ekran: /plate/novi — Generisanje Izveštaja

```
┌─────────────────────────────────────────────────────┐
│  Generisanje Platnog Izveštaja                      │
│  Radnik:  [Marko Petrović ▼]                        │
│  Mesec:   [Januar ▼]  Godina: [2025 ▼]             │
│  [Generiši pregled]                                 │
└─────────────────────────────────────────────────────┘

↓ Klik prikazuje preview ↓

┌─────────────────────────────────────────────────────┐
│  📄 PREGLED IZVEŠTAJA                               │
│  Radnik: Marko Petrović | Januar 2025              │
├─────────────────────────────────────────────────────┤
│  OBRAČUN SATI                    │  AKONTACIJE      │
│  Redovni:    168h × 450 = 75.600 │  05.01.  15.000 │
│  Prekovremeni: 8h × 675 =  5.400 │  15.01.  20.000 │
│  Subota:      16h × 560 =  8.960 │  ────────────── │
│  Nedelja:      0h × 700 =      0 │  Ukupno: 35.000 │
│  Praznik:      8h × 900 =  7.200 │                 │
│  Ukupno sati:           97.160   │                 │
│                                  │                 │
│  DODACI                          │                 │
│  Topli obrok: 22 × 600 = 13.200  │                 │
│  Prevoz:                  5.500  │                 │
│  Bonus (Projekat X):      5.000  │                 │
│  Ukupno dodaci:          23.700  │                 │
│                                  │                 │
│  Broj radnih dana: 22            │                 │
│                                                     │
│  UKUPNO BRUTO:                          120.860    │
│  AKONTACIJE:                           - 35.000    │
│  ─────────────────────────────────────────────     │
│  NETO ZA ISPLATU:                        85.860    │
├─────────────────────────────────────────────────────┤
│  [Otkaži]  [Sačuvaj kao nacrt]  [Finalizuj]       │
└─────────────────────────────────────────────────────┘
```

---

## Ekran: /plate/[id] — Platni Listić (PDF)

```
┌─────────────────────────────────────────────────────────┐
│                 ISPLATNI IZVEŠTAJ                       │
│                                                         │
│  Radnik: Marko Petrović                                 │
│  Pozicija: Operater                                     │
│  Period: Januar 2025                                    │
│  Datum izdavanja: 05.02.2025                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  OBRAČUN SATI                            │  AKONTACIJE  │
│  ──────────────────────────────          │  ───────────│
│  Redovni:       168h × 450   =  75.600   │  05.01. 15.000│
│  Prekovremeni:    8h × 675   =   5.400   │  15.01. 20.000│
│  Subota:         16h × 560   =   8.960   │              │
│  Nedelja:         0h × 700   =       0   │  ───────────│
│  Praznik:         8h × 900   =   7.200   │  UKUPNO:     │
│  ──────────────────────────────          │    35.000    │
│  Ukupno sati:              97.160        │              │
│                                          │              │
│  DODACI                                  │              │
│  ──────────────────────────────          │              │
│  Topli obrok:   22 × 600     =  13.200   │              │
│  Prevoz:                        5.500    │              │
│  Bonus (Projekat X):            5.000    │              │
│  ──────────────────────────────          │              │
│  Ukupno dodaci:                23.700    │              │
│                                          │              │
│  Broj radnih dana: 22                    │              │
│                                          │              │
│  ═══════════════════════════════════════════════════════│
│  UKUPNO BRUTO:                          120.860        │
│  ISPLAĆENO (akontacije):               - 35.000        │
│  ───────────────────────────────────────────────────   │
│  ✅ NETO ZA ISPLATU:                     85.860 RSD    │
│  ═══════════════════════════════════════════════════════│
│                                                         │
│  _______________          _______________               │
│  Potpis poslodavca        Potpis radnika               │
└─────────────────────────────────────────────────────────┘

[Štampaj]  [Export PDF]  [Označi kao isplaćen]
```
