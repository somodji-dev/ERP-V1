-- Tabela za mesečne prihode i rashode
CREATE TABLE IF NOT EXISTS monthly_financials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mesec integer NOT NULL CHECK (mesec BETWEEN 1 AND 12),
  godina integer NOT NULL,
  prihod numeric NOT NULL DEFAULT 0,
  rashod numeric NOT NULL DEFAULT 0,
  napomena text,
  created_by uuid REFERENCES auth.users,
  created_at timestamp DEFAULT now(),
  UNIQUE(mesec, godina)
);

ALTER TABLE monthly_financials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read monthly_financials"
  ON monthly_financials FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert monthly_financials"
  ON monthly_financials FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow update monthly_financials"
  ON monthly_financials FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow delete monthly_financials"
  ON monthly_financials FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);
