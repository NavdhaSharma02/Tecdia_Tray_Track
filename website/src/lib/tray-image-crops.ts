import { Jimp } from "jimp";
import type { YoloDetectionBox } from "@/lib/yolo-detector";

interface CropRegion {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Crop each YOLO food box (normalized 0–1 coords on the source image). */
export async function buildTrayCropsFromBoxes(
  imageBuffer: Buffer,
  boxes: YoloDetectionBox[]
): Promise<Buffer[]> {
  const base = await Jimp.read(imageBuffer);
  const w = base.bitmap.width;
  const h = base.bitmap.height;
  const buffers: Buffer[] = [];

  for (const box of boxes) {
    const left = Math.max(0, Math.floor(box.x1 * w));
    const top = Math.max(0, Math.floor(box.y1 * h));
    const right = Math.min(w, Math.ceil(box.x2 * w));
    const bottom = Math.min(h, Math.ceil(box.y2 * h));
    const cropW = Math.max(1, right - left);
    const cropH = Math.max(1, bottom - top);

    const tile = base
      .clone()
      .crop({ x: left, y: top, w: cropW, h: cropH })
      .contain({ w: 384, h: 384 });

    buffers.push(await tile.getBuffer("image/jpeg"));
  }

  return buffers;
}

/** Build full-frame + grid crops (pure JS via Jimp — avoids sharp/onnx conflicts on Windows). */
export async function buildTrayCrops(imageBuffer: Buffer): Promise<Buffer[]> {
  const base = await Jimp.read(imageBuffer);
  const resized = base.clone().contain({ w: 1024, h: 768 });
  const w = resized.bitmap.width;
  const h = resized.bitmap.height;

  const crops: CropRegion[] = [{ left: 0, top: 0, width: w, height: h }];

  const cols = 3;
  const rows = 2;
  const cellW = Math.floor(w / cols);
  const cellH = Math.floor(h / rows);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      crops.push({
        left: col * cellW,
        top: row * cellH,
        width: Math.min(cellW, w - col * cellW),
        height: Math.min(cellH, h - row * cellH),
      });
    }
  }

  const buffers: Buffer[] = [];
  for (const region of crops) {
    const tile = resized.clone().crop({
      x: region.left,
      y: region.top,
      w: region.width,
      h: region.height,
    });
    buffers.push(await tile.getBuffer("image/jpeg"));
  }

  return buffers;
}
