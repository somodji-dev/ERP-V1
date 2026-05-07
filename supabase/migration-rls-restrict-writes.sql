-- =============================================================================
-- RLS: Ograničavanje INSERT/UPDATE/DELETE na ulogovane korisnike (auth.uid() IS NOT NULL).
-- Rešava Supabase linter upozorenja "RLS Policy Always True".
-- Pokreni u Supabase SQL Editor NAKON ostalih RLS migracija.
-- =============================================================================

-- activity_log
DROP POLICY IF EXISTS "Allow insert activity_log" ON activity_log;
CREATE POLICY "Allow insert activity_log"
  ON activity_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- advances
DROP POLICY IF EXISTS "Allow insert advances" ON advances;
DROP POLICY IF EXISTS "Allow delete advances" ON advances;
CREATE POLICY "Allow insert advances" ON advances FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow delete advances" ON advances FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- bonuses
DROP POLICY IF EXISTS "Allow insert bonuses" ON bonuses;
DROP POLICY IF EXISTS "Allow delete bonuses" ON bonuses;
CREATE POLICY "Allow insert bonuses" ON bonuses FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow delete bonuses" ON bonuses FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- cash_snapshots
DROP POLICY IF EXISTS "Allow insert cash_snapshots" ON cash_snapshots;
DROP POLICY IF EXISTS "Allow update cash_snapshots" ON cash_snapshots;
DROP POLICY IF EXISTS "Allow delete cash_snapshots" ON cash_snapshots;
CREATE POLICY "Allow insert cash_snapshots" ON cash_snapshots FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow update cash_snapshots" ON cash_snapshots FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow delete cash_snapshots" ON cash_snapshots FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- employees
DROP POLICY IF EXISTS "Allow insert employees" ON employees;
DROP POLICY IF EXISTS "Allow update employees" ON employees;
CREATE POLICY "Allow insert employees" ON employees FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow update employees" ON employees FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- excel_partners
DROP POLICY IF EXISTS "Allow insert excel_partners" ON excel_partners;
DROP POLICY IF EXISTS "Allow delete excel_partners" ON excel_partners;
CREATE POLICY "Allow insert excel_partners" ON excel_partners FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow delete excel_partners" ON excel_partners FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- payroll_reports
DROP POLICY IF EXISTS "Allow insert payroll_reports" ON payroll_reports;
DROP POLICY IF EXISTS "Allow update payroll_reports" ON payroll_reports;
DROP POLICY IF EXISTS "Allow delete payroll_reports" ON payroll_reports;
CREATE POLICY "Allow insert payroll_reports" ON payroll_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow update payroll_reports" ON payroll_reports FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow delete payroll_reports" ON payroll_reports FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- rate_settings
DROP POLICY IF EXISTS "Allow insert rate_settings" ON rate_settings;
CREATE POLICY "Allow insert rate_settings" ON rate_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- work_logs
DROP POLICY IF EXISTS "Allow insert work_logs" ON work_logs;
DROP POLICY IF EXISTS "Allow delete work_logs" ON work_logs;
CREATE POLICY "Allow insert work_logs" ON work_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow delete work_logs" ON work_logs FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
