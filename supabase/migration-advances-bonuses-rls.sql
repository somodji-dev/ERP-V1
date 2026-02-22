-- =============================================================================
-- RLS policy-ji za advances i bonuses (dozvoli čitanje i upis)
-- Pokreni u Supabase SQL Editor ako INSERT na ove tabele vraća RLS grešku.
-- =============================================================================

-- advances: SELECT + INSERT + DELETE
DROP POLICY IF EXISTS "Allow read advances" ON advances;
DROP POLICY IF EXISTS "Allow insert advances" ON advances;
DROP POLICY IF EXISTS "Allow delete advances" ON advances;
CREATE POLICY "Allow read advances" ON advances FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert advances" ON advances FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow delete advances" ON advances FOR DELETE TO anon, authenticated USING (true);

-- bonuses: SELECT + INSERT + DELETE
DROP POLICY IF EXISTS "Allow read bonuses" ON bonuses;
DROP POLICY IF EXISTS "Allow delete bonuses" ON bonuses;
DROP POLICY IF EXISTS "Allow insert bonuses" ON bonuses;
CREATE POLICY "Allow read bonuses" ON bonuses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert bonuses" ON bonuses FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow delete bonuses" ON bonuses FOR DELETE TO anon, authenticated USING (true);
