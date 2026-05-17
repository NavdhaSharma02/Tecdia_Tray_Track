import {
  cosineSimilarity,
  getClipEmbedder,
  isClipInferenceEnabled,
  l2Normalize,
} from "@/lib/clip-embedder";
import {
  isSebawMenuItem,
  RICE_BIG_CATEGORY,
  RICE_SMALL_CATEGORY,
} from "@/lib/constants";
import { buildTrayCropsFromBoxes } from "@/lib/tray-image-crops";
import { detectTrayRegions, type YoloDetectionBox } from "@/lib/yolo-detector";
import { isRiceYoloClass, scannedItemsFromRiceDetections } from "@/lib/yolo-rice-scan";
import {
  isMeatlessSoupYoloClass,
  scannedItemsFromMeatlessSoupDetections,
} from "@/lib/yolo-sebaw-scan";
import {
  embeddingRowToScannedItem,
  type EmbeddingPrototypeRow,
} from "@/lib/embeddings-db";
import { getScanEmbeddingBank } from "@/lib/embedding-bank";
import { simulateScanFromMenu } from "@/lib/tray-scan-sim";
import type { ScannedItem } from "@/types";


/**
 * Best CLIP match for one crop — always the highest-scoring menu prototype (no score cutoff).
 */
function bestClipMatchForCrop(
  query: number[],
  bank: EmbeddingPrototypeRow[]
): { row: EmbeddingPrototypeRow; score: number } | null {
  if (bank.length === 0) return null;

  let best: { row: EmbeddingPrototypeRow; score: number } | null = null;

  for (const row of bank) {
    const score = cosineSimilarity(query, row.embedding);
    if (!best || score > best.score) {
      best = { row, score };
    }
  }

  return best;
}

/** CLIP bank — rice and Sebaw are resolved from YOLO classes, not embeddings. */
function clipBankForYoloCrops(bank: EmbeddingPrototypeRow[]): EmbeddingPrototypeRow[] {
  return bank.filter(
    (row) =>
      row.category !== RICE_BIG_CATEGORY &&
      row.category !== RICE_SMALL_CATEGORY &&
      !isSebawMenuItem(row)
  );
}

/** Regions that skip CLIP (rice always; meatless soup only when Sebaw is on today's menu). */
function boxesForClip(boxes: YoloDetectionBox[], sebawOnMenu: boolean) {
  return boxes.filter((b) => {
    if (isRiceYoloClass(b.class)) return false;
    if (isMeatlessSoupYoloClass(b.class)) return !sebawOnMenu;
    return true;
  });
}

function mergeScannedItems(items: ScannedItem[]): ScannedItem[] {
  const byId = new Map<string, ScannedItem>();

  for (const item of items) {
    const prev = byId.get(item.id);
    if (!prev) {
      byId.set(item.id, { ...item });
      continue;
    }
    byId.set(item.id, {
      ...prev,
      quantity: prev.quantity + item.quantity,
      confidence: Math.max(prev.confidence, item.confidence),
    });
  }

  return Array.from(byId.values()).sort((a, b) => b.confidence - a.confidence);
}

export async function embedMenuReferenceImage(
  imageBuffer: Buffer
): Promise<number[]> {
  const embed = await getClipEmbedder();
  const vector = await embed(imageBuffer);
  return l2Normalize(Array.from(vector));
}

export interface TrayInferenceResult {
  items: ScannedItem[];
  mode: "clip" | "simulate";
  message?: string;
}

/**
 * Tray scan: YOLO localizes regions → rice and (when enabled) meatless soup→Sebaw go
 * direct on the bill; other regions use best CLIP match (meatless soup→priced soup if Sebaw off).
 */
export async function inferTrayFromImage(
  imageBuffer: Buffer
): Promise<TrayInferenceResult> {
  const { listTodayMenuAvailableForScan } = await import("@/lib/today-menu-db");

  if (!isClipInferenceEnabled()) {
    const menu = await listTodayMenuAvailableForScan();
    return {
      items: simulateScanFromMenu(menu),
      mode: "simulate",
      message: "ML_INFERENCE_MODE=simulate (development only).",
    };
  }

  const menu = await listTodayMenuAvailableForScan();
  const yoloOutcome = await detectTrayRegions(imageBuffer);

  if (yoloOutcome.status !== "ok") {
    return {
      items: [],
      mode: "clip",
      message: yoloOutcome.message,
    };
  }

  const yoloBoxes = yoloOutcome.boxes;

  const sebawOnMenu = menu.some((m) => isSebawMenuItem(m));
  const riceItems = scannedItemsFromRiceDetections(yoloBoxes, menu);
  const sebawItems = sebawOnMenu
    ? scannedItemsFromMeatlessSoupDetections(yoloBoxes, menu)
    : [];
  const clipBoxes = boxesForClip(yoloBoxes, sebawOnMenu);

  const bank = clipBankForYoloCrops(await getScanEmbeddingBank());
  const cropBuffers =
    clipBoxes.length > 0
      ? await buildTrayCropsFromBoxes(imageBuffer, clipBoxes)
      : [];

  const clipItems: ScannedItem[] = [];

  if (cropBuffers.length > 0) {
    if (bank.length === 0) {
      if (riceItems.length === 0 && sebawItems.length === 0) {
        return {
          items: [],
          mode: "clip",
          message:
            "No vision-ready reference photos for dishes. In Admin → Menu, upload a photo for each dish (Vision = Ready), or click Rebuild vision after npm run ml:setup.",
        };
      }
      return {
        items: mergeScannedItems([...riceItems, ...sebawItems]),
        mode: "clip",
        message:
          "Rice/Sebaw added from localization. Other regions could not be classified — add reference photos for today's dishes.",
      };
    }

    const embed = await getClipEmbedder();

    for (const crop of cropBuffers) {
      const query = l2Normalize(Array.from(await embed(crop)));
      const match = bestClipMatchForCrop(query, bank);
      if (!match) continue;
      clipItems.push(embeddingRowToScannedItem(match.row, match.score));
    }
  }

  const items = mergeScannedItems([...riceItems, ...sebawItems, ...clipItems]);

  if (items.length === 0) {
    return {
      items: [],
      mode: "clip",
      message:
        "Nothing to bill from this tray. Check that rice prices are set and dish reference photos exist for today's menu.",
    };
  }

  const riceCount = riceItems.reduce((n, i) => n + i.quantity, 0);
  const sebawCount = sebawItems.reduce((n, i) => n + i.quantity, 0);
  const clipLineCount = clipItems.length;

  return {
    items,
    mode: "clip",
    message:
      `YOLO: ${yoloBoxes.length} region(s).` +
      (riceCount > 0 ? ` Rice: ${riceCount} portion(s) (direct).` : "") +
      (sebawCount > 0 ? ` Sebaw: ${sebawCount} (free, from meatless soup).` : "") +
      (clipLineCount > 0
        ? ` Dishes: ${clipLineCount} region(s) → best CLIP match each.`
        : ""),
  };
}
