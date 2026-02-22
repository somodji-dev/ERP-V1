-- ═══════════════════════════════════════════════════════════
-- MODUL PROIZVODNJA — Nova struktura (zamenjuje stare work_orders/items/hours)
-- ═══════════════════════════════════════════════════════════

-- 1. Ukloni stare tabele (redosled: zavisne pa zaglavlje)
DROP TABLE IF EXISTS work_order_hours;
DROP TABLE IF EXISTS work_order_items;
DROP TABLE IF EXISTS work_orders;

-- 2. Radni nalozi (zaglavlje)
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

-- 3. Radnici na nalogu (many-to-many)
CREATE TABLE work_order_employees (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id         uuid NOT NULL REFERENCES work_orders (id) ON DELETE CASCADE,
  employee_id           uuid NOT NULL REFERENCES employees (id) ON DELETE RESTRICT,
  created_at            timestamptz DEFAULT now(),
  UNIQUE (work_order_id, employee_id)
);

CREATE INDEX idx_woe_order ON work_order_employees (work_order_id);
CREATE INDEX idx_woe_employee ON work_order_employees (employee_id);

-- 4. Dražiranje proces
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

-- 5. Prženje proces
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

-- 6. Začinjavanje proces (za sada prazan)
CREATE TABLE zacinjavane (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id         uuid NOT NULL REFERENCES work_orders (id) ON DELETE CASCADE,
  datum                 date,
  smena                 text,
  created_at            timestamptz DEFAULT now(),
  UNIQUE (work_order_id)
);

CREATE INDEX idx_zacinjavane_datum ON zacinjavane (datum);

-- 7. Pakovanje proces
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
  bbq_200g             integer DEFAULT 0,
  bbq_150g             integer DEFAULT 0,
  bbq_80g              integer DEFAULT 0,
  lot_broj              text,
  datum                 date,
  smena                 text,
  created_at            timestamptz DEFAULT now(),
  UNIQUE (work_order_id)
);

CREATE INDEX idx_pakovanje_radnik ON pakovanje (radnik_id);
CREATE INDEX idx_pakovanje_datum ON pakovanje (datum);
CREATE INDEX idx_pakovanje_lot ON pakovanje (lot_broj);

-- RLS isključen za development (po promptu)
ALTER TABLE work_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE draziranje DISABLE ROW LEVEL SECURITY;
ALTER TABLE przenje DISABLE ROW LEVEL SECURITY;
ALTER TABLE zacinjavane DISABLE ROW LEVEL SECURITY;
ALTER TABLE pakovanje DISABLE ROW LEVEL SECURITY;
