import { NextResponse } from "next/server";
import { countEmbeddingPrototypesInBank } from "@/lib/embeddings-db";
import { syncComputerVisionFolder } from "@/lib/vision-bank-sync";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/admin/ml/import-vision
 * Import / refresh prototypes from the Computer Vision folder into Postgres.
 */
export async function POST() {
  try {
    const result = await syncComputerVisionFolder();
    const totalPrototypes = await countEmbeddingPrototypesInBank();

    return NextResponse.json({
      ok: true,
      data: {
        ...result,
        totalPrototypesInBank: totalPrototypes,
      },
    });
  } catch (error) {
    console.error("import-vision failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Could not import Computer Vision embeddings. Check ML_VISION_BANK_DIR and migration 009.",
      },
      { status: 500 }
    );
  }
}
