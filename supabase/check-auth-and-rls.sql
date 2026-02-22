-- =============================================================================
-- Provera auth + RLS (pokreni u Supabase SQL Editor)
-- 1) Proveri da li postoje policy-ji na user_roles i user_permissions
-- 2) Ponovo kreiraj policy-je ako treba
-- 3) Proveri da li postoji red u user_roles za admin (user_id iz Auth)
-- =============================================================================

-- A) Lista trenutnih policy-ja
SELECT 'Trenutni RLS policy-ji:' AS info;
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('user_roles', 'user_permissions')
ORDER BY tablename;

-- B) Ponovo kreiraj policy-je (bezbedno — DROP IF EXISTS pa CREATE)
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
CREATE POLICY "Users can view own role"
  ON user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own role" ON user_roles;
CREATE POLICY "Users can update own role"
  ON user_roles FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own permissions" ON user_permissions;
CREATE POLICY "Users can view own permissions"
  ON user_permissions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- C) Provera: redovi u user_roles (zameni UUID ako treba)
SELECT 'Redovi u user_roles:' AS info;
SELECT id, user_id, username, display_name, aktivan
FROM user_roles
ORDER BY username;

-- D) Provera: da li postoji red za admin (tvoj User UID)
SELECT 'Admin user_roles (user_id = d748504d-...):' AS info;
SELECT *
FROM user_roles
WHERE user_id = 'd748504d-625d-4a50-82f9-896f1491dafa';
