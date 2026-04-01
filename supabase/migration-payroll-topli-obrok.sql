-- Dodaj kolone za topli obrok i broj radnih dana u payroll_reports
ALTER TABLE payroll_reports ADD COLUMN IF NOT EXISTS broj_radnih_dana integer DEFAULT 0;
ALTER TABLE payroll_reports ADD COLUMN IF NOT EXISTS topli_obrok_iznos numeric DEFAULT 0;
