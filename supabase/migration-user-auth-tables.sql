-- =============================================================================
-- Migracija: user_roles i user_permissions — kanonska struktura
-- Referenca: docs/db-auth-tables.md i supabase/schema.sql
--
-- Ova skripta je IDEMPOTENTNA:
-- - Kreira tabele ako ne postoje (pun set kolona).
-- - Ako tabele već postoje, dodaje samo eventualno nedostajuće kolone.
-- - Ne briše podatke.
--
-- Preduslov: Tabela "employees" mora postojati (user_roles.employee_id → employees.id).
-- Pokretanje: Supabase SQL Editor ili: psql -f migration-user-auth-tables.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. user_roles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  username        text NOT NULL UNIQUE,
  display_name    text NOT NULL,
  aktivan         boolean DEFAULT true,
  employee_id     uuid REFERENCES employees (id) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now(),
  last_login      timestamptz
);

-- Indeksi (ignoriši ako već postoje)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_username ON user_roles (username);

-- Dodaj kolone koje su mogle nedostajati u starim verzijama (bez brisanja podataka)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'aktivan') THEN
    ALTER TABLE user_roles ADD COLUMN aktivan boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'employee_id') THEN
    ALTER TABLE user_roles ADD COLUMN employee_id uuid REFERENCES employees (id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'created_at') THEN
    ALTER TABLE user_roles ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'last_login') THEN
    ALTER TABLE user_roles ADD COLUMN last_login timestamptz;
  END IF;
END $$;

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2. user_permissions (kolone "create" i "delete" u navodnicima — rezervisane reči)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_permissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  modul       text NOT NULL,
  view        boolean DEFAULT false,
  "create"    boolean DEFAULT false,
  edit        boolean DEFAULT false,
  "delete"    boolean DEFAULT false,
  CONSTRAINT uq_user_permissions_user_modul UNIQUE (user_id, modul)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions (user_id);

-- Dodaj kolone koje su mogle nedostajati (npr. "create"/"delete" ako su bile bez navodnika)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_permissions' AND column_name = 'view') THEN
    ALTER TABLE user_permissions ADD COLUMN view boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_permissions' AND column_name = 'create') THEN
    ALTER TABLE user_permissions ADD COLUMN "create" boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_permissions' AND column_name = 'edit') THEN
    ALTER TABLE user_permissions ADD COLUMN edit boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_permissions' AND column_name = 'delete') THEN
    ALTER TABLE user_permissions ADD COLUMN "delete" boolean DEFAULT false;
  END IF;
END $$;

ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 3. RLS policies (opciono — odkomentariši ako želiš da korisnici vide samo svoje)
-- =============================================================================
/*
-- user_roles: korisnici vide samo svoj red
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
CREATE POLICY "Users can view own role"
  ON user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Za upravljanje drugim korisnicima: samo oni koji imaju podesavanja + edit (vidi auth-setup.md)
-- CREATE POLICY "Only podesavanja edit can manage roles" ...

-- user_permissions: korisnici vide samo svoja prava
DROP POLICY IF EXISTS "Users can view own permissions" ON user_permissions;
CREATE POLICY "Users can view own permissions"
  ON user_permissions FOR SELECT TO authenticated
  USING (user_id = auth.uid());
*/

-- =============================================================================
-- Kraj migracije. Provera: SELECT * FROM user_roles LIMIT 1; SELECT * FROM user_permissions LIMIT 1;
-- =============================================================================
