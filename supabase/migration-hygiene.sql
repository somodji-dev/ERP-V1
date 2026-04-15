-- Higijena ček lista (Z-19)

-- Template stavki (admin menja)
CREATE TABLE IF NOT EXISTS hygiene_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  naziv text NOT NULL,
  grupa text NOT NULL CHECK (grupa IN ('radni_prostor', 'krug')),
  period text NOT NULL CHECK (period IN ('SP', 'NP', 'MP')),
  redosled integer NOT NULL DEFAULT 0,
  aktivan boolean DEFAULT true,
  created_at timestamp DEFAULT now()
);

-- Mesečne ček liste
CREATE TABLE IF NOT EXISTS hygiene_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mesec integer NOT NULL CHECK (mesec BETWEEN 1 AND 12),
  godina integer NOT NULL,
  verifikator_id uuid REFERENCES employees(id),
  verifikator_funkcija text,
  verifikator_datum date,
  napomena text,
  created_by uuid REFERENCES auth.users,
  created_at timestamp DEFAULT now(),
  UNIQUE(mesec, godina)
);

-- Pojedinačni događaji "urađeno"
CREATE TABLE IF NOT EXISTS hygiene_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid REFERENCES hygiene_checklists(id) ON DELETE CASCADE NOT NULL,
  template_id uuid REFERENCES hygiene_templates(id) NOT NULL,
  datum_uradjeno date NOT NULL,
  employee_id uuid REFERENCES employees(id),
  napomena text,
  created_by uuid REFERENCES auth.users,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hygiene_completions_checklist ON hygiene_completions(checklist_id);
CREATE INDEX IF NOT EXISTS idx_hygiene_completions_template ON hygiene_completions(template_id);

-- RLS
ALTER TABLE hygiene_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hygiene_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE hygiene_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read hygiene_templates" ON hygiene_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert hygiene_templates" ON hygiene_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow update hygiene_templates" ON hygiene_templates FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow read hygiene_checklists" ON hygiene_checklists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert hygiene_checklists" ON hygiene_checklists FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow update hygiene_checklists" ON hygiene_checklists FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow delete hygiene_checklists" ON hygiene_checklists FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow read hygiene_completions" ON hygiene_completions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert hygiene_completions" ON hygiene_completions FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow update hygiene_completions" ON hygiene_completions FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow delete hygiene_completions" ON hygiene_completions FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- Seed templates iz Z-19
INSERT INTO hygiene_templates (naziv, grupa, period, redosled) VALUES
  ('Pod u pogonu i magacinu', 'radni_prostor', 'SP', 1),
  ('Oprema', 'radni_prostor', 'SP', 2),
  ('Radne površine', 'radni_prostor', 'SP', 3),
  ('Alati u proizvodnji', 'radni_prostor', 'SP', 4),
  ('Kante', 'radni_prostor', 'SP', 5),
  ('Točeća mesta', 'radni_prostor', 'SP', 6),
  ('Dezobarijera - Doziranje', 'radni_prostor', 'SP', 7),
  ('Dezobarijera - Pranje', 'radni_prostor', 'SP', 8),
  ('Garderoba', 'radni_prostor', 'SP', 9),
  ('Sanitarni čvor', 'radni_prostor', 'SP', 10),
  ('Vrata', 'radni_prostor', 'NP', 11),
  ('Zidne pločice', 'radni_prostor', 'NP', 12),
  ('Prozori', 'radni_prostor', 'MP', 13),
  ('Plafon', 'radni_prostor', 'MP', 14),
  ('Krug', 'krug', 'SP', 15),
  ('Utovarna/istovarna mesta', 'krug', 'SP', 16);
