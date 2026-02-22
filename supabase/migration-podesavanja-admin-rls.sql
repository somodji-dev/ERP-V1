-- =============================================================================
-- RLS: korisnici sa podesavanja + edit mogu da vide i upravljaju svim user_roles
-- i user_permissions (lista korisnika, dodavanje, izmena prava, aktivacija).
-- Pokreni u Supabase SQL Editor nakon migration-user-auth-rls-policies.sql.
-- =============================================================================

-- Helper: korisnik ima podesavanja + edit
-- (koristimo isti uslov u svim policy-jima ispod)

-- user_roles: podesavanja admin može da vidi SVE redove (ne samo svoj)
DROP POLICY IF EXISTS "Podesavanja edit can view all user_roles" ON user_roles;
CREATE POLICY "Podesavanja edit can view all user_roles"
  ON user_roles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_id = auth.uid()
        AND modul = 'podesavanja'
        AND edit = true
    )
  );

-- user_roles: podesavanja admin može INSERT (novi korisnik)
DROP POLICY IF EXISTS "Podesavanja edit can insert user_roles" ON user_roles;
CREATE POLICY "Podesavanja edit can insert user_roles"
  ON user_roles FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_id = auth.uid()
        AND modul = 'podesavanja'
        AND edit = true
    )
  );

-- user_roles: podesavanja admin može UPDATE bilo kog reda (aktivan, display_name, itd.)
DROP POLICY IF EXISTS "Podesavanja edit can update user_roles" ON user_roles;
CREATE POLICY "Podesavanja edit can update user_roles"
  ON user_roles FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_id = auth.uid()
        AND modul = 'podesavanja'
        AND edit = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_id = auth.uid()
        AND modul = 'podesavanja'
        AND edit = true
    )
  );

-- user_permissions: podesavanja admin može da vidi SVE redove
DROP POLICY IF EXISTS "Podesavanja edit can view all user_permissions" ON user_permissions;
CREATE POLICY "Podesavanja edit can view all user_permissions"
  ON user_permissions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up2
      WHERE up2.user_id = auth.uid()
        AND up2.modul = 'podesavanja'
        AND up2.edit = true
    )
  );

-- user_permissions: podesavanja admin može INSERT/UPDATE/DELETE (upravljanje pravima)
DROP POLICY IF EXISTS "Podesavanja edit can manage user_permissions" ON user_permissions;
CREATE POLICY "Podesavanja edit can manage user_permissions"
  ON user_permissions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up2
      WHERE up2.user_id = auth.uid()
        AND up2.modul = 'podesavanja'
        AND up2.edit = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up2
      WHERE up2.user_id = auth.uid()
        AND up2.modul = 'podesavanja'
        AND up2.edit = true
    )
  );
