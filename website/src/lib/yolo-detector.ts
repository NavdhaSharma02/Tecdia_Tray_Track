/** Normalized bounding box (0–1) from the optional local YOLO service. */
export interface YoloDetectionBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  confidence: number;
  /** YOLO class name, e.g. food, rice_big, rice_small. */
  class: string;
}

/** @deprecated Use YoloDetectionBox */
export type YoloFoodBox = YoloDetectionBox;

function yoloServiceUrl(): string | null {
  const raw = process.env.ML_YOLO_SERVICE_URL;
  if (!raw) return null;
  const url = raw.trim();
  if (!url || url === "off" || url === "false" || url === "0") return null;
  return url;
}

/**
 * Call the local Python YOLO service (if running) to find tray regions.
 * Returns null when the service is disabled or unreachable — caller falls back to grid crops.
 */
export async function detectTrayRegions(
  imageBuffer: Buffer
): Promise<YoloDetectionBox[] | null> {
  const url = yoloServiceUrl();
  if (!url) return null;

  const timeoutMs = Number(process.env.ML_YOLO_TIMEOUT_MS) || 8000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const form = new FormData();
    form.append(
      "image",
      new Blob([new Uint8Array(imageBuffer)], { type: "image/jpeg" }),
      "tray.jpg"
    );

    const res = await fetch(url, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });

    if (!res.ok) return null;

    const json = (await res.json()) as {
      ok?: boolean;
      boxes?: Array<YoloDetectionBox & { class?: string }>;
    };

    if (!json.ok || !Array.isArray(json.boxes)) return null;
    return json.boxes
      .map((b) => ({
        x1: b.x1,
        y1: b.y1,
        x2: b.x2,
        y2: b.y2,
        confidence: b.confidence,
        class: typeof b.class === "string" && b.class ? b.class : "food",
      }))
      .filter(
        (b) =>
          Number.isFinite(b.x1) &&
          Number.isFinite(b.y1) &&
          Number.isFinite(b.x2) &&
          Number.isFinite(b.y2) &&
          b.x2 > b.x1 &&
          b.y2 > b.y1
      );
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** @deprecated Use detectTrayRegions */
export const detectFoodRegions = detectTrayRegions;
