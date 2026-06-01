# Future Improvements — Tecdia Tray Track

Potential features and enhancements for future development, organized by area.

---

## 1. UI / UX

| Improvement | Detail |
|-------------|--------|
| **View past menus** | Date picker to browse what was served on any previous day. Data already exists in `service_day_menu_items` + `service_days` — no UI currently reads it. |
| **Dropdown / autocomplete of existing dishes** | When adding an item to today's menu, search previously used items instead of always creating a new `menu_items` row. Prevents catalog bloat from near-duplicate entries. |
| **Merge "Rebuild Vision" + "Import Training Bank"** | Single "Sync Vision" button that picks the right source automatically — import training `.npy` files if present, and also recompute CLIP embeddings from any admin-uploaded photos missing an embedding. |
| **Multi-language UI** | Localize the customer kiosk and admin interface for different regions. |

---

## 2. ML / Vision Pipeline

| Improvement | Detail |
|-------------|--------|
| **Accumulate reference photos** | Keep old uploads on disk instead of overwriting, so CLIP matching has multiple reference angles / lighting conditions per dish. Currently each upload replaces the previous photo and embedding. |
| **Auto-retrain trigger from admin UI** | Button to kick off Python YOLO training (`train_detector.py`) from within the admin interface instead of switching to a terminal. |
| **GPU acceleration for CLIP** | ONNX supports DirectML (Windows) and CUDA (NVIDIA). Currently runs on CPU via `@xenova/transformers`. |
| **Accumulate scan images for training** | Optionally save anonymized tray scan images to build a dataset for future YOLO / CLIP retraining. |

---

## 3. API & Data

| Improvement | Detail |
|-------------|--------|
| **Soft-delete for menu items removed from a day** | Currently `removeMenuItemFromToday` hard-deletes the `service_day_menu_items` join row — the item is permanently missing from that day's history. A soft-delete (`available = false` + `removed_at`) would keep the record intact. |
| **Batch operations** | Delete multiple menu items or upload multiple reference photos in one action instead of one-at-a-time. |
| **Pagination** | Add pagination to menu search and transaction list endpoints for large datasets. |
| **CSV export for transactions** | Expand existing partial export support to cover all transaction data. |

---

## 4. Deployment & Operations

| Improvement | Detail |
|-------------|--------|
| **Docker image** | Package the app, PostgreSQL, and YOLO sidecar into a Docker image for non-Windows testing and easier deployment. |
| **Automated database backup from admin UI** | Trigger `pg_dump` and download the backup file directly from the browser instead of running it manually on the server. |
| **Receipt printing** | Send a receipt to a local thermal printer after checkout. |

---

## 5. Refactoring / Technical Debt

| Improvement | Detail |
|-------------|--------|
| **Remove dead grid-crop code** | `lib/tray-image-crops.ts` has a `buildTrayCrops()` function (pre-YOLO grid approach) that is no longer called. YOLO provides bounding boxes directly. |
| **Clean up deprecated exports** | `yolo-detector.ts` has a `@deprecated` `detectFoodRegions()` export — callers should use `detectTrayRegions` instead. |
| **Remove legacy `admin_users` table** | Not actively used; migration path not defined. |
