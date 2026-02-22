# Brisanje seed podataka (sati, platni izveštaji)

Pokretanje u **Supabase → SQL Editor**. Zameni UUID i datume po potrebi.

## Unos sati (work_logs)

**Jedan radnik, jedan mesec:**
```sql
DELETE FROM work_logs
WHERE employee_id = 'uuid-radnika'
  AND datum >= '2026-02-01' AND datum <= '2026-02-29';
```

**Svi unosi sati:**
```sql
DELETE FROM work_logs;
```

## Platni izveštaji (payroll_reports)

**Jedan izveštaj (po ID-u):**
```sql
DELETE FROM payroll_reports WHERE id = 'uuid-izvestaja';
```

**Jedan radnik, jedan mesec:**
```sql
DELETE FROM payroll_reports
WHERE employee_id = 'uuid-radnika' AND mesec = 2 AND godina = 2026;
```

**Svi platni izveštaji:**
```sql
DELETE FROM payroll_reports;
```

## Kako naći UUID

- **Radnik:** Table Editor → employees → kolona `id`.
- **Platni izveštaj:** Table Editor → payroll_reports → kolona `id`, ili URL stranice `/plate/[id]`.
