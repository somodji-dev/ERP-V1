-- =============================================================================
-- Rabatne skale: po blok (pakovanje) + 4 scenarija
-- Scenarios čuvamo kao JSONB niz (uvek 4 elementa) - simpler schema, atomic upsert
-- Zavisnost: migration-proizvodi.sql, migration-ambalaza.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS rabatne_skale_block (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  proizvod_id           uuid        NOT NULL REFERENCES proizvodi(id) ON DELETE CASCADE,
  selected_pakovanje_id uuid        REFERENCES ambalaza_pakovanja(id) ON DELETE SET NULL,
  position              integer     NOT NULL DEFAULT 0,
  scenarios             jsonb       NOT NULL DEFAULT '[
    {"osnovna_kg": 0, "kolicina_kg": 0, "rabat": 0},
    {"osnovna_kg": 0, "kolicina_kg": 0, "rabat": 0},
    {"osnovna_kg": 0, "kolicina_kg": 0, "rabat": 0},
    {"osnovna_kg": 0, "kolicina_kg": 0, "rabat": 0}
  ]'::jsonb,
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rabatne_skale_block_proizvod_idx
  ON rabatne_skale_block (proizvod_id, position);

ALTER TABLE rabatne_skale_block ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rabatne_skale_block_select"
  ON rabatne_skale_block FOR SELECT TO authenticated USING (true);

CREATE POLICY "rabatne_skale_block_insert"
  ON rabatne_skale_block FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "rabatne_skale_block_update"
  ON rabatne_skale_block FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "rabatne_skale_block_delete"
  ON rabatne_skale_block FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);
