import {
  getVisionBankFingerprint,
  loadComputerVisionPrototypes,
  loadVisionNameAliases,
  mapVisionPrototypesToMenuItems,
  resolveVisionBankDir,
  visionBankFilesExist,
} from "@/lib/computer-vision-bank";
import { normalizeDishName } from "@/lib/dish-name-match";
import {
  CLIP_MODEL_VERSION,
  getEmbeddingBankSyncFingerprint,
  insertMenuItemEmbedding,
  listAllActiveMenuItemsForVisionSync,
  migrateLegacyCatalogEmbeddings,
  setEmbeddingBankSyncFingerprint,
} from "@/lib/embeddings-db";

export interface VisionBankSyncResult {
  skipped: boolean;
  reason?: string;
  inserted: number;
  matched: number;
  unmatchedClasses: string[];
}

const SYNC_SOURCE = "computer_vision_folder";

export async function syncComputerVisionFolderIfNeeded(): Promise<VisionBankSyncResult> {
  await migrateLegacyCatalogEmbeddings();

  const dir = resolveVisionBankDir();
  if (!dir) {
    return { skipped: true, reason: "ML_VISION_BANK_DIR disabled", inserted: 0, matched: 0, unmatchedClasses: [] };
  }

  const files = await visionBankFilesExist(dir);
  if (!files) {
    return {
      skipped: true,
      reason: `No vision bank at ${dir}`,
      inserted: 0,
      matched: 0,
      unmatchedClasses: [],
    };
  }

  const { fingerprint } = await getVisionBankFingerprint(files);
  const previous = await getEmbeddingBankSyncFingerprint(SYNC_SOURCE);
  if (previous === fingerprint) {
    return { skipped: true, reason: "already synced", inserted: 0, matched: 0, unmatchedClasses: [] };
  }

  return syncComputerVisionFolder(files.dir, fingerprint);
}

/** Force sync from the Computer Vision folder (admin script / API). */
export async function syncComputerVisionFolder(
  dir?: string,
  fingerprintOverride?: string
): Promise<VisionBankSyncResult> {
  await migrateLegacyCatalogEmbeddings();

  const bankDir = dir ?? resolveVisionBankDir();
  if (!bankDir) {
    return { skipped: true, reason: "no directory", inserted: 0, matched: 0, unmatchedClasses: [] };
  }

  const files = await visionBankFilesExist(bankDir);
  if (!files) {
    return {
      skipped: true,
      reason: `missing files in ${bankDir}`,
      inserted: 0,
      matched: 0,
      unmatchedClasses: [],
    };
  }

  const fingerprint =
    fingerprintOverride ?? (await getVisionBankFingerprint(files)).fingerprint;

  const menuItems = await listAllActiveMenuItemsForVisionSync();
  const aliases = await loadVisionNameAliases(files.dir);
  const drafts = await loadComputerVisionPrototypes(files);
  const mapped = mapVisionPrototypesToMenuItems(drafts, menuItems, aliases);

  let inserted = 0;
  for (const proto of mapped) {
    const added = await insertMenuItemEmbedding({
      menuItemId: proto.menuItemId,
      referenceName: proto.referenceName,
      embedding: proto.embedding,
      modelVersion: CLIP_MODEL_VERSION,
      source: proto.source,
      sourceKey: proto.sourceKey,
    });
    if (added) inserted += 1;
  }

  const matchedNames = new Set(
    mapped
      .filter((p) => p.menuItemId !== null)
      .map((p) => normalizeDishName(p.referenceName))
  );
  const classNames = [...new Set(drafts.map((d) => d.className))];
  const unmatchedClasses = classNames.filter(
    (name) => !matchedNames.has(normalizeDishName(name))
  );

  await setEmbeddingBankSyncFingerprint(SYNC_SOURCE, fingerprint, mapped.length);

  return {
    skipped: false,
    inserted,
    matched: matchedNames.size,
    unmatchedClasses,
  };
}
