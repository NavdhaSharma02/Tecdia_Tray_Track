import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import {
  appendMenuItemEmbedding,
  clearMenuItemCatalogReference,
  countMenuItemEmbeddings,
  deleteMenuItemDayEmbedding,
  deleteMenuItemEmbeddingBySourceKey,
  deleteMenuItemEmbeddingsBySource,
  listMenuItemEmbeddingBankRows,
  upsertMenuItemCatalogReference,
  upsertMenuItemDayEmbedding,
} from "@/lib/embeddings-db";
import {
  deleteMenuItemImageFile,
  legacyMenuItemImagePath,
  listMenuItemImageUuidsFromBankRows,
  menuItemImageApiPath,
  menuItemImagePath,
  readLegacyMenuItemImage,
  readMenuItemImage,
  saveMenuItemImage,
  uploadSourceKeyForImageUuid,
} from "@/lib/image-store";
import { embedMenuReferenceImage } from "@/lib/tray-inference";
import {
  getOrCreateTodayServiceDayId,
  listTodayMenuForAdmin,
} from "@/lib/today-menu-db";
import { unlink } from "fs/promises";

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

async function resolveImageBuffer(
  menuItemId: string,
  imageUuid: string | null
): Promise<Buffer | null> {
  if (imageUuid) {
    return readMenuItemImage(imageUuid);
  }

  const bankRows = await listMenuItemEmbeddingBankRows(menuItemId);
  const uuids = listMenuItemImageUuidsFromBankRows(bankRows);
  const latestUuid = uuids[uuids.length - 1];
  if (latestUuid) {
    return readMenuItemImage(latestUuid);
  }

  return readLegacyMenuItemImage(menuItemId);
}

/** GET — serve reference image (?uuid= for a specific file; latest when omitted). */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { menuItemId } = await params;
    const imageUuid = new URL(request.url).searchParams.get("uuid");
    const buffer = await resolveImageBuffer(menuItemId, imageUuid);
    if (!buffer) {
      return NextResponse.json({ ok: false, error: "No image." }, { status: 404 });
    }
    return new NextResponse(new Uint8Array(buffer), {
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
 * POST — upload today's reference photo(s), compute CLIP embedding, store in Postgres.
 * multipart/form-data fields: image / images
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { menuItemId } = await params;
    if (!menuItemId) {
      return NextResponse.json({ ok: false, error: "Missing id." }, { status: 400 });
    }

    const todayItems = await listTodayMenuForAdmin();
    const menuItem = todayItems.find((i) => i.id === menuItemId);
    if (!menuItem) {
      return NextResponse.json(
        { ok: false, error: "Item is not on today's menu." },
        { status: 404 }
      );
    }

    const form = await request.formData();
    const files = [...form.getAll("images"), ...form.getAll("image")].filter(
      (file): file is File => file instanceof File
    );
    if (files.length < 1) {
      return NextResponse.json(
        { ok: false, error: "Upload at least 1 reference photo." },
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

    const imageUuids = buffers.map(() => randomUUID());
    const imagePaths = await Promise.all(
      buffers.map((buffer, index) => saveMenuItemImage(imageUuids[index]!, buffer))
    );
    const latestUuid = imageUuids[imageUuids.length - 1]!;
    const imageUrl = menuItemImageApiPath(menuItemId, latestUuid);
    const imagePath = imagePaths[imagePaths.length - 1]!;

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

      for (let i = 0; i < buffers.length; i++) {
        await appendMenuItemEmbedding({
          menuItemId,
          referenceName: menuItem.name,
          embedding: embeddings[i]!,
          source: "admin_upload",
          sourceKey: uploadSourceKeyForImageUuid(imageUuids[i]!),
        });
      }

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

    const embeddingCount = await countMenuItemEmbeddings(
      menuItemId,
      menuItem.name
    );

    return NextResponse.json({
      ok: true,
      data: {
        menuItemId,
        hasEmbedding: embedding !== null || embeddingCount > 0,
        embeddingCount,
        hasReferencePhoto: true,
        imageUrl,
        imageUrls: imageUuids.map((uuid) => menuItemImageApiPath(menuItemId, uuid)),
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

/** DELETE — remove one reference photo (?uuid=) or all when uuid is omitted. */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { menuItemId } = await params;
    const imageUuid = new URL(request.url).searchParams.get("uuid");

    if (imageUuid) {
      await deleteMenuItemImageFile(imageUuid);
      await deleteMenuItemEmbeddingBySourceKey(
        menuItemId,
        "admin_upload",
        uploadSourceKeyForImageUuid(imageUuid)
      );

      const bankRows = await listMenuItemEmbeddingBankRows(menuItemId);
      const remaining = listMenuItemImageUuidsFromBankRows(bankRows);
      const latestUuid = remaining[remaining.length - 1];

      if (latestUuid) {
        await upsertMenuItemCatalogReference({
          menuItemId,
          imageUrl: menuItemImageApiPath(menuItemId, latestUuid),
          imagePath: menuItemImagePath(latestUuid),
        });
      } else {
        const serviceDayId = await getOrCreateTodayServiceDayId();
        await deleteMenuItemDayEmbedding(menuItemId, serviceDayId);
        await clearMenuItemCatalogReference(menuItemId);
        try {
          await unlink(legacyMenuItemImagePath(menuItemId));
        } catch {
          /* legacy file may already be missing */
        }
      }

      return NextResponse.json({ ok: true, data: null });
    }

    const bankRows = await listMenuItemEmbeddingBankRows(menuItemId);
    const uuids = listMenuItemImageUuidsFromBankRows(bankRows);

    const serviceDayId = await getOrCreateTodayServiceDayId();
    await deleteMenuItemDayEmbedding(menuItemId, serviceDayId);
    await deleteMenuItemEmbeddingsBySource(menuItemId, [
      "admin_upload",
      "rebuild_disk",
      "catalog_legacy",
    ]);
    await clearMenuItemCatalogReference(menuItemId);

    await Promise.all(uuids.map((uuid) => deleteMenuItemImageFile(uuid)));

    try {
      await unlink(legacyMenuItemImagePath(menuItemId));
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
