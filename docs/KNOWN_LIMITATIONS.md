# Known Limitations — Tecdia Tray Track

---

## 1. Security

| Limitation | Detail |
|-----------|--------|
| **No consistent auth middleware on admin API routes** | Admin endpoints rely on manual PIN checks in individual route handlers rather than a shared middleware guard |
| **No rate limiting on login** | `/api/auth/login` and `/api/auth/login-admin` have no brute-force protection |
| **No CSRF protection** | No anti-CSRF tokens on state-changing requests |
| **Custom password hashing** | Uses custom hash + salt (`auth.ts`) instead of bcrypt/argon2 |
| **Passwords in transit** | No TLS in local deployment; PINs sent in plaintext over LAN |
| **Session cookies lack Secure flag in dev** | `Secure` flag set only when `NODE_ENV=production` |

---

## 2. Offline / Single Machine

| Limitation | Detail |
|-----------|--------|
| **No multi-device sync** | The kiosk runs on one machine; database and uploads are not replicated |
| **No remote administration** | Admin UI is only accessible on the tablet itself |
| **No cloud backup** | No automatic off-site backup; database must be dumped manually |
| **No internet required during service** | All ML models, reference photos, and data are local — no outage risk from network |

---

## 3. Database

| Limitation | Detail |
|-----------|--------|
| **Single-user concurrency** | PostgreSQL runs locally; no pooling for high concurrency |
| **Manual SQL migrations** | No migration framework — `.sql` files are applied by hand |
| **No automatic backup** | `pg_dump` must be run manually or scripted externally |
| **Legacy `admin_users` table** | Not actively used; migration path not defined |

---

## 4. Vision / ML Pipeline

| Limitation | Detail |
|-----------|--------|
| **CLIP cold start** | First embedding computation takes ~30–60s (ONNX model loaded into memory) |
| **No minimum score threshold** | CLIP always returns the best-scoring prototype match even if similarity is low |
| **Empty bank = no dish classification** | If `menu_item_day_embeddings` is empty, YOLO-detected regions produce no dish items |
| **Rice/Sebaw excluded from CLIP** | Rice (`rice_big`, `rice_small`) and Sebaw are billed by YOLO detection alone — they must have prices set |
| **YOLO requires Python** | The dish-localization model runs in a separate Python Flask process (`ultralytics`) — not self-contained in Node.js |
| **Reference photos required** | Without admin-uploaded photos, CLIP has no embeddings to match against |
| **No automatic retraining** | YOLO model and CLIP embedding bank must be updated through the separate Python training workflow |
| **Sync silently skips on malformed files** | If CV folder `.npy` files are missing or corrupt, sync is silently skipped with no alert |

---

## 5. API

| Limitation | Detail |
|-----------|--------|
| **Permanent items cannot be removed** | Sebaw, `rice_big`, and `rice_small` are permanent catalog entries with no delete endpoint |
| **No batch operations** | Menu items and photos must be created/updated one at a time |
| **No pagination on some list endpoints** | `/api/admin/menu/search` and `/api/admin/today-menu` do not paginate |

---

## 6. Deployment

| Limitation | Detail |
|-----------|--------|
| **Windows-only tested** | Scripts use PowerShell; paths assume Windows conventions |
| **Single-user kiosk** | Designed for one touchscreen tablet with one transaction at a time |
| **No Docker image** | Deployment is manual (copy build artifacts + install PostgreSQL + Node.js) |

---

## 7. Future Improvements

Categorized list of potential features, UX enhancements, and technical debt items: **[FUTURE_IMPROVEMENTS.md](./FUTURE_IMPROVEMENTS.md)**
