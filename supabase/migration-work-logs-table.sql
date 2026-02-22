-- =============================================================================
-- Tabela work_logs (unos sati) — pokreni u Supabase SQL Editor ako je ne vidiš.
-- Zavisnost: mora postojati tabela employees.
-- =============================================================================

CREATE TABLE IF NOT EXISTS work_logs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id           uuid NOT NULL REFERENCES employees (id) ON DELETE CASCADE,
  datum                 date NOT NULL,
  sati                  numeric NOT NULL,
  tip_sata              text NOT NULL,
  napomena              text,
  uneo_user_id          uuid REFERENCES auth.users (id),
  created_at            timestamptz DEFAULT now(),
  CONSTRAINT chk_work_logs_tip_sata CHECK (tip_sata IN ('redovni', 'prekovremeno', 'subota', 'nedelja', 'praznik', 'godisnji', 'bolovanje', 'odsustvo')),
  CONSTRAINT chk_work_logs_sati CHECK (sati >= 0)
);

CREATE INDEX IF NOT EXISTS idx_work_logs_employee_id ON work_logs (employee_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_datum ON work_logs (datum);
CREATE INDEX IF NOT EXISTS idx_work_logs_employee_datum ON work_logs (employee_id, datum);
CREATE INDEX IF NOT EXISTS idx_work_logs_uneo_user_id ON work_logs (uneo_user_id);

ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;

-- RLS policy-ji (da bi čitanje i upis radili)
DROP POLICY IF EXISTS "Allow read work_logs" ON work_logs;
DROP POLICY IF EXISTS "Allow insert work_logs" ON work_logs;
DROP POLICY IF EXISTS "Allow delete work_logs" ON work_logs;
CREATE POLICY "Allow read work_logs" ON work_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert work_logs" ON work_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow delete work_logs" ON work_logs FOR DELETE TO anon, authenticated USING (true);
