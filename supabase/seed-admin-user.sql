-- =============================================================================
-- Seed: admin korisnik (user_roles + user_permissions)
-- Korisnik već postoji u Supabase Auth: admin@internal.erp
-- User UID: d748504d-625d-4a50-82f9-896f1491dafa
-- Pokreni u Supabase SQL Editor (jednom).
-- =============================================================================

-- Jedan red u user_roles
INSERT INTO user_roles (user_id, username, display_name, aktivan)
VALUES (
  'd748504d-625d-4a50-82f9-896f1491dafa',
  'admin',
  'Administrator',
  true
)
ON CONFLICT (user_id) DO UPDATE SET
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  aktivan = EXCLUDED.aktivan;

-- Prava za sve module
INSERT INTO user_permissions (user_id, modul, view, "create", edit, "delete")
VALUES
  ('d748504d-625d-4a50-82f9-896f1491dafa', 'dashboard', true, true, true, true),
  ('d748504d-625d-4a50-82f9-896f1491dafa', 'radnici', true, true, true, true),
  ('d748504d-625d-4a50-82f9-896f1491dafa', 'cashflow', true, true, true, true),
  ('d748504d-625d-4a50-82f9-896f1491dafa', 'proizvodnja', true, true, true, true),
  ('d748504d-625d-4a50-82f9-896f1491dafa', 'podesavanja', true, true, true, true)
ON CONFLICT (user_id, modul) DO UPDATE SET
  view = EXCLUDED.view,
  "create" = EXCLUDED."create",
  edit = EXCLUDED.edit,
  "delete" = EXCLUDED."delete";
