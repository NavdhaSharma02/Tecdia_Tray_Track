import {
  ensureYoloServiceReady,
  yoloDetectUrl,
} from "@/lib/yolo-service-manager";

/** Normalized bounding box (0–1) from the local YOLO service. */
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

export type YoloDetectOutcome =
  | { status: "ok"; boxes: YoloDetectionBox[] }
  | { status: "disabled"; message: string }
  | { status: "unavailable"; message: string }
  | { status: "empty"; message: string };

function parseBoxes(
  raw: Array<YoloDetectionBox & { class?: string }>
): YoloDetectionBox[] {
  return raw
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
}

/**
 * Call the local Python YOLO service to find tray regions.
 * Auto-starts the server when configured and not running (ML_YOLO_AUTO_START).
 */
export async function detectTrayRegions(
  imageBuffer: Buffer
): Promise<YoloDetectOutcome> {
  const url = yoloDetectUrl();
  if (!url) {
    return {
      status: "disabled",
      message:
        "ML_YOLO_SERVICE_URL is not set. Add it to .env.local (e.g. http://127.0.0.1:5001/detect).",
    };
  }

  const ready = await ensureYoloServiceReady();
  if (!ready.ok) {
    return { status: "unavailable", message: ready.message ?? "YOLO service unavailable." };
  }

  const timeoutMs = Number(process.env.ML_YOLO_TIMEOUT_MS) || 30_000;
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

    const json = (await res.json()) as {
      ok?: boolean;
      error?: string;
      boxes?: Array<YoloDetectionBox & { class?: string }>;
    };

    if (!res.ok || !json.ok) {
      return {
        status: "unavailable",
        message:
          json.error ||
          `Dish localization failed (HTTP ${res.status}). Check Dish Localization/best.pt exists.`,
      };
    }

    if (!Array.isArray(json.boxes)) {
      return { status: "unavailable", message: "Invalid response from YOLO service." };
    }

    const boxes = parseBoxes(json.boxes);
    if (boxes.length === 0) {
      return {
        status: "empty",
        message:
          "No food regions detected on this tray. Reposition the tray or improve lighting.",
      };
    }

    return { status: "ok", boxes };
  } catch (error) {
    const detail =
      error instanceof Error && error.name === "AbortError"
        ? "timed out"
        : error instanceof Error
          ? error.message
          : "request failed";
    return {
      status: "unavailable",
      message: `Dish localization unreachable (${detail}). Run: python scripts/yolo-detect-server.py`,
    };
  } finally {
    clearTimeout(timer);
  }
}

/** @deprecated Use detectTrayRegions */
export async function detectFoodRegions(
  imageBuffer: Buffer
): Promise<YoloDetectionBox[] | null> {
  const outcome = await detectTrayRegions(imageBuffer);
  return outcome.status === "ok" ? outcome.boxes : null;
}
