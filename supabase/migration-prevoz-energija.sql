-- =============================================================================
-- Prevoz i energija: 1-to-1 sa proizvodom, mesečne vrednosti
-- Migracija sa localStorage (rio-erp-prevoz-energija-{productId})
-- Zavisnost: migration-proizvodi.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS prevoz_energija (
  proizvod_id   uuid        PRIMARY KEY REFERENCES proizvodi(id) ON DELETE CASCADE,
  prevoz_cena   numeric     NOT NULL DEFAULT 0 CHECK (prevoz_cena >= 0),
  prevoz_kg     numeric     NOT NULL DEFAULT 0 CHECK (prevoz_kg >= 0),
  struja_racun  numeric     NOT NULL DEFAULT 0 CHECK (struja_racun >= 0),
  struja_kg     numeric     NOT NULL DEFAULT 0 CHECK (struja_kg >= 0),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE prevoz_energija ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prevoz_energija_select"
  ON prevoz_energija FOR SELECT TO authenticated USING (true);

CREATE POLICY "prevoz_energija_insert"
  ON prevoz_energija FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "prevoz_energija_update"
  ON prevoz_energija FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "prevoz_energija_delete"
  ON prevoz_energija FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);
