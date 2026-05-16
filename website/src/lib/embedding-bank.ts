import {
  listEmbeddingPrototypesForScan,
  type EmbeddingPrototypeRow,
} from "@/lib/embeddings-db";
import { syncComputerVisionFolderIfNeeded } from "@/lib/vision-bank-sync";

let syncPromise: Promise<void> | null = null;

async function ensureVisionBankSynced(): Promise<void> {
  if (!syncPromise) {
    syncPromise = syncComputerVisionFolderIfNeeded().then(() => undefined);
  }
  await syncPromise;
}

/** Full prototype bank for today's available menu (syncs Computer Vision folder first). */
export async function getScanEmbeddingBank(): Promise<EmbeddingPrototypeRow[]> {
  await ensureVisionBankSynced();
  return listEmbeddingPrototypesForScan();
}

/** Distinct menu items that have at least one prototype for today's scan. */
export async function countTodayMenuItemsWithEmbeddings(): Promise<number> {
  const bank = await getScanEmbeddingBank();
  return new Set(bank.map((row) => row.menu_item_id)).size;
}
