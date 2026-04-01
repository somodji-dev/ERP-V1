-- Dodaj kolonu za redosled sirovina
ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS redosled integer DEFAULT 0;

-- Postavi redosled prema originalnom spisku
UPDATE raw_materials SET redosled = 1 WHERE naziv = 'Skrob';
UPDATE raw_materials SET redosled = 2 WHERE naziv = 'Modifikovani skrob';
UPDATE raw_materials SET redosled = 3 WHERE naziv = 'Kikiriki';
UPDATE raw_materials SET redosled = 4 WHERE naziv = 'Pirofosfat';
UPDATE raw_materials SET redosled = 5 WHERE naziv = 'Soda bikarbona';
UPDATE raw_materials SET redosled = 6 WHERE naziv = 'Šećer';
UPDATE raw_materials SET redosled = 7 WHERE naziv = 'So';
UPDATE raw_materials SET redosled = 8 WHERE naziv = 'Maltodekstoza';
UPDATE raw_materials SET redosled = 9 WHERE naziv = 'Slatka paprika';
UPDATE raw_materials SET redosled = 10 WHERE naziv = 'Ljuta paprika';
UPDATE raw_materials SET redosled = 11 WHERE naziv = 'Glutaminat';
UPDATE raw_materials SET redosled = 12 WHERE naziv = 'Kari';
UPDATE raw_materials SET redosled = 13 WHERE naziv = 'Oleorezin slatke pap.';
UPDATE raw_materials SET redosled = 14 WHERE naziv = 'Suncokretovo ulje';
UPDATE raw_materials SET redosled = 15 WHERE naziv = 'Palmino ulje';
UPDATE raw_materials SET redosled = 16 WHERE naziv = 'Limunska kiselina';
UPDATE raw_materials SET redosled = 17 WHERE naziv = 'Crni luk prah';
UPDATE raw_materials SET redosled = 18 WHERE naziv = 'Braon šećer';
UPDATE raw_materials SET redosled = 19 WHERE naziv = 'Kumin';
UPDATE raw_materials SET redosled = 20 WHERE naziv = 'Aroma dima';
UPDATE raw_materials SET redosled = 21 WHERE naziv = 'Piment';
UPDATE raw_materials SET redosled = 22 WHERE naziv = 'Beli luk u prahu';
UPDATE raw_materials SET redosled = 23 WHERE naziv = 'Kutije';
UPDATE raw_materials SET redosled = 24 WHERE naziv = 'Ozzy kese 1kg';
UPDATE raw_materials SET redosled = 25 WHERE naziv = 'Srebrne kese';
UPDATE raw_materials SET redosled = 26 WHERE naziv = 'Čaše 150g';
UPDATE raw_materials SET redosled = 27 WHERE naziv = 'Posude 80g';
UPDATE raw_materials SET redosled = 28 WHERE naziv = 'Posude 200g';
UPDATE raw_materials SET redosled = 29 WHERE naziv = 'Poklopci 150g';
UPDATE raw_materials SET redosled = 30 WHERE naziv = 'Poklopci 80g pikant';
UPDATE raw_materials SET redosled = 31 WHERE naziv = 'Poklopci 80g BBQ';
UPDATE raw_materials SET redosled = 32 WHERE naziv = 'Nalepnice čaše';

-- Dodaj kolonu za radnika koji je radio popis (umesto napomene)
ALTER TABLE inventory_counts ADD COLUMN IF NOT EXISTS employee_id uuid REFERENCES employees(id);
