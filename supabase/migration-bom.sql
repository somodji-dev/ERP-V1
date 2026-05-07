-- =============================================================================
-- BOM (Bill of Materials): stavke sirovina po proizvodu + ukupna količina
-- Migracija sa localStorage (rio-erp-bom-{productId}, rio-erp-bom-kg-{productId})
-- Zavisnost: migration-proizvodi.sql i migration-materijali-cene.sql
-- =============================================================================

-- 1. Ukupna količina za proračun BOM-a — 1-to-1 sa proizvodom
ALTER TABLE proizvodi
  ADD COLUMN IF NOT EXISTS bom_ukupna_kolicina numeric NOT NULL DEFAULT 1
  CHECK (bom_ukupna_kolicina > 0);

-- 2. Stavke BOM-a po proizvodu
CREATE TABLE IF NOT EXISTS bom_stavke (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  proizvod_id   uuid        NOT NULL REFERENCES proizvodi(id) ON DELETE CASCADE,
  materijal_id  uuid        REFERENCES materijali_cene(id) ON DELETE SET NULL,
  naziv         text        NOT NULL,
  udeo          numeric     NOT NULL DEFAULT 0 CHECK (udeo >= 0 AND udeo <= 1),
  cena_po_kg    numeric     NOT NULL DEFAULT 0 CHECK (cena_po_kg >= 0),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bom_stavke_proizvod_idx ON bom_stavke (proizvod_id);
CREATE INDEX IF NOT EXISTS bom_stavke_materijal_idx ON bom_stavke (materijal_id);

ALTER TABLE bom_stavke ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bom_stavke_select"
  ON bom_stavke FOR SELECT TO authenticated USING (true);

CREATE POLICY "bom_stavke_insert"
  ON bom_stavke FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "bom_stavke_update"
  ON bom_stavke FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "bom_stavke_delete"
  ON bom_stavke FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);
