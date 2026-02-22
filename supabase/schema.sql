-- =============================================================================
-- RIO ERP — Supabase Schema
-- Kompletan SQL za kreiranje svih tabela (redosled po dependency-ju)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. employees
-- -----------------------------------------------------------------------------
CREATE TABLE employees (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ime                   text NOT NULL,
  prezime               text NOT NULL,
  jmbg                  text,
  pozicija              text,
  datum_zaposlenja      date,
  godisnji_fond         integer DEFAULT 20,
  aktivan               boolean DEFAULT true,
  napomena              text,
  created_at            timestamptz DEFAULT now()
);

CREATE INDEX idx_employees_aktivan ON employees (aktivan);
CREATE INDEX idx_employees_prezime ON employees (prezime);
CREATE INDEX idx_employees_datum_zaposlenja ON employees (datum_zaposlenja);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2. rate_settings
-- -----------------------------------------------------------------------------
CREATE TABLE rate_settings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tip                   text NOT NULL,
  iznos                 numeric NOT NULL,
  vazi_od               date NOT NULL,
  napomena              text,
  uneo_user_id          uuid REFERENCES auth.users (id),
  created_at            timestamptz DEFAULT now(),
  CONSTRAINT chk_rate_settings_tip CHECK (tip IN ('redovni', 'prekovremeno', 'subota', 'nedelja', 'praznik')),
  CONSTRAINT chk_rate_settings_iznos CHECK (iznos >= 0)
);

CREATE INDEX idx_rate_settings_tip ON rate_settings (tip);
CREATE INDEX idx_rate_settings_vazi_od ON rate_settings (vazi_od);
CREATE INDEX idx_rate_settings_uneo_user_id ON rate_settings (uneo_user_id);

ALTER TABLE rate_settings ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 3. work_logs
-- -----------------------------------------------------------------------------
CREATE TABLE work_logs (
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

CREATE INDEX idx_work_logs_employee_id ON work_logs (employee_id);
CREATE INDEX idx_work_logs_datum ON work_logs (datum);
CREATE INDEX idx_work_logs_employee_datum ON work_logs (employee_id, datum);
CREATE INDEX idx_work_logs_uneo_user_id ON work_logs (uneo_user_id);

ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 4. advances
-- -----------------------------------------------------------------------------
CREATE TABLE advances (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id           uuid NOT NULL REFERENCES employees (id) ON DELETE CASCADE,
  datum                 date NOT NULL,
  iznos                 numeric NOT NULL,
  mesec                integer NOT NULL,
  godina               integer NOT NULL,
  napomena              text,
  uneo_user_id          uuid REFERENCES auth.users (id),
  created_at            timestamptz DEFAULT now(),
  CONSTRAINT chk_advances_mesec CHECK (mesec >= 1 AND mesec <= 12),
  CONSTRAINT chk_advances_godina CHECK (godina >= 2000 AND godina <= 2100),
  CONSTRAINT chk_advances_iznos CHECK (iznos > 0)
);

CREATE INDEX idx_advances_employee_id ON advances (employee_id);
CREATE INDEX idx_advances_mesec_godina ON advances (mesec, godina);
CREATE INDEX idx_advances_uneo_user_id ON advances (uneo_user_id);

ALTER TABLE advances ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 5. bonuses
-- -----------------------------------------------------------------------------
CREATE TABLE bonuses (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id           uuid NOT NULL REFERENCES employees (id) ON DELETE CASCADE,
  mesec                integer NOT NULL,
  godina               integer NOT NULL,
  iznos                numeric NOT NULL,
  opis                 text,
  uneo_user_id         uuid REFERENCES auth.users (id),
  created_at           timestamptz DEFAULT now(),
  CONSTRAINT chk_bonuses_mesec CHECK (mesec >= 1 AND mesec <= 12),
  CONSTRAINT chk_bonuses_godina CHECK (godina >= 2000 AND godina <= 2100),
  CONSTRAINT chk_bonuses_iznos CHECK (iznos >= 0)
);

CREATE INDEX idx_bonuses_employee_id ON bonuses (employee_id);
CREATE INDEX idx_bonuses_mesec_godina ON bonuses (mesec, godina);
CREATE INDEX idx_bonuses_uneo_user_id ON bonuses (uneo_user_id);

ALTER TABLE bonuses ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 6. payroll_reports
-- -----------------------------------------------------------------------------
CREATE TABLE payroll_reports (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id           uuid NOT NULL REFERENCES employees (id) ON DELETE CASCADE,
  mesec                integer NOT NULL,
  godina               integer NOT NULL,
  redovni_sati         numeric DEFAULT 0,
  prekovremeni_sati    numeric DEFAULT 0,
  subota_sati          numeric DEFAULT 0,
  nedelja_sati         numeric DEFAULT 0,
  praznik_sati         numeric DEFAULT 0,
  bruto_redovni        numeric DEFAULT 0,
  bruto_prekovremeno   numeric DEFAULT 0,
  bruto_subota         numeric DEFAULT 0,
  bruto_nedelja        numeric DEFAULT 0,
  bruto_praznik        numeric DEFAULT 0,
  ukupni_bonusi        numeric DEFAULT 0,
  ukupno_bruto         numeric DEFAULT 0,
  ukupni_avans         numeric DEFAULT 0,
  neto_za_isplatu      numeric DEFAULT 0,
  status               text DEFAULT 'nacrt',
  created_at           timestamptz DEFAULT now(),
  CONSTRAINT chk_payroll_reports_mesec CHECK (mesec >= 1 AND mesec <= 12),
  CONSTRAINT chk_payroll_reports_godina CHECK (godina >= 2000 AND godina <= 2100),
  CONSTRAINT chk_payroll_reports_status CHECK (status IN ('nacrt', 'finalizovan', 'isplacen')),
  CONSTRAINT uq_payroll_reports_employee_mesec_godina UNIQUE (employee_id, mesec, godina)
);

CREATE INDEX idx_payroll_reports_employee_id ON payroll_reports (employee_id);
CREATE INDEX idx_payroll_reports_mesec_godina ON payroll_reports (mesec, godina);
CREATE INDEX idx_payroll_reports_status ON payroll_reports (status);

ALTER TABLE payroll_reports ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 7. cash_snapshots (Cash Flow — mesečni snimci, v. DOCS/module-cashflow.md)
-- -----------------------------------------------------------------------------
CREATE TABLE cash_snapshots (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mesec                   integer NOT NULL,
  godina                  integer NOT NULL,
  datum_unosa             date DEFAULT CURRENT_DATE,
  tip_unosa               text NOT NULL,
  potrazivanja_kupci      numeric,
  racun_intesa            numeric,
  racun_nlb               numeric,
  devizni_racun           numeric,
  gotovi_proizvodi        numeric,
  sirovine                numeric,
  ostalo                  numeric,
  ukupno_cash             numeric NOT NULL,
  dugovanja_dobavljaci    numeric NOT NULL,
  neto_cash_flow          numeric NOT NULL,
  excel_file_url          text,
  created_by              uuid REFERENCES auth.users,
  created_at              timestamptz DEFAULT now(),
  CONSTRAINT chk_cash_snapshots_mesec CHECK (mesec >= 1 AND mesec <= 12),
  CONSTRAINT chk_cash_snapshots_godina CHECK (godina >= 2000 AND godina <= 2100),
  CONSTRAINT chk_cash_snapshots_tip_unosa CHECK (tip_unosa IN ('detaljan', 'brzi')),
  CONSTRAINT uq_cash_snapshots_mesec_godina UNIQUE (mesec, godina)
);

CREATE INDEX idx_cash_snapshots_mesec_godina ON cash_snapshots (mesec, godina);
CREATE INDEX idx_cash_snapshots_created_by ON cash_snapshots (created_by);

ALTER TABLE cash_snapshots ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 8. excel_partners (redovi iz Excel fajla po cash snapshot-u)
-- -----------------------------------------------------------------------------
CREATE TABLE excel_partners (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id         uuid NOT NULL REFERENCES cash_snapshots (id) ON DELETE CASCADE,
  partner_naziv       text NOT NULL,
  kupci_iznos         numeric DEFAULT 0,
  dobavljaci_iznos    numeric DEFAULT 0,
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_excel_partners_snapshot_id ON excel_partners (snapshot_id);

ALTER TABLE excel_partners ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 9. work_orders (modul Proizvodnja — radni nalozi)
-- -----------------------------------------------------------------------------
CREATE TABLE work_orders (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broj_naloga           text UNIQUE NOT NULL,
  datum                 date NOT NULL DEFAULT CURRENT_DATE,
  smena                 text NOT NULL,
  status                text DEFAULT 'aktivan',
  created_by            uuid REFERENCES auth.users,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  CONSTRAINT chk_work_orders_smena CHECK (smena IN ('I', 'II')),
  CONSTRAINT chk_work_orders_status CHECK (status IN ('aktivan', 'zavrsen', 'storniran'))
);

CREATE INDEX idx_wo_datum ON work_orders (datum);
CREATE INDEX idx_wo_smena ON work_orders (smena);
CREATE INDEX idx_wo_broj ON work_orders (broj_naloga);
CREATE INDEX idx_wo_status ON work_orders (status);

-- -----------------------------------------------------------------------------
-- 10. work_order_employees (radnici na nalogu)
-- -----------------------------------------------------------------------------
CREATE TABLE work_order_employees (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id         uuid NOT NULL REFERENCES work_orders (id) ON DELETE CASCADE,
  employee_id           uuid NOT NULL REFERENCES employees (id) ON DELETE RESTRICT,
  created_at            timestamptz DEFAULT now(),
  UNIQUE (work_order_id, employee_id)
);

CREATE INDEX idx_woe_order ON work_order_employees (work_order_id);
CREATE INDEX idx_woe_employee ON work_order_employees (employee_id);

-- -----------------------------------------------------------------------------
-- 11. draziranje (proces)
-- -----------------------------------------------------------------------------
CREATE TABLE draziranje (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id         uuid NOT NULL REFERENCES work_orders (id) ON DELETE CASCADE,
  radnik_id             uuid NOT NULL REFERENCES employees (id) ON DELETE RESTRICT,
  broj_draziranja       integer NOT NULL,
  dobavljac             text NOT NULL,
  datum                 date,
  smena                 text,
  created_at            timestamptz DEFAULT now(),
  UNIQUE (work_order_id),
  CONSTRAINT chk_draziranje_dobavljac CHECK (dobavljac IN ('Good Food', 'Karlito', 'In sistem'))
);

CREATE INDEX idx_draziranje_radnik ON draziranje (radnik_id);
CREATE INDEX idx_draziranje_dobavljac ON draziranje (dobavljac);
CREATE INDEX idx_draziranje_datum ON draziranje (datum);

-- -----------------------------------------------------------------------------
-- 12. przenje (proces)
-- -----------------------------------------------------------------------------
CREATE TABLE przenje (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id         uuid NOT NULL REFERENCES work_orders (id) ON DELETE CASCADE,
  merenje_tpm           numeric,
  datum                 date,
  smena                 text,
  created_at            timestamptz DEFAULT now(),
  UNIQUE (work_order_id)
);

CREATE INDEX idx_przenje_datum ON przenje (datum);

-- -----------------------------------------------------------------------------
-- 13. zacinjavane (proces, za sada prazan)
-- -----------------------------------------------------------------------------
CREATE TABLE zacinjavane (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id         uuid NOT NULL REFERENCES work_orders (id) ON DELETE CASCADE,
  datum                 date,
  smena                 text,
  created_at            timestamptz DEFAULT now(),
  UNIQUE (work_order_id)
);

CREATE INDEX idx_zacinjavane_datum ON zacinjavane (datum);

-- -----------------------------------------------------------------------------
-- 14. pakovanje (proces)
-- -----------------------------------------------------------------------------
CREATE TABLE pakovanje (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id         uuid NOT NULL REFERENCES work_orders (id) ON DELETE CASCADE,
  radnik_id             uuid NOT NULL REFERENCES employees (id) ON DELETE RESTRICT,
  pikant_15kg           numeric DEFAULT 0,
  pikant_1kg            numeric DEFAULT 0,
  pikant_200g           integer DEFAULT 0,
  pikant_150g           integer DEFAULT 0,
  pikant_80g            integer DEFAULT 0,
  bbq_15kg              numeric DEFAULT 0,
  bbq_1kg               numeric DEFAULT 0,
  bbq_200g              integer DEFAULT 0,
  bbq_150g              integer DEFAULT 0,
  bbq_80g               integer DEFAULT 0,
  lot_broj              text,
  datum                 date,
  smena                 text,
  created_at            timestamptz DEFAULT now(),
  UNIQUE (work_order_id)
);

CREATE INDEX idx_pakovanje_radnik ON pakovanje (radnik_id);
CREATE INDEX idx_pakovanje_datum ON pakovanje (datum);
CREATE INDEX idx_pakovanje_lot ON pakovanje (lot_broj);

-- Napomena: RLS je isključen za development (migration-proizvodnja-modul.sql ga DISABLE-uje)

-- -----------------------------------------------------------------------------
-- 15. user_roles
-- -----------------------------------------------------------------------------
CREATE TABLE user_roles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  username        text NOT NULL UNIQUE,
  display_name    text NOT NULL,
  aktivan         boolean DEFAULT true,
  employee_id     uuid REFERENCES employees (id) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now(),
  last_login      timestamptz
);

CREATE INDEX idx_user_roles_user_id ON user_roles (user_id);
CREATE INDEX idx_user_roles_username ON user_roles (username);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 16. user_permissions (modul, view, create, edit, delete)
-- -----------------------------------------------------------------------------
CREATE TABLE user_permissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  modul       text NOT NULL,
  view        boolean DEFAULT false,
  "create"    boolean DEFAULT false,
  edit        boolean DEFAULT false,
  "delete"    boolean DEFAULT false,
  CONSTRAINT uq_user_permissions_user_modul UNIQUE (user_id, modul)
);

CREATE INDEX idx_user_permissions_user_id ON user_permissions (user_id);

ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Seed data za admin usera (comment)
-- RLS policies ćemo dodati kasnije
-- =============================================================================
