import { randomUUID } from "crypto";
import { unlink, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { CLIP_MODEL_VERSION } from "@/lib/embeddings-db";

export type ClipEmbedder = (
  input: Uint8Array | Buffer
) => Promise<Float32Array | number[]>;

interface ClipVisionStack {
  processor: Awaited<
    ReturnType<
      typeof import("@xenova/transformers")["AutoProcessor"]["from_pretrained"]
    >
  >;
  model: Awaited<
    ReturnType<
      typeof import("@xenova/transformers")["CLIPVisionModelWithProjection"]["from_pretrained"]
    >
  >;
}

let embedderPromise: Promise<ClipEmbedder> | null = null;

function getModelCacheDir(): string {
  return (
    process.env.ML_MODEL_CACHE_DIR ||
    path.join(process.cwd(), "data", "ml-cache")
  );
}

export function isClipInferenceEnabled(): boolean {
  const mode = (process.env.ML_INFERENCE_MODE || "clip").toLowerCase();
  return mode !== "simulate" && mode !== "mock";
}

/** Lazy-load CLIP once per Node process (important on a kiosk tablet). */
export async function getClipEmbedder(): Promise<ClipEmbedder> {
  if (!embedderPromise) {
    embedderPromise = loadClipEmbedder();
  }
  return embedderPromise;
}

async function loadClipVisionStack(): Promise<ClipVisionStack> {
  const {
    AutoProcessor,
    CLIPVisionModelWithProjection,
    env,
  } = await import("@xenova/transformers");

  const modelId = CLIP_MODEL_VERSION;
  env.cacheDir = getModelCacheDir();
  env.allowLocalModels = true;
  env.useBrowserCache = false;

  const processor = await AutoProcessor.from_pretrained(modelId);
  const model = await CLIPVisionModelWithProjection.from_pretrained(modelId, {
    quantized: true,
  });

  return { processor, model };
}

async function loadClipEmbedder(): Promise<ClipEmbedder> {
  const stack = await loadClipVisionStack();

  return async (input: Uint8Array | Buffer) => {
    const { RawImage } = await import("@xenova/transformers");
    const tmpFile = path.join(os.tmpdir(), `tecdia-clip-${randomUUID()}.jpg`);
    await writeFile(tmpFile, Buffer.from(input));

    try {
      const image = await RawImage.read(tmpFile);
      const imageInputs = await stack.processor(image);
      const { image_embeds } = await stack.model(imageInputs);
      const data = image_embeds.data as Float32Array | number[];
      return l2Normalize(Array.from(data));
    } finally {
      await unlink(tmpFile).catch(() => undefined);
    }
  };
}

export function l2Normalize(vector: number[]): number[] {
  let norm = 0;
  for (const v of vector) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  return vector.map((v) => v / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < len; i++) dot += a[i] * b[i];
  return dot;
}

/** Warm model in background (call after `npm run dev` on kiosk setup). */
export async function warmClipModel(): Promise<void> {
  if (!isClipInferenceEnabled()) return;
  await getClipEmbedder();
}
