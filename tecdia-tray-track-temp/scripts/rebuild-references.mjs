import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url)) + "/..";
process.chdir(root);

const envText = fs.readFileSync(".env.local", "utf8");
for (const line of envText.split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  process.env[line.slice(0, i)] = line.slice(i + 1);
}

const { rebuildCatalogEmbeddingsFromDisk } = await import(
  "../src/lib/menu-reference-rebuild.ts"
);
const result = await rebuildCatalogEmbeddingsFromDisk();
console.log(JSON.stringify(result, null, 2));
