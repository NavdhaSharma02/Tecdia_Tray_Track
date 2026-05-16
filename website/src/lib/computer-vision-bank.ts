import { access, stat } from "fs/promises";
import path from "path";
import { resolveMenuItemByDishName } from "@/lib/dish-name-match";
import { readFile } from "fs/promises";
import { readNpyFloat32Matrix } from "@/lib/npy-reader";
import { l2Normalize } from "@/lib/clip-embedder";

export type VisionPrototypeSource = "computer_vision_image" | "computer_vision_text";

export interface VisionPrototypeDraft {
  className: string;
  embedding: number[];
  source: VisionPrototypeSource;
  sourceKey: string;
}

export interface ComputerVisionBankFiles {
  dir: string;
  imageEmbeddings: string;
  textEmbeddings: string;
  imageMetadata: string;
  labelMap: string;
}

export interface ComputerVisionBankFingerprint {
  fingerprint: string;
  imageMtimeMs: number;
  imageSize: number;
  metadataMtimeMs: number;
}

export function resolveVisionBankDir(): string | null {
  const raw = process.env.ML_VISION_BANK_DIR?.trim();
  if (raw === "off" || raw === "false" || raw === "0") return null;
  if (raw) {
    return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
  }
  return path.resolve(process.cwd(), "..", "Computer Vision");
}

export async function visionBankFilesExist(
  dir: string
): Promise<ComputerVisionBankFiles | null> {
  const files: ComputerVisionBankFiles = {
    dir,
    imageEmbeddings: path.join(dir, "image_embeddings.npy"),
    textEmbeddings: path.join(dir, "text_embeddings.npy"),
    imageMetadata: path.join(dir, "image_metadata.json"),
    labelMap: path.join(dir, "label_map.json"),
  };

  try {
    await access(files.imageEmbeddings);
    await access(files.imageMetadata);
    await access(files.labelMap);
    return files;
  } catch {
    return null;
  }
}

export async function getVisionBankFingerprint(
  files: ComputerVisionBankFiles
): Promise<ComputerVisionBankFingerprint> {
  const [imageStat, metaStat] = await Promise.all([
    stat(files.imageEmbeddings),
    stat(files.imageMetadata),
  ]);
  const fingerprint = `${imageStat.mtimeMs}:${imageStat.size}:${metaStat.mtimeMs}`;
  return {
    fingerprint,
    imageMtimeMs: imageStat.mtimeMs,
    imageSize: imageStat.size,
    metadataMtimeMs: metaStat.mtimeMs,
  };
}

interface ImageMetadataRow {
  path: string;
  class_name: string;
  class_idx: number;
}

function rowVector(
  matrix: Float32Array,
  rows: number,
  cols: number,
  index: number
): number[] {
  const start = index * cols;
  return l2Normalize(Array.from(matrix.subarray(start, start + cols)));
}

/** Load all prototypes from the Computer Vision folder (not yet tied to menu UUIDs). */
export async function loadComputerVisionPrototypes(
  files: ComputerVisionBankFiles
): Promise<VisionPrototypeDraft[]> {
  const [imageMatrix, metadataRaw, labelMapRaw] = await Promise.all([
    readNpyFloat32Matrix(files.imageEmbeddings),
    readFile(files.imageMetadata, "utf8"),
    readFile(files.labelMap, "utf8"),
  ]);

  const metadata = JSON.parse(metadataRaw) as ImageMetadataRow[];
  const labelMap = JSON.parse(labelMapRaw) as Record<string, number>;
  const drafts: VisionPrototypeDraft[] = [];

  const rowCount = Math.min(metadata.length, imageMatrix.rows);
  for (let i = 0; i < rowCount; i++) {
    const row = metadata[i]!;
    drafts.push({
      className: row.class_name,
      embedding: rowVector(imageMatrix.data, imageMatrix.rows, imageMatrix.cols, i),
      source: "computer_vision_image",
      sourceKey: `img:${i}:${row.path}`,
    });
  }

  try {
    const textMatrix = await readNpyFloat32Matrix(files.textEmbeddings);
    const classByIdx = new Map<number, string>();
    for (const [name, idx] of Object.entries(labelMap)) {
      classByIdx.set(idx, name);
    }

    for (let idx = 0; idx < textMatrix.rows; idx++) {
      const className = classByIdx.get(idx);
      if (!className) continue;
      drafts.push({
        className,
        embedding: rowVector(
          textMatrix.data,
          textMatrix.rows,
          textMatrix.cols,
          idx
        ),
        source: "computer_vision_text",
        sourceKey: `txt:${idx}`,
      });
    }
  } catch {
    /* text_embeddings.npy optional */
  }

  return drafts;
}

export interface VisionPrototypeForMenuItem {
  menuItemId: string | null;
  referenceName: string;
  embedding: number[];
  source: VisionPrototypeSource;
  sourceKey: string;
}

export async function loadVisionNameAliases(
  dir: string
): Promise<Record<string, string>> {
  try {
    const raw = await readFile(path.join(dir, "menu_aliases.json"), "utf8");
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

/** Map training prototypes to menu item UUIDs by dish name. */
export function mapVisionPrototypesToMenuItems<
  T extends { id: string; name: string }
>(
  drafts: VisionPrototypeDraft[],
  menuItems: T[],
  aliases: Record<string, string> = {}
): VisionPrototypeForMenuItem[] {
  const mapped: VisionPrototypeForMenuItem[] = [];

  for (const draft of drafts) {
    const item = resolveMenuItemByDishName(draft.className, menuItems, aliases);
    mapped.push({
      menuItemId: item?.id ?? null,
      referenceName: draft.className,
      embedding: draft.embedding,
      source: draft.source,
      sourceKey: draft.sourceKey,
    });
  }

  return mapped;
}
