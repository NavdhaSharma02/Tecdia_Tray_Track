import {
  cosineSimilarity,
  getClipEmbedder,
  isClipInferenceEnabled,
  l2Normalize,
} from "@/lib/clip-embedder";
import { buildTrayCrops } from "@/lib/tray-image-crops";
import {
  embeddingRowToScannedItem,
  listTodayEmbeddingsForScan,
  type TodayEmbeddingRow,
} from "@/lib/embeddings-db";
import { simulateScanFromMenu } from "@/lib/tray-scan-sim";
import type { ScannedItem } from "@/types";

const DEFAULT_MIN_SIMILARITY = 0.58;
const DEFAULT_UNKNOWN_GAP = 0.12;

function minSimilarity(): number {
  const n = Number(process.env.ML_SCAN_MIN_SIMILARITY);
  return Number.isFinite(n) ? n : DEFAULT_MIN_SIMILARITY;
}

function unknownGap(): number {
  const n = Number(process.env.ML_SCAN_UNKNOWN_GAP);
  return Number.isFinite(n) ? n : DEFAULT_UNKNOWN_GAP;
}

function bestMatchForEmbedding(
  query: number[],
  bank: TodayEmbeddingRow[]
): { row: TodayEmbeddingRow; score: number } | null {
  if (bank.length === 0) return null;

  let best: { row: TodayEmbeddingRow; score: number } | null = null;
  let secondScore = -1;

  for (const row of bank) {
    const score = cosineSimilarity(query, row.embedding);
    if (!best || score > best.score) {
      secondScore = best?.score ?? secondScore;
      best = { row, score };
    } else if (score > secondScore) {
      secondScore = score;
    }
  }

  if (!best) return null;

  const gap = best.score - secondScore;
  if (best.score < minSimilarity()) return null;
  if (gap < unknownGap() && secondScore >= minSimilarity()) {
    return null;
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

  const bank = await listTodayEmbeddingsForScan();
  if (bank.length === 0) {
    return {
      items: [],
      mode: "clip",
      message:
        "No vision-ready reference photos. In Admin → Menu, upload a photo for each dish (Vision = Ready), or click Rebuild vision after npm run ml:setup.",
    };
  }

  const embed = await getClipEmbedder();
  const cropBuffers = await buildTrayCrops(imageBuffer);
  const byItemId = new Map<string, { row: TodayEmbeddingRow; score: number }>();

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

  return { items, mode: "clip" };
}
