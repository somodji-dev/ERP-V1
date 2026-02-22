# Modul Radnici & Plate — šta sadrži i kako izgleda

Pregled prema **module-radnici.md**, **design-system.md** i **ui-rules.md**.

---

## Šta je već urađeno (samo podaci o radnicima)

| Ruta | Stanje | Napomena |
|------|--------|----------|
| `/radnici` | ✅ | Lista, filter Svi/Aktivni/Neaktivni, Prevoz, Otvori profil, Uredi |
| `/radnici/novi` | ✅ | Forma (stranica), prevoz |
| `/radnici/[id]` | ✅ | Lični podaci + Prevoz; placeholder kartice za GO, Bolovanje, Statistika; link Generiši platni |
| `/radnici/[id]/uredi` | ✅ | Izmena podataka |

---

## Šta modul još treba da sadrži (prema module-radnici.md)

### 1. KPI kartice za modul Radnici (design-system.md)

Na **početku modula** (npr. iznad liste na `/radnici`) doc predviđa 4 KPI kartice:

| KPI | Ikona (Lucide) | Opis |
|-----|----------------|------|
| Aktivni radnici | `Users` | Broj radnika sa `aktivan = true` |
| Ukupno sati (mesec) | `Clock` | Suma sati iz `work_logs` za tekući mesec |
| Ukupno isplaćeno (mesec) | `Banknote` | Suma `neto_za_isplatu` iz `payroll_reports` za tekući mesec (status finalizovan/isplacen) |
| Prekovremeni sati | `AlertCircle` | Suma sati tipa `prekovremeno` za tekući mesec |

**Izgled (design-system):** bela kartica, `rounded-lg`, `shadow-sm`, padding 24px; gore naziv (text-sm, #6B7280) + ikona desno; sredina veliki broj (text-3xl, bold, #111827); dole opciono trend.

---

### 2. `/radnici/podesavanja` — Satnice (samo Admin)

- **Šta:** Prikaz trenutnih satnica po tipu (redovni, prekovremeno, subota, nedelja, praznik, topli_obrok) — poslednja vrednost po tipu; dugme „Izmeni” otvara **Dialog** (ne Sheet).
- **Izgled:** Jedna bela kartica (border #E5E7EB, shadow-sm), red po tipu: naziv + iznos (formatCurrency) + „Izmeni”; ispod opciono „Istorija promena” (link ili sekcija).
- **Dialog izmene (design-system):** overlay bg-black/40, kartica rounded-xl shadow-md p-6; polja: Nova cena (RSD), Važi od (datum), Napomena; footer: Otkaži | Sačuvaj.
- **Baza:** `rate_settings`; u schemi možda treba proširiti CHECK da uključi `'topli_obrok'`.

---

### 3. `/sati` — Mesečni unos radnih sati

- **Šta:** Izbor radnika (Select) + mesec/godina; **kalendar** dana u mesecu sa po danu: redovni sati, prekovremeni sati, checkbox GO, checkbox B; „Automatski popuni 8h radni dani”; pregled meseca (ukupno po tipu, radni dani, GO, bolovanje); tabele **Akontacije** i **Bonusi** za taj mesec; „Sačuvaj sve unose”.
- **Izgled:** Bela kartica, zaglavlje sa Select-ima i dugmetom; tabela/grid sa zaglavljem (PON–NED), redovi po danu (design-system: zaglavlje bg-gray-50, text-xs uppercase, redovi hover:bg-gray-50); posebne kartice za Pregled meseca, Akontacije, Bonusi (border #E5E7EB, padding 24px).
- **Baza:** `work_logs` (po danu, tip_sata, opciono je_godisnji/je_bolovanje), `advances`, `bonuses`.

---

### 4. `/plate` — Lista platnih izveštaja

- **Šta:** Tabela: radnik (ime i prezime), mesec, godina, status (nacrt / finalizovan / isplacen), akcije (Pogledaj, PDF, označi isplaćen).
- **Izgled:** Ista tabela stil kao na `/radnici` (design-system: zaglavlje bg-gray-50, hover #F4F5F7); status kao **badge** (design-system: nacrt = sivi, finalizovan = plavi, isplaćen = zeleni).

---

### 5. `/plate/novi` — Generisanje platnog izveštaja

- **Šta:** Select radnik + mesec + godina → „Generiši pregled” → prikaz obračuna (sati po tipu × satnica, dodaci, akontacije, neto); dugmad „Sačuvaj kao nacrt”, „Finalizuj”.
- **Izgled:** Bela kartica, forma na vrhu; ispod kartica „Pregled izveštaja” (tekst i brojevi, formatCurrency za iznose); footer dugmad (design-system: primary plavo za Finalizuj, outline za Otkaži).

---

### 6. `/plate/[id]` — Platni listić (prikaz + PDF)

- **Šta:** Prikaz istog sadržaja kao pregled (radnik, period, obračun sati, dodaci, akontacije, neto za isplatu); dugmad Štampaj, Export PDF, Označi kao isplaćen.
- **Izgled:** Kartica kao „štampani dokument” (clean, sa border); dugmad (design-system: primary / outline).

---

### 7. Profil radnika `/radnici/[id]` — dopuna (kad ima podataka)

- **GO (Jul–Jun):** Kartica sa fondom, iskorišćeno, preostalo (progress bar opciono); podaci iz `work_logs` (je_godisnji) i godisnji_fond.
- **Bolovanje:** Kartica sa brojem dana u godini; iz `work_logs` (je_bolovanje).
- **Statistika meseca:** Kartica sa redovni/prekovremeni/subota-nedelja sati za izabrani mesec; iz `work_logs`.
- **Generiši platni:** Već link na `/plate/novi?employeeId=...`; opciono izbor mesec/godina na profilu.

---

## Pravila iz ui-rules.md (obavezno u modulu)

| # | Pravilo | Gde se primenjuje u modulu |
|---|---------|----------------------------|
| **1** | **Numerički input — nikad default 0** | Godišnji fond, Prevoz, sati po danu (/sati), iznosi satnica (podešavanja), akontacije, bonusi, iznosi u platnom izveštaju. Uvek: `value={vrednost == null ? '' : vrednost}`, `placeholder="0"`, onChange vrati `null` za prazan string. |
| **2** | **Select — uvek placeholder** | Radnik na /sati i /plate/novi: `<SelectValue placeholder="Izaberi radnika..." />`. Mesec/godina: npr. "Izaberi mesec". |
| **3** | **Datum polja — uvek kontrolisano** | Datum zaposlenja (novi/uredi), Važi od (satnice), datum akontacije. `value={datum ?? ''}`, `onChange={(e) => setDatum(e.target.value || null)}`. |
| **4** | **Forme — reset nakon čuvanja** | Po uspešnom submit: `form.reset()`, zatvoriti Sheet/Dialog (`setOpen(false)`). Na stranici (novi radnik) već imamo redirect; u Sheet/Dialog reset + close. |
| **5** | **Dugmad — uvek loading state** | Svako submit dugme: `disabled={isLoading}`, u telu prikazati Loader2 + "Čuvanje..." dok traje akcija. Već na novi/uredi; obavezno na /sati, /plate/novi, dialozima. |
| **6** | **Brisanje — uvek AlertDialog** | Brisanje akontacije, bonusa, eventualno brisanje radnika ili platnog nacrta. Nikad samo "Obriši" bez potvrde. |
| **7** | **Prazne liste — uvek empty state** | Lista radnika (već ima), lista platnih izveštaja, akontacije/bonusi na /sati, lista satnica u podešavanjima. Ikona + kratak tekst + opciono dugme "Dodaj". |
| **8** | **Supabase greške — uvek toast** | Posle svakog insert/update/delete: pri grešci `toast({ title: "Greška", description: error.message, variant: "destructive" })`, pri uspehu kratak uspešan toast. |
| **9** | **Iznosi — uvek formatCurrency** | Svi prikazi RSD (prevoz, satnice, akontacije, bonusi, bruto, neto). Nikad sirovi broj niti ručno "RSD". Koristiti `formatCurrency()` iz lib/utils/format.ts. |
| **10** | **Tabele — uvek .order() u queriju** | employees, payroll_reports, work_logs, advances, bonuses, rate_settings — svaki fetch sa `.order(...)`. |
| **11** | **Forme u Sheet ili Dialog** | Novi radnik: doc kaže Sheet (trenutno stranica — OK dok se ne predesignira). Izmena satnice → **Dialog**. Dodaj akontaciju/bonus na /sati → Dialog ili Sheet. Nikad inline edit u tabeli. |
| **12** | **Greška validacije ispod polja** | Zod + react-hook-form: uvek `<FormMessage />` ispod polja (ili `{errors.ime && <p className="text-xs text-red-600">...</p>}`). Već na formama radnika; isto na /sati, /plate, podešavanjima. |

---

## Zajednička pravila iz design-system.md

- **Pozadina stranice:** #F4F5F7.
- **Kartice:** bela (#FFFFFF), border #E5E7EB, shadow-sm, rounded-lg, padding 24px.
- **Dugmad:** primary #2563EB, hover #1D4ED8; outline border #E5E7EB.
- **Tabele:** zaglavlje bg-[#F9FAFB], text-xs uppercase, #6B7280; redovi hover:bg-[#F4F5F7]; padding ćelija px-4 py-3.
- **Badge status:** zaplatiti pill (rounded-full, text-xs); nacrt = sivi, finalizovan = plavi, isplaćen = zeleni.
- **Input:** border #E5E7EB, focus ring plavi; greška border-red-400, text ispod text-xs text-red-500.
- **Iznosi:** uvek `formatCurrency()` (lib/utils/format.ts).

---

## Redosled implementacije (kratko)

1. **KPI kartice** na `/radnici` (brzo, odmah bolji izgled modula).
2. **Podešavanja** `/radnici/podesavanja` (satnice, rate_settings).
3. **Sati** `/sati` (work_logs, advances, bonuses) — najveći posao.
4. **Plate** `/plate`, `/plate/novi`, `/plate/[id]` (payroll_reports, logika obračuna, PDF).
5. **Profil** — zamena placeholder kartica pravim GO/Bolovanje/Statistika kada postoje podaci iz sati/plate.

Ako želiš, sledeći korak može biti: dodavanje KPI kartica na `/radnici` ili skica stranice `/radnici/podesavanja` po ovom pregledu.
