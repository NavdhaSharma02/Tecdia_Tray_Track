import { NextResponse } from "next/server";
import { inferTrayFromImage } from "@/lib/tray-inference";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * POST /api/scan
 * multipart/form-data field: image (JPEG from USB camera)
 * Runs fully on the kiosk machine (localhost) — no external network required.
 */
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("image");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { ok: false, error: "Missing image field." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length < 100) {
      return NextResponse.json(
        { ok: false, error: "Image data is too small." },
        { status: 400 }
      );
    }

    const result = await inferTrayFromImage(buffer);

    if (result.items.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: result.message || "No dishes recognized on this tray.",
          meta: { mode: result.mode },
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: result.items,
      meta: { mode: result.mode, message: result.message },
    });
  } catch (error) {
    console.error("POST /api/scan failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Scan processing failed. Ensure the ML model was downloaded (npm run ml:setup).",
      },
      { status: 500 }
    );
  }
}
