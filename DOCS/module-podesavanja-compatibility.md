# Kompatibilnost: spoljni prompt za modul Podešavanja vs plan i pravila

Pregled poklapanja i razlika između **spoljnog prompta** (4 sekcije: Korisnici, Info Firme, Backup, Aktivnosti Log) i **docs/module-podesavanja.md** + **docs/design-system.md** + **docs/ui-rules.md**. Bez kodiranja — samo razmatranje.

---

## 1. Šta je kompatibilno

### 1.1 Četiri sekcije
Oba pristupa imaju iste 4 bloka:
- **Korisnici** (lista, prava, novi korisnik, izmena)
- **Info firme** (jedan set podataka firme)
- **Backup** (export podataka)
- **Aktivnosti / Log** (pregled aktivnosti)

### 1.2 Postojeće tabele
Spoljni prompt nalaže da se **prvo ispitaju** `user_roles` i `user_permissions`. To je u skladu sa planom koji eksplicitno koristi ove dve tabele bez novih korisničkih tabela.

**Stvarna struktura u projektu** (supabase/schema.sql):

- **user_roles**  
  - Kolone: `id` (PK), `user_id` (UNIQUE, FK → auth.users(id)), `username`, `display_name`, `aktivan`, `employee_id`, `created_at`, `last_login`.  
  - Sve navedeno u promptu (username, display_name, employee_id, aktivan) postoji.

- **user_permissions**  
  - Kolone: `id` (PK), `user_id` (FK → **auth.users(id)**), `modul`, `view`, `"create"`, `edit`, `"delete"` (UNIQUE(user_id, modul)).  
  - U promptu je primer sa `user_id REFERENCES user_roles(user_id)` — u projektu je **user_id REFERENCES auth.users(id)**. Implementacija mora koristiti **auth.users(id)** kao referencu; to je u skladu sa planom u module-podesavanja.md.

- **Rezervisane reči**  
  - U bazi su kolone `"create"` i `"delete"` u navodnicima. Prompt ispravno predviđa quoted kolone u insertu/update-u.

### 1.3 Rute i fajlovi
Prompt predlaže:

- `/podesavanja` → glavni ekran (4 kartice)
- `/podesavanja/korisnici` (lista), `korisnici/novi`, `korisnici/[id]`, `korisnici/[id]/uredi`
- `/podesavanja/firma`
- `/podesavanja/backup`
- `/podesavanja/aktivnosti`

Plan u module-podesavanja.md ima:

- `/podesavanja/log` umesto `/podesavanja/aktivnosti`.

Razlika je samo u **nazivu rute za log**: `log` vs `aktivnosti`. Oba su prihvatljiva; dovoljno je odlučiti jedan (npr. `aktivnosti` za konzistentnost sa nazivom sekcije „Aktivnosti“ na srpskom).

Struktura fajlova (app, components, actions, lib) iz prompta je u skladu sa planom i sa strukturom projekta (App Router, shared/components, server actions).

### 1.4 Dizajn
Prompt koristi grid kartica, boje (#2563EB, zelena), kartice „white, rounded-xl, shadow-sm“, hover efekti. To je u skladu sa **design-system.md** (primary, success, card styling, shadow-sm). Glavni ekran sa 4 kartice i „Otvori →“ odgovara KPI/karticama iz design sistema.

### 1.5 Korisnici — forma i permissions matrix
Predložena polja (display_name, username, lozinka, employee_id, permissions po modulima) i 5 modula (dashboard, radnici, cashflow, proizvodnja, podesavanja) odgovaraju planu i strukturi `user_permissions`. Permissions matrix sa checkboxima za view/create/edit/delete je kompatibilan.

### 1.6 Kreiranje korisnika
Prompt koristi `signUp` u primeru; plan u module-podesavanja.md i auth-setup.md koristi **auth.admin.createUser** (admin API) jer se korisnici kreiraju iz admin panela, ne self-signup. Pri implementaciji treba koristiti **createUser** (admin), sa email formatom npr. `username@internal.erp` kako je u auth-setup.md.

---

## 2. Razlike koje treba uskladiti

### 2.1 user_permissions.user_id → auth.users, ne user_roles
U promptu je primer:

```sql
user_id uuid REFERENCES user_roles(user_id)
```

U projektu je:

```sql
user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE
```

**Zaključak:** Implementacija mora raditi sa **auth.users(id)**. Ne menjati FK na user_roles; referenca na auth.users je ispravna i u skladu sa planom.

### 2.2 RLS za company_settings i activity_log
U promptu je:

- `company_settings`: **ALTER TABLE company_settings DISABLE ROW LEVEL SECURITY**
- `activity_log`: **ALTER TABLE activity_log DISABLE ROW LEVEL SECURITY**

U **module-podesavanja.md** i **.cursorrules** predviđeno je da Supabase tabele imaju RLS gde ima smisla.

**Preporuka:** Ne isključivati RLS bez razloga.

- **company_settings:**  
  - SELECT za authenticated (svi ulogovani mogu da čitaju podatke firme).  
  - INSERT/UPDATE samo ako korisnik ima `user_permissions.modul = 'podesavanja'` i `edit = true`.  
  - Jedan red (singleton) može se obezbediti aplikaciono ili constraint-om.

- **activity_log:**  
  - INSERT: dozvoliti authenticated (ili samo server-side akcije).  
  - SELECT: samo korisnici sa `podesavanja` + `view`.  
  - DELETE: ne dozvoliti u RLS (ili samo service role).

Tako ostaje kompatibilno sa planom i pravilima projekta.

### 2.3 Info firme — „edit inline“ vs ui-rules
Prompt kaže za Info firme: **„FORMA (edit inline): Sva polja editable.“**

**ui-rules.md** (pravilo 11): **„Forme su u Sheet ili Dialog — Nikad Inline.“**

**Preporuka:** Ne raditi inline editovanje u tabeli. Forma za podatke firme može biti na stranici `/podesavanja/firma` kao **jedna kartica sa poljima i dugmetom „Sačuvaj“** (jedan red u bazi, nema tabele). To nije „inline edit u tabeli“, već jedna stranica-forma, što je u skladu sa ui-rules. Ako želiš strogo Sheet/Dialog, može se forma otvoriti u Sheet; za jedan singleton obično je dovoljno stranica sa formom.

### 2.4 company_settings — kolone
Plan: `naziv`, `pib`, `maticni_broj`, `adresa`, `grad`, `postanski_broj`, `telefon`, `email`, `created_at`, `updated_at`, opciono `logo_url`.

Prompt dodaje: `racun_intesa`, `racun_nlb`, `devizni_racun` (tekst za brojeve računa).

U schema.sql za cash_snapshots već postoje polja `racun_intesa`, `racun_nlb`, `devizni_racun` (numerički). Ako želimo **podatke firme** (naziv banke, broj računa za štampu na dokumentima), onda u `company_settings` ima smisla imati **tekst** za brojeve računa (npr. `racun_intesa text`). To je kompatibilno sa promptom; plan može da se proširi za ova tri polja.

### 2.5 activity_log — nazivi kolona
Plan: `akcija`, `entitet`, `entitet_id`, `detalji` (text ili jsonb).

Prompt: `action`, `table_name`, `record_id`, `details` (jsonb).

Oba rešenja su logična. Projekat koristi engleski u kodu; **Preporuka:** u bazi koristiti engleske nazive (`action`, `table_name`, `record_id`, `details`) da se izbegne mešanje jezika u kodu. U UI prikazivati prevod (npr. „Akcija“, „Tabela“, „ID zapisa“). Ako želiš konzistentno srpske nazive u bazi, onda `akcija`, `entitet`, `entitet_id`, `detalji` — dovoljno je jednu konvenciju primeniti u celoj migraciji.

### 2.6 activity_log.user_id
U planu: `user_id` → auth.users (nullable). U promptu: „user_id — FK prema user_roles“. U bazi je logično referencirati **auth.users(id)** (isti identitet kao u user_roles), tako da je plan u skladu sa projektom; prompt treba samo tumačiti kao „user koji je izvršio akciju“, što je auth.users(id).

### 2.7 Backup — Excel po modulima
Plan: jedan Server Action koji vraća JSON (ili ZIP). Prompt dodaje **export po modulima u Excel (XLSX)**.

**.cursorrules** navode Recharts i jsPDF za export; XLSX nije zabranjen. Ako želimo export u Excel, to je proširenje u odnosu na plan; kompatibilno je i može se uvesti u lib/podesavanja (ili sl.) i pozivati iz backup stranice. Plan može ostati „JSON/ZIP za sve“, a Excel po modulima kao opciono proširenje.

---

## 3. Rezime kompatibilnosti

| Aspekt | Kompatibilno? | Napomena |
|--------|----------------|----------|
| 4 sekcije (Korisnici, Firma, Backup, Log) | Da | Isto. |
| user_roles / user_permissions | Da | Koristiti stvarnu strukturu; user_id u permissions → auth.users(id). |
| Rute (korisnici, firma, backup) | Da | Jedina razlika: log vs aktivnosti — uskladiti naziv rute. |
| Glavni ekran (4 kartice) | Da | U skladu sa design-system. |
| Korisnici: lista, novi, [id], uredi | Da | Detaljnija struktura u promptu je korisna. |
| Permissions matrix (5 modula × 4 prava) | Da | Odgovara user_permissions. |
| company_settings tabela | Da | Uskladiti kolone (dodati racun_* ako treba); RLS uključen. |
| activity_log tabela | Da | Uskladiti naziv kolona (en/sr) i user_id → auth.users. |
| RLS | Delimično | Prompt isključuje RLS; preporuka je uključiti RLS kako u planu. |
| Info firme forma | Delimično | Ne „edit inline“ u tabeli; stranica-forma ili Sheet (ui-rules). |
| Backup (JSON + opciono Excel) | Da | JSON obavezno; Excel po modulima opciono. |
| design-system / ui-rules | Da | Primena pravila 11 (Sheet/Dialog), formatCurrency, AlertDialog, itd. |

---

## 4. Preporuka za jedinstveni plan

1. **Usvoji** strukturu ruta i fajlova iz prompta (uključujući `korisnici/novi`, `[id]`, `[id]/uredi`).
2. **Rutu za log** nazovi `/podesavanja/aktivnosti` (da odgovara naslovu „Aktivnosti“).
3. **Baza:**  
   - `user_id` u `user_permissions` i u `activity_log` → **auth.users(id)**.  
   - `company_settings`: uključiti RLS (read authenticated, write podesavanja+edit); dodati `grad`, `postanski_broj`, opciono `racun_intesa`, `racun_nlb`, `devizni_racun` (text).  
   - `activity_log`: RLS uključen (insert/select kako u planu); kolone po jednoj konvenciji (npr. action, table_name, record_id, details).
4. **Info firme:** forma na stranici `/podesavanja/firma` (kartica sa poljima + „Sačuvaj“), bez inline edit u tabeli.
5. **Backup:** Server Action za export svih podataka (JSON/ZIP); opciono druga akcija za export po modulima u Excel (XLSX).
6. **Kreiranje korisnika:** Auth Admin API `createUser` + insert u `user_roles` + insert u `user_permissions`, email `username@internal.erp`.

Sa ovim usklađivanjima, spoljni prompt je **kompatibilan** sa planom u module-podesavanja.md i sa docs/design-system.md i docs/ui-rules.md; izmene su navedene gore da implementacija bude konzistentna sa projektom.
