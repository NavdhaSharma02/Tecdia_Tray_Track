import { createHash } from "crypto";
import {
  appendMenuItemEmbedding,
  upsertMenuItemCatalogReference,
  upsertMenuItemDayEmbedding,
} from "@/lib/embeddings-db";
import {
  menuItemImageApiPath,
  menuItemImageExists,
  readMenuItemImage,
} from "@/lib/image-store";
import { embedMenuReferenceImage } from "@/lib/tray-inference";
import { getOrCreateTodayServiceDayId, listTodayMenuForAdmin } from "@/lib/today-menu-db";

export interface RebuildReferencesResult {
  processed: number;
  succeeded: number;
  failed: { menuItemId: string; name: string; error: string }[];
}

/** Compute catalog embeddings from on-disk reference photos (appends to bank). */
export async function rebuildCatalogEmbeddingsFromDisk(): Promise<RebuildReferencesResult> {
  const items = await listTodayMenuForAdmin();
  const result: RebuildReferencesResult = {
    processed: 0,
    succeeded: 0,
    failed: [],
  };

  let serviceDayId: string | null = null;

  for (const item of items) {
    const hasFile = await menuItemImageExists(item.id);
    if (!hasFile) continue;

    result.processed += 1;
    try {
      const buffer = await readMenuItemImage(item.id);
      if (!buffer) continue;

      const imageUrl = menuItemImageApiPath(item.id);
      await upsertMenuItemCatalogReference({ menuItemId: item.id, imageUrl });

      const embedding = await embedMenuReferenceImage(buffer);
      const sourceKey = `disk:${createHash("sha256").update(buffer).digest("hex").slice(0, 20)}`;

      await appendMenuItemEmbedding({
        menuItemId: item.id,
        referenceName: item.name,
        embedding,
        source: "rebuild_disk",
        sourceKey,
      });

      await upsertMenuItemCatalogReference({
        menuItemId: item.id,
        imageUrl,
        embedding,
      });

      if (!serviceDayId) {
        serviceDayId = await getOrCreateTodayServiceDayId();
      }
      await upsertMenuItemDayEmbedding({
        menuItemId: item.id,
        serviceDayId,
        embedding,
        imagePath: null,
      });

      result.succeeded += 1;
    } catch (error) {
      result.failed.push({
        menuItemId: item.id,
        name: item.name,
        error: error instanceof Error ? error.message : "Embedding failed",
      });
    }
  }

  return result;
}
