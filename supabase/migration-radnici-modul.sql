-- =============================================================================
-- Radnici modul — kolona za prevoz (docs/module-radnici.md)
-- Pokreni u Supabase SQL Editor. Možeš ponovo pokrenuti (IF NOT EXISTS).
-- =============================================================================

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS nadoknada_prevoz numeric DEFAULT 0;
