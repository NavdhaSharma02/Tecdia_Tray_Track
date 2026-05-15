-- Permanent reference photo + CLIP embedding on the menu catalog (reused every service day).

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS reference_embedding JSONB,
  ADD COLUMN IF NOT EXISTS reference_model_version TEXT;

CREATE INDEX IF NOT EXISTS idx_menu_items_has_reference_embedding
  ON menu_items ((reference_embedding IS NOT NULL))
  WHERE reference_embedding IS NOT NULL;
