import {
  isSebawMenuItem,
  YOLO_MEATLESS_SOUP_CLASS,
} from "@/lib/constants";
import type { MenuItem, ScannedItem } from "@/types";
import type { YoloDetectionBox } from "@/lib/yolo-detector";

export function isMeatlessSoupYoloClass(className: string): boolean {
  return className === YOLO_MEATLESS_SOUP_CLASS;
}

/**
 * YOLO meatless soup → Sebaw at ₱0 when Sebaw is on today's menu.
 * When Sebaw is off, caller sends these regions through CLIP as normal soup.
 */
export function scannedItemsFromMeatlessSoupDetections(
  boxes: YoloDetectionBox[],
  menu: MenuItem[]
): ScannedItem[] {
  const sebaw = menu.find((m) => isSebawMenuItem(m));
  if (!sebaw) return [];

  let count = 0;
  let bestConf = 0;

  for (const box of boxes) {
    if (!isMeatlessSoupYoloClass(box.class)) continue;
    count += 1;
    bestConf = Math.max(bestConf, box.confidence);
  }

  if (count === 0) return [];

  return [
    {
      id: sebaw.id,
      name: sebaw.name,
      category: sebaw.category,
      price: 0,
      quantity: count,
      confidence: parseFloat(bestConf.toFixed(4)),
      calories: sebaw.calories,
    },
  ];
}
