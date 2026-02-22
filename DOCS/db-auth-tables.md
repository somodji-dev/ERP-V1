# Referenca: tabele user_roles i user_permissions

Jedinstvena referenca za kolone i tipove — da izbegneš neslaganje između SQL-a i koda (TypeScript / Supabase client).

**SQL skripta za usklađivanje:** `supabase/migration-user-auth-tables.sql` — idempotentna (kreira tabele ako ne postoje, dodaje nedostajuće kolone; ne briše podatke). Pokreni u Supabase SQL Editor ako sumnjaš da struktura nije u skladu sa ovim dokumentom.

---

## 1. user_roles

**Namena:** Jedan red po korisniku (auth.users). Čuva username, prikazno ime, da li je aktivan, povezanog radnika (employees) i last_login.

| Kolona (SQL)   | Tip         | Nullable | Napomena |
|----------------|------------|----------|----------|
| `id`           | uuid       | NOT NULL | PK, gen_random_uuid() |
| `user_id`      | uuid       | NOT NULL | UNIQUE, FK → auth.users(id) ON DELETE CASCADE |
| `username`     | text       | NOT NULL | UNIQUE (npr. "admin") |
| `display_name` | text       | NOT NULL | Prikazano ime (npr. "Administrator") |
| `aktivan`      | boolean    | NOT NULL | DEFAULT true (soft-delete: false = ne može da se uloguje) |
| `employee_id`  | uuid       | NULL     | FK → employees(id) ON DELETE SET NULL |
| `created_at`   | timestamptz| NOT NULL | DEFAULT now() |
| `last_login`   | timestamptz| NULL     | Ažurira se pri uspešnom loginu |

**Indeksi:** `idx_user_roles_user_id`, `idx_user_roles_username`.

**TypeScript (lib/types/auth.ts):**
```ts
interface UserRole {
  id: string
  user_id: string
  username: string
  display_name: string
  aktivan: boolean
  employee_id: string | null
  created_at: string   // ISO
  last_login: string | null
}
```

**Važno:** U Supabase client koristiš iste nazive: `user_id`, `username`, `display_name`, `aktivan`, `employee_id`, `created_at`, `last_login`. Nema rezervisanih reči u ovim nazivima.

---

## 2. user_permissions

**Namena:** Prava po korisniku i modulu. Jedan red = jedna kombinacija (user_id, modul). UNIQUE(user_id, modul).

| Kolona (SQL) | Tip    | Nullable | Napomena |
|--------------|--------|----------|----------|
| `id`         | uuid   | NOT NULL | PK, gen_random_uuid() |
| `user_id`    | uuid   | NOT NULL | FK → auth.users(id) ON DELETE CASCADE |
| `modul`      | text   | NOT NULL | 'dashboard' \| 'radnici' \| 'cashflow' \| 'proizvodnja' \| 'podesavanja' |
| `view`       | boolean| NOT NULL | DEFAULT false — vidi modul u meniju i može da otvori stranice |
| `"create"`   | boolean| NOT NULL | DEFAULT false — može da dodaje nove stavke |
| `edit`       | boolean| NOT NULL | DEFAULT false — može da menja |
| `"delete"`   | boolean| NOT NULL | DEFAULT false — može da briše / stornira |

**Rezervisane reči u PostgreSQL:** Kolone `create` i `delete` moraju u SQL-u da budu u navodnicima: `"create"`, `"delete"`. U **Supabase JavaScript client** i dalje koristiš obične ključeve: `create`, `delete` (JSON koji šalješ/primećuješ ima keys `create` i `delete`). Ne treba nikakvo posebno mapiranje.

**TypeScript (lib/types/auth.ts):**
```ts
interface UserPermission {
  id: string
  user_id: string
  modul: ModulName
  view: boolean
  create: boolean   // u bazi kolona "create"
  edit: boolean
  delete: boolean   // u bazi kolona "delete"
}
```

**Primer inserta iz koda:**
```ts
await supabase.from('user_permissions').insert({
  user_id: userId,
  modul: 'radnici',
  view: true,
  create: true,
  edit: true,
  delete: false,
})
```

**Primer selecta:**  
`select('*')` ili `select('id, user_id, modul, view, create, edit, delete')` — u odgovoru će polja biti `create` i `delete` (bez navodnika u JSON-u).

---

## 3. Redosled zavisnosti

- `auth.users` — Supabase Auth (ne diraj u migracijama).
- `employees` — mora postojati pre `user_roles` (FK employee_id).
- `user_roles` — zavisna od auth.users i employees.
- `user_permissions` — zavisna od auth.users (ne od user_roles).

---

## 4. Šta proveriti ako nešto ne radi

1. **Greška tipa "column does not exist"**  
   Proveri u Supabase (Table Editor ili SQL): da li kolona zaista postoji i kako se zove. Za permissions moraju postojati kolone sa tačnim imenima, uključujući `"create"` i `"delete"` (u bazi su u navodnicima).

2. **Insert u user_permissions pada**  
   Proveri da li u CREATE TABLE koristiš `"create"` i `"delete"` (sa navodnicima). Ako si nekad kreirao tabelu sa `create` bez navodnika, PostgreSQL bi pri CREATE prijavio grešku; ako tabela postoji, verovatno su kolone već ispravno imenovane.

3. **RLS blokira upit**  
   Za pregled/izmenu drugih korisnika i prava potreban je RLS koji dozvoljava pristup onima koji imaju `user_permissions.modul = 'podesavanja'` i `edit = true`. Za samo „vidi svoj red“ dovoljne su policy-ji iz auth-setup.md (SELECT USING (user_id = auth.uid())).

---

## 5. Povezivanje sa auth-setup.md i schema.sql

- **docs/auth-setup.md** — opisi i primeri; u SQL primerima u dokumentu kolone `create`/`delete` mogu biti bez navodnika (u pravom SQL-u u bazi moraju biti `"create"` i `"delete"`).
- **supabase/schema.sql** — glavni izvor istine za CREATE TABLE; tamo su `"create"` i `"delete"` u navodnicima.
- Pri bilo kojoj novoj migraciji koristi iste nazive i tipove kao u ovom dokumentu i u schema.sql.
