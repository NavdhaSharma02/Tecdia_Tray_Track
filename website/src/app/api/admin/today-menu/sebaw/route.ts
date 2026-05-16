import { NextResponse } from "next/server";
import { enrichMenuItemsWithEmbeddingFlags } from "@/lib/embeddings-db";
import { upsertSebawForToday } from "@/lib/today-menu-db";

/**
 * PUT /api/admin/today-menu/sebaw — set whether free Sebaw soup is on today's menu.
 */
export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { available?: boolean };
    const available = body.available !== false;
    const item = await upsertSebawForToday(available);
    const [enriched] = await enrichMenuItemsWithEmbeddingFlags([item]);
    return NextResponse.json({ ok: true, data: enriched });
  } catch (error) {
    console.error("admin today-menu sebaw PUT failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not update Sebaw for today." },
      { status: 500 }
    );
  }
}
