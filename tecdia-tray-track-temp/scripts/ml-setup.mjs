/**
 * One-time (or after upgrade) download of the CLIP ONNX model for offline kiosk use.
 * Run on a machine with internet, then copy data/ml-cache to the tablet if needed.
 */
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const cacheDir =
  process.env.ML_MODEL_CACHE_DIR || path.join(root, "data", "ml-cache");
const modelId = process.env.ML_MODEL_ID || "Xenova/clip-vit-base-patch32";

console.log(`Downloading CLIP model: ${modelId}`);
console.log(`Cache directory: ${cacheDir}`);

const { AutoProcessor, CLIPVisionModelWithProjection, env } = await import(
  "@xenova/transformers"
);

env.cacheDir = cacheDir;
env.allowLocalModels = true;

await AutoProcessor.from_pretrained(modelId);
await CLIPVisionModelWithProjection.from_pretrained(modelId, { quantized: true });

console.log("CLIP model ready for offline inference.");
