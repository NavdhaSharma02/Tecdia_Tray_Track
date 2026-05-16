/** Normalize dish names for matching training labels to menu_items.name. */
export function normalizeDishName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildDishNameIndex<T extends { name: string }>(
  items: T[]
): Map<string, T> {
  const index = new Map<string, T>();
  for (const item of items) {
    index.set(normalizeDishName(item.name), item);
  }
  return index;
}

/** Resolve a training label to a menu row (exact, then unique fuzzy). */
export function resolveMenuItemByDishName<T extends { name: string }>(
  className: string,
  menuItems: T[],
  aliases: Record<string, string> = {}
): T | undefined {
  const aliasTarget = aliases[className] ?? className;
  const normalized = normalizeDishName(aliasTarget);
  const byName = buildDishNameIndex(menuItems);
  const exact = byName.get(normalized);
  if (exact) return exact;

  const candidates = menuItems.filter((item) => {
    const menuNorm = normalizeDishName(item.name);
    return (
      menuNorm.includes(normalized) ||
      normalized.includes(menuNorm)
    );
  });

  if (candidates.length === 1) return candidates[0];
  return undefined;
}
