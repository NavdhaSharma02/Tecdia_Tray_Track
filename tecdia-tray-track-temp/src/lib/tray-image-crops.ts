import { Jimp } from "jimp";

interface CropRegion {
  left: number;
  top: number;
  width: number;
  height: number;
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
