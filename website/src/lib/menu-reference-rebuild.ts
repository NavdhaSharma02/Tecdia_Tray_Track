import {
  appendMenuItemEmbedding,
  listMenuItemEmbeddingBankRows,
  upsertMenuItemCatalogReference,
  upsertMenuItemDayEmbedding,
} from "@/lib/embeddings-db";
import {
  listMenuItemImageUuidsFromBankRows,
  menuItemImageApiPath,
  readLegacyMenuItemImage,
  readMenuItemImage,
} from "@/lib/image-store";
import { embedMenuReferenceImage } from "@/lib/tray-inference";
import { getOrCreateTodayServiceDayId, listTodayMenuForAdmin } from "@/lib/today-menu-db";

export interface RebuildReferencesResult {
  processed: number;
  succeeded: number;
  failed: { menuItemId: string; name: string; error: string }[];
}

function averageEmbeddings(embeddings: number[][]): number[] {
  const dimensions = embeddings[0]?.length ?? 0;
  return Array.from({ length: dimensions }, (_, index) => {
    const total = embeddings.reduce((sum, embedding) => sum + embedding[index], 0);
    return total / embeddings.length;
  });
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
    const bankRows = await listMenuItemEmbeddingBankRows(item.id);
    let imageUuids = listMenuItemImageUuidsFromBankRows(bankRows);

    if (imageUuids.length === 0) {
      const legacy = await readLegacyMenuItemImage(item.id);
      if (!legacy) continue;
      imageUuids = [item.id];
    }

    result.processed += 1;
    try {
      const embeddings: number[][] = [];

      for (const imageUuid of imageUuids) {
        const buffer =
          imageUuid === item.id
            ? await readLegacyMenuItemImage(item.id)
            : await readMenuItemImage(imageUuid);
        if (!buffer) continue;

        const embedding = await embedMenuReferenceImage(buffer);
        embeddings.push(embedding);

        await appendMenuItemEmbedding({
          menuItemId: item.id,
          referenceName: item.name,
          embedding,
          source: "rebuild_disk",
          sourceKey: `rebuild:${imageUuid}`,
        });
      }

      if (embeddings.length === 0) continue;

      const latestUuid = imageUuids[imageUuids.length - 1]!;
      const imageUrl = menuItemImageApiPath(item.id, latestUuid);
      const averaged = averageEmbeddings(embeddings);

      await upsertMenuItemCatalogReference({
        menuItemId: item.id,
        imageUrl,
        embedding: averaged,
      });

      if (!serviceDayId) {
        serviceDayId = await getOrCreateTodayServiceDayId();
      }
      await upsertMenuItemDayEmbedding({
        menuItemId: item.id,
        serviceDayId,
        embedding: averaged,
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
