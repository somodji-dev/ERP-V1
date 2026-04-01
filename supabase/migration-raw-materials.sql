-- Matični podaci sirovina sa minimalnim količinama
CREATE TABLE IF NOT EXISTS raw_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  naziv text NOT NULL,
  jedinica text NOT NULL,        -- kg, kom, paleta, kutija, paket, kante, pakovanja
  min_kolicina numeric NOT NULL DEFAULT 0,
  aktivan boolean DEFAULT true,
  created_at timestamp DEFAULT now()
);

-- Popisi sirovina (svaki popis = snapshot svih količina na određeni datum)
CREATE TABLE IF NOT EXISTS inventory_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  datum date NOT NULL DEFAULT CURRENT_DATE,
  napomena text,
  created_by uuid REFERENCES auth.users,
  created_at timestamp DEFAULT now()
);

-- Stavke popisa (količina svake sirovine u okviru jednog popisa)
CREATE TABLE IF NOT EXISTS inventory_count_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_count_id uuid REFERENCES inventory_counts(id) ON DELETE CASCADE NOT NULL,
  raw_material_id uuid REFERENCES raw_materials(id) NOT NULL,
  kolicina numeric NOT NULL DEFAULT 0,
  UNIQUE(inventory_count_id, raw_material_id)
);

-- RLS
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_count_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read raw_materials" ON raw_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert raw_materials" ON raw_materials FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow update raw_materials" ON raw_materials FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow read inventory_counts" ON inventory_counts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert inventory_counts" ON inventory_counts FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow delete inventory_counts" ON inventory_counts FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow read inventory_count_items" ON inventory_count_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert inventory_count_items" ON inventory_count_items FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow update inventory_count_items" ON inventory_count_items FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Seed: matični podaci sirovina
INSERT INTO raw_materials (naziv, jedinica, min_kolicina) VALUES
  ('Skrob', 'paleta', 1),
  ('Modifikovani skrob', 'paleta', 1),
  ('Kikiriki', 'paleta', 1),
  ('Pirofosfat', 'kg', 50),
  ('Soda bikarbona', 'kg', 50),
  ('Šećer', 'kg', 50),
  ('So', 'kg', 100),
  ('Maltodekstoza', 'kg', 50),
  ('Slatka paprika', 'kg', 20),
  ('Ljuta paprika', 'kg', 10),
  ('Glutaminat', 'kg', 25),
  ('Kari', 'kg', 10),
  ('Oleorezin slatke', 'kutija', 1),
  ('Suncokretovo ulje', 'paket', 3),
  ('Palmino ulje', 'kanta', 20),
  ('Limunska kiselina', 'kg', 25),
  ('Crni luk prah', 'kg', 2),
  ('Braon šećer', 'kg', 5),
  ('Kumin', 'kg', 1),
  ('Aroma dima', 'kg', 2),
  ('Piment', 'kg', 2),
  ('Beli luk u prahu', 'kg', 2),
  ('Kutije', 'pakovanje', 30),
  ('Ozzy kese 1kg', 'kutija', 15),
  ('Srebrne kese', 'kutija', 1),
  ('Čaše 150g', 'kutija', 3),
  ('Posude 80g', 'kutija', 2),
  ('Posude 200g', 'kutija', 3),
  ('Poklopci 150g', 'kom', 5000),
  ('Poklopci 80g pikant', 'kom', 5000),
  ('Poklopci 80g BBQ', 'kom', 5000),
  ('Nalepnice čaše', 'kom', 5000);
