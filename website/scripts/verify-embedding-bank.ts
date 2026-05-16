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

  const { getDbPool } = await import("../src/lib/db");
  const { normalizeDishName, buildDishNameIndex } = await import(
    "../src/lib/dish-name-match"
  );
  const { listEmbeddingPrototypesForScan, countEmbeddingPrototypesInBank } =
    await import("../src/lib/embeddings-db");
  const { getScanEmbeddingBank } = await import("../src/lib/embedding-bank");
  const { loadComputerVisionPrototypes, visionBankFilesExist, resolveVisionBankDir } =
    await import("../src/lib/computer-vision-bank");

  const pool = getDbPool();

  const tables = await pool.query<{ table_name: string }>(`
    SELECT table_name FROM information_schema.tables
    WHERE table_name IN ('menu_item_embedding_bank', 'embedding_bank_sync_state');
  `);

  const bankStats = await pool.query<{
    total: string;
    with_menu_id: string;
    without_menu_id: string;
    sources: string;
  }>(`
    SELECT
      COUNT(*)::text AS total,
      COUNT(*) FILTER (WHERE menu_item_id IS NOT NULL)::text AS with_menu_id,
      COUNT(*) FILTER (WHERE menu_item_id IS NULL)::text AS without_menu_id,
      string_agg(DISTINCT source, ', ' ORDER BY source) AS sources
    FROM menu_item_embedding_bank;
  `);

  const todayMenu = await pool.query<{ id: string; name: string }>(`
    SELECT mi.id::text, mi.name
    FROM menu_items mi
    JOIN service_day_menu_items sdmi ON sdmi.menu_item_id = mi.id
    JOIN service_days sd ON sd.id = sdmi.service_day_id
    WHERE sd.service_date = CURRENT_DATE AND sdmi.available = TRUE AND mi.is_active = TRUE;
  `);

  const scanBank = await listEmbeddingPrototypesForScan();
  const fullScanBank = await getScanEmbeddingBank();

  const dir = resolveVisionBankDir();
  const files = dir ? await visionBankFilesExist(dir) : null;
  let cvCount = 0;
  if (files) {
    const drafts = await loadComputerVisionPrototypes(files);
    cvCount = drafts.length;
  }

  const menuByName = buildDishNameIndex(todayMenu.rows);
  const matchableToday = todayMenu.rows.filter((m) => {
    const bankHasName = scanBank.some(
      (p) => normalizeDishName(p.name) === normalizeDishName(m.name)
    );
    return bankHasName;
  });

  const { enrichMenuItemsWithEmbeddingFlags } = await import(
    "../src/lib/embeddings-db"
  );
  const enriched = await enrichMenuItemsWithEmbeddingFlags(
    todayMenu.rows.map((m) => ({
      id: m.id,
      name: m.name,
      category: "Main",
      price: 0,
      image: null,
      available: true,
      calories: null,
    }))
  );
  const flagsWrong = enriched.filter(
    (item) => scanBank.some((p) => p.menu_item_id === item.id) && !item.hasEmbedding
  );

  const issues: string[] = [];

  if (tables.rows.length < 2) {
    issues.push("Missing tables — run npm run ml:migrate-009 and ml:migrate-010");
  }

  const total = Number(bankStats.rows[0]?.total ?? 0);
  if (total === 0) {
    issues.push("Bank is empty — run npm run ml:import-vision");
  }

  if (cvCount > 0 && total < cvCount * 0.9) {
    issues.push(
      `Bank has ${total} rows but Computer Vision folder has ~${cvCount} prototypes`
    );
  }

  if (todayMenu.rows.length > 0 && scanBank.length === 0) {
    issues.push(
      "Today's menu has items but scan bank is empty — dish names may not match training labels"
    );
  }

  if (flagsWrong.length > 0) {
    issues.push(
      `Admin hasEmbedding flag wrong for: ${flagsWrong.map((i) => i.name).join(", ")}`
    );
  }

  const report = {
    ok: issues.length === 0,
    issues,
    tables: tables.rows.map((r) => r.table_name),
    bank: bankStats.rows[0],
    computerVisionPrototypesOnDisk: cvCount,
    todayMenuCount: todayMenu.rows.length,
    todayMenuWithPrototypes: matchableToday.length,
    scanPrototypeCount: scanBank.length,
    scanDistinctDishes: new Set(scanBank.map((r) => r.menu_item_id)).size,
    getScanEmbeddingBankMatchesList: scanBank.length === fullScanBank.length,
    totalInBank: await countEmbeddingPrototypesInBank(),
    sampleTodayMatches: matchableToday.slice(0, 5).map((m) => m.name),
    adminFlags: enriched.map((i) => ({
      name: i.name,
      hasEmbedding: i.hasEmbedding,
      embeddingCount: i.embeddingCount,
    })),
  };

  console.log(JSON.stringify(report, null, 2));
  await pool.end();
  process.exit(issues.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
