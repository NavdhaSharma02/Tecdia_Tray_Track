# Tech Stack & Dependencies — Tecdia Tray Track

---

## 1. Runtime Overview

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **App Framework** | Next.js | ^16.2.6 | Full-stack React framework (App Router) |
| **UI Library** | React | 19.2.4 | Component rendering |
| **Language** | TypeScript | ^6.0.2 | Type-safe JavaScript |
| **Styling** | Tailwind CSS | ^4 | Utility-first CSS framework |
| **Database** | PostgreSQL | 15+ | Relational data store |
| **ML (Node)** | `@xenova/transformers` | ^2.17.2 | On-device CLIP inference |
| **ML (Python)** | `ultralytics` | — | YOLOv8 dish localization |
| **Python Server** | Flask + waitress | — | YOLO HTTP sidecar |

---

## 2. Node.js Dependencies

All sourced from `website/package.json`.

### Production Dependencies

| Package | Version | Used In | Purpose |
|---------|---------|---------|---------|
| `next` | ^16.2.6 | Entire app | Framework (routing, SSR, API, build) |
| `react` | 19.2.4 | All components | UI rendering |
| `react-dom` | 19.2.4 | All components | DOM rendering |
| `@xenova/transformers` | ^2.17.2 | `src/lib/clip-embedder.ts` | CLIP ViT-B/32 inference (embedding generation) |
| `pg` | ^8.20.0 | `src/lib/db.ts` + all `-db.ts` modules | PostgreSQL client |
| `sharp` | ^0.34.5 | `src/lib/tray-image-crops.ts`, `src/lib/image-store.ts` | High-performance image processing (JPEG resize, crop, encode) |
| `jimp` | ^1.6.1 | `src/lib/tray-image-crops.ts` | Fallback image processing (when sharp can't handle the format) |

### Dev Dependencies

| Package | Version | Used In | Purpose |
|---------|---------|---------|---------|
| `typescript` | ^6.0.2 | All `.ts`/`.tsx` files | Type checking |
| `tsx` | ^4.22.0 | Scripts (import-vision-bank.ts) | TypeScript execution for Node scripts |
| `@types/node` | ^25.6.0 | Global | Node.js type definitions |
| `@types/react` | ^19.2.14 | Components | React type definitions |
| `@types/react-dom` | ^19.2.3 | Components | ReactDOM type definitions |
| `@types/pg` | ^8.20.0 | `src/lib/db.ts` | PostgreSQL type definitions |
| `eslint` | ^9 | Global | JavaScript/TypeScript linting |
| `eslint-config-next` | 16.2.3 | Global | Next.js ESLint configuration |
| `tailwindcss` | ^4 | Styles | Tailwind CSS compiler |
| `@tailwindcss/postcss` | ^4 | Styles | PostCSS plugin for Tailwind v4 |

### Package.json Scripts

```json
{
  "dev": "next dev --webpack",
  "dev:ml": "node scripts/dev-with-ml.mjs",
  "dev:turbo": "next dev",
  "yolo": "python scripts/yolo-detect-server.py",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "ml:setup": "node scripts/ml-setup.mjs",
  "ml:migrate-009": "node scripts/run-migration-009.mjs",
  "ml:migrate-010": "node scripts/run-migration-010.mjs",
  "ml:import-vision": "npx tsx scripts/import-vision-bank.ts"
}
```

| Script | Purpose | When to Run |
|--------|---------|-------------|
| `dev` | Development server (webpack) | Daily dev work |
| `dev:ml` | Dev server + auto-start YOLO Python sidecar | When testing tray scan with YOLO |
| `yolo` | Start YOLO Flask server on :5001 | Production: run alongside `start` |
| `build` | Production build | Before deployment |
| `start` | Production server | Production kiosk |
| `lint` | Run ESLint | Before commits |
| `ml:setup` | Download CLIP model weights to cache | First-time setup |
| `ml:migrate-009/010` | Run embedding bank migrations | After pulling migration 009/010 |
| `ml:import-vision` | Import vision bank prototypes | After setting up vision bank data |

---

## 3. Python Dependencies

### YOLO Detection Server (`website/scripts/yolo-detect-server.py`)

| Package | Purpose |
|---------|---------|
| `ultralytics` | YOLOv8 model loading and inference (object detection) |
| `flask` | HTTP server for `/detect` and `/health` endpoints |
| `waitress` | Production WSGI server (multi-threaded, Windows-compatible) |
| `opencv-python-headless` | Image decoding and manipulation (`cv2.imdecode`, `cv2.imread`) |
| `numpy` | Array/buffer operations for image data |

Install: `pip install ultralytics flask opencv-python-headless waitress`

### Optional Training Scripts (`dish classification/scripts/`)

These are standalone Python scripts used for training YOLO and CLIP models offline. **Not required for kiosk operation.**

| Script | Key Libraries | Purpose |
|--------|---------------|---------|
| `train_detector.py` | `ultralytics` | Train YOLOv8 on dish localization dataset |
| `build_embeddings.py` | `open-clip-torch`, `torch`, `PIL`, `numpy`, `tqdm` | Build CLIP embedding bank from dish images |
| `predict_dish.py` | `ultralytics`, `open-clip-torch`, `torch`, `PIL`, `sklearn`, `numpy`, `cv2` | End-to-end test: YOLO detect → CLIP classify |
| `test_detetctor.py` | `ultralytics` | Quick YOLO inference test on sample images |

Additional libraries used across these scripts:

| Library | Purpose |
|---------|---------|
| `open-clip-torch` | OpenCLIP model (ViT-B-32, pretrained `laion2b_s34b_b79k`) |
| `torch` | PyTorch — model inference backend |
| `scikit-learn` | `cosine_similarity` for embedding matching |
| `Pillow` | Image loading and preprocessing |
| `tqdm` | Progress bars for batch processing |
| `numpy` | Array operations and `.npy` file I/O |

---

## 4. Database (PostgreSQL)

| Detail | Value |
|--------|-------|
| **Engine** | PostgreSQL 15+ |
| **Extension** | `pgcrypto` (for `gen_random_uuid()`) |
| **Connection** | `localhost:5432` |
| **Database name** | `tecdia_tray_track` |
| **Client** | `pg` (node-postgres) via `src/lib/db.ts` |
| **Pool** | `Pool` — max 10 connections, 30s idle timeout, 5s connection timeout |
| **Migrations** | Manual SQL files in `website/db/migrations/` (applied sequentially via `psql`) |

**Config (from `.env.local`):**

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=tecdia_tray_track
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
```

### Schema Migrations

| File | Change |
|------|--------|
| `schema.sql` | All core tables (customers, menu_items, service_days, tray_scans, transactions, etc.) |
| `002_menu_calories_nullable.sql` | Make `menu_items.calories` nullable |
| `003_feedbacks_table.sql` | Create `feedbacks` table |
| `004_customers_profile_fields.sql` | Add `employee_code`, `department` to customers |
| `005_transactions_analytics_indexes.sql` | Analytics indexes on transactions |
| `006_staff_users.sql` | Create `staff_users` table |
| `007_menu_item_day_embeddings.sql` | Create per-day embedding table |
| `008_menu_item_reference_embedding.sql` | Add `reference_embedding` to `menu_items` |
| `009_menu_item_embedding_bank.sql` | Create embedding bank + sync state tables |
| `010_embedding_bank_reference_name.sql` | Add `reference_name`, make `menu_item_id` nullable |

---

## 5. Environment Variables

Full reference from `.env.example`.

### Database

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `POSTGRES_HOST` | `localhost` | Yes | PostgreSQL host |
| `POSTGRES_PORT` | `5432` | Yes | PostgreSQL port |
| `POSTGRES_DB` | `tecdia_tray_track` | Yes | Database name |
| `POSTGRES_USER` | `postgres` | Yes | Database user |
| `POSTGRES_PASSWORD` | — | Yes | Database password |

### Auth

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `AUTH_SESSION_SECRET` | — | Yes | Long random string for session signing |
| `ADMIN_PIN` | `123456` | Yes | Exactly 6 digits; admin dashboard login |
| `CASHIER_PIN` | `654321` | Yes | 6 digits; cashier portion adjustments on kiosk |

### ML / Vision

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `ML_INFERENCE_MODE` | `clip` | Yes | `"clip"` = production, `"simulate"` = random items for dev |
| `ML_MODEL_ID` | `Xenova/clip-vit-base-patch32` | Yes | CLIP model identifier for `@xenova/transformers` |
| `ML_MODEL_CACHE_DIR` | `./data/ml-cache` | Yes | CLIP model weights cache directory |
| `MENU_IMAGES_DIR` | `./data/menu-images` | Yes | Reference photo storage |

### YOLO Service

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `ML_YOLO_SERVICE_URL` | `http://127.0.0.1:5001/detect` | Yes | YOLO Python service endpoint |
| `ML_YOLO_AUTO_START` | — | No | Auto-start YOLO as subprocess |
| `ML_YOLO_PYTHON` | `python` | No | Python executable path |
| `ML_YOLO_TIMEOUT_MS` | `30000` | No | Request timeout to YOLO service |
| `ML_YOLO_STARTUP_TIMEOUT_MS` | `300000` | No | YOLO startup timeout |
| `ML_YOLO_MODEL_PATH` | `../Dish Localization/best.pt` | No | Custom YOLO weights path |

### Other

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | `/api` | No | Override for remote API (dev only) |

---

## 6. File Structure Reference

### Core Source (`website/src/`)

```
src/
├── app/                           ← Next.js App Router
│   ├── page.tsx                   ← Marketing homepage
│   ├── layout.tsx                 ← Root layout (HTML shell, fonts)
│   ├── globals.css                ← Global Tailwind CSS
│   ├── error.tsx                  ← Error boundary
│   ├── loading.tsx                ← Loading fallback
│   ├── not-found.tsx              ← 404 page
│   ├── customer/
│   │   ├── layout.tsx             ← Customer context provider
│   │   └── page.tsx               ← Kiosk state machine
│   ├── admin/
│   │   ├── layout.tsx             ← Auth guard + sidebar
│   │   ├── page.tsx               ← Dashboard (StatsGrid)
│   │   ├── login/page.tsx         ← PIN login
│   │   ├── menu/page.tsx          ← MenuEditor
│   │   ├── users/page.tsx         ← UserTable
│   │   ├── transactions/page.tsx  ← TransactionTable
│   │   ├── feedbacks/page.tsx     ← FeedbackTable
│   │   ├── employees/page.tsx     ← EmployeeManagementTable
│   │   └── analytics/page.tsx     ← Charts + CSV export
│   └── api/                       ← 33 API route files
├── components/
│   ├── admin/                     ← 9 admin components
│   ├── camera/                    ← ScanOverlay
│   ├── customer/                  ← 10 kiosk step components
│   ├── layout/                    ← 7 layout components
│   ├── marketing/                 ← MarketingTrayShowcase
│   └── ui/                        ← 9 reusable atomics (Button, Input, Card, etc.)
├── hooks/
│   ├── useCustomerFlow.tsx        ← Kiosk state machine (reducer + context)
│   ├── useCamera.ts               ← USB camera MediaStream
│   └── useEmployeeIdScanner.ts    ← Barcode/ID scanner
├── lib/                           ← 32 modules (core logic)
│   ├── db.ts                      ← PostgreSQL pool singleton
│   ├── clip-embedder.ts           ← CLIP inference wrapper
│   ├── tray-inference.ts          ← Scan pipeline orchestrator
│   ├── tray-image-crops.ts        ← Grid crop extraction
│   ├── yolo-detector.ts           ← YOLO HTTP client
│   ├── yolo-service-manager.ts    ← YOLO subprocess manager
│   ├── yolo-rice-scan.ts          ← Rice-specific YOLO logic
│   ├── yolo-sebaw-scan.ts         ← Sebaw-specific YOLO logic
│   ├── embeddings-db.ts           ← Embedding CRUD
│   ├── embedding-bank.ts          ← Embedding bank operations
│   ├── image-store.ts             ← Disk image read/write
│   ├── today-menu-db.ts           ← Menu DB queries
│   ├── constants.ts               ─ App-wide constants
│   ├── utils.ts                   ─ Misc utilities
│   ├── auth.ts                    ─ Password hashing + session
│   ├── customer-auth.ts           ─ Customer auth helpers
│   ├── admin-auth.ts              ─ Admin PIN verification
│   ├── session.ts                 ─ Session cookie management
│   ├── customer-profile.ts        ─ Employee profile queries
│   ├── customer-activity-db.ts    ─ Activity tracking
│   ├── manual-bill.ts             ─ Manual billing logic
│   ├── admin-stats-db.ts          ─ Dashboard stats queries
│   ├── admin-transactions-db.ts   ─ Transaction queries
│   ├── admin-users-db.ts          ─ Staff user CRUD
│   ├── employee-admin-db.ts       ─ Employee CRUD
│   ├── dish-name-match.ts         ─ Dish name normalization
│   ├── computer-vision-bank.ts    ─ CV folder integration
│   ├── vision-bank-sync.ts        ─ Embedding bank sync
│   ├── menu-reference-rebuild.ts  ─ Rebuild embeddings from disk
│   ├── npy-reader.ts              ─ .npy file parser
│   └── mock-data.ts               ─ Dev mock data
├── services/
│   └── api.ts                     ─ Frontend API client
└── types/
    └── index.ts                   ─ Shared TypeScript types
```

### Database Files (`website/db/`)

```
db/
├── schema.sql                    ← Full core schema
├── seed_today_menu_example.sql   ← Development seed data
└── migrations/
    ├── 002_menu_calories_nullable.sql
    ├── 003_feedbacks_table.sql
    ├── 004_customers_profile_fields.sql
    ├── 005_transactions_analytics_indexes.sql
    ├── 006_staff_users.sql
    ├── 007_menu_item_day_embeddings.sql
    ├── 008_menu_item_reference_embedding.sql
    ├── 009_menu_item_embedding_bank.sql
    └── 010_embedding_bank_reference_name.sql
```

### Scripts (`website/scripts/`)

| File | Type | Purpose |
|------|------|---------|
| `yolo-detect-server.py` | Python | YOLO Flask HTTP server |
| `ml-setup.mjs` | Node | Download CLIP model to cache |
| `dev-with-ml.mjs` | Node | Dev server + auto-start YOLO |
| `run-migration-008.mjs` | Node | Run migration 008 programmatically |
| `run-migration-009.mjs` | Node | Run migration 009 programmatically |
| `run-migration-010.mjs` | Node | Run migration 010 programmatically |
| `import-vision-bank.ts` | TypeScript | Import vision bank prototypes |
| `verify-embedding-bank.ts` | TypeScript | Verify embedding bank integrity |
| `rebuild-references.mjs` | Node | Rebuild embeddings from disk |

---

## 7. Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **OS** | Windows 10 | Windows 11 |
| **RAM** | 8 GB | 16 GB |
| **Disk** | 2 GB free | 5 GB free |
| **CPU** | x86_64, 4 cores | x86_64, 8+ cores |
| **Camera** | USB webcam (720p) | USB webcam (1080p) |
| **Browser** | Chrome / Edge | Chrome / Edge (latest) |

### Disk Breakdown

| Item | Size |
|------|------|
| `node_modules/` | ~500 MB |
| `.next/` (build) | ~200 MB |
| `data/ml-cache/` (CLIP weights) | ~400 MB |
| `data/menu-images/` | ~10-50 MB (grows with usage) |
| Python venv | ~1-2 GB (if YOLO sidecar installed) |

---

## 8. Key Library Details

### `@xenova/transformers` (CLIP)

- **Model:** `Xenova/clip-vit-base-patch32`
- **Inference:** Runs entirely in Node.js via ONNX runtime (no Python needed)
- **Cache:** Weights downloaded once to `data/ml-cache/` via `npm run ml:setup`
- **First load:** ~30-60s (model deserialization + warm-up)
- **Subsequent calls:** ~500ms-2s per embedding
- **Output:** 512-dimensional normalized embedding vector

### `ultralytics` (YOLO)

- **Model:** `Dish Localization/best.pt` (YOLOv8)
- **Classes (6):** `drink`, `food`, `meatless soup`, `rice_big`, `rice_small`, `soup`
- **Inference:** Runs as separate Python process on `:5001`
- **Confidence threshold:** `0.4` (configurable via `ML_YOLO_CONF`)
- **Coordinates:** Normalized `[x1, y1, x2, y2]` (0.0–1.0)

### `pg` (node-postgres)

- **Connection:** Connection pool singleton in `src/lib/db.ts`
- **Pool size:** 10 connections
- **Idle timeout:** 30s
- **Connection timeout:** 5s
- **Query pattern:** All DB modules import `getDbPool()` and use `pool.query()`

### `sharp` + `jimp` (Image Processing)

- **sharp:** Used as primary image processor (JPEG decode, resize, crop)
- **jimp:** Used as fallback when sharp encounters unsupported formats
- **Usage:** `tray-image-crops.ts` (extract grid regions), `image-store.ts` (save reference photos)

---

## 9. Development Dependencies Not in package.json

| Tool | Purpose | Install |
|------|---------|---------|
| `psql` | Run SQL migrations manually | PostgreSQL install |
| `pg_dump` | Database backup | PostgreSQL install |
| `Node.js 20 LTS` | App runtime | `nodejs.org` |
| `npm` | Package management | Bundled with Node.js |
| `Python 3.10+` | YOLO service + training scripts | `python.org` |
| `pip` | Python package management | Bundled with Python |
