import { NextResponse } from "next/server";
import { countTodayMenuItemsWithEmbeddings } from "@/lib/embedding-bank";
import { isClipInferenceEnabled } from "@/lib/clip-embedder";

export const runtime = "nodejs";

/** GET /api/ml/status — kiosk setup health (local only). */
export async function GET() {
  try {
    const embeddingCount = await countTodayMenuItemsWithEmbeddings();
    return NextResponse.json({
      ok: true,
      data: {
        inferenceMode: process.env.ML_INFERENCE_MODE || "clip",
        clipEnabled: isClipInferenceEnabled(),
        todayEmbeddingCount: embeddingCount,
        modelId: process.env.ML_MODEL_ID || "Xenova/clip-vit-base-patch32",
        cacheDir: process.env.ML_MODEL_CACHE_DIR || "./data/ml-cache",
      },
    });
  } catch (error) {
    console.error("ml status failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not read ML status." },
      { status: 500 }
    );
  }
}
