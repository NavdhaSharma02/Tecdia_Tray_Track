-- Per-day reference embeddings for menu items (built from admin-uploaded photos).

CREATE TABLE IF NOT EXISTS menu_item_day_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  service_day_id UUID NOT NULL REFERENCES service_days(id) ON DELETE CASCADE,
  embedding JSONB NOT NULL,
  model_version TEXT NOT NULL DEFAULT 'Xenova/clip-vit-base-patch32',
  image_path TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (menu_item_id, service_day_id)
);

CREATE INDEX IF NOT EXISTS idx_menu_item_day_embeddings_service_day
  ON menu_item_day_embeddings(service_day_id);

CREATE INDEX IF NOT EXISTS idx_menu_item_day_embeddings_menu_item
  ON menu_item_day_embeddings(menu_item_id);
