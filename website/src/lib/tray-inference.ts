import {
  cosineSimilarity,
  getClipEmbedder,
  isClipInferenceEnabled,
  l2Normalize,
} from "@/lib/clip-embedder";
import {
  RICE_BIG_CATEGORY,
  RICE_SMALL_CATEGORY,
} from "@/lib/constants";
import { buildTrayCropsFromBoxes } from "@/lib/tray-image-crops";
import { detectTrayRegions } from "@/lib/yolo-detector";
import { isRiceYoloClass, scannedItemsFromRiceDetections } from "@/lib/yolo-rice-scan";
import {
  embeddingRowToScannedItem,
  type EmbeddingPrototypeRow,
} from "@/lib/embeddings-db";
import { getScanEmbeddingBank } from "@/lib/embedding-bank";
import { simulateScanFromMenu } from "@/lib/tray-scan-sim";
import type { ScannedItem } from "@/types";

const YOLO_REQUIRED_MESSAGE =
  "Dish localization is required. Start python scripts/yolo-detect-server.py and set ML_YOLO_SERVICE_URL in .env (e.g. http://127.0.0.1:5001/detect).";

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

/** CLIP bank for food/soup/drink regions — rice is billed from YOLO class only. */
function clipBankExcludingRice(
  bank: EmbeddingPrototypeRow[]
): EmbeddingPrototypeRow[] {
  return bank.filter(
    (row) =>
      row.category !== RICE_BIG_CATEGORY &&
      row.category !== RICE_SMALL_CATEGORY
  );
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
 * Tray scan: YOLO localizes regions → rice_big/rice_small go straight on the bill;
 * every other region is assigned the best CLIP match (no confidence threshold).
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
  const yoloBoxes = await detectTrayRegions(imageBuffer);

  if (!yoloBoxes || yoloBoxes.length === 0) {
    return {
      items: [],
      mode: "clip",
      message: YOLO_REQUIRED_MESSAGE,
    };
  }

  const riceItems = scannedItemsFromRiceDetections(yoloBoxes, menu);
  const clipBoxes = yoloBoxes.filter((b) => !isRiceYoloClass(b.class));

  const bank = clipBankExcludingRice(await getScanEmbeddingBank());
  const cropBuffers =
    clipBoxes.length > 0
      ? await buildTrayCropsFromBoxes(imageBuffer, clipBoxes)
      : [];

  const clipItems: ScannedItem[] = [];

  if (cropBuffers.length > 0) {
    if (bank.length === 0) {
      if (riceItems.length === 0) {
        return {
          items: [],
          mode: "clip",
          message:
            "No vision-ready reference photos for dishes. In Admin → Menu, upload a photo for each dish (Vision = Ready), or click Rebuild vision after npm run ml:setup.",
        };
      }
      return {
        items: mergeScannedItems(riceItems),
        mode: "clip",
        message:
          "Rice added from localization. Other regions could not be classified — add reference photos for today's dishes.",
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

  const items = mergeScannedItems([...riceItems, ...clipItems]);

  if (items.length === 0) {
    return {
      items: [],
      mode: "clip",
      message:
        "Nothing to bill from this tray. Check that rice prices are set and dish reference photos exist for today's menu.",
    };
  }

  const riceCount = riceItems.reduce((n, i) => n + i.quantity, 0);
  const clipLineCount = clipItems.length;

  return {
    items,
    mode: "clip",
    message:
      `YOLO: ${yoloBoxes.length} region(s).` +
      (riceCount > 0 ? ` Rice: ${riceCount} portion(s) (direct).` : "") +
      (clipLineCount > 0
        ? ` Dishes: ${clipLineCount} region(s) → best CLIP match each.`
        : ""),
  };
}
