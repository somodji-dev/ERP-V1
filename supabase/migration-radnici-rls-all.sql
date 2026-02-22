-- =============================================================================
-- RLS za sve tabele modula Radnici & Plate (rate_settings, work_logs, advances, bonuses, payroll_reports)
-- Pokreni u Supabase SQL Editor.
-- =============================================================================

-- rate_settings: dozvoli read + insert (za podešavanja satnica)
DROP POLICY IF EXISTS "Allow read rate_settings" ON rate_settings;
DROP POLICY IF EXISTS "Allow insert rate_settings" ON rate_settings;
CREATE POLICY "Allow read rate_settings" ON rate_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert rate_settings" ON rate_settings FOR INSERT TO anon, authenticated WITH CHECK (true);

-- work_logs: read + insert + delete (unos sati)
DROP POLICY IF EXISTS "Allow read work_logs" ON work_logs;
DROP POLICY IF EXISTS "Allow insert work_logs" ON work_logs;
DROP POLICY IF EXISTS "Allow delete work_logs" ON work_logs;
CREATE POLICY "Allow read work_logs" ON work_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert work_logs" ON work_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow delete work_logs" ON work_logs FOR DELETE TO anon, authenticated USING (true);

-- advances: read + insert + delete
DROP POLICY IF EXISTS "Allow read advances" ON advances;
DROP POLICY IF EXISTS "Allow insert advances" ON advances;
DROP POLICY IF EXISTS "Allow delete advances" ON advances;
CREATE POLICY "Allow read advances" ON advances FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert advances" ON advances FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow delete advances" ON advances FOR DELETE TO anon, authenticated USING (true);

-- bonuses: read + insert + delete
DROP POLICY IF EXISTS "Allow read bonuses" ON bonuses;
DROP POLICY IF EXISTS "Allow insert bonuses" ON bonuses;
DROP POLICY IF EXISTS "Allow delete bonuses" ON bonuses;
CREATE POLICY "Allow read bonuses" ON bonuses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert bonuses" ON bonuses FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow delete bonuses" ON bonuses FOR DELETE TO anon, authenticated USING (true);

-- payroll_reports: read + insert + update
DROP POLICY IF EXISTS "Allow read payroll_reports" ON payroll_reports;
DROP POLICY IF EXISTS "Allow insert payroll_reports" ON payroll_reports;
DROP POLICY IF EXISTS "Allow update payroll_reports" ON payroll_reports;
CREATE POLICY "Allow read payroll_reports" ON payroll_reports FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert payroll_reports" ON payroll_reports FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update payroll_reports" ON payroll_reports FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
