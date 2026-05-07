-- =============================================================================
-- RLS za tabele modula Proizvodnja (work_orders, work_order_employees, draziranje,
-- przenje, zacinjavane, pakovanje). Pokreni u Supabase SQL Editor.
-- =============================================================================

-- work_orders
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read work_orders" ON work_orders;
DROP POLICY IF EXISTS "Allow insert work_orders" ON work_orders;
DROP POLICY IF EXISTS "Allow update work_orders" ON work_orders;
DROP POLICY IF EXISTS "Allow delete work_orders" ON work_orders;
CREATE POLICY "Allow read work_orders" ON work_orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert work_orders" ON work_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow update work_orders" ON work_orders FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow delete work_orders" ON work_orders FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- work_order_employees
ALTER TABLE work_order_employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read work_order_employees" ON work_order_employees;
DROP POLICY IF EXISTS "Allow insert work_order_employees" ON work_order_employees;
DROP POLICY IF EXISTS "Allow delete work_order_employees" ON work_order_employees;
CREATE POLICY "Allow read work_order_employees" ON work_order_employees FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert work_order_employees" ON work_order_employees FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow delete work_order_employees" ON work_order_employees FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- draziranje
ALTER TABLE draziranje ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read draziranje" ON draziranje;
DROP POLICY IF EXISTS "Allow insert draziranje" ON draziranje;
DROP POLICY IF EXISTS "Allow update draziranje" ON draziranje;
DROP POLICY IF EXISTS "Allow delete draziranje" ON draziranje;
CREATE POLICY "Allow read draziranje" ON draziranje FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert draziranje" ON draziranje FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow update draziranje" ON draziranje FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow delete draziranje" ON draziranje FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- przenje
ALTER TABLE przenje ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read przenje" ON przenje;
DROP POLICY IF EXISTS "Allow insert przenje" ON przenje;
DROP POLICY IF EXISTS "Allow update przenje" ON przenje;
DROP POLICY IF EXISTS "Allow delete przenje" ON przenje;
CREATE POLICY "Allow read przenje" ON przenje FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert przenje" ON przenje FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow update przenje" ON przenje FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow delete przenje" ON przenje FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- zacinjavane
ALTER TABLE zacinjavane ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read zacinjavane" ON zacinjavane;
DROP POLICY IF EXISTS "Allow insert zacinjavane" ON zacinjavane;
DROP POLICY IF EXISTS "Allow update zacinjavane" ON zacinjavane;
DROP POLICY IF EXISTS "Allow delete zacinjavane" ON zacinjavane;
CREATE POLICY "Allow read zacinjavane" ON zacinjavane FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert zacinjavane" ON zacinjavane FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow update zacinjavane" ON zacinjavane FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow delete zacinjavane" ON zacinjavane FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- pakovanje
ALTER TABLE pakovanje ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read pakovanje" ON pakovanje;
DROP POLICY IF EXISTS "Allow insert pakovanje" ON pakovanje;
DROP POLICY IF EXISTS "Allow update pakovanje" ON pakovanje;
DROP POLICY IF EXISTS "Allow delete pakovanje" ON pakovanje;
CREATE POLICY "Allow read pakovanje" ON pakovanje FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert pakovanje" ON pakovanje FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow update pakovanje" ON pakovanje FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow delete pakovanje" ON pakovanje FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
