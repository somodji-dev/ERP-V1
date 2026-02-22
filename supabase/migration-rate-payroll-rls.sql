-- =============================================================================
-- RLS policy-ji za rate_settings i payroll_reports
-- Pokreni u Supabase SQL Editor ako generisanje platnog izveštaja ili upis
-- satnice izbacuje "row-level security policy" grešku.
-- =============================================================================

-- rate_settings: SELECT + INSERT (podešavanja satnica)
DROP POLICY IF EXISTS "Allow read rate_settings" ON rate_settings;
DROP POLICY IF EXISTS "Allow insert rate_settings" ON rate_settings;
CREATE POLICY "Allow read rate_settings" ON rate_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert rate_settings" ON rate_settings FOR INSERT TO anon, authenticated WITH CHECK (true);

-- payroll_reports: SELECT + INSERT + UPDATE + DELETE (platni izveštaji)
DROP POLICY IF EXISTS "Allow read payroll_reports" ON payroll_reports;
DROP POLICY IF EXISTS "Allow insert payroll_reports" ON payroll_reports;
DROP POLICY IF EXISTS "Allow update payroll_reports" ON payroll_reports;
DROP POLICY IF EXISTS "Allow delete payroll_reports" ON payroll_reports;
CREATE POLICY "Allow read payroll_reports" ON payroll_reports FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert payroll_reports" ON payroll_reports FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update payroll_reports" ON payroll_reports FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete payroll_reports" ON payroll_reports FOR DELETE TO anon, authenticated USING (true);
