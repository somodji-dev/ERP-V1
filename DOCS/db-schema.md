# db-schema.md — Baza Podataka

## Tabele i Relacije

### `employees`
```sql
id                    uuid PK DEFAULT gen_random_uuid()
ime                   text NOT NULL
prezime               text NOT NULL
jmbg                  text
pozicija              text
datum_zaposlenja      date
godisnji_fond         integer DEFAULT 20
aktivan               boolean DEFAULT true
napomena              text
created_at            timestamp DEFAULT now()
```

### `rate_settings` — Istorija satnica (nikad se ne briše)
```sql
id                    uuid PK DEFAULT gen_random_uuid()
tip                   text NOT NULL  -- 'redovni' | 'prekovremeno' | 'subota' | 'nedelja' | 'praznik'
iznos                 numeric NOT NULL
vazi_od               date NOT NULL
napomena              text
uneo_user_id          uuid REFERENCES auth.users
created_at            timestamp DEFAULT now()
```

### `work_logs` — Dnevni unos sati
```sql
id                    uuid PK DEFAULT gen_random_uuid()
employee_id           uuid REFERENCES employees NOT NULL
datum                 date NOT NULL
sati                  numeric NOT NULL
tip_sata              text NOT NULL  -- 'redovni' | 'prekovremeno' | 'subota' | 'nedelja' | 'praznik' | 'godisnji' | 'bolovanje' | 'odsustvo'
napomena              text
uneo_user_id          uuid REFERENCES auth.users
created_at            timestamp DEFAULT now()
```

### `advances` — Avansne isplate
```sql
id                    uuid PK DEFAULT gen_random_uuid()
employee_id           uuid REFERENCES employees NOT NULL
datum                 date NOT NULL
iznos                 numeric NOT NULL
mesec                 integer NOT NULL
godina                integer NOT NULL
napomena              text
uneo_user_id          uuid REFERENCES auth.users
created_at            timestamp DEFAULT now()
```

### `bonuses`
```sql
id                    uuid PK DEFAULT gen_random_uuid()
employee_id           uuid REFERENCES employees NOT NULL
mesec                 integer NOT NULL
godina                integer NOT NULL
iznos                 numeric NOT NULL
opis                  text
uneo_user_id          uuid REFERENCES auth.users
created_at            timestamp DEFAULT now()
```

### `payroll_reports`
```sql
id                    uuid PK DEFAULT gen_random_uuid()
employee_id           uuid REFERENCES employees NOT NULL
mesec                 integer NOT NULL
godina                integer NOT NULL
redovni_sati          numeric DEFAULT 0
prekovremeni_sati     numeric DEFAULT 0
subota_sati           numeric DEFAULT 0
nedelja_sati          numeric DEFAULT 0
praznik_sati          numeric DEFAULT 0
bruto_redovni         numeric DEFAULT 0
bruto_prekovremeno    numeric DEFAULT 0
bruto_subota          numeric DEFAULT 0
bruto_nedelja         numeric DEFAULT 0
bruto_praznik         numeric DEFAULT 0
ukupni_bonusi         numeric DEFAULT 0
ukupno_bruto          numeric DEFAULT 0
ukupni_avans          numeric DEFAULT 0
neto_za_isplatu       numeric DEFAULT 0
status                text DEFAULT 'nacrt'  -- 'nacrt' | 'finalizovan' | 'isplacen'
created_at            timestamp DEFAULT now()
```

### `cash_categories`
```sql
id                    uuid PK DEFAULT gen_random_uuid()
naziv                 text NOT NULL
tip                   text NOT NULL  -- 'prihod' | 'rashod'
boja                  text
aktivan               boolean DEFAULT true
created_at            timestamp DEFAULT now()
```

### `cash_entries`
```sql
id                    uuid PK DEFAULT gen_random_uuid()
category_id           uuid REFERENCES cash_categories NOT NULL
iznos                 numeric NOT NULL
datum                 date NOT NULL
opis                  text
dokument_url          text
uneo_user_id          uuid REFERENCES auth.users
created_at            timestamp DEFAULT now()
```

### `work_orders`
```sql
id                    uuid PK DEFAULT gen_random_uuid()
broj_naloga           text UNIQUE NOT NULL  -- auto: "RN-2025-001"
naziv                 text NOT NULL
opis                  text
datum_otvaranja       date DEFAULT CURRENT_DATE
rok                   date
status                text DEFAULT 'otvoren'  -- 'otvoren' | 'u_toku' | 'zavrsen' | 'otkazan'
prioritet             text DEFAULT 'normalan' -- 'nizak' | 'normalan' | 'visok' | 'hitan'
created_at            timestamp DEFAULT now()
```

### `work_order_items`
```sql
id                    uuid PK DEFAULT gen_random_uuid()
work_order_id         uuid REFERENCES work_orders NOT NULL
opis                  text NOT NULL
kolicina              numeric
jedinica              text
created_at            timestamp DEFAULT now()
```

### `work_order_hours`
```sql
id                    uuid PK DEFAULT gen_random_uuid()
work_order_id         uuid REFERENCES work_orders NOT NULL
employee_id           uuid REFERENCES employees NOT NULL
datum                 date NOT NULL
sati                  numeric NOT NULL
napomena              text
created_at            timestamp DEFAULT now()
```

### `user_roles`
```sql
id                    uuid PK DEFAULT gen_random_uuid()
user_id               uuid REFERENCES auth.users UNIQUE NOT NULL
rola                  text NOT NULL  -- 'admin' | 'menadzer' | 'radnik'
employee_id           uuid REFERENCES employees
created_at            timestamp DEFAULT now()
```

---

## Ključni Queriji

### Trenutna satnica za datum
```sql
SELECT iznos FROM rate_settings
WHERE tip = '[tip_sata]' AND vazi_od <= '[datum]'
ORDER BY vazi_od DESC
LIMIT 1
```

### Iskorišćeni godišnji odmor
```sql
SELECT COUNT(*) FROM work_logs
WHERE employee_id = '[id]'
AND tip_sata = 'godisnji'
AND EXTRACT(YEAR FROM datum) = [godina]
```
