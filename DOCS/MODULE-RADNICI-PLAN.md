# Plan modula Radnici & Plate

Jedan dokument koji mapira **ceo modul** prema `module-radnici.md`, redosled implementacije i usklađenost sa bazom.

---

## 1. Rute i ekrani (pregled)

| Ruta | Opis | Prioritet |
|------|------|-----------|
| `/radnici` | Lista radnika — tabela, filter Svi/Aktivni/Neaktivni, Prevoz kolona, Akcije: Otvori profil, Uredi, + Novi radnik | 1 |
| `/radnici/novi` | Dodavanje novog radnika (stranica ili Sheet sa forme) | 1 |
| `/radnici/[id]` | Profil radnika — Lični podaci, GO, Bolovanje, Statistika meseca, Generiši platni izveštaj | 1 |
| `/radnici/[id]/uredi` | Izmena podataka radnika (forma kao novi) | 1 |
| `/radnici/podesavanja` | Satnice i globalna podešavanja (samo Admin) | 2 |
| `/sati` | Mesečni unos radnih sati (kalendar, akontacije, bonusi) | 2 |
| `/plate` | Lista platnih izveštaja | 2 |
| `/plate/novi` | Generisanje novog platnog izveštaja (radnik + mesec, pregled, nacrt/finalizuj) | 2 |
| `/plate/[id]` | Prikaz platnog listića, Štampaj, Export PDF, Označi isplaćen | 2 |

---

## 2. Baza — usklađenost sa `module-radnici.md`

### 2.1 `employees`
- **U schemi trenutno:** ime, prezime, jmbg, pozicija, datum_zaposlenja, godisnji_fond, aktivan, napomena.
- **U docu dodatno:** `nadoknada_prevoz` (numeric DEFAULT 0).
- **Akcija:** migracija — dodati kolonu `nadoknada_prevoz numeric DEFAULT 0`.

### 2.2 `rate_settings`
- **U schemi:** CHECK(tip IN ('redovni','prekovremeno','subota','nedelja','praznik')).
- **U docu:** i `'topli_obrok'`.
- **Akcija:** migracija — proširiti CHECK da uključi `'topli_obrok'`.

### 2.3 `work_logs`
- **U schemi:** nema kolona `je_godisnji`, `je_bolovanje`; tip_sata uključuje 'godisnji','bolovanje','odsustvo'.
- **U docu:** kolone `je_godisnji boolean DEFAULT false`, `je_bolovanje boolean DEFAULT false` (evidencija po danu).
- **Akcija:** migracija — dodati `je_godisnji`, `je_bolovanje`.

### 2.4 `payroll_reports`
- **U schemi:** ukupni_bonusi; nema broj_radnih_dana, topli_obrok_iznos, prevoz_iznos.
- **U docu:** broj_radnih_dana, topli_obrok_iznos, prevoz_iznos, bonusi_ukupno.
- **Akcija:** migracija — dodati kolone (ako nedostaju) i uskladiti naziv bonusi_ukupno vs ukupni_bonusi (ostaviti jedan naziv u bazi i mapirati u kodu).

---

## 3. Deljeni resursi (pre implementacije)

- **`lib/types/radnici.ts`** — tipovi: Employee, RateSetting, WorkLog, Advance, Bonus, PayrollReport (prema docu i bazi).
- **`lib/utils.ts`** — `formatCurrency(iznos: number): string` (sr-RS, RSD) ako već ne postoji.
- **`lib/radnici/` (opciono)** — helperi: `getSatnicaZaDatum(supabase, tip, datum)`, `getGOPeriod(date)` (Jul–Jun), broj radnih dana za mesec.

---

## 4. Redosled implementacije

### Faza 1 — Radnici (lista, novi, profil, uredi)
1. Migracija: `employees.nadoknada_prevoz`.
2. Tipovi u `lib/types/radnici.ts` (Employee sa nadoknada_prevoz).
3. **Lista `/radnici`:**
   - Fetch svih radnika (bez filtera po aktivan u query — filter u UI).
   - Kolone: Ime i prezime, Pozicija, Prevoz (✓ ako nadoknada_prevoz > 0, inače prazno), Status (Aktivan/Neaktivan), Akcije (Otvori profil, Uredi).
   - Filter: Svi / Aktivni / Neaktivni (tabs ili select).
   - Dugme + Novi radnik → link na `/radnici/novi` (ili otvaranje Sheet-a ako se odluči).
4. **Novi radnik `/radnici/novi`:** forma (ime, prezime, jmbg, pozicija, datum_zaposlenja, godisnji_fond, nadoknada_prevoz, aktivan, napomena), Server Action insert, redirect na profil ili listu.
5. **Profil `/radnici/[id]`:** Lični podaci (uključujući Prevoz: X RSD ili "nema"); sekcije GO (Jul–Jun), Bolovanje (godina), Statistika izabranog meseca; dugme "Generiši platni izveštaj za [Mesec] [Godina]".
6. **Uredi `/radnici/[id]/uredi`:** ista forma kao novi, prefilled, Server Action update.

### Faza 2 — Podešavanja i Sati
7. Migracije: `rate_settings` (topli_obrok), `work_logs` (je_godisnji, je_bolovanje).
8. **Podešavanja `/radnici/podesavanja`:** lista satnica (poslednja vrednost po tipu), modal za izmenu (nova cena, važi_od, napomena).
9. **Sati `/sati`:** izbor radnika + mesec/godina; kalendar (redovni/prekovremeni po danu, GO/B checkboxi); pregled meseca; akontacije i bonusi za mesec; čuvanje (brisanje work_logs za mesec + insert novih, advances/bonuses posebno).

### Faza 3 — Plate
10. Migracija: `payroll_reports` (broj_radnih_dana, topli_obrok_iznos, prevoz_iznos ako nedostaju).
11. **Lista `/plate`:** tabela platnih izveštaja (radnik, mesec, godina, status, akcije).
12. **Novi `/plate/novi`:** radnik + mesec/godina → generisanje pregleda (logika iz doca) → Sačuvaj nacrt / Finalizuj.
13. **Prikaz `/plate/[id]`:** prikaz izveštaja, Štampaj, Export PDF (npr. jsPDF), Označi kao isplaćen.

---

## 5. Fajlovi po fazi (checklist)

### Faza 1 (implementirano)
- [x] `supabase/migration-radnici-modul.sql` — dodaje `employees.nadoknada_prevoz`
- [x] `lib/types/radnici.ts`
- [x] `lib/utils/format.ts` — formatCurrency
- [x] `app/(dashboard)/radnici/page.tsx` — lista + filter Svi/Aktivni/Neaktivni + Prevoz + Otvori profil / Uredi
- [x] `components/radnici/RadniciListClient.tsx` — client filter + tabela
- [x] `app/(dashboard)/radnici/novi/page.tsx` — forma + nadoknada_prevoz
- [x] `app/actions/radnici.ts` — createEmployeeAction, updateEmployeeAction
- [x] `app/(dashboard)/radnici/[id]/page.tsx` — profil (lični + Prevoz, placeholder GO/Bolovanje/Statistika, Generiši platni)
- [x] `app/(dashboard)/radnici/[id]/uredi/page.tsx` — server fetch + `UrediRadnikForm`
- [x] `components/radnici/UrediRadnikForm.tsx` — forma izmene
- [x] RLS (SELECT, INSERT, UPDATE) u `migration-employees-rls.sql`

**Napomena:** Pokreni `migration-radnici-modul.sql` u Supabase da bi kolona `nadoknada_prevoz` postojala; inače će insert/update radnika prijaviti grešku.

### Faza 2
- [ ] Migracije: rate_settings (topli_obrok), work_logs (je_godisnji, je_bolovanje)
- [ ] `lib/radnici/satnice.ts` (getSatnicaZaDatum, getGOPeriod)
- [ ] `app/(dashboard)/radnici/podesavanja/page.tsx`
- [ ] `app/(dashboard)/sati/page.tsx` + akcije (work_logs, advances, bonuses)

### Faza 3
- [ ] Migracija payroll_reports (kolone po docu)
- [ ] `app/(dashboard)/plate/page.tsx`
- [ ] `app/(dashboard)/plate/novi/page.tsx`
- [ ] `app/(dashboard)/plate/[id]/page.tsx` + PDF export

---

## 6. Pravila iz `.cursorrules` i `ui-rules.md`

- Supabase pozivi server-side (Server Components / Server Actions).
- Forme: Zod + react-hook-form, greške ispod polja, nikad default 0 u number input (placeholder).
- Iznosi: uvek `formatCurrency()`, tabele uvek `.order()`.
- Empty state i loading (Suspense/skeleton) gde ima smisla.
- Jezik: UI na srpskom, kod na engleskom.

---

Kada plan odobriš, implementacija može ići redom: prvo Faza 1 u celosti (bez prepravljanja iz delova), zatim Faza 2, pa Faza 3.
