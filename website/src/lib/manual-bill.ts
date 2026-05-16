import type { MenuItem, ScannedItem } from "@/types";

export function menuItemToScannedLine(menuItem: MenuItem, quantity = 1): ScannedItem {
  return {
    id: menuItem.id,
    name: menuItem.name,
    category: menuItem.category,
    price: menuItem.price,
    quantity,
    confidence: 1,
    calories: menuItem.calories,
  };
}

export function addMenuItemToBill(
  items: ScannedItem[],
  menuItem: MenuItem,
  delta = 1
): ScannedItem[] {
  const existing = items.find((i) => i.id === menuItem.id);
  if (existing) {
    return items
      .map((i) =>
        i.id === menuItem.id
          ? { ...i, quantity: Math.max(0, i.quantity + delta) }
          : i
      )
      .filter((i) => i.quantity > 0);
  }
  if (delta <= 0) return items;
  return [...items, menuItemToScannedLine(menuItem, delta)];
}
