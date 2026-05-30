# Code Map — Navigation by Feature Flow

## 1. Scan Flow (end-to-end)

| File | What it does |
|---|---|
| `api/scan/route.ts` | POST endpoint: accepts JPEG from camera, calls `inferTrayFromImage`, returns ScannedItem[] |
| `lib/tray-inference.ts` | Orchestrator: YOLO localizes regions → rice/sebaw direct → other crops → CLIP matching → merged line items |
| `lib/yolo-detector.ts` | HTTP client that posts image to the Python YOLO sidecar and parses normalized bounding boxes |
| `lib/yolo-service-manager.ts` | Auto-spawns `scripts/yolo-detect-server.py` as a child process and waits for `/health` |
| `lib/clip-embedder.ts` | Lazily loads `@xenova/transformers` CLIP vision model; runs inference on crop buffers |
| `lib/embeddings-db.ts` | Queries the `menu_item_embedding_bank` table for prototype vectors used during scan matching |
| `lib/embedding-bank.ts` | Entry-point for scan prototypes: ensures Computer Vision folder is synced before returning rows |
| `lib/tray-image-crops.ts` | Uses `jimp` to crop YOLO boxes from the source image and resize to 384×384 |
| `lib/yolo-rice-scan.ts` | Maps `rice_big` / `rice_small` YOLO classes to permanent menu items (no CLIP) |
| `lib/yolo-sebaw-scan.ts` | Maps `meatless soup` YOLO class to free Sebaw when it's on today's menu |
| `scripts/yolo-detect-server.py` | Flask server loading `Dish Localization/best.pt`; endpoints `POST /detect`, `GET /health` |
| `lib/tray-scan-sim.ts` | Dev mode: returns random menu items when `ML_INFERENCE_MODE=simulate` |

---

## 2. Admin API & Menu

| File | What it does |
|---|---|
| `api/admin/today-menu/route.ts` | GET (list today's items with embedding flags) + POST (add new dish) |
| `api/admin/today-menu/[menuItemId]/route.ts` | PATCH (update name/price/calories) + DELETE (remove from today) |
| `api/admin/today-menu/[menuItemId]/image/route.ts` | GET (serve photo), POST (upload + compute CLIP embedding), DELETE (remove photo + embeddings) |
| `api/admin/today-menu/rice/route.ts` | PUT — set prices for permanent `rice_big` / `rice_small` |
| `api/admin/today-menu/sebaw/route.ts` | PUT — toggle whether free Sebaw soup is on today's menu |
| `api/admin/stats/route.ts` | GET — aggregated dashboard stats (meals/revenue/active users/popular item) |
| `api/admin/transactions/route.ts` | GET — all transactions (last 5000) with line items |
| `api/admin/feedbacks/route.ts` | GET — all customer feedback entries with user details |
| `api/admin/employees/route.ts` | GET — list all employees with aggregated spend/balance |
| `api/admin/employees/[employeeCode]/route.ts` | PATCH — update employee code, name, department |
| `api/admin/users/route.ts` | GET + POST — list / create `staff_users` (admin/cashier) |
| `api/admin/users/[userCode]/route.ts` | PATCH + DELETE — update or delete a staff user (PIN-guarded) |
| `api/admin/login/route.ts` | POST — validate admin PIN, set `admin_session` cookie |
| `api/admin/logout/route.ts` | POST — clear `admin_session` cookie |
| `api/admin/ml/rebuild-references/route.ts` | POST — recompute CLIP embeddings from on-disk reference photos |
| `api/admin/ml/import-vision/route.ts` | POST — sync Computer Vision folder prototypes into Postgres |
| `lib/image-store.ts` | Save / read / serve JPEG reference photos under `data/menu-images/` |
| `lib/menu-reference-rebuild.ts` | Scans on-disk photos, computes CLIP embeddings, appends to bank |
| `components/admin/MenuItemForm.tsx` | Add/edit dish form with name, category, price, calories, photo upload |

---

## 3. Customer Kiosk

| File | What it does |
|---|---|
| `app/customer/page.tsx` | Top-level state machine: renders the right step component (IDLE → EMAIL_AUTH → SCANNING → BILL → PAYMENT → DONE) |
| `hooks/useCustomerFlow.tsx` | React context + reducer managing kiosk state (auth, scan results, billing, payment) |
| `components/customer/EmailAuthScreen.tsx` | Email/password login or sign-up form |
| `components/customer/EmployeeIdScanPanel.tsx` | Camera + barcode scanner for employee ID |
| `components/customer/IdleScreenEditorial.tsx` | Attract loop shown before identification |
| `components/customer/TrayScanView.tsx` | Camera preview + scan overlay; calls `POST /api/scan` |
| `components/camera/ScanOverlay.tsx` | Corner markers, dashed guide, scanning line animation |
| `components/customer/FoodResults.tsx` | Bill review after scan; adjust quantities, staff PIN edit, proceed to payment |
| `components/customer/ManualBillingView.tsx` | Staff-authorized manual add/remove of items to bill |
| `components/customer/StaffMenuAddPanel.tsx` | Panel for cashiers to add extra items from today's menu |
| `components/customer/PaymentScreen.tsx` | Choose immediate or account payment, confirm |
| `components/customer/DoneScreen.tsx` | Success / receipt display with auto-redirect |
| `components/customer/FeedbackModal.tsx` | Issue reporting modal after checkout |
| `hooks/useCamera.ts` | `getUserMedia` wrapper: start/stop stream, capture JPEG frame |
| `hooks/useEmployeeIdScanner.ts` | ZXing barcode decoder + keyboard wedge for employee ID capture |
| `services/api.ts` | Browser-side fetch client wrapping every kiosk and admin API endpoint |
| `api/customer/checkout/route.ts` | POST — persist transaction + line items, return receipt |
| `api/customer/feedback/route.ts` | POST — submit issue report for a transaction |
| `api/customer/profile/route.ts` | GET — current session employee profile + live balance |
| `api/customer/transactions/route.ts` | GET — current customer's transaction history |
| `api/customer/employees/[employeeCode]/route.ts` | GET — employee lookup by code (used during ID scan) |

---

## 4. Auth & Sessions

| File | What it does |
|---|---|
| `lib/auth.ts` | scrypt password hashing + timing-safe verification |
| `lib/session.ts` | HMAC-signed session token builder/parser; cookie helpers |
| `lib/customer-auth.ts` | Customer CRUD: create, findByEmail, findByEmployeeCode, findById, updatePassword |
| `lib/admin-auth.ts` | `ADMIN_PIN` / `CASHIER_PIN` validation from env vars; `verifySuperUserPin` checks both |
| `api/auth/login/route.ts` | POST — email + password login, sets `tt_customer_session` cookie |
| `api/auth/login-by-employee-code/route.ts` | POST — employee-code-only login (no password for barcode scan) |
| `api/auth/signup/route.ts` | POST — create customer account, set session cookie |
| `api/auth/logout/route.ts` | POST — clear `tt_customer_session` cookie |
| `api/auth/me/route.ts` | GET — return current customer from session cookie (or null) |
| `api/auth/verify-super-pin/route.ts` | POST — validate admin/cashier PIN on kiosk (staff billing auth) |
| `api/auth/reset-password/route.ts` | POST — admin-PIN-guarded password reset for any customer |
| `middleware.ts` | Next.js middleware: redirects `/admin/*` to login if `admin_session` missing |

---

## 5. Database Layer

| File | What it does |
|---|---|
| `lib/db.ts` | Singleton `pg.Pool` — connection to Postgres |
| `lib/today-menu-db.ts` | Menu CRUD: service days, menu_items, rice/sebaw auto-seeding, yesterday→today copy |
| `lib/embeddings-db.ts` | Embedding bank queries: insert prototypes, list for scan, enrichment flags, bank counts, legacy migration |
| `lib/embedding-bank.ts` | Thin wrapper that triggers vision-bank sync before returning scan prototypes |
| `lib/vision-bank-sync.ts` | Checks fingerprint, loads `.npy` + `label_map.json`, maps classes to menu UUIDs, inserts into bank |
| `lib/computer-vision-bank.ts` | Reads `image_embeddings.npy` / `text_embeddings.npy` / `image_metadata.json` / `label_map.json` |
| `lib/npy-reader.ts` | Raw `.npy` float32 matrix parser (v1.0/v2.0) |
| `lib/image-store.ts` | Disk read/write for JPEG reference photos |
| `lib/admin-stats-db.ts` | Aggregation queries for dashboard: meals/revenue/active users/popular item |
| `lib/admin-transactions-db.ts` | List all transactions (last 5000) with line items |
| `lib/admin-users-db.ts` | CRUD for `staff_users` table (admin/cashier records) |
| `lib/employee-admin-db.ts` | Employee listing with aggregated spend/balance from customers + transactions |
| `lib/customer-activity-db.ts` | Transaction creation, customer history, feedback submission, account balance |
| `lib/customer-profile.ts` | Builds `Employee` profile from customer data + live account balance |
| `db/schema.sql` | Initial DDL: customers, menu_items, service_days, transactions, feedbacks, etc. |
| `db/migrations/002` … `010` | Incremental schema changes (nullable calories, staff_users, embeddings, indexes) |
| `db/seed_today_menu_example.sql` | Sample data for development |
| `dish classification/data/data.yaml` | YOLO dataset config: drink, food, meatless soup, rice_big, rice_small, soup |

---

## 6. UI Components

| File | What it does |
|---|---|
| `components/ui/Button.tsx` | Reusable button: primary/success/outline/danger/ghost, sizes, loading spinner |
| `components/ui/Input.tsx` | Styled text input |
| `components/ui/Card.tsx` | Card container |
| `components/ui/Modal.tsx` | Generic modal dialog |
| `components/ui/Badge.tsx` | Status/category badge |
| `components/ui/Spinner.tsx` | Loading spinner |
| `components/ui/StatCard.tsx` | Admin dashboard stat card (value + label) |
| `components/ui/PinPadModal.tsx` | Numeric PIN pad modal for staff auth |
| `components/ui/InstructionImageViewer.tsx` | Photo/instruction viewer overlay |
| `components/layout/AdminSidebar.tsx` | Sidebar navigation for admin pages |
| `components/layout/Header.tsx` | Global header with branding |
| `components/layout/FlowStepper.tsx` | Step indicator (Identify → Scan → Bill → Payment → Done) |
| `components/layout/CustomerInteractivePanel.tsx` | Kiosk side panel with instructions |
| `components/layout/CustomerBackgroundSlideshow.tsx` | Background image carousel on kiosk |
| `components/layout/CustomerCatCompanion.tsx` | Animated cat mascot on kiosk |
| `components/layout/TecdiaLogo.tsx` | Brand logo component |
| `components/admin/MenuEditor.tsx` | Full menu management page with add/edit/delete |
| `components/admin/MenuItemForm.tsx` | Add/edit dish form with photo upload |
| `components/admin/StatsGrid.tsx` | Dashboard stats grid (meals, revenue, popular item) |
| `components/admin/TransactionTable.tsx` | Admin transaction listing |
| `components/admin/FeedbackTable.tsx` | Admin feedback listing |
| `components/admin/EmployeeManagementTable.tsx` | Employee list with edit |
| `components/admin/UserTable.tsx` | Staff user CRUD table |
| `components/admin/RicePanel.tsx` | Rice price configuration panel |
| `components/admin/SebawPanel.tsx` | Sebaw toggle panel |
| `components/camera/ScanOverlay.tsx` | Camera overlay with guide corners and scan animation |
| `components/marketing/MarketingTrayShowcase.tsx` | Landing page showcase |

---

## 7. Python Scripts (Training & Inference)

| File | What it does |
|---|---|
| `website/scripts/yolo-detect-server.py` | Production Flask server: loads `best.pt`, serves `POST /detect` + `GET /health` |
| `dish classification/scripts/train_detector.py` | YOLOv8 training script: `yolov8n.pt`, 100 epochs, AdamW, data.yaml |
| `dish classification/scripts/test_detetctor.py` | Run `best.pt` inference on the `data/raw/tarys` directory |
| `dish classification/scripts/predict_dish.py` | YOLO → CLIP pipeline: detect food regions → CLIP cosine similarity → best menu match |
| `dish classification/scripts/build_embeddings.py` | Compute CLIP embeddings for all images in `data/raw/menu_items/` using `open_clip` |
| `Dish Localization/dishLocalization.ipynb` | Jupyter notebook: YOLO training/evaluation workflow |
| `Dish Localization/best.pt` | Trained YOLOv8 weights (drink, food, meatless soup, rice_big, rice_small, soup) |

---

## 8. Configuration, Scripts & Data

| File | What it does |
|---|---|
| `.env.example` | All required env vars with documentation: Postgres, PINs, ML paths |
| `lib/constants.ts` | App-wide constants: food categories, YOLO class names, rice/sebaw codes, flow step labels |
| `lib/utils.ts` | Shared helpers: `cn()`, `formatCurrency()`, `formatDate()`, `getGreeting()`, etc. |
| `lib/mock-data.ts` | Static mock employees, menu items, transactions, stats (development fallback) |
| `lib/dish-name-match.ts` | Normalize dish names; build index; fuzzy resolve training labels → menu items |
| `lib/manual-bill.ts` | Helper to add/remove menu items from a ScannedItem[] bill |
| `types/index.ts` | All TypeScript interfaces: MenuItem, ScannedItem, Employee, Transaction, etc. |
| `website/scripts/ml-setup.mjs` | Downloads CLIP ONNX model from HuggingFace to `data/ml-cache/` |
| `website/scripts/dev-with-ml.mjs` | Concurrently runs `yolo-detect-server.py` + `next dev` |
| `website/scripts/rebuild-references.mjs` | Loads `.env.local` and calls `rebuildCatalogEmbeddingsFromDisk` |
| `website/scripts/import-vision-bank.ts` | Loads `.env.local` and calls `syncComputerVisionFolder` |
| `website/scripts/verify-embedding-bank.ts` | Diagnostics: counts bank rows, checks dish name matches, validates admin flags |
| `website/scripts/run-migration-*.mjs` | One-shot SQL migration runners (006 → 010) |
| `data/ml-cache/` | ONNX model cache directory (gitignored, populated by `ml-setup.mjs`) |
| `data/menu-images/` | Reference photos uploaded via Admin → Menu |
| `dish classification/embeddings/` | Pre-computed `.npy` embeddings and `label_map.json` from training |
| `dish classification/data/processed/embeddings/` | `dish_embeddings.npy` + `dish_labels.json` from `build_embeddings.py` |
