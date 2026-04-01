-- Dodaj kolonu za štikliranje "ima dovoljno" bez unosa tačne količine
ALTER TABLE inventory_count_items ADD COLUMN IF NOT EXISTS iznad_minimuma boolean DEFAULT false;
