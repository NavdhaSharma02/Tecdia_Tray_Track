import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

async function main(): Promise<void> {
  const root = path.dirname(fileURLToPath(import.meta.url)) + "/..";
  process.chdir(root);

  const envText = fs.readFileSync(".env.local", "utf8");
  for (const line of envText.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    process.env[line.slice(0, i)] = line.slice(i + 1);
  }

  const { syncComputerVisionFolder } = await import("../src/lib/vision-bank-sync");
  const { countEmbeddingPrototypesInBank, migrateLegacyCatalogEmbeddings } =
    await import("../src/lib/embeddings-db");

  await migrateLegacyCatalogEmbeddings();
  const result = await syncComputerVisionFolder();
  const total = await countEmbeddingPrototypesInBank();

  console.log(JSON.stringify({ ...result, totalPrototypesInBank: total }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
