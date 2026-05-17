import { spawn, type ChildProcess } from "child_process";
import path from "path";

let managedProcess: ChildProcess | null = null;
let startPromise: Promise<boolean> | null = null;

function envFlag(name: string, defaultOn = true): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return defaultOn;
  const v = raw.trim().toLowerCase();
  return v !== "0" && v !== "false" && v !== "off" && v !== "no";
}

export function isYoloAutoStartEnabled(): boolean {
  return envFlag("ML_YOLO_AUTO_START", true);
}

export function yoloDetectUrl(): string | null {
  const raw = process.env.ML_YOLO_SERVICE_URL;
  if (!raw) return null;
  const url = raw.trim();
  if (!url || url === "off" || url === "false" || url === "0") return null;
  return url;
}

/** Base origin for health checks, e.g. http://127.0.0.1:5001 */
export function yoloServiceOrigin(detectUrl: string): string {
  const u = new URL(detectUrl);
  return `${u.protocol}//${u.host}`;
}

export function yoloHealthUrl(detectUrl: string): string {
  const override = process.env.ML_YOLO_HEALTH_URL?.trim();
  if (override) return override;
  return `${yoloServiceOrigin(detectUrl)}/health`;
}

async function pingHealth(healthUrl: string, timeoutMs = 15_000): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(healthUrl, { signal: controller.signal });
    if (!res.ok) return false;
    const json = (await res.json()) as { ok?: boolean };
    return json.ok === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function spawnYoloServer(): ChildProcess {
  const websiteRoot = process.cwd();
  const scriptPath = path.join(websiteRoot, "scripts", "yolo-detect-server.py");
  const python = process.env.ML_YOLO_PYTHON?.trim() || "python";

  const child = spawn(python, [scriptPath], {
    cwd: websiteRoot,
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  child.stdout?.on("data", (chunk: Buffer) => {
    console.log(`[yolo] ${chunk.toString().trim()}`);
  });
  child.stderr?.on("data", (chunk: Buffer) => {
    console.error(`[yolo] ${chunk.toString().trim()}`);
  });
  child.on("exit", (code, signal) => {
    if (managedProcess === child) managedProcess = null;
    console.warn(`[yolo] process exited (code=${code ?? "null"}, signal=${signal ?? "null"})`);
  });

  return child;
}

async function waitForHealthy(
  healthUrl: string,
  timeoutMs: number
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  let delayMs = 400;

  while (Date.now() < deadline) {
    if (await pingHealth(healthUrl, 2500)) return true;
    await new Promise((r) => setTimeout(r, delayMs));
    delayMs = Math.min(delayMs * 1.4, 2000);
  }

  return false;
}

/**
 * Ensure the local YOLO Python service responds on /health.
 * Spawns scripts/yolo-detect-server.py when ML_YOLO_AUTO_START is enabled (default).
 */
export async function ensureYoloServiceReady(): Promise<{
  ok: boolean;
  message?: string;
}> {
  const detectUrl = yoloDetectUrl();
  if (!detectUrl) {
    return {
      ok: false,
      message:
        "ML_YOLO_SERVICE_URL is not set. Add it to .env.local (e.g. http://127.0.0.1:5001/detect).",
    };
  }

  const healthUrl = yoloHealthUrl(detectUrl);
  const readyTimeoutMs =
    Number(process.env.ML_YOLO_STARTUP_TIMEOUT_MS) || 300_000;

  if (await pingHealth(healthUrl, 3000)) {
    return { ok: true };
  }

  if (!isYoloAutoStartEnabled()) {
    return {
      ok: false,
      message:
        "Dish localization server is not running. Start it with: python scripts/yolo-detect-server.py",
    };
  }

  if (!startPromise) {
    startPromise = (async () => {
      if (managedProcess && !managedProcess.killed) {
        return waitForHealthy(healthUrl, readyTimeoutMs);
      }

      console.log("[yolo] starting dish localization server…");
      managedProcess = spawnYoloServer();
      return waitForHealthy(healthUrl, readyTimeoutMs);
    })().finally(() => {
      startPromise = null;
    });
  }

  const ready = await startPromise;
  if (ready) return { ok: true };

  return {
    ok: false,
    message:
      "Dish localization server did not become ready. Check that Python, ultralytics, and Dish Localization/best.pt are installed, then run: python scripts/yolo-detect-server.py",
  };
}
