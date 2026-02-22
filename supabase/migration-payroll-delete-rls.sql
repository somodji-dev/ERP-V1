-- =============================================================================
-- Dozvoli brisanje platnih izveštaja (payroll_reports).
-- Pokreni u Supabase SQL Editor ako "Obriši izveštaj" ne briše red u tabeli.
-- =============================================================================

DROP POLICY IF EXISTS "Allow delete payroll_reports" ON payroll_reports;
CREATE POLICY "Allow delete payroll_reports" ON payroll_reports FOR DELETE TO anon, authenticated USING (true);
