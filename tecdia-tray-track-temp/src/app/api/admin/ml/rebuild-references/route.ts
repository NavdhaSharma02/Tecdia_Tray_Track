import { NextResponse } from "next/server";
import { rebuildCatalogEmbeddingsFromDisk } from "@/lib/menu-reference-rebuild";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/admin/ml/rebuild-references
 * Recompute CLIP embeddings from saved reference photos on disk.
 */
export async function POST() {
  try {
    const result = await rebuildCatalogEmbeddingsFromDisk();
    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    console.error("rebuild-references failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Could not rebuild embeddings. Run npm run ml:setup once, then try again.",
      },
      { status: 500 }
    );
  }
}
