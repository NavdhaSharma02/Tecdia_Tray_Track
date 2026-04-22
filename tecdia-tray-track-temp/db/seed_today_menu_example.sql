-- Example: add one item and attach it to TODAY’s service day.
-- Run: psql -U postgres -h localhost -d tecdia_tray_track -f db/seed_today_menu_example.sql

INSERT INTO service_days (service_date)
VALUES (CURRENT_DATE)
ON CONFLICT (service_date) DO NOTHING;

INSERT INTO menu_items (code, name, category, base_price, calories, is_active)
VALUES ('EXAMPLE-001', 'Example Thali', 'Main Course', 150.00, NULL, TRUE)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  base_price = EXCLUDED.base_price,
  calories = EXCLUDED.calories,
  is_active = EXCLUDED.is_active;

INSERT INTO service_day_menu_items (service_day_id, menu_item_id, available)
SELECT sd.id, mi.id, TRUE
FROM service_days sd
JOIN menu_items mi ON mi.code = 'EXAMPLE-001'
WHERE sd.service_date = CURRENT_DATE
ON CONFLICT (service_day_id, menu_item_id) DO UPDATE SET
  available = EXCLUDED.available;
