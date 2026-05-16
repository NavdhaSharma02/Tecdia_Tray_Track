-- Allow prototypes to persist by training label even before a menu UUID mapping exists.
ALTER TABLE menu_item_embedding_bank
  ADD COLUMN IF NOT EXISTS reference_name TEXT;

UPDATE menu_item_embedding_bank b
SET reference_name = mi.name
FROM menu_items mi
WHERE b.menu_item_id = mi.id AND b.reference_name IS NULL;

ALTER TABLE menu_item_embedding_bank
  ALTER COLUMN reference_name SET NOT NULL;

ALTER TABLE menu_item_embedding_bank
  ALTER COLUMN menu_item_id DROP NOT NULL;

ALTER TABLE menu_item_embedding_bank
  DROP CONSTRAINT IF EXISTS menu_item_embedding_bank_menu_item_id_source_source_key_key;

ALTER TABLE menu_item_embedding_bank
  ADD CONSTRAINT menu_item_embedding_bank_name_source_key_key
  UNIQUE (reference_name, source, source_key);

CREATE INDEX IF NOT EXISTS idx_menu_item_embedding_bank_reference_name
  ON menu_item_embedding_bank (reference_name);
