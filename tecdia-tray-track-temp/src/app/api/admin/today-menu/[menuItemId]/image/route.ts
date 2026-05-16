import { NextResponse } from "next/server";
import {
  clearMenuItemCatalogReference,
  deleteMenuItemDayEmbedding,
  upsertMenuItemCatalogReference,
  upsertMenuItemDayEmbedding,
} from "@/lib/embeddings-db";
import { embedMenuReferenceImage } from "@/lib/tray-inference";
import {
  menuItemImageApiPath,
  readMenuItemImage,
  saveMenuItemImage,
} from "@/lib/image-store";
import {
  getOrCreateTodayServiceDayId,
  listTodayMenuForAdmin,
} from "@/lib/today-menu-db";

export const runtime = "nodejs";
export const maxDuration = 120;

interface RouteParams {
  params: Promise<{ menuItemId: string }>;
}

function averageEmbeddings(embeddings: number[][]): number[] {
  const dimensions = embeddings[0]?.length ?? 0;
  return Array.from({ length: dimensions }, (_, index) => {
    const total = embeddings.reduce((sum, embedding) => sum + embedding[index], 0);
    return total / embeddings.length;
  });
}

async function menuItemOnToday(menuItemId: string): Promise<boolean> {
  const items = await listTodayMenuForAdmin();
  return items.some((i) => i.id === menuItemId);
}

/** GET — serve stored reference image for a menu item. */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { menuItemId } = await params;
    const buffer = await readMenuItemImage(menuItemId);
    if (!buffer) {
      return NextResponse.json({ ok: false, error: "No image." }, { status: 404 });
    }
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("menu image GET failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not load image." },
      { status: 500 }
    );
  }
}

/**
 * POST — upload today's reference photo, compute CLIP embedding, store in Postgres.
 * multipart/form-data field: image
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { menuItemId } = await params;
    if (!menuItemId) {
      return NextResponse.json({ ok: false, error: "Missing id." }, { status: 400 });
    }

    if (!(await menuItemOnToday(menuItemId))) {
      return NextResponse.json(
        { ok: false, error: "Item is not on today's menu." },
        { status: 404 }
      );
    }

    const form = await request.formData();
    const files = [...form.getAll("images"), ...form.getAll("image")].filter(
      (file): file is Blob => file instanceof Blob
    );
    if (files.length < 4) {
      return NextResponse.json(
        { ok: false, error: "Upload at least 4 reference photos." },
        { status: 400 }
      );
    }

    const buffers = await Promise.all(
      files.map(async (file) => Buffer.from(await file.arrayBuffer()))
    );
    if (buffers.some((buffer) => buffer.length < 100)) {
      return NextResponse.json(
        { ok: false, error: "One or more image files are too small." },
        { status: 400 }
      );
    }

    const imagePath = await saveMenuItemImage(menuItemId, buffers[0]);
    const imageUrl = menuItemImageApiPath(menuItemId);

    await upsertMenuItemCatalogReference({
      menuItemId,
      imageUrl,
      imagePath,
      embedding: null,
    });

    let embedding: number[] | null = null;
    let embeddingWarning: string | undefined;

    try {
      const embeddings = await Promise.all(buffers.map(embedMenuReferenceImage));
      embedding = averageEmbeddings(embeddings);
      await upsertMenuItemCatalogReference({
        menuItemId,
        imageUrl,
        imagePath,
        embedding,
      });

      const serviceDayId = await getOrCreateTodayServiceDayId();
      await upsertMenuItemDayEmbedding({
        menuItemId,
        serviceDayId,
        embedding,
        imagePath,
      });
    } catch (embedError) {
      console.error("menu image embedding failed (photo saved):", embedError);
      embeddingWarning =
        "Photo saved permanently. Vision embedding failed — run npm run ml:setup on this tablet, then use Rebuild vision in Admin → Menu or re-upload the photo.";
    }

    return NextResponse.json({
      ok: true,
      data: {
        menuItemId,
        hasEmbedding: embedding !== null,
        hasReferencePhoto: true,
        imageUrl,
        dimensions: embedding?.length ?? 0,
        referencePhotoCount: buffers.length,
        warning: embeddingWarning,
      },
    });
  } catch (error) {
    console.error("menu image POST failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not save reference photo. Check disk space and try again.",
      },
      { status: 500 }
    );
  }
}

/** DELETE — remove reference image and today's embedding. */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { menuItemId } = await params;
    const serviceDayId = await getOrCreateTodayServiceDayId();
    await deleteMenuItemDayEmbedding(menuItemId, serviceDayId);
    await clearMenuItemCatalogReference(menuItemId);

    const { unlink } = await import("fs/promises");
    const { menuItemImagePath } = await import("@/lib/image-store");
    try {
      await unlink(menuItemImagePath(menuItemId));
    } catch {
      /* file may already be missing */
    }

    return NextResponse.json({ ok: true, data: null });
  } catch (error) {
    console.error("menu image DELETE failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not remove image." },
      { status: 500 }
    );
  }
}
