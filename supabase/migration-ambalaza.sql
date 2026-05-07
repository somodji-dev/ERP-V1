-- =============================================================================
-- Ambalaža: pakovanja i njihove stavke (ulazne komponente pakovanja)
-- Migracija sa localStorage (rio-erp-ambalaza-{productId}) na Supabase
-- Zavisnost: migration-proizvodi.sql mora biti pokrenuta prvo
-- =============================================================================

CREATE TABLE IF NOT EXISTS ambalaza_pakovanja (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  proizvod_id uuid        NOT NULL REFERENCES proizvodi(id) ON DELETE CASCADE,
  naziv       text        NOT NULL,
  masa        numeric     NOT NULL DEFAULT 0 CHECK (masa >= 0),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ambalaza_pakovanja_proizvod_idx
  ON ambalaza_pakovanja (proizvod_id);

CREATE TABLE IF NOT EXISTS ambalaza_stavke (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pakovanje_id uuid        NOT NULL REFERENCES ambalaza_pakovanja(id) ON DELETE CASCADE,
  naziv        text        NOT NULL,
  kolicina     numeric     NOT NULL DEFAULT 0 CHECK (kolicina >= 0),
  jedinica     text        NOT NULL DEFAULT 'kom',
  cena         numeric     NOT NULL DEFAULT 0 CHECK (cena >= 0),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ambalaza_stavke_pakovanje_idx
  ON ambalaza_stavke (pakovanje_id);

ALTER TABLE ambalaza_pakovanja ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambalaza_stavke    ENABLE ROW LEVEL SECURITY;

-- ambalaza_pakovanja
CREATE POLICY "ambalaza_pakovanja_select"
  ON ambalaza_pakovanja FOR SELECT TO authenticated USING (true);

CREATE POLICY "ambalaza_pakovanja_insert"
  ON ambalaza_pakovanja FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "ambalaza_pakovanja_update"
  ON ambalaza_pakovanja FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "ambalaza_pakovanja_delete"
  ON ambalaza_pakovanja FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ambalaza_stavke
CREATE POLICY "ambalaza_stavke_select"
  ON ambalaza_stavke FOR SELECT TO authenticated USING (true);

CREATE POLICY "ambalaza_stavke_insert"
  ON ambalaza_stavke FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "ambalaza_stavke_update"
  ON ambalaza_stavke FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "ambalaza_stavke_delete"
  ON ambalaza_stavke FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);
