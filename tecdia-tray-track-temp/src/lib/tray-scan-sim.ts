import type { MenuItem, ScannedItem } from "@/types";

/**
 * Simulated ML output: pick a random subset of today's available menu items.
 */
export function simulateScanFromMenu(menu: MenuItem[]): ScannedItem[] {
  const pool = menu.filter((i) => i.available);
  if (pool.length === 0) return [];

  const count = Math.min(pool.length, 2 + Math.floor(Math.random() * 3));
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  return selected.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    price: item.price,
    quantity: 1,
    confidence: parseFloat((0.85 + Math.random() * 0.14).toFixed(2)),
    calories: item.calories,
  }));
}
