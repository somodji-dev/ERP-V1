CREATE TABLE IF NOT EXISTS materijali_cene (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  naziv      text    NOT NULL,
  cena       numeric NOT NULL DEFAULT 0 CHECK (cena >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS materijali_cene_naziv_idx
  ON materijali_cene (lower(naziv));

ALTER TABLE materijali_cene ENABLE ROW LEVEL SECURITY;

CREATE POLICY "materijali_cene_select"
  ON materijali_cene FOR SELECT TO authenticated USING (true);

CREATE POLICY "materijali_cene_insert"
  ON materijali_cene FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "materijali_cene_update"
  ON materijali_cene FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "materijali_cene_delete"
  ON materijali_cene FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);
