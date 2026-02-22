-- Cash Flow modul — tabele po DOCS/module-cashflow.md
-- Zamenjuje postojeću strukturu cash_snapshots i excel_partners.

-- 1. Ukloni staru excel_partners (nema FK ka cash_snapshots u trenutnoj verziji)
DROP TABLE IF EXISTS excel_partners;

-- 2. Zameni cash_snapshots novom strukturom
DROP TABLE IF EXISTS cash_snapshots;

CREATE TABLE cash_snapshots (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mesec                   integer NOT NULL,
  godina                  integer NOT NULL,
  datum_unosa             date DEFAULT CURRENT_DATE,

  -- Tip unosa
  tip_unosa               text NOT NULL,

  -- CASH komponente (NULL za brzi unos)
  potrazivanja_kupci      numeric,
  racun_intesa            numeric,
  racun_nlb               numeric,
  devizni_racun           numeric,
  gotovi_proizvodi        numeric,
  sirovine                numeric,
  ostalo                  numeric,
  ukupno_cash             numeric NOT NULL,

  -- DUGOVANJA
  dugovanja_dobavljaci    numeric NOT NULL,

  -- REZULTAT
  neto_cash_flow          numeric NOT NULL,

  -- Excel fajl (samo za detaljni unos)
  excel_file_url          text,

  -- Meta
  created_by              uuid REFERENCES auth.users,
  created_at              timestamptz DEFAULT now(),

  CONSTRAINT chk_cash_snapshots_mesec CHECK (mesec >= 1 AND mesec <= 12),
  CONSTRAINT chk_cash_snapshots_godina CHECK (godina >= 2000 AND godina <= 2100),
  CONSTRAINT chk_cash_snapshots_tip_unosa CHECK (tip_unosa IN ('detaljan', 'brzi')),
  CONSTRAINT uq_cash_snapshots_mesec_godina UNIQUE (mesec, godina)
);

CREATE INDEX idx_cash_snapshots_mesec_godina ON cash_snapshots (mesec, godina);
CREATE INDEX idx_cash_snapshots_created_by ON cash_snapshots (created_by);

-- 3. Nova excel_partners — redovi iz Excel fajla po snimku
CREATE TABLE excel_partners (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id         uuid NOT NULL REFERENCES cash_snapshots (id) ON DELETE CASCADE,
  partner_naziv       text NOT NULL,
  kupci_iznos         numeric DEFAULT 0,
  dobavljaci_iznos    numeric DEFAULT 0,
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_excel_partners_snapshot_id ON excel_partners (snapshot_id);

-- 4. RLS
ALTER TABLE cash_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE excel_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read cash_snapshots" ON cash_snapshots;
DROP POLICY IF EXISTS "Allow insert cash_snapshots" ON cash_snapshots;
DROP POLICY IF EXISTS "Allow update cash_snapshots" ON cash_snapshots;
DROP POLICY IF EXISTS "Allow delete cash_snapshots" ON cash_snapshots;
CREATE POLICY "Allow read cash_snapshots" ON cash_snapshots FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert cash_snapshots" ON cash_snapshots FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update cash_snapshots" ON cash_snapshots FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete cash_snapshots" ON cash_snapshots FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow read excel_partners" ON excel_partners;
DROP POLICY IF EXISTS "Allow insert excel_partners" ON excel_partners;
DROP POLICY IF EXISTS "Allow delete excel_partners" ON excel_partners;
CREATE POLICY "Allow read excel_partners" ON excel_partners FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert excel_partners" ON excel_partners FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow delete excel_partners" ON excel_partners FOR DELETE TO anon, authenticated USING (true);
