-- Accumulating CLIP prototype bank per menu item (admin uploads + imported training bank).
CREATE TABLE IF NOT EXISTS menu_item_embedding_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  reference_name TEXT NOT NULL,
  embedding JSONB NOT NULL,
  model_version TEXT NOT NULL,
  source TEXT NOT NULL,
  source_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (reference_name, source, source_key)
);

CREATE INDEX IF NOT EXISTS idx_menu_item_embedding_bank_menu_item
  ON menu_item_embedding_bank (menu_item_id);

CREATE INDEX IF NOT EXISTS idx_menu_item_embedding_bank_reference_name
  ON menu_item_embedding_bank (reference_name);

CREATE INDEX IF NOT EXISTS idx_menu_item_embedding_bank_source
  ON menu_item_embedding_bank (source);

-- Tracks last sync fingerprint for external vision banks (e.g. Computer Vision folder).
CREATE TABLE IF NOT EXISTS embedding_bank_sync_state (
  source TEXT PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  prototype_count INTEGER NOT NULL DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
