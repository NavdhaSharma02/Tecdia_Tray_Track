import { NextResponse } from "next/server";
import { enrichMenuItemsWithEmbeddingFlags } from "@/lib/embeddings-db";
import { updatePermanentRicePrices } from "@/lib/today-menu-db";

/**
 * PUT /api/admin/today-menu/rice — set prices for permanent rice_big / rice_small items.
 */
export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      rice_big?: number;
      rice_small?: number;
    };
    const rice_big = Number(body.rice_big);
    const rice_small = Number(body.rice_small);

    if (!Number.isFinite(rice_big) || rice_big < 0) {
      return NextResponse.json(
        { ok: false, error: "Valid rice_big price is required." },
        { status: 400 }
      );
    }
    if (!Number.isFinite(rice_small) || rice_small < 0) {
      return NextResponse.json(
        { ok: false, error: "Valid rice_small price is required." },
        { status: 400 }
      );
    }

    const items = await updatePermanentRicePrices({ rice_big, rice_small });
    const enriched = await enrichMenuItemsWithEmbeddingFlags([
      items.rice_big,
      items.rice_small,
    ]);
    return NextResponse.json({
      ok: true,
      data: { rice_big: enriched[0], rice_small: enriched[1] },
    });
  } catch (error) {
    console.error("admin today-menu rice PUT failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not update rice prices." },
      { status: 500 }
    );
  }
}
