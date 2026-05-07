-- =============================================================================
-- Radna snaga: grupe radnika po proizvodu + globalno opterećenje plata
-- Migracija sa localStorage (rio-erp-radna-snaga-{productId}, rio-erp-radna-snaga-opterecenje)
-- Zavisnost: migration-proizvodi.sql
-- =============================================================================

-- 1. Globalni parametri modula proračuna cena (singleton)
CREATE TABLE IF NOT EXISTS cene_config (
  id                        integer     PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  opterecenje_plata_procenat numeric     NOT NULL DEFAULT 0 CHECK (opterecenje_plata_procenat >= 0 AND opterecenje_plata_procenat <= 500),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

INSERT INTO cene_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE cene_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cene_config_select"
  ON cene_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "cene_config_update"
  ON cene_config FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Grupe radnika po proizvodu — composite PK
CREATE TABLE IF NOT EXISTS radna_snaga_grupa (
  proizvod_id  uuid        NOT NULL REFERENCES proizvodi(id) ON DELETE CASCADE,
  grupa_key    text        NOT NULL,
  grupa_label  text        NOT NULL,
  broj         integer     NOT NULL DEFAULT 0 CHECK (broj >= 0),
  neto         numeric     NOT NULL DEFAULT 0 CHECK (neto >= 0),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (proizvod_id, grupa_key)
);

CREATE INDEX IF NOT EXISTS radna_snaga_grupa_proizvod_idx ON radna_snaga_grupa (proizvod_id);

ALTER TABLE radna_snaga_grupa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "radna_snaga_grupa_select"
  ON radna_snaga_grupa FOR SELECT TO authenticated USING (true);

CREATE POLICY "radna_snaga_grupa_insert"
  ON radna_snaga_grupa FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "radna_snaga_grupa_update"
  ON radna_snaga_grupa FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "radna_snaga_grupa_delete"
  ON radna_snaga_grupa FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);
