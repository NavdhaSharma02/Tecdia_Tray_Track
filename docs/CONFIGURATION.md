# Configuration Reference — Tecdia Tray Track

All environment variables read at process startup from `.env.local` (copied from `.env.example`).

---

## 1. Database

| Variable | Default | Description | Read By |
|----------|---------|-------------|---------|
| `POSTGRES_HOST` | `localhost` | PostgreSQL host | `db.ts` |
| `POSTGRES_PORT` | `5432` | PostgreSQL port | `db.ts` |
| `POSTGRES_DB` | `tecdia_tray_track` | Database name | `db.ts` |
| `POSTGRES_USER` | `postgres` | Database user | `db.ts` |
| `POSTGRES_PASSWORD` | — | Database password | `db.ts` |

---

## 2. Auth

| Variable | Default | Description | Read By |
|----------|---------|-------------|---------|
| `AUTH_SESSION_SECRET` | — | Session encryption key (long random string) | `session.ts` |
| `ADMIN_PIN` | — | 6-digit admin PIN (full access) | `admin-auth.ts` |
| `CASHIER_PIN` | — | 6-digit cashier PIN (billing only) | `admin-auth.ts` |

---

## 3. ML Inference

| Variable | Default | Description | Read By |
|----------|---------|-------------|---------|
| `ML_INFERENCE_MODE` | `clip` | `clip` = production ONNX; `simulate`/`mock` = dev only | `clip-embedder.ts`, `tray-inference.ts` |
| `ML_MODEL_ID` | `Xenova/clip-vit-base-patch32` | CLIP model identifier | `clip-embedder.ts`, `embeddings-db.ts` |
| `ML_MODEL_CACHE_DIR` | `./data/ml-cache` | ONNX model cache directory | `clip-embedder.ts` |
| `MENU_IMAGES_DIR` | `./data/menu-images` | Reference photo storage | `image-store.ts` |
| `ML_VISION_BANK_DIR` | `../Computer Vision` | Training embeddings folder; set to `off`/`false`/`0` to disable sync | `computer-vision-bank.ts` |

### Deprecated

| Variable | Reason |
|----------|--------|
| `ML_SCAN_MIN_SIMILARITY` | No longer used — current algorithm has no minimum score threshold |
| `ML_SCAN_UNKNOWN_GAP` | No longer used — current algorithm has no score gap logic |

---

## 4. YOLO (Node.js Sidecar Manager)

| Variable | Default | Description | Read By |
|----------|---------|-------------|---------|
| `ML_YOLO_SERVICE_URL` | — | HTTP URL of YOLO Flask server (e.g. `http://127.0.0.1:5001/detect`) | `yolo-detector.ts`, `yolo-service-manager.ts` |
| `ML_YOLO_AUTO_START` | `true` | Auto-spawn Python subprocess when unreachable | `yolo-service-manager.ts` |
| `ML_YOLO_STARTUP_TIMEOUT_MS` | `300000` (5 min) | Max wait for Python to become healthy | `yolo-service-manager.ts` |
| `ML_YOLO_TIMEOUT_MS` | `30000` (30 s) | Per-request detection timeout | `yolo-detector.ts` |
| `ML_YOLO_PYTHON` | `python` | Python executable for auto-start | `yolo-service-manager.ts` |
| `ML_YOLO_HEALTH_URL` | `<origin>/health` | Custom health check endpoint | `yolo-service-manager.ts` |

---

## 5. YOLO (Python Flask Server)

| Variable | Default | Description | Read By |
|----------|---------|-------------|---------|
| `ML_YOLO_MODEL_PATH` | `../Dish Localization/best.pt` | Path to YOLOv8 weights | `yolo-detect-server.py` |
| `ML_YOLO_CONF` | `0.4` | Detection confidence threshold | `yolo-detect-server.py` |
| `ML_YOLO_EMIT_CLASSES` | `drink,food,meatless soup,rice_big,rice_small,soup` | Comma-separated class whitelist | `yolo-detect-server.py` |
| `ML_YOLO_HOST` | `127.0.0.1` | Bind address | `yolo-detect-server.py` |
| `ML_YOLO_PORT` | `5001` | Listen port | `yolo-detect-server.py` |

---

## 6. Frontend

| Variable | Default | Description | Read By |
|----------|---------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | `/api` | API base URL for frontend HTTP calls | `constants.ts` |

---

## 7. Env File Template

```env
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=tecdia_tray_track
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_postgres_password

# Auth
AUTH_SESSION_SECRET=replace_with_a_long_random_secret
ADMIN_PIN=123456
CASHIER_PIN=654321

# ML Inference
ML_INFERENCE_MODE=clip
ML_MODEL_ID=Xenova/clip-vit-base-patch32
ML_MODEL_CACHE_DIR=./data/ml-cache
MENU_IMAGES_DIR=./data/menu-images

# YOLO Service
ML_YOLO_SERVICE_URL=http://127.0.0.1:5001/detect
# ML_YOLO_AUTO_START=true
# ML_YOLO_PYTHON=python
# ML_YOLO_TIMEOUT_MS=30000
# ML_YOLO_STARTUP_TIMEOUT_MS=300000
# ML_YOLO_MODEL_PATH=../Dish Localization/best.pt

# Vision Bank (optional; set to "off" to disable)
# ML_VISION_BANK_DIR=../Computer Vision
```

---

## 8. Configuration Flow

```
.env.example → .env.local → process.env → modules
```

All vars read once at process startup. No hot-reload. Deployment must copy `.env.local` alongside the build artifacts.
