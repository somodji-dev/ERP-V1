-- =============================================================================
-- Migracija: user_roles i user_permissions prema docs/auth-setup.md
-- Pokrenuti u Supabase SQL Editor nakon što postojeće tabele više nisu potrebne.
-- =============================================================================

-- 1. DROP stare tabele (prvo permissions jer zavisi od roles)
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;

-- 2. Kreiraj user_roles sa NOVOM strukturom iz auth-setup.md
CREATE TABLE user_roles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  username        text NOT NULL UNIQUE,
  display_name    text NOT NULL,
  aktivan         boolean DEFAULT true,
  employee_id     uuid REFERENCES employees (id) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now(),
  last_login      timestamptz
);

CREATE INDEX idx_user_roles_user_id ON user_roles (user_id);
CREATE INDEX idx_user_roles_username ON user_roles (username);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Kreiraj user_permissions sa NOVOM strukturom iz auth-setup.md
-- Napomena: "create" i "delete" su rezervisane reči u SQL, koriste se u navodnicima.
CREATE TABLE user_permissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  modul       text NOT NULL,
  view        boolean DEFAULT false,
  "create"    boolean DEFAULT false,
  edit        boolean DEFAULT false,
  "delete"    boolean DEFAULT false,
  CONSTRAINT uq_user_permissions_user_modul UNIQUE (user_id, modul)
);

CREATE INDEX idx_user_permissions_user_id ON user_permissions (user_id);

ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS policies (prema auth-setup.md) — opciono, odkomentarisati kada treba
-- =============================================================================
/*
-- user_roles: korisnici vide samo svoj red
CREATE POLICY "Users can view own role"
ON user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- user_permissions: korisnici vide samo svoja prava
CREATE POLICY "Users can view own permissions"
ON user_permissions FOR SELECT TO authenticated
USING (user_id = auth.uid());
*/
