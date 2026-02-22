-- Dodaj 'topli_obrok' u dozvoljene tipove rate_settings (docs/module-radnici.md)
ALTER TABLE rate_settings DROP CONSTRAINT IF EXISTS chk_rate_settings_tip;
ALTER TABLE rate_settings ADD CONSTRAINT chk_rate_settings_tip
  CHECK (tip IN ('redovni', 'prekovremeno', 'subota', 'nedelja', 'praznik', 'topli_obrok'));
