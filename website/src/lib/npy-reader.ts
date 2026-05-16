import { readFile } from "fs/promises";

/** Read a little-endian float32 .npy matrix (v1.0 / v2.0). */
export async function readNpyFloat32Matrix(
  filePath: string
): Promise<{ data: Float32Array; rows: number; cols: number }> {
  const buf = await readFile(filePath);
  if (
    buf.length < 10 ||
    buf[0] !== 0x93 ||
    buf.toString("latin1", 1, 6) !== "NUMPY"
  ) {
    throw new Error(`Not a NumPy file: ${filePath}`);
  }

  const major = buf[6]!;
  const minor = buf[7]!;
  let headerLen = 0;
  let headerStart = 0;

  if (major === 1) {
    headerLen = buf.readUInt16LE(8);
    headerStart = 10;
  } else if (major === 2) {
    headerLen = buf.readUInt32LE(8);
    headerStart = 12;
  } else {
    throw new Error(`Unsupported .npy version ${major}.${minor}`);
  }

  const header = buf
    .subarray(headerStart, headerStart + headerLen)
    .toString("ascii")
    .trim();

  const descrMatch = /'descr':\s*'([^']+)'/.exec(header);
  const shapeMatch = /'shape':\s*\(([^)]*)\)/.exec(header);
  if (!descrMatch || !shapeMatch) {
    throw new Error(`Could not parse .npy header: ${filePath}`);
  }

  const descr = descrMatch[1]!;
  if (descr !== "<f4" && descr !== "|f4") {
    throw new Error(`Expected float32 .npy (<f4), got ${descr}`);
  }

  const shapeParts = shapeMatch[1]!
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s));

  const dataStart = headerStart + headerLen;
  const data = new Float32Array(
    buf.buffer,
    buf.byteOffset + dataStart,
    (buf.length - dataStart) / 4
  );

  if (shapeParts.length === 1) {
    return { data, rows: shapeParts[0]!, cols: 1 };
  }
  if (shapeParts.length === 2) {
    const [rows, cols] = shapeParts;
    if (rows! * cols! !== data.length) {
      throw new Error(`Shape mismatch in ${filePath}`);
    }
    return { data, rows: rows!, cols: cols! };
  }

  throw new Error(`Unsupported .npy rank in ${filePath}`);
}
