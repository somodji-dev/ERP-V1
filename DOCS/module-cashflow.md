# module-cashflow.md — Cash Flow Analiza

## Koncept

Cash Flow modul prati **bilansni pristup** — aktivu (cash) vs pasivu (dugovanja). Korisnik uploaduje Excel fajl sa partnerima (kupci i dobavljači), zatim unosi ostale cash komponente (računi, zalihe, itd.), i dobija neto cash flow.

**Formula:**
```
NETO CASH FLOW = UKUPNA AKTIVA (CASH) - UKUPNA PASIVA (DUGOVANJA)
```

---

## Stranice
```
/cash-flow                → Dashboard sa KPI karticama, grafikonom i listom
/cash-flow/novi           → Kreiranje novog snimka (detaljni ili brzi)
/cash-flow/[id]           → Detalj snimka
/cash-flow/[id]/uredi     → Izmena snimka (samo Admin)
/cash-flow/uporedi        → Poređenje dva meseca
```

---

## Prava Pristupa

| Akcija | Admin | Menadžer | Radnik |
|--------|-------|----------|--------|
| Pregled dashboard i snimaka | ✅ | ✅ | ❌ |
| Kreiranje novog snimka | ✅ | ✅ | ❌ |
| Izmena postojećih snimaka | ✅ | ❌ | ❌ |
| Poređenje meseci | ✅ | ✅ | ❌ |

---

## Baza Podataka

### `cash_snapshots` — Mesečni Snimci
```sql
CREATE TABLE cash_snapshots (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mesec                   integer NOT NULL,
  godina                  integer NOT NULL,
  datum_unosa             date DEFAULT CURRENT_DATE,
  
  -- Tip unosa
  tip_unosa               text NOT NULL,  -- 'detaljan' | 'brzi'
  
  -- CASH komponente (NULL za brzi unos)
  potrazivanja_kupci      numeric,
  racun_intesa            numeric,
  racun_nlb               numeric,
  devizni_racun           numeric,
  gotovi_proizvodi        numeric,
  sirovine                numeric,
  ostalo                  numeric,
  ukupno_cash             numeric NOT NULL,  -- za brzi unos direktno uneto, za detaljan suma komponenti
  
  -- DUGOVANJA
  dugovanja_dobavljaci    numeric NOT NULL,
  
  -- REZULTAT
  neto_cash_flow          numeric NOT NULL,  -- ukupno_cash - dugovanja_dobavljaci
  
  -- Excel fajl (samo za detaljni unos)
  excel_file_url          text,
  
  -- Meta
  created_by              uuid REFERENCES auth.users,
  created_at              timestamp DEFAULT now(),
  
  UNIQUE(mesec, godina)
);

CREATE INDEX idx_cash_snapshots_mesec_godina ON cash_snapshots(mesec, godina);
CREATE INDEX idx_cash_snapshots_created_by ON cash_snapshots(created_by);
```

### `excel_partners` — Detalji Iz Excel Fajla
```sql
CREATE TABLE excel_partners (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id         uuid REFERENCES cash_snapshots ON DELETE CASCADE NOT NULL,
  partner_naziv       text NOT NULL,
  kupci_iznos         numeric DEFAULT 0,
  dobavljaci_iznos    numeric DEFAULT 0,
  created_at          timestamp DEFAULT now()
);

CREATE INDEX idx_excel_partners_snapshot_id ON excel_partners(snapshot_id);
```

**Napomena:** Ova tabela postoji **samo za detaljne unose**. Za brze unose (istorija) ne postoje redovi u ovoj tabeli.

---

## Excel Format

### Očekivana Struktura
```
Kolona A: Partner (naziv)
Kolona B: Kupci (iznos)
Kolona C: Dobavljači (iznos)

Primer:
┌────────────────┬──────────┬─────────────┐
│ Partner        │ Kupci    │ Dobavljači  │
├────────────────┼──────────┼─────────────┤
│ Firma A        │ 150.000  │             │
│ Firma B        │ 200.000  │             │
│ Dobavljač X    │          │ 80.000      │
│ Dobavljač Y    │          │ 120.000     │
│ Firma C        │ 50.000   │ 45.000      │
├────────────────┼──────────┼─────────────┤
│ UKUPNO:        │ 400.000  │ 245.000     │
└────────────────┴──────────┴─────────────┘
```

**Podržani formati:** `.xlsx` i `.csv`

---

## Ekran: `/cash-flow` — Dashboard

```
┌─────────────────────────────────────────────────────────┐
│  Cash Flow Analiza                                      │
│  [+ Novi snimak]  [Uporedi mesece]                     │
├─────────────────────────────────────────────────────────┤
│  KPI KARTICE:                                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ CASH         │ │ DUGOVANJA    │ │ NETO C/F     │   │
│  │ 2.150.000    │ │ 245.000      │ │ 1.905.000    │   │
│  │ +8% 🟢      │ │ -3% 🟢       │ │ +12% 🟢     │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
│                                                         │
│  Poslednji snimak: Januar 2025                          │
├─────────────────────────────────────────────────────────┤
│  GRAFIKON — Kretanje Kroz Vreme                        │
│  [Prikaz: Poslednih 12 meseci ▼]                      │
│                                                         │
│  2.5M │                              ●●●               │
│  2.0M │                         ●●●                    │
│  1.5M │                    ●●●                         │
│  1.0M │               ●●●                              │
│  0.5M │          ●●●                                   │
│       └───────────────────────────────────────         │
│       2024  Feb  Apr  Jun  Aug  Oct  Dec  2025        │
│                                                         │
│  ─── Cash (aktiva)                                     │
│  ─── Dugovanja (pasiva)                                │
│  ─── Neto Cash Flow                                    │
├─────────────────────────────────────────────────────────┤
│  LISTA SNIMAKA                                         │
│  ┌────────┬──────────┬────────┬──────────────────┐    │
│  │Mesec   │Neto C/F  │Tip     │Akcije            │    │
│  ├────────┼──────────┼────────┼──────────────────┤    │
│  │Jan 25  │1.905.000 │📊 Det  │[Detalji] [Izmeni]│    │
│  │Dec 24  │1.780.000 │📊 Det  │[Detalji] [Izmeni]│    │
│  │Nov 24  │1.650.000 │📊 Det  │[Detalji] [Izmeni]│    │
│  │...     │...       │...     │...               │    │
│  │Jan 23  │750.000   │⚡ Brzi │[Detalji] [Izmeni]│    │
│  │Dec 22  │680.000   │⚡ Brzi │[Detalji] [Izmeni]│    │
│  └────────┴──────────┴────────┴──────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

**Desktop:** 3 KPI kartice u redu, grafikon, tabela

**Mobile:** KPI kartice stack-ovane, grafikon, lista (umesto tabele)

---

## Ekran: `/cash-flow/novi` — Kreiranje Snimka

### Korak 1: Izbor Tipa Unosa
```
┌─────────────────────────────────────────────────────────┐
│  Novi Cash Flow Snimak                                  │
├─────────────────────────────────────────────────────────┤
│  Mesec:  [Januar ▼]     Godina:  [2025 ▼]             │
│                                                         │
│  Izaberi tip unosa:                                     │
│                                                         │
│  ○ Detaljni unos (sa Excel fajlom)                     │
│     Uploaduj Excel sa partnerima, unesi račune i zalihe│
│                                                         │
│  ○ Brzi unos (samo totali)                             │
│     Unesi ukupnu aktivu i pasivu — za istorijske podatke│
├─────────────────────────────────────────────────────────┤
│  [Otkaži]                              [Nastavi]       │
└─────────────────────────────────────────────────────────┘
```

---

### Opcija A: Detaljni Unos

```
┌─────────────────────────────────────────────────────────┐
│  Novi Snimak — Januar 2025 (Detaljni)                   │
├─────────────────────────────────────────────────────────┤
│  KORAK 1: Upload Excel Fajla                            │
│  Podržani formati: .xlsx, .csv                          │
│                                                         │
│  [📎 Drag & Drop fajl ili klikni za upload]            │
│                                                         │
│  (Nakon upload-a:)                                      │
│  ✅ partner-lista.xlsx (23 KB)                          │
│                                                         │
│  PREGLED TABELE:                                        │
│  ┌──────────────┬──────────┬─────────────┐            │
│  │Partner       │Kupci     │Dobavljači   │            │
│  ├──────────────┼──────────┼─────────────┤            │
│  │Firma A       │150.000   │             │            │
│  │Firma B       │200.000   │             │            │
│  │Dobavljač X   │          │80.000       │            │
│  │Dobavljač Y   │          │120.000      │            │
│  │Firma C       │50.000    │45.000       │            │
│  ├──────────────┼──────────┼─────────────┤            │
│  │UKUPNO:       │400.000   │245.000      │            │
│  └──────────────┴──────────┴─────────────┘            │
│                                                         │
│  ⚠️ Greška u tabeli? [Re-upload Excel]                 │
├─────────────────────────────────────────────────────────┤
│  KORAK 2: Unesi Ostale Cash Komponente                 │
│                                                         │
│  Potraživanja od kupaca:  [400.000] 🔒 (iz Excel-a)    │
│  Račun Intesa:            [________]                   │
│  Račun NLB:               [________]                   │
│  Devizni račun:           [________]                   │
│  Gotovi proizvodi:        [________]                   │
│  Sirovine:                [________]                   │
│  Ostalo:                  [________]                   │
│  ────────────────────────────────────                  │
│  UKUPNO CASH:             [auto suma]                  │
│                                                         │
│  Dugovanja dobavljači:    [245.000] 🔒 (iz Excel-a)    │
│                                                         │
│  ════════════════════════════════════                  │
│  NETO CASH FLOW:          [auto razlika]               │
│  ════════════════════════════════════                  │
├─────────────────────────────────────────────────────────┤
│  [Otkaži]                              [Sačuvaj]       │
└─────────────────────────────────────────────────────────┘
```

**Logika:**
- Potraživanja kupci i Dugovanja dobavljači su **locked** (🔒) — ne mogu se ručno menjati jer dolaze iz Excel-a
- Ostali iznosi se unose ručno
- UKUPNO CASH = suma svih komponenti (auto kalkulacija)
- NETO = UKUPNO CASH - Dugovanja

---

### Opcija B: Brzi Unos

```
┌─────────────────────────────────────────────────────────┐
│  Novi Snimak — Januar 2023 (Brzi Unos)                  │
├─────────────────────────────────────────────────────────┤
│  Ukupna Aktiva (Cash):      [___________]               │
│  Ukupna Pasiva (Dugovanja): [___________]               │
│                                                         │
│  ════════════════════════════════════                  │
│  NETO CASH FLOW:            [auto razlika]             │
│  ════════════════════════════════════                  │
│                                                         │
│  ℹ️ Koristi za unos istorijskih podataka bez detalja   │
├─────────────────────────────────────────────────────────┤
│  [Otkaži]                              [Sačuvaj]       │
└─────────────────────────────────────────────────────────┘
```

---

## Ekran: `/cash-flow/[id]` — Detalj Snimka

### Ako Je Detaljni Unos

```
┌─────────────────────────────────────────────────────────┐
│  Cash Flow — Januar 2025                                │
│  Status: 📊 Detaljni snimak                             │
│  Datum unosa: 05.02.2025                                │
│  [Izmeni] [Download Excel]                             │
├─────────────────────────────────────────────────────────┤
│  CASH (Aktiva)                                          │
│  Potraživanja od kupaca:       400.000                  │
│  Račun Intesa:                 850.000                  │
│  Račun NLB:                    320.000                  │
│  Devizni račun:                180.000                  │
│  Gotovi proizvodi:             250.000                  │
│  Sirovine:                     120.000                  │
│  Ostalo:                        30.000                  │
│  ────────────────────────────────────                  │
│  UKUPNO CASH:                2.150.000                  │
│                                                         │
│  DUGOVANJA (Pasiva)                                     │
│  Dobavljači:                   245.000                  │
│                                                         │
│  ════════════════════════════════════                  │
│  NETO CASH FLOW:             1.905.000                  │
│  ════════════════════════════════════                  │
├─────────────────────────────────────────────────────────┤
│  TABELA PARTNERA IZ EXCEL-a                            │
│  [Tab: Kupci] [Tab: Dobavljači] [Tab: Svi]            │
│                                                         │
│  (Prikaz trenutno: Kupci)                               │
│  ┌──────────────────┬──────────────┐                   │
│  │Partner           │Iznos         │                   │
│  ├──────────────────┼──────────────┤                   │
│  │Firma A           │150.000       │                   │
│  │Firma B           │200.000       │                   │
│  │Firma C           │50.000        │                   │
│  ├──────────────────┼──────────────┤                   │
│  │UKUPNO:           │400.000       │                   │
│  └──────────────────┴──────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

---

### Ako Je Brzi Unos

```
┌─────────────────────────────────────────────────────────┐
│  Cash Flow — Januar 2023                                │
│  Status: ⚡ Brzi unos (istorija)                        │
│  Datum unosa: 15.02.2025                                │
│  [Izmeni]                                               │
├─────────────────────────────────────────────────────────┤
│  Ukupna Aktiva (Cash):       1.200.000                  │
│  Ukupna Pasiva (Dugovanja):    450.000                  │
│                                                         │
│  ════════════════════════════════════                  │
│  NETO CASH FLOW:               750.000                  │
│  ════════════════════════════════════                  │
│                                                         │
│  ℹ️ Istorijski podatak — nema detalja po komponentama  │
└─────────────────────────────────────────────────────────┘
```

---

## Ekran: `/cash-flow/[id]/uredi` — Izmena Snimka

**Layout:** Isti kao `/novi`, ali sa popunjenim poljima.

**Prava:** Samo Admin može menjati postojeće snimke.

**Napomena:** Ako menja detaljni snimak, može re-upload-ovati novi Excel ili ručno menjati cash komponente.

---

## Ekran: `/cash-flow/uporedi` — Poređenje Meseci

```
┌─────────────────────────────────────────────────────────┐
│  Uporedi Mesece                                         │
├─────────────────────────────────────────────────────────┤
│  Mesec 1:  [Januar 2025 ▼]                              │
│  Mesec 2:  [Decembar 2024 ▼]                            │
│  [Uporedi]                                              │
└─────────────────────────────────────────────────────────┘

↓ Nakon klika ↓

┌──────────────────────────────────────────────────────────┐
│  Uporedba: Januar 2025 vs Decembar 2024                 │
├──────────────────────────────────────────────────────────┤
│  ┌────────────────────┬──────────┬──────────┬─────────┐ │
│  │                    │Januar 25 │Decembar24│ Razlika │ │
│  ├────────────────────┼──────────┼──────────┼─────────┤ │
│  │CASH (Aktiva)       │          │          │         │ │
│  │Potraživanja        │  400.000 │  380.000 │+20k 🟢 │ │
│  │Račun Intesa        │  850.000 │  820.000 │+30k 🟢 │ │
│  │Račun NLB           │  320.000 │  300.000 │+20k 🟢 │ │
│  │Devizni             │  180.000 │  170.000 │+10k 🟢 │ │
│  │Gotovi proizvodi    │  250.000 │  240.000 │+10k 🟢 │ │
│  │Sirovine            │  120.000 │  110.000 │+10k 🟢 │ │
│  │Ostalo              │   30.000 │   30.000 │   0    │ │
│  │────────────────────────────────────────────────────│ │
│  │UKUPNO CASH         │2.150.000 │2.050.000 │+100k🟢 │ │
│  │                    │          │          │         │ │
│  │DUGOVANJA (Pasiva)  │          │          │         │ │
│  │Dobavljači          │  245.000 │  270.000 │-25k 🟢 │ │
│  │                    │          │          │         │ │
│  │════════════════════════════════════════════════════│ │
│  │NETO CASH FLOW      │1.905.000 │1.780.000 │+125k🟢 │ │
│  │════════════════════════════════════════════════════│ │
│  └────────────────────┴──────────┴──────────┴─────────┘ │
│                                                          │
│  📊 Promene u %:                                         │
│  Cash:       +4.9%                                       │
│  Dugovanja:  -9.3%                                       │
│  Neto C/F:   +7.0%                                       │
└──────────────────────────────────────────────────────────┘
```

---

## Logika Obračuna

### Auto-Kalkulacije

```typescript
// Za detaljni unos
ukupno_cash = 
  potrazivanja_kupci +
  racun_intesa +
  racun_nlb +
  devizni_racun +
  gotovi_proizvodi +
  sirovine +
  ostalo

neto_cash_flow = ukupno_cash - dugovanja_dobavljaci
```

```typescript
// Za brzi unos
neto_cash_flow = ukupno_cash - dugovanja_dobavljaci
// (ukupno_cash se unosi direktno, ne računa se)
```

---

## Parsing Excel Fajla

### Biblioteka: `xlsx` (SheetJS)
```typescript
import * as XLSX from 'xlsx'

async function parseExcel(file: File) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  
  // Konvertuj u JSON
  const data = XLSX.utils.sheet_to_json(sheet)
  
  // Očekivana struktura:
  // [
  //   { Partner: 'Firma A', Kupci: 150000, Dobavljači: 0 },
  //   { Partner: 'Dobavljač X', Kupci: 0, Dobavljači: 80000 },
  //   ...
  // ]
  
  let sumaKupci = 0
  let sumaDobavljaci = 0
  
  const partneri = data.map(row => {
    const kupci = Number(row['Kupci'] || 0)
    const dobavljaci = Number(row['Dobavljači'] || 0)
    
    sumaKupci += kupci
    sumaDobavljaci += dobavljaci
    
    return {
      partner_naziv: row['Partner'],
      kupci_iznos: kupci,
      dobavljaci_iznos: dobavljaci
    }
  })
  
  return {
    partneri,
    sumaKupci,
    sumaDobavljaci
  }
}
```

---

## Mobile Layout

### Dashboard
- KPI kartice stack-ovane (jedna ispod druge)
- Grafikon pun širine
- Lista snimaka umesto tabele

### Novi snimak
- Forma vertical scroll
- Upload dugme pun širine
- Tabela pregleda horizontalno scroll-able

---

## Validacije

**Pri kreiranju:**
- Mesec i godina su obavezni
- Mesec + Godina kombinacija mora biti jedinstvena (ne možeš dva puta Januar 2025)
- Svi iznosi moraju biti >= 0
- Za detaljni unos: Excel fajl mora biti uploadovan

**Pri izmeni:**
- Samo Admin može menjati
- Ista validacija kao pri kreiranju

---

## Praktičan Workflow

### Scenario 1: Kreiranje Snimka Za Tekući Mesec (Detaljno)
```
1. Admin → Cash Flow → [+ Novi snimak]
2. Izabere: Januar 2025, Detaljni unos
3. Upload-uje partner-lista.xlsx
4. Vidi tabelu → proveri da nema grešaka
5. Unese: Račun Intesa 850.000, NLB 320.000, itd.
6. Sistem auto računa UKUPNO CASH i NETO
7. Klikne Sačuvaj
8. Snimak se pojavljuje na dashboard-u
```

### Scenario 2: Popunjavanje Istorije (Brzo)
```
1. Admin → Cash Flow → [+ Novi snimak]
2. Izabere: Januar 2023, Brzi unos
3. Unese: Aktiva 1.200.000, Pasiva 450.000
4. Sistem auto računa NETO = 750.000
5. Klikne Sačuvaj
6. Ponovi za Feb 2023, Mar 2023... do današnjeg dana
7. Grafikon sada prikazuje celu istoriju
```

### Scenario 3: Poređenje Meseci
```
1. Admin → Cash Flow → [Uporedi mesece]
2. Izabere: Januar 2025 vs Decembar 2024
3. Vidi side-by-side uporedbu svih komponenti
4. Vidi % promene
5. Identifikuje gde je došlo do rasta ili pada
```

---

## Grafikon — Line Chart (Recharts)

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

const data = snimci.map(s => ({
  mesec: `${s.mesec}/${s.godina}`,
  cash: s.ukupno_cash,
  dugovanja: s.dugovanja_dobavljaci,
  neto: s.neto_cash_flow
}))

<LineChart data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="mesec" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Line type="monotone" dataKey="cash" stroke="#2563EB" name="Cash" />
  <Line type="monotone" dataKey="dugovanja" stroke="#DC2626" name="Dugovanja" />
  <Line type="monotone" dataKey="neto" stroke="#16A34A" name="Neto C/F" strokeWidth={3} />
</LineChart>
```

---

## Napomene

- Excel fajl se čuva u Supabase Storage (`excel_file_url`)
- Download Excel dugme preuzima originalni fajl
- Admin može re-upload-ovati Excel ako je napravio grešku
- Soft delete ne postoji za snimke — Admin može obrisati snimak hard delete-om (pošto je finansijski podatak)
- Istorija izmena se ne prati (za sada) — ako Admin promeni snimak, ne znamo šta je bilo pre
