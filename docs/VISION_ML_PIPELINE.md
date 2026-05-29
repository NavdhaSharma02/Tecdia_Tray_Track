# Vision / ML Pipeline — Tecdia Tray Track

## 1. Tray Scan Pipeline

```
USB Camera → JPEG → POST /api/scan → inferTrayFromImage()
```

### 1.1 Pipeline Flow

```
┌────────────┐   ┌──────────────────┐   ┌───────────────────┐
│ YOLO       │   │ CLIP Embedder    │   │ Best Match        │
│ detectTray │ → │ encodeImage()    │ → │ cosineSimilarity  │ → ScannedItem[]
│ Regions    │   │ 512-dim vector   │   │ vs embedding bank │
│ (Python)   │   │ (Node.js ONNX)   │   │ (no threshold)    │
└────────────┘   └──────────────────┘   └───────────────────┘
      │                                          ↑
      ├── rice_big / rice_small ──→ bill direct ──┤ (no CLIP)
      ├── meatless soup ──→ free Sebaw if on menu ─┤ (no CLIP)
      └── drink / food / soup ──→ CLIP classify ──┘
```

**Source:** `src/lib/tray-inference.ts` → `inferTrayFromImage()`

### 1.2 Step-by-step

1. Check `ML_INFERENCE_MODE` env var
2. Load today's available menu from DB
3. YOLO localizes regions in the tray image → bounding boxes
4. Classify each region:
   - **rice_big / rice_small** → look up in-menu price → direct bill item (no CLIP)
   - **meatless soup** → if Sebaw is on today's menu → free Sebaw (₱0); otherwise → CLIP as soup
   - **drink / food / soup** → CLIP encoding → best match from today's embedding bank
5. Merge identical dishes (sum quantity, keep max confidence)
6. Return `ScannedItem[]` to the bill review

---

## 2. YOLO Detection

### 2.1 Pipeline

```
POST /api/scan → detectTrayRegions() → HTTP POST to Python Flask :5001/detect
```

**Source:** `src/lib/yolo-detector.ts`

### 2.2 Detection Classes

| Index | Class | YOLO Label | Behavior |
|-------|-------|------------|----------|
| 0 | `drink` | drink | CLIP-classified |
| 1 | `food` | food | CLIP-classified |
| 2 | `meatless soup` | meatless soup | Free if Sebaw on menu; CLIP-classified otherwise |
| 3 | `rice_big` | rice_big | Direct bill (no CLIP) |
| 4 | `rice_small` | rice_small | Direct bill (no CLIP) |
| 5 | `soup` | soup | CLIP-classified |

### 2.3 Service Manager

**Source:** `src/lib/yolo-service-manager.ts`

The YOLO detection runs as a separate Python Flask process (`scripts/yolo-detect-server.py`).

**Configuration:**

| Env Var | Default | Purpose |
|---------|---------|---------|
| `ML_YOLO_SERVICE_URL` | — | HTTP URL (e.g. `http://127.0.0.1:5001/detect`) |
| `ML_YOLO_AUTO_START` | `true` | Auto-spawn Python subprocess when unreachable |
| `ML_YOLO_STARTUP_TIMEOUT_MS` | 300000 | Max wait for Python to become healthy |
| `ML_YOLO_TIMEOUT_MS` | 30000 | Per-request timeout |
| `ML_YOLO_PYTHON` | `python` | Python executable for auto-start |
| `ML_YOLO_HEALTH_URL` | `<origin>/health` | Health check endpoint |
| `ML_YOLO_AUTO_START` | `true` | Enable/disable auto-spawn |

**Auto-start sequence:**
1. First scan request arrives
2. Check `ML_YOLO_SERVICE_URL` health
3. If unreachable AND `ML_YOLO_AUTO_START=true`:
   - Spawn `python scripts/yolo-detect-server.py`
   - Poll `/health` with exponential backoff (400ms → 2000ms)
   - Cache subprocess handle
   - Max wait: 300s
4. If unreachable AND no auto-start → return "YOLO unavailable"
5. Proceed with detection

### 2.4 Failure Modes

| Condition | Metadata message returned |
|-----------|--------------------------|
| `ML_YOLO_SERVICE_URL` not set | `"ML_YOLO_SERVICE_URL is not set. Add it to .env.local..."` |
| YOLO unreachable, auto-start off | `"Dish localization server is not running..."` |
| Auto-start started but never became healthy | `"Dish localization server did not become ready..."` |
| HTTP error from YOLO | `"Dish localization failed (HTTP {status})..."` |
| Invalid response (no boxes array) | `"Invalid response from YOLO service."` |
| YOLO returned empty box list | `"No food regions detected on this tray. Reposition the tray or improve lighting."` |
| Request timeout (30s default) | `"Dish localization unreachable (timed out)..."` |
| Network error | `"Dish localization unreachable ({error message})..."` |

---

## 3. CLIP Embedding & Matching

### 3.1 Model

**Source:** `src/lib/clip-embedder.ts`

| Detail | Value |
|--------|-------|
| Model | `Xenova/clip-vit-base-patch32` |
| Runtime | Node.js via ONNX (`@xenova/transformers`) |
| Cache | `data/ml-cache/` (~400 MB) |
| Output | 512-dimensional L2-normalized vector |
| First load | ~30–60s (cold start) |
| Subsequent | ~500ms–2s per embedding |
| Initialization | Lazy singleton — loaded once per process |

### 3.2 Inference Mode

Controlled by `ML_INFERENCE_MODE` env var:

| Value | Behavior |
|-------|----------|
| `clip` (default) | Full pipeline with real CLIP embeddings |
| `simulate` | Returns mock scan data from today's menu (dev only) |
| `mock` | Same as `simulate` |

### 3.3 Matching Algorithm

**Source:** `src/lib/tray-inference.ts` → `bestClipMatchForCrop()`

For each crop:
1. Compute CLIP embedding vector (L2-normalized)
2. Compute cosine similarity against every prototype in today's embedding bank
3. Pick the prototype with the highest similarity score (no minimum threshold)
4. Map to `ScannedItem`

```typescript
function bestClipMatchForCrop(query: number[], bank: EmbeddingPrototypeRow[]) {
  // Always returns the best-scoring match — no score cutoff
  let best = null;
  for (const row of bank) {
    const score = cosineSimilarity(query, row.embedding);
    if (!best || score > best.score) best = { row, score };
  }
  return best; // may be null if bank is empty
}
```

**Constraints:**
- Rice categories (`rice_big`, `rice_small`) and Sebaw are excluded from the CLIP bank
- Empty bank → crops produce no CLIP items (only rice/Sebaw may be billed)

### 3.4 Failure Modes

| Condition | Metadata message returned |
|-----------|--------------------------|
| `ML_INFERENCE_MODE=simulate` | `"ML_INFERENCE_MODE=simulate (development only)."` |
| Empty bank + no rice/Sebaw | `"No vision-ready reference photos for dishes..."` |
| Empty bank + rice/Sebaw exists | `"Rice/Sebaw added from localization. Other regions could not be classified..."` |
| No items detected at all | `"Nothing to bill from this tray. Check that rice prices are set and dish reference photos exist..."` |
| Partial success | `"YOLO: {n} region(s). Rice: {m} portion(s) (direct). Sebaw: {k} (free). Dishes: {c} region(s) → best CLIP match each."` |

---

## 4. Embedding Storage Strategy

**Sources:** `src/lib/embeddings-db.ts`, `src/lib/embedding-bank.ts`

### 4.1 Storage Tables

| Table | Scope | Purpose |
|-------|-------|---------|
| `menu_item_embedding_bank` | All time | Accumulating prototype bank — multiple embeddings per dish across sources |
| `menu_item_day_embeddings` | Per service day | Active matching set for today's menu (regenerated on photo upload) |
| `menu_items.reference_embedding` | Per menu item | Legacy single-embedding column (migration 008); updated on each new upload |

### 4.2 Sources

Embeddings can originate from:

| Source | Label | Trigger |
|--------|-------|---------|
| Admin photo upload | `admin_upload` | `POST /api/admin/today-menu/:id/image` |
| Computer Vision folder (image) | `computer_vision_image` | `POST /api/admin/ml/import-vision` or auto-sync on scan |
| Computer Vision folder (text) | `computer_vision_text` | Same as above |
| Disk rebuild | `rebuild_disk` | `POST /api/admin/ml/rebuild-references` |
| Legacy migration | `catalog_legacy` | First scan or sync after migration 009 |

### 4.3 Bank Deduplication

The embedding bank uses a unique constraint on `(reference_name, source, source_key)` to prevent duplicate inserts.

### 4.4 Photo Upload Flow

1. Admin uploads JPEG → `image-store.ts` saves to `data/menu-images/{id}.jpg`
2. `clip-embedder.ts` computes CLIP vector
3. Stored in `menu_item_day_embeddings` (today) + `menu_item_embedding_bank` (permanent)
4. Updates `menu_items.reference_embedding` to the latest
5. Batch-rebuild from disk via `POST /api/admin/ml/rebuild-references`

### 4.5 Computer Vision Folder Sync

**Source:** `src/lib/vision-bank-sync.ts`

The Computer Vision folder (default `../Computer Vision`) contains Python-generated `.npy` embedding files. On each scan, `getScanEmbeddingBank()` auto-syncs if the folder's fingerprint has changed.

**Fingerprint:** `{image_embeddings.npy mtime}:{size}:{image_metadata.json mtime}`

**Sync process:**
1. Check fingerprint against `embedding_bank_sync_state` table
2. If unchanged → skip
3. If changed → load `.npy` files → map class names to menu items via `dish-name-match.ts` → insert into bank → update fingerprint

**Sync failure:** If `.npy` files are missing or malformed, sync is silently skipped.

### 4.6 Migration Legacy

Migration 009 introduced the accumulating `menu_item_embedding_bank` table. On the first scan after migration, `migrateLegacyCatalogEmbeddings()` copies existing `menu_items.reference_embedding` rows into the bank (source: `catalog_legacy`).

---

## 5. Performance Characteristics

| Scenario | Duration | Condition |
|----------|----------|-----------|
| First CLIP load | ~30–60s | Cold start; model download if not cached |
| Subsequent CLIP | ~500ms–2s | After warm-up |
| YOLO detection | ~500ms–3s | Python Flask, depends on image size |
| Full scan (CLIP + YOLO) | ~2–5s | Multiple regions to encode and match |
| RAM (Node.js) | ~500 MB | Includes CLIP model |
| RAM (CLIP model) | ~500 MB | ONNX weights in memory |
| RAM (PostgreSQL) | ~1 GB | Local database |
| Disk (CLIP cache) | ~400 MB | `data/ml-cache/` |
| Disk (menu images) | ~10–50 MB | `data/menu-images/` |

---

## 6. Environment Variables

| Variable | Default | Section |
|----------|---------|---------|
| `ML_INFERENCE_MODE` | `clip` | [3.2](#32-inference-mode) |
| `ML_MODEL_ID` | `Xenova/clip-vit-base-patch32` | [3.1](#31-model) |
| `ML_MODEL_CACHE_DIR` | `data/ml-cache/` | [3.1](#31-model) |
| `ML_VISION_BANK_DIR` | `../Computer Vision` | [4.5](#45-computer-vision-folder-sync) |
| `ML_SCAN_MIN_SIMILARITY` | — | Deprecated (no threshold in current algorithm) |
| `ML_SCAN_UNKNOWN_GAP` | — | Deprecated (no threshold in current algorithm) |
| `ML_YOLO_*` | Various | [2.3](#23-service-manager) |
| `MENU_IMAGES_DIR` | `data/menu-images/` | [4.4](#44-photo-upload-flow) |

---

## 7. References

- **Pipeline entry point:** `src/lib/tray-inference.ts`
- **YOLO detector:** `src/lib/yolo-detector.ts` + Flask `scripts/yolo-detect-server.py`
- **CLIP embedder:** `src/lib/clip-embedder.ts`
- **YOLO rice scan:** `src/lib/yolo-rice-scan.ts`
- **YOLO Sebaw scan:** `src/lib/yolo-sebaw-scan.ts`
- **Embedding bank:** `src/lib/embedding-bank.ts`
- **Embedding DB:** `src/lib/embeddings-db.ts`
- **Vision bank sync:** `src/lib/vision-bank-sync.ts` + `src/lib/computer-vision-bank.ts`
- **Image crops:** `src/lib/tray-image-crops.ts`
- **Disk rebuild:** `src/lib/menu-reference-rebuild.ts`
- **Service manager:** `src/lib/yolo-service-manager.ts`
- **API endpoints:** `API_REFERENCE.md` (endpoints 3, 31–32, 37–38)
- **Database schema:** `DATABASE_SCHEMA.md` (embedding tables)
- **Thresholds deprecated:** Old `minSimilarity` (0.58) / `unknownGap` (0.12) algorithm removed; current code uses best-match-only with no score cutoff.
