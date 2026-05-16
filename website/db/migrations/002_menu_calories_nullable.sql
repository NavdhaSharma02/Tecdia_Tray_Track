-- Allow unknown / “N/A” calories on menu items (NULL in the database).
-- Run after initial schema: psql ... -f db/migrations/002_menu_calories_nullable.sql

ALTER TABLE menu_items ALTER COLUMN calories DROP NOT NULL;
