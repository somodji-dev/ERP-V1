-- =============================================================================
-- Proizvodi: root tabela za proračun cene proizvoda
-- Migracija sa localStorage (rio-erp-cene-proizvodi) na Supabase
-- Pokreni u Supabase SQL Editor
-- =============================================================================

CREATE TABLE IF NOT EXISTS proizvodi (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  naziv      text        NOT NULL,
  opis       text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS proizvodi_naziv_idx
  ON proizvodi (lower(naziv));

ALTER TABLE proizvodi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proizvodi_select"
  ON proizvodi FOR SELECT TO authenticated USING (true);

CREATE POLICY "proizvodi_insert"
  ON proizvodi FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "proizvodi_update"
  ON proizvodi FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "proizvodi_delete"
  ON proizvodi FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);
