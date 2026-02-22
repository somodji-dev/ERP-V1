-- =============================================================================
-- RLS policies za user_roles i user_permissions
-- Bez ovih policy-ja ulogovani korisnik ne može da pročita svoj red pa getCurrentUser()
-- vraća null i aplikacija ga redirect-uje nazad na /login.
-- Pokreni u Supabase SQL Editor (jednom).
-- =============================================================================

-- user_roles: ulogovani korisnik može da vidi samo svoj red
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
CREATE POLICY "Users can view own role"
  ON user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- user_roles: može da ažurira samo svoj red (npr. last_login pri prijavi)
DROP POLICY IF EXISTS "Users can update own role" ON user_roles;
CREATE POLICY "Users can update own role"
  ON user_roles FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- user_permissions: ulogovani korisnik može da vidi samo svoja prava
DROP POLICY IF EXISTS "Users can view own permissions" ON user_permissions;
CREATE POLICY "Users can view own permissions"
  ON user_permissions FOR SELECT TO authenticated
  USING (user_id = auth.uid());
