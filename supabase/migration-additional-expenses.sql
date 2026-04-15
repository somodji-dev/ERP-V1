-- Dodatni troškovi: neposlovni troškovi i podizanje gotovine sa bankomata
CREATE TABLE IF NOT EXISTS additional_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mesec integer NOT NULL CHECK (mesec BETWEEN 1 AND 12),
  godina integer NOT NULL,
  neposlovni numeric NOT NULL DEFAULT 0,
  bankomat numeric NOT NULL DEFAULT 0,
  napomena text,
  created_by uuid REFERENCES auth.users,
  created_at timestamp DEFAULT now(),
  UNIQUE(mesec, godina)
);

ALTER TABLE additional_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read additional_expenses"
  ON additional_expenses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert additional_expenses"
  ON additional_expenses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow update additional_expenses"
  ON additional_expenses FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow delete additional_expenses"
  ON additional_expenses FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);
