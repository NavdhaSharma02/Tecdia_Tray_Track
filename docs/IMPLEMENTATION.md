# Implementation guide — Tecida Tray Track

Single reference for deploying the kiosk on **one Windows tablet** (USB camera, PostgreSQL on the same machine, **no internet during service**).

## What you are shipping

| Piece | Location |
|-------|----------|
| Web app (kiosk + admin) | `tecdia-tray-track-temp/` |
| Vision (CLIP on device) | `src/lib/clip-embedder.ts`, `tray-inference.ts`, `POST /api/scan` |
| Reference photos | Admin → Menu → upload per dish |
| Embeddings | PostgreSQL `menu_item_day_embeddings` + files in `data/menu-images/` |

`New_Trained_File/` is **optional** Python training only — not required to run the kiosk.

---

## Prerequisites

- Windows 10/11 tablet (8 GB RAM minimum; 16 GB recommended for CLIP)
- PostgreSQL 15+ on `localhost`
- Node.js 20 LTS
- USB webcam (Chrome or Edge)
- ~2 GB free disk (`node_modules` + CLIP cache ~400 MB)

---

## Step 1 — Database

```powershell
cd c:\githubForks\Tecida_Tray_Track\website

psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE tecdia_tray_track;"

psql -U postgres -h localhost -d tecdia_tray_track -f db/schema.sql
psql -U postgres -h localhost -d tecdia_tray_track -f db/migrations/002_menu_calories_nullable.sql
psql -U postgres -h localhost -d tecdia_tray_track -f db/migrations/003_feedbacks_table.sql
psql -U postgres -h localhost -d tecdia_tray_track -f db/migrations/004_customers_profile_fields.sql
psql -U postgres -h localhost -d tecdia_tray_track -f db/migrations/005_transactions_analytics_indexes.sql
psql -U postgres -h localhost -d tecdia_tray_track -f db/migrations/006_staff_users.sql
psql -U postgres -h localhost -d tecdia_tray_track -f db/migrations/007_menu_item_day_embeddings.sql
psql -U postgres -h localhost -d tecdia_tray_track -f db/migrations/008_menu_item_reference_embedding.sql
psql -U postgres -h localhost -d tecdia_tray_track -f db/migrations/009_menu_item_embedding_bank.sql
```

Optional seed for first test:

```powershell
psql -U postgres -h localhost -d tecdia_tray_track -f db/seed_today_menu_example.sql
```

Skip any migration that errors with “already exists” if you applied `schema.sql` fresh.

---

## Step 2 — Environment

```powershell
Copy-Item .env.example .env.local
```

Edit `.env.local`:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=tecdia_tray_track
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<your password>
AUTH_SESSION_SECRET=<long random string>

ADMIN_PIN=123456
CASHIER_PIN=654321

ML_INFERENCE_MODE=clip
ML_MODEL_ID=Xenova/clip-vit-base-patch32
ML_MODEL_CACHE_DIR=./data/ml-cache
MENU_IMAGES_DIR=./data/menu-images
ML_SCAN_MIN_SIMILARITY=0.58
ML_SCAN_UNKNOWN_GAP=0.12
```

| Variable | Purpose |
|----------|---------|
| `ML_INFERENCE_MODE=clip` | Production scanning (required) |
| `ML_INFERENCE_MODE=simulate` | Dev only — random items, no camera ML |
| `ML_SCAN_MIN_SIMILARITY` | Lower = more matches (try 0.52 if misses) |
| `ML_SCAN_UNKNOWN_GAP` | Raise if wrong dish wins (try 0.15) |

---

## Step 3 — Install app and CLIP model

Needs internet **once** (or copy `data/ml-cache` from another PC).

```powershell
npm install
npm run ml:setup
```

Verify:

```powershell
npm run dev
```

Open http://localhost:3000/api/ml/status — expect `clipEnabled: true`, `inferenceMode: "clip"`.

---

## Step 4 — Production run on the tablet

```powershell
npm run build
npm run start
```

Pin the browser to http://localhost:3000/customer (kiosk) and http://localhost:3000/admin/login (staff).

All API calls stay on `localhost` — suitable for low-network sites.

---

## Step 5 — Daily operations

### Morning (staff)

1. Log in at `/admin/login` with `ADMIN_PIN`.
2. Open **Menu**.
3. For **each dish served today**: Add/Edit → upload **Reference photo** (plate as it looks on the line) → Save.
4. Wait until **Vision** column shows **Ready** (first photo after boot may take 30–60 s while CLIP loads).
5. Confirm: `GET http://localhost:3000/api/ml/status` → `todayEmbeddingCount` equals number of available dishes with photos.

### Service (employees)

1. `/customer` → email login.
2. Scan tray (USB camera) → review bill → pay.
3. Session ends after payment; next customer logs in again.

### If scan fails

| Symptom | Fix |
|---------|-----|
| “No dishes recognized” | Upload reference photos; improve lighting; lower `ML_SCAN_MIN_SIMILARITY` |
| “Could not reach…” | Start `npm run start`; check Postgres |
| Wrong item on bill | Cashier PIN on bill step to adjust; re-upload reference photo |
| Camera error | Allow camera in browser; replug USB webcam |

---

## How vision works (code map)

```
Admin upload  →  POST /api/admin/today-menu/:id/image
                      → embedMenuReferenceImage()
                      → menu_item_day_embeddings + data/menu-images/{id}.jpg

Kiosk scan    →  POST /api/scan  (multipart field: image)
                      → inferTrayFromImage()
                      → grid crops + cosine match vs today's embeddings
                      → ScannedItem[]  →  bill  →  POST /api/customer/checkout
```

Key files:

- `src/app/api/scan/route.ts`
- `src/app/api/admin/today-menu/[menuItemId]/image/route.ts`
- `src/lib/tray-inference.ts`
- `src/lib/clip-embedder.ts`
- `src/lib/embeddings-db.ts`
- `src/components/admin/MenuItemForm.tsx` (reference photo)
- `src/services/api.ts` → `scanTray()`, `uploadMenuItemReferenceImage()`

---

## API (vision-related)

| Method | Path | Body |
|--------|------|------|
| POST | `/api/scan` | `image` (JPEG) |
| POST | `/api/admin/today-menu/:menuItemId/image` | `image` |
| GET | `/api/admin/today-menu/:menuItemId/image` | — |
| DELETE | `/api/admin/today-menu/:menuItemId/image` | — |
| GET | `/api/ml/status` | — |
| GET | `/api/menu/today` | Available dishes (no embeddings) |

---

## Go-live checklist

- [ ] PostgreSQL running as Windows service
- [ ] Migration `007_menu_item_day_embeddings.sql` applied
- [ ] `.env.local` filled; `ML_INFERENCE_MODE=clip`
- [ ] `npm run ml:setup` completed; `data/ml-cache` present
- [ ] `npm run build` succeeds
- [ ] Every **available** menu item has reference photo (**Vision: Ready**)
- [ ] `/api/ml/status` → `todayEmbeddingCount` > 0
- [ ] Test scan on real tray matches expected dishes
- [ ] Auto-start app on boot (Task Scheduler → `npm run start` in app folder)
- [ ] Browser kiosk mode pointed at `/customer`
- [ ] Backup: `pg_dump` + copy `data/menu-images/`

---

## Optional: Python YOLO training

Use `New_Trained_File/` only if you later want tighter food **region** detection. Production kiosk today uses Node CLIP only. To add YOLO later, run a small Python service on `127.0.0.1:5001` and call it from `inferTrayFromImage()` before CLIP — still no cloud.

---

## Troubleshooting

**`npm install` / ENOSPC** — Free disk space (~2 GB), then re-run install.

**CLIP download fails** — Run `npm run ml:setup` on a machine with internet; copy `data/ml-cache` to the tablet.

**Embeddings not saving** — Check migration 007; inspect server logs during upload.

**Slow first scan** — Normal; CLIP loads once per process. Keep `npm run start` running all day.
