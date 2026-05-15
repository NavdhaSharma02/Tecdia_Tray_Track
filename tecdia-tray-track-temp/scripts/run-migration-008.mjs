import fs from "fs";
import pg from "pg";

const envText = fs.readFileSync(".env.local", "utf8");
const env = {};
for (const line of envText.split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  env[line.slice(0, i)] = line.slice(i + 1);
}

const pool = new pg.Pool({
  host: env.POSTGRES_HOST,
  port: Number(env.POSTGRES_PORT),
  database: env.POSTGRES_DB,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
});

const sql = fs.readFileSync("db/migrations/008_menu_item_reference_embedding.sql", "utf8");
await pool.query(sql);
const { rows } = await pool.query(
  `SELECT column_name FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name LIKE 'reference%'`
);
console.log("migration ok:", rows.map((r) => r.column_name));
await pool.end();
