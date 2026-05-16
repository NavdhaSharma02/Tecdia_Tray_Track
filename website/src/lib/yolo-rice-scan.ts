import {
  RICE_BIG_NAME,
  RICE_SMALL_NAME,
} from "@/lib/constants";
import type { MenuItem, ScannedItem } from "@/types";
import type { YoloDetectionBox } from "@/lib/yolo-detector";

const RICE_YOLO_CLASSES = new Set([RICE_BIG_NAME, RICE_SMALL_NAME]);

export function isRiceYoloClass(className: string): boolean {
  return RICE_YOLO_CLASSES.has(className);
}

/** Map YOLO rice_big / rice_small boxes to permanent menu items (no CLIP). */
export function scannedItemsFromRiceDetections(
  boxes: YoloDetectionBox[],
  menu: MenuItem[]
): ScannedItem[] {
  const counts = new Map<string, { count: number; bestConf: number }>();

  for (const box of boxes) {
    if (!isRiceYoloClass(box.class)) continue;
    const prev = counts.get(box.class);
    if (!prev) {
      counts.set(box.class, { count: 1, bestConf: box.confidence });
    } else {
      prev.count += 1;
      prev.bestConf = Math.max(prev.bestConf, box.confidence);
    }
  }

  const items: ScannedItem[] = [];

  for (const [className, { count, bestConf }] of counts) {
    const menuItem = menu.find(
      (m) => m.name === className && m.category === className
    );
    if (!menuItem) continue;

    items.push({
      id: menuItem.id,
      name: menuItem.name,
      category: menuItem.category,
      price: menuItem.price,
      quantity: count,
      confidence: parseFloat(bestConf.toFixed(4)),
      calories: menuItem.calories,
    });
  }

  return items.sort((a, b) => b.confidence - a.confidence);
}
