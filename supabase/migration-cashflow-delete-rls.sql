-- Dozvoli brisanje cash_snapshots (excel_partners se briše CASCADE).
DROP POLICY IF EXISTS "Allow delete cash_snapshots" ON cash_snapshots;
CREATE POLICY "Allow delete cash_snapshots" ON cash_snapshots FOR DELETE TO anon, authenticated USING (true);
