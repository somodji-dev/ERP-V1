# Modul Podešavanja — Plan

Plan modula **Podešavanja** bez implementacije. Koristi postojeće tabele `user_roles` i `user_permissions`; dodaju se samo tabele za podatke firme, activity log i eventualno backup metadata.

---

## 1. Šta modul obuhvata

| Sekcija | Opis |
|--------|------|
| **Korisnici i prava** | Lista korisnika, upravljanje nalozima (ko vidi koji modul), aktivacija/deaktivacija, reset lozinke |
| **Podaci firme** | Jedno mesto za unos podataka firme (naziv, PIB, adresa, itd.) |
| **Backup** | Mogućnost kreiranja backup-a podataka (export) |
| **Log aktivnosti** | Pregled i upis aktivnosti korisnika u sistemu |

Pristup: samo korisnici koji imaju **modul `podesavanja`** sa **`view = true`** vide link u navigaciji; za uređivanje korisnika/firme potrebno je **`edit = true`** (već definisano u `docs/auth-setup.md`).

---

## 2. Postojeće tabele (ne dodajemo nove za korisnike)

### `user_roles` (schema.sql)
- `user_id` → `auth.users(id)`
- `username`, `display_name`, `aktivan`, `employee_id`, `created_at`, `last_login`

### `user_permissions`
- `user_id`, `modul` (npr. `dashboard`, `radnici`, `cashflow`, `proizvodnja`, `podesavanja`)
- `view`, `create`, `edit`, `delete` (boolean po modulu)

**Moduli** za prava: `dashboard`, `radnici`, `cashflow`, `proizvodnja`, `podesavanja`.

RLS za `user_roles` i `user_permissions`: korisnik vidi samo svoj red; INSERT/UPDATE/DELETE samo ako ima `user_permissions.modul = 'podesavanja'` i `edit = true` (pogledaj `auth-setup.md` i `migration-auth-fix.sql`).

---

## 3. Struktura ruta i ekrana

```
/podesavanja                    → Landing (kratak pregled + linkovi na podsekcije)
/podesavanja/korisnici          → Korisnici i prava pristupa
/podesavanja/firma              → Podaci firme
/podesavanja/backup             → Backup podataka
/podesavanja/log                → Log aktivnosti
```

- **Landing**  
  Kartice ili lista: Korisnici, Podaci firme, Backup, Log aktivnosti. Svaka vodi na odgovarajuću podstranicu. Prikazati samo one za koje korisnik ima `view` na modul `podesavanja` (ceo modul je jedan „blok“, nema posebnih prava po podstranici u ovom planu).

- **Korisnici** (`/podesavanja/korisnici`)  
  - Lista: iz `user_roles` (join sa `auth.users` samo ako treba email/created_at za prikaz, inače samo user_roles).  
  - Kolone: prikazno ime, username, aktivan (da/ne), last login, akcije (Uredi prava, Deaktiviraj/aktiviraj, Reset lozinke).  
  - „Novi korisnik“: forma (username, display name, lozinka) → kreiranje u `auth.users` (admin API) + red u `user_roles` + podrazumevano prazna ili minimalna prava u `user_permissions`. Zatim otvaranje uređivanja prava za tog korisnika.  
  - Uredi prava: po modulima (dashboard, radnici, cashflow, proizvodnja, podesavanja) checkbox-i za view/create/edit/delete; čuvanje u `user_permissions` (replace po user_id).

- **Podaci firme** (`/podesavanja/firma`)  
  - Jedna forma (single-row podešavanje).  
  - Polja: naziv firme, PIB, matični broj, adresa, grad, poštanski broj, telefon, email (firme).  
  - Čuvanje u novoj tabeli `company_settings` (vidi ispod). Samo jedan red u bazi (singleton); RLS: read za sve authenticated, write samo za one sa `podesavanja` + `edit`.

- **Backup** (`/podesavanja/backup`)  
  - Dugme „Preuzmi backup“ (ili slično).  
  - Akcija: Server Action koji prikupi podatke iz svih važnih tabel (employees, work_logs, advances, bonuses, payroll_reports, cash_snapshots, excel_partners, work_orders + povezane, user_roles, user_permissions, company_settings, activity_log) i vrati ih kao JSON (ili generiše ZIP sa JSON/CSV fajlovima). Alternativa: link ka Supabase Dashboard uputstvu za backup (manje poželjno ako želimo sve u jednoj aplikaciji).  
  - Bez posebne tabele za backup u prvom koraku; ako kasnije bude „zakazani backup“, može se dodati tabela `backup_jobs` ili sl.

- **Log aktivnosti** (`/podesavanja/log`)  
  - Lista unosa iz tabele `activity_log` (vidi ispod): ko, kada, akcija, modul/entitet, opciono detalji.  
  - Filter po datumu, korisniku, modulu, tipu akcije. Sort po datumu (najnovije prvo).  
  - Samo pregled; bez brisanja loga iz UI-ja (admin može u bazi ako treba).

---

## 4. Nove tabele u bazi

### 4.1 `company_settings` (podaci firme)

Jedan red po tenantu (singleton). Npr.:

- `id` (uuid, PK)
- `naziv` (text)
- `pib` (text)
- `maticni_broj` (text)
- `adresa` (text)
- `grad` (text)
- `postanski_broj` (text)
- `telefon` (text)
- `email` (text)
- `created_at`, `updated_at` (timestamptz)

Opciono: `logo_url` ako kasnije bude upload logotipa.  
RLS: SELECT za authenticated; INSERT/UPDATE samo ako korisnik ima `user_permissions.modul = 'podesavanja'` i `edit = true`. Može i policy koja dozvoljava samo jedan red (npr. proviera da je `id` fiksan ili da broj redova <= 1).

### 4.2 `activity_log`

- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users, nullable ako se loguje i bez usera)
- `akcija` (text) — npr. `login`, `create`, `edit`, `delete`, `export`
- `modul` (text) — npr. `radnici`, `cashflow`, `proizvodnja`, `podesavanja`
- `entitet` (text) — npr. `employee`, `work_order`, `cash_snapshot`
- `entitet_id` (uuid, nullable)
- `detalji` (text ili jsonb, opciono) — slobodan opis ili JSON
- `created_at` (timestamptz)

Indeksi: `created_at`, `user_id`, `modul`, eventualno `(modul, created_at)` za brzi pregled po modulu.  
RLS: INSERT dozvoljen za authenticated (svaki korisnik može pisati svoj log, ili samo server-side akcije pisu u log); SELECT samo za korisnike sa `podesavanja` + `view`. DELETE ne dozvoliti (ili samo service role).

Upis u log: pozivati iz Server Actions nakon uspešne akcije (npr. kreiranje radnika, izmena naloga, login, export backup-a). Helper npr. `lib/activity-log.ts` → `insertActivityLog({ userId, action, module, entity, entityId, details })`.

---

## 5. Podešavanja i navigacija

- U sidebaru link „Podešavanja“ vodi na `/podesavanja` (već postoji u projektu).  
- Prikaz linka samo ako `canViewModule(permissions, 'podesavanja')`.  
- Na landing stranici `/podesavanja` prikazati kartice/linkove ka: Korisnici, Podaci firme, Backup, Log aktivnosti.

---

## 6. Redosled implementacije (preporuka)

1. **Migracije**  
   - Kreirati `company_settings` i `activity_log` + RLS i indeksi.

2. **Korisnici i prava**  
   - Stranica lista korisnika iz `user_roles` (+ prikaz prava iz `user_permissions`).  
   - Forma novi korisnik (auth.admin.createUser + user_roles + inicijalna user_permissions).  
   - Modal/drugi ekran za uređivanje prava po modulima (checkbox-i, čuvanje u `user_permissions`).  
   - Akcije: aktiviraj/deaktiviraj (update `user_roles.aktivan`), reset lozinke (auth.admin.updateUserById).

3. **Podaci firme**  
   - Stranica `/podesavanja/firma` sa formom; učitavanje jedinog reda iz `company_settings`; insert ili update u zavisnosti da li red postoji.

4. **Activity log**  
   - Helper za upis loga; dodati pozive u ključne Server Actions (npr. radnici, proizvodnja, cashflow, login).  
   - Stranica `/podesavanja/log` sa tabelom i filterima (datum, korisnik, modul, akcija).

5. **Backup**  
   - Server Action koji čita sve relevantne tabele i vraća JSON (ili generiše fajl za preuzimanje). Dugme na `/podesavanja/backup`.

6. **Landing**  
   - Ažurirati `/podesavanja` sa karticama i linkovima ka podstranicama.

---

## 7. Napomene

- **Jezički**: UI na srpskom (latinica); kod i varijable na engleskom; komentari po želji na srpskom.  
- **Tema**: samo svetla tema (bez dark mode).  
- **Brisanje**: kod korisnika koristiti soft-delete (npr. `user_roles.aktivan = false`), ne brisati redove iz `user_roles`/`user_permissions` ako želimo istoriju; eventualno sakriti deaktivirane u listi ili prikazati kao „Neaktivan“.  
- **Kreiranje korisnika**: zahteva Supabase Auth Admin API (`createUser`, `updateUserById`); proveriti da service role / env varijable budu dostupne samo na serveru.

Ovaj dokument služi kao jedinstveni plan za modul Podešavanja; implementacija treba da prati ovu strukturu i postojeće tabele `user_roles` i `user_permissions`.
