-- =============================================================================
-- RLS policies za tabelu employees
-- Pokreni CELU skriptu od početka do kraja u Supabase SQL Editor.
-- Ako dobiješ "already exists": prvo pokreni samo blok ispod (DROP), pa ponovo celu skriptu.
-- =============================================================================

-- 1) UKLONI SVE POLICY-JE (pokreni ovaj blok ako "already exists")
DROP POLICY IF EXISTS "Allow read employees" ON employees;
DROP POLICY IF EXISTS "Allow insert employees" ON employees;
DROP POLICY IF EXISTS "Allow update employees" ON employees;

-- 2) KREIRAJ POLICY-JE
CREATE POLICY "Allow read employees"
  ON employees FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow insert employees"
  ON employees FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update employees"
  ON employees FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
