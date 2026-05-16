import {
  cosineSimilarity,
  getClipEmbedder,
  isClipInferenceEnabled,
  l2Normalize,
} from "@/lib/clip-embedder";
import {
  buildTrayCrops,
  buildTrayCropsFromBoxes,
} from "@/lib/tray-image-crops";
import { detectFoodRegions } from "@/lib/yolo-detector";
import {
  embeddingRowToScannedItem,
  type EmbeddingPrototypeRow,
} from "@/lib/embeddings-db";
import { getScanEmbeddingBank } from "@/lib/embedding-bank";
import { simulateScanFromMenu } from "@/lib/tray-scan-sim";
import type { ScannedItem } from "@/types";

/**
 * Best match across all prototypes: highest score per menu item, then best item overall.
 */
function bestMatchForEmbedding(
  query: number[],
  bank: EmbeddingPrototypeRow[]
): { row: EmbeddingPrototypeRow; score: number } | null {
  if (bank.length === 0) return null;

  const bestByItem = new Map<
    string,
    { row: EmbeddingPrototypeRow; score: number }
  >();

  for (const row of bank) {
    const score = cosineSimilarity(query, row.embedding);
    const prev = bestByItem.get(row.menu_item_id);
    if (!prev || score > prev.score) {
      bestByItem.set(row.menu_item_id, { row, score });
    }
  }

  let best: { row: EmbeddingPrototypeRow; score: number } | null = null;
  for (const entry of bestByItem.values()) {
    if (!best || entry.score > best.score) {
      best = entry;
    }
  }

  return best;
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
 * Classify a tray photo against today's stored reference embeddings.
 * Dev-only: set ML_INFERENCE_MODE=simulate for random demo items.
 */
export async function inferTrayFromImage(
  imageBuffer: Buffer
): Promise<TrayInferenceResult> {
  if (!isClipInferenceEnabled()) {
    const { listTodayMenuAvailableForScan } = await import("@/lib/today-menu-db");
    const menu = await listTodayMenuAvailableForScan();
    return {
      items: simulateScanFromMenu(menu),
      mode: "simulate",
      message: "ML_INFERENCE_MODE=simulate (development only).",
    };
  }

  const bank = await getScanEmbeddingBank();
  if (bank.length === 0) {
    return {
      items: [],
      mode: "clip",
      message:
        "No vision-ready reference photos. In Admin → Menu, upload a photo for each dish (Vision = Ready), or click Rebuild vision after npm run ml:setup.",
    };
  }

  const yoloBoxes = await detectFoodRegions(imageBuffer);
  const cropBuffers =
    yoloBoxes && yoloBoxes.length > 0
      ? await buildTrayCropsFromBoxes(imageBuffer, yoloBoxes)
      : await buildTrayCrops(imageBuffer);

  const embed = await getClipEmbedder();
  const byItemId = new Map<string, { row: EmbeddingPrototypeRow; score: number }>();

  for (const crop of cropBuffers) {
    const query = l2Normalize(Array.from(await embed(crop)));
    const match = bestMatchForEmbedding(query, bank);
    if (!match) continue;

    const prev = byItemId.get(match.row.menu_item_id);
    if (!prev || match.score > prev.score) {
      byItemId.set(match.row.menu_item_id, match);
    }
  }

  const items = Array.from(byItemId.values())
    .sort((a, b) => b.score - a.score)
    .map(({ row, score }) => embeddingRowToScannedItem(row, score));

  if (items.length === 0) {
    return {
      items: [],
      mode: "clip",
      message:
        "Could not match tray to today's menu. Check lighting, tray position, or upload clearer reference photos.",
    };
  }

  const cropSource =
    yoloBoxes && yoloBoxes.length > 0 ? "yolo" : "grid";

  return {
    items,
    mode: "clip",
    message:
      cropSource === "yolo"
        ? `Matched ${items.length} dish(es) from ${yoloBoxes!.length} detected region(s).`
        : undefined,
  };
}
