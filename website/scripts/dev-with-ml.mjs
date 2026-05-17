/**
 * Run Next.js and the YOLO dish-localization server together.
 * Usage: npm run dev:ml
 */
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const python = process.env.ML_YOLO_PYTHON || "python";

const children = [];

function run(cmd, args, label) {
  const child = spawn(cmd, args, {
    cwd: root,
    env: process.env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  child.on("exit", (code) => {
    console.log(`[${label}] exited with code ${code ?? "?"}`);
    shutdown(code ?? 1);
  });
  children.push(child);
  return child;
}

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("Starting YOLO dish localization + Next.js…");
run(python, ["scripts/yolo-detect-server.py"], "yolo");
run("npm", ["run", "dev"], "next");
