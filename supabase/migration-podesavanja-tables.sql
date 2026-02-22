-- =============================================================================
-- Modul Podešavanja: company_settings i activity_log
-- Referenca: docs/module-podesavanja.md
-- Pokreni u Supabase SQL Editor.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. company_settings (singleton — jedan red za podatke firme)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_settings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  naziv             text,
  pib               text,
  maticni_broj      text,
  adresa            text,
  grad              text,
  postanski_broj    text,
  telefon           text,
  email             text,
  logo_url          text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_settings_id ON company_settings (id);

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Svi ulogovani mogu da čitaju; samo oni sa podesavanja + edit mogu da menjaju
DROP POLICY IF EXISTS "Allow read company_settings" ON company_settings;
CREATE POLICY "Allow read company_settings"
  ON company_settings FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow manage company_settings for podesavanja edit" ON company_settings;
CREATE POLICY "Allow manage company_settings for podesavanja edit"
  ON company_settings FOR ALL TO authenticated
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

-- -----------------------------------------------------------------------------
-- 2. activity_log
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  akcija      text NOT NULL,
  modul       text NOT NULL,
  entitet     text,
  entitet_id  uuid,
  detalji     jsonb,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log (user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_modul ON activity_log (modul);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- INSERT: bilo ko ulogovan može da upiše (server-side akcije)
DROP POLICY IF EXISTS "Allow insert activity_log" ON activity_log;
CREATE POLICY "Allow insert activity_log"
  ON activity_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- SELECT: samo oni koji imaju podesavanja + view
DROP POLICY IF EXISTS "Allow read activity_log for podesavanja view" ON activity_log;
CREATE POLICY "Allow read activity_log for podesavanja view"
  ON activity_log FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_id = auth.uid()
        AND modul = 'podesavanja'
        AND view = true
    )
  );

-- DELETE ne dozvoljavamo (log se ne briše iz UI-ja)
