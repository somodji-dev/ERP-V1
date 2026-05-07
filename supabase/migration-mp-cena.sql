-- Krajnja maloprodajna cena po proizvodu i pakovanju
CREATE TABLE IF NOT EXISTS mp_cena_block (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proizvod_id           uuid NOT NULL REFERENCES proizvodi(id) ON DELETE CASCADE,
  selected_pakovanje_id uuid REFERENCES ambalaza_pakovanja(id) ON DELETE SET NULL,
  position              integer NOT NULL DEFAULT 0,
  prodajna_cena         numeric NOT NULL DEFAULT 0,
  rabat                 numeric NOT NULL DEFAULT 0,
  marza_distributera    numeric NOT NULL DEFAULT 0,
  marza_maloprodaje     numeric NOT NULL DEFAULT 0,
  pdv                   numeric NOT NULL DEFAULT 20,
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mp_cena_block_proizvod_idx
  ON mp_cena_block (proizvod_id, position);

ALTER TABLE mp_cena_block ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read mp_cena_block"
  ON mp_cena_block FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert mp_cena_block"
  ON mp_cena_block FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow update mp_cena_block"
  ON mp_cena_block FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow delete mp_cena_block"
  ON mp_cena_block FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);
