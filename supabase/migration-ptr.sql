-- =============================================================================
-- PTR: fiksni troškovi, parametri kalkulacije, miks pakovanja
-- Migracija sa localStorage (rio-erp-ptr-fiksni, rio-erp-ptr-params, rio-erp-ptr-miks)
-- Zavisnost: migration-proizvodi.sql, migration-ambalaza.sql
-- =============================================================================

-- 1. Fiksni troškovi po proizvodu
CREATE TABLE IF NOT EXISTS ptr_fiksni_stavke (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  proizvod_id uuid        NOT NULL REFERENCES proizvodi(id) ON DELETE CASCADE,
  naziv       text        NOT NULL,
  iznos       numeric     NOT NULL DEFAULT 0 CHECK (iznos >= 0),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ptr_fiksni_stavke_proizvod_idx ON ptr_fiksni_stavke (proizvod_id);

ALTER TABLE ptr_fiksni_stavke ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ptr_fiksni_stavke_select"  ON ptr_fiksni_stavke FOR SELECT TO authenticated USING (true);
CREATE POLICY "ptr_fiksni_stavke_insert"  ON ptr_fiksni_stavke FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ptr_fiksni_stavke_update"  ON ptr_fiksni_stavke FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ptr_fiksni_stavke_delete"  ON ptr_fiksni_stavke FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 2. PTR parametri (1-to-1 sa proizvodom)
CREATE TABLE IF NOT EXISTS ptr_params (
  proizvod_id    uuid        PRIMARY KEY REFERENCES proizvodi(id) ON DELETE CASCADE,
  prodajna_kg    numeric     NOT NULL DEFAULT 0 CHECK (prodajna_kg >= 0),
  kapacitet      numeric     NOT NULL DEFAULT 0 CHECK (kapacitet >= 0),
  kurs           numeric     NOT NULL DEFAULT 0 CHECK (kurs >= 0),
  selected_pakovanje_id uuid REFERENCES ambalaza_pakovanja(id) ON DELETE SET NULL,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ptr_params ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ptr_params_select"  ON ptr_params FOR SELECT TO authenticated USING (true);
CREATE POLICY "ptr_params_insert"  ON ptr_params FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ptr_params_update"  ON ptr_params FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ptr_params_delete"  ON ptr_params FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 3. Miks pakovanja po proizvodu
CREATE TABLE IF NOT EXISTS ptr_miks (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  proizvod_id  uuid        NOT NULL REFERENCES proizvodi(id) ON DELETE CASCADE,
  pakovanje_id uuid        NOT NULL REFERENCES ambalaza_pakovanja(id) ON DELETE CASCADE,
  kolicina_kg  numeric     NOT NULL DEFAULT 0 CHECK (kolicina_kg >= 0),
  prodajna_kg  numeric     NOT NULL DEFAULT 0 CHECK (prodajna_kg >= 0),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ptr_miks_proizvod_idx ON ptr_miks (proizvod_id);

ALTER TABLE ptr_miks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ptr_miks_select"  ON ptr_miks FOR SELECT TO authenticated USING (true);
CREATE POLICY "ptr_miks_insert"  ON ptr_miks FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ptr_miks_update"  ON ptr_miks FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ptr_miks_delete"  ON ptr_miks FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
