# System Design — Tecdia Tray Track

Cafeteria kiosk: employee login → USB camera tray scan → bill → payment.
Admin manages today's menu and reference photos for on-device dish recognition.

---

## 1. High-Level Architecture

```mermaid
flowchart TB
    subgraph Browser[Browser — Single Windows Tablet]
        Kiosk["/customer
Kiosk SPA"]
        Admin["/admin
Admin Dashboard"]
    end

    subgraph NextJS[Next.js App — tecdia-tray-track-temp/]
        Pages["Pages & Layouts
root + admin + customer"]
        API["API Routes
/api/*"]

        subgraph Lib["src/lib/ — Core Logic"]
            CV["tray-inference.ts
clip-embedder.ts
yolo-detector.ts
yolo-service-manager.ts
tray-image-crops.ts"]
            DB["db.ts
embeddings-db.ts
embedding-bank.ts
today-menu-db.ts"]
            Auth["auth.ts
customer-auth.ts
admin-auth.ts
session.ts"]
            Biz["manual-bill.ts
customer-profile.ts
customer-activity-db.ts
admin-stats-db.ts
admin-transactions-db.ts
admin-users-db.ts
employee-admin-db.ts
dish-name-match.ts"]
            Util["constants.ts
utils.ts
image-store.ts
vision-bank-sync.ts
menu-reference-rebuild.ts
computer-vision-bank.ts
npy-reader.ts
mock-data.ts"]
        end
    end

    subgraph Python[Python Sidecar — Optional]
        YOLO["yolo-detect-server.py
Flask on :5001
POST /detect
GET /health"]
    end

    subgraph ML[ML Models]
        CLIP["Xenova/clip-vit-base-patch32
(on-device in Node.js via @xenova/transformers)"]
        YOLOModel["Dish Localization/best.pt
YOLOv8 (6 classes)"]
    end

    subgraph DB[PostgreSQL]
        DB_["tecdia_tray_track
14 tables"]
    end

    subgraph Disk[Local Filesystem]
        MenuImages["data/menu-images/"]
        MLCache["data/ml-cache/"]
    end

    Browser -->|HTTP localhost:3000| NextJS
    API -->|SQL| DB_
    API -->|Python subprocess or HTTP| YOLO
    API -->|on-device inference| CLIP
    API -->|read/write| MenuImages
    CLIP -->|model weights| MLCache
    YOLO -->|model weights| YOLOModel

    Kiosk -->|multipart image| POST_scan["POST /api/scan"]
    Admin -->|reference photo| POST_image["POST /api/admin/today-menu/:id/image"]
```

---

## 2. Kiosk Customer Flow (State Machine)

The kiosk is a single-page state machine driven by `useCustomerFlow` (reducer + context in `src/hooks/useCustomerFlow.tsx`).

```mermaid
stateDiagram-v2
    [*] --> IDLE
    IDLE --> EMAIL_AUTH: tap screen
    EMAIL_AUTH --> PROFILE: email / employee code login
    EMAIL_AUTH --> EMAIL_AUTH: signup
    EMAIL_AUTH --> IDLE: timeout (120s)
    PROFILE --> SCANNING: employee verified
    SCANNING --> BILL: tray scanned (POST /api/scan)
    SCANNING --> BILL: manual entry (staff PIN)
    BILL --> SCANNING: re-scan
    BILL --> PAYMENT: confirm items
    PAYMENT --> DONE: POST /api/customer/checkout
    DONE --> IDLE: auto-redirect (6s)

    note right of IDLE: IdleScreenEditorial
    note right of EMAIL_AUTH: EmailAuthScreen / EmployeeIdScanPanel
    note right of SCANNING: TrayScanView + ScanOverlay + camera
    note right of BILL: FoodResults / ManualBillingView + StaffMenuAddPanel
    note right of PAYMENT: PaymentScreen (immediate or account)
    note right of DONE: DoneScreen
```

### Flow Steps

| Step | Component | Description |
|------|-----------|-------------|
| `IDLE` | `IdleScreenEditorial` | Attract screen, tap to start |
| `EMAIL_AUTH` | `EmailAuthScreen` | Login by email+password or employee code |
| `PROFILE` | — | Loading employee profile + transaction history |
| `SCANNING` | `TrayScanView` + `ScanOverlay` | USB camera → grid/YOLO → dish recognition |
| `BILL` | `FoodResults` | Review detected items, adjust quantities |
| `PAYMENT` | `PaymentScreen` | Choose payment method, confirm checkout |
| `DONE` | `DoneScreen` | Receipt shown, auto-reset to IDLE |

### State Shape (`CustomerFlowState`)

```typescript
{
  step: FlowStep;
  employee: Employee | null;
  transactions: Transaction[];
  scannedItems: ScannedItem[];
  billingMode: "scan" | "manual";
  staffBillingAuthorized: boolean;
  paymentMethod: PaymentMethod | null;
  receipt: Receipt | null;
  error: string | null;
  lastScannedEmployeeCode: string | null;
  isLoading: boolean;
}
```

---

## 3. Admin Dashboard

### Route Structure

```mermaid
flowchart LR
    subgraph Admin[Admin SPA]
        Login["/admin/login
PIN Login"]
        Dashboard["/admin
Stats Grid"]
        Menu["/admin/menu
Menu Editor (CRUD + photos)"]
        Users["/admin/users
User Management"]
        Transactions["/admin/transactions
Transaction History"]
        Feedbacks["/admin/feedbacks
Customer Feedback"]
        Employees["/admin/employees
Employee Registry"]
        Analytics["/admin/analytics
Charts + Reports"]
    end

    Login --> Dashboard: correct PIN
    Dashboard --> Menu
    Dashboard --> Users
    Dashboard --> Transactions
    Dashboard --> Feedbacks
    Dashboard --> Employees
    Dashboard --> Analytics
```

### Admin Components

| Admin Page | Component | Key Endpoints Used |
|-----------|-----------|-------------------|
| Dashboard | `StatsGrid` | `GET /api/admin/stats` |
| Menu | `MenuEditor` + `MenuItemForm` + `SebawPanel` + `RicePanel` | `GET/POST /api/admin/today-menu`, `PATCH/DELETE /api/admin/today-menu/:id`, `GET/POST/DELETE .../image` |
| Users | `UserTable` | `GET/POST /api/admin/users`, `PATCH/DELETE /api/admin/users/:code` |
| Transactions | `TransactionTable` | `GET /api/admin/transactions` |
| Feedbacks | `FeedbackTable` | `GET /api/admin/feedbacks` |
| Employees | `EmployeeManagementTable` | `GET /api/admin/employees`, `PATCH /api/admin/employees/:code` |
| Analytics | `StatsGrid` + inline charts | revenue trends, payment mix, sales breakdown, CSV export |
| Login | `PinPadModal` | `POST /api/admin/login`, `POST /api/admin/logout` |

Admin auth: 6-digit PIN → HTTP-only `admin_session` cookie (8-hour expiry). Frontend checks `sessionStorage` for `admin_auth` flag.

---

## 4. Vision / ML Pipeline

### Tray Scan Pipeline

```mermaid
flowchart TB
    Camera["USB Camera
(JPEG via browser
MediaStream API)"]
    Upload["POST /api/scan
(multipart: image)"]
    GridCrop["tray-image-crops.ts
Extract grid crops
(~6 overlapping regions)"]
    YOLODetect["yolo-detector.ts
→ yolo-service-manager.ts
→ Python Flask :5001
POST /detect"]
    YOLOCrop["Crop YOLO regions:
drink, food, meatless soup, soup"]
    Embed["clip-embedder.ts
CLIP ViT-B/32
encodeImage() → vector"]
    Match["tray-inference.ts
cosine similarity vs
today's menu embeddings"]
    Threshold["Threshold logic:
minSimilarity (0.58)
unknownGap (0.12)"]
    Bill["ScannedItem[]
→ bill review"]

    Camera --> Upload
    Upload --> GridCrop
    Upload --> YOLODetect
    GridCrop --> Embed
    YOLODetect --> YOLOCrop
    YOLOCrop --> Embed
    Embed --> Match
    Match --> Threshold
    Threshold --> Bill

    subgraph EmbedRef[Embedding References]
        PhotoUpload["Admin uploads
reference photo"]
        EmbedRefImg["embedMenuReferenceImage()
→ CLIP embedding stored in
menu_item_day_embeddings
+ menu_item_embedding_bank"]
        DiskImage["data/menu-images/{id}.jpg"]
    end

    PhotoUpload --> EmbedRefImg
    EmbedRefImg --> DiskImage
```

### Detection Classes (YOLO — `best.pt`)

```
0: drink
1: food
2: meatless soup
3: rice_big       ← auto-charged, no CLIP needed
4: rice_small     ← auto-charged, no CLIP needed
5: soup
```

- `rice_big` / `rice_small`: billed by quantity detected, no CLIP matching
- `drink`, `food`, `meatless soup`, `soup`: crops sent to CLIP for dish identification
- `meatless soup` + category "Soup" + name "Sebaw" = free soup (special handling)

### Similarity Matching Logic (`tray-inference.ts`)

```
For each CLIP crop:
  1. Compute embedding vector
  2. Cosine similarity vs all today-menu embeddings
  3. Best match → score
  4. If best match is NOT in today's menu:
     - Find best menu match
     - If menu match score > minSimilarity (0.58)
       AND score gap < unknownGap (0.12)
       → use menu match
     - Else → mark as "UNKNOWN"
  5. Deduplicate: multiple detections of same dish → single ScannedItem
```

### Reference Photo Flow

```mermaid
flowchart LR
    AdminUpload["Admin uploads
reference photo"]
    SaveDisk["saveImageFile()
→ data/menu-images/{id}.jpg"]
    Embed["CLIP embedding
→ JSONB in PostgreSQL"]
    DayEmbed["INSERT
menu_item_day_embeddings
(menu_item_id, service_day_id)"]
    BankEmbed["INSERT
menu_item_embedding_bank
(reference_name, source)"]
    Rebuild["POST /api/admin/ml/
rebuild-references
(recompute from disk)"]

    AdminUpload --> SaveDisk
    AdminUpload --> Embed
    Embed --> DayEmbed
    Embed --> BankEmbed
    SaveDisk --> Rebuild
```

---

## 5. Database Schema (ERD)

### Tables & Relationships

```mermaid
erDiagram
    customers ||--o{ tray_scans : "FK customer_id"
    customers ||--o{ transactions : "FK customer_id"
    customers ||--o{ feedbacks : "FK customer_id"

    service_days ||--o{ tray_scans : "FK service_day_id"
    service_days ||--o{ service_day_menu_items : "FK service_day_id"
    service_days ||--o{ menu_item_day_embeddings : "FK service_day_id"

    menu_items ||--o{ service_day_menu_items : "FK menu_item_id"
    menu_items ||--o{ tray_scan_items : "FK menu_item_id"
    menu_items ||--o{ transaction_items : "FK menu_item_id"
    menu_items ||--o{ menu_item_day_embeddings : "FK menu_item_id"
    menu_items ||--o{ menu_item_embedding_bank : "FK menu_item_id"

    tray_scans ||--o{ tray_scan_items : "FK tray_scan_id"
    tray_scans ||--o| transactions : "FK tray_scan_id"

    transactions ||--o{ transaction_items : "FK transaction_id"
    transactions ||--o{ feedbacks : "FK transaction_id"
```

### 14 Tables Summary

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `customers` | Employee accounts (email + password auth) | `employee_code`, `email`, `full_name`, `password_hash`, `salt` |
| `admin_users` | Hard-coded (not used in kiosk UI) | `email`, `pin_hash` |
| `staff_users` | Admin/cashier access control | `user_code`, `role` (admin/cashier), `status` |
| `menu_items` | Master dish catalog | `code`, `name`, `category`, `base_price`, `reference_embedding` |
| `service_days` | Service date groupings | `service_date` (unique), `meal_window` |
| `service_day_menu_items` | Which dishes are on today's menu | `override_price`, `available`, FK to service_days + menu_items |
| `tray_scans` | Scan sessions | `status`, `scan_source`, FK to customer + service_day |
| `tray_scan_items` | Individual detections per scan | `quantity`, `unit_price`, `confidence`, FK to tray_scan + menu_item |
| `transactions` | Payment records | `subtotal`, `total_amount`, `payment_method`, `status` |
| `transaction_items` | Line items per transaction | `item_name_snapshot`, `quantity`, `unit_price`, `line_total` |
| `feedbacks` | Customer issue reports | `issue_text`, FK to customer + transaction |
| `menu_item_day_embeddings` | CLIP vectors for today's menu | `embedding` (JSONB), `model_version`, FK to menu_item + service_day |
| `menu_item_embedding_bank` | All known dish prototypes | `embedding` (JSONB), `reference_name`, `source`, `source_key` |
| `embedding_bank_sync_state` | Sync tracking for vision bank | `source`, `fingerprint`, `prototype_count` |

---

## 6. Deployment Architecture

```mermaid
flowchart TB
    subgraph WinTablet[Windows Tablet — Single Machine]
        Node["Node.js 20 LTS
next start (port 3000)
- Kiosk UI
- Admin UI
- API routes
- CLIP inference"]
        PG["PostgreSQL 15+
localhost:5432
tecdia_tray_track"]
        YOLOPython["YOLO Python Service
(optional, port 5001)
Flask + waitress
ultralytics YOLOv8"]
        Disk["Local Filesystem
- data/ml-cache/ (CLIP weights)
- data/menu-images/ (reference photos)
- .next/ (build output)"]
        USB["USB Camera
(Chrome/Edge)"]
    end

    USB --> Node
    Node --> PG
    Node <--> YOLOPython
    Node --> Disk
    YOLOPython --> Disk
```

### Startup Sequence

1. PostgreSQL starts (Windows service, auto-start)
2. `npm run start` → Next.js serves on `:3000`
3. On first `/api/scan` → CLIP model loads from cache (~400 MB, ~30-60s)
4. Optional: `python scripts/yolo-detect-server.py` → Flask on `:5001`

### Non-Functional Characteristics

| Aspect | Detail |
|--------|--------|
| **Single-user** | One concurrent kiosk session at a time |
| **Offline-capable** | No internet once `.env.local` + `data/ml-cache` are set up |
| **First-scan latency** | ~30-60s for CLIP warm-up; sub-second thereafter |
| **Subsequent scans** | ~2-5s (grid crops + CLIP encode + similarity search) |
| **RAM** | ~500 MB for Node.js, ~1 GB for PostgreSQL, ~500 MB for CLIP |

---

## 7. Key Data Flows

### A. Morning Setup (Admin)

```
Admin logs in (6-digit PIN)
  ↓
Navigates to Menu Editor
  ↓
For each dish served today:
  1. Add/Edit menu item (name, category, price, calories)
  2. Upload reference photo (JPEG from tablet camera or file)
  3. Server saves to data/menu-images/{id}.jpg
  4. Server runs CLIP embedding → stored in:
     - menu_item_day_embeddings (for today's matching)
     - menu_item_embedding_bank (permanent prototype bank)
  ↓
Verify: /api/ml/status → todayEmbeddingCount > 0
```

### B. Kiosk Transaction

```
Customer approaches kiosk (IDLE screen)
  ↓ Tap screen
Customer logs in (EMAIL_AUTH):
  - Option A: Enter employee code (scanned from ID card)
  - Option B: Email + password
  ↓
Employee profile loaded (PROFILE)
  ↓
Tray placed under USB camera
  ↓ Camera opens in browser
Server processes tray image (SCANNING):
  ├── Grid crop approach: 6 overlapping regions → CLIP → embeddings
  ├── YOLO approach (if enabled): POST /detect → extract regions → CLIP
  └── Match vs today's embeddings → ScannedItem[]
  ↓
Bill shown to customer (BILL):
  - Detected items with prices
  - Cashier PIN can adjust/add items
  ↓
Payment selected (PAYMENT):
  - "immediate" → charge now
  - "account" → deduct from account balance
  ↓
POST /api/customer/checkout → Transaction created
  ↓
Receipt shown (DONE) → redirect to IDLE after 6s
```

### C. Reference Image → Embedding Persistence

```
Admin uploads photo
  ↓
src/lib/image-store.ts → saves JPEG to disk
  ↓
src/lib/clip-embedder.ts → compute CLIP vector
  ↓
src/lib/embeddings-db.ts → INSERT menu_item_day_embeddings
  +                                     embedding_bank
  ↓
src/lib/menu-reference-rebuild.ts → batch recompute from disk
```

---

## 8. API Route Map

```
/api
├── /health                          GET    Health check
├── /scan                            POST   Tray image → dish recognition
├── /ml/status                       GET    ML model health + embedding count
├── /menu/today                      GET    Today's menu items (public)
├── /auth
│   ├── /login                       POST   Customer email+password login
│   ├── /login-by-employee-code      POST   Customer employee-code login
│   ├── /signup                      POST   Register new customer
│   ├── /logout                      POST   Clear customer session
│   ├── /me                          GET    Current customer from session
│   ├── /reset-password              POST   Admin-reset customer password
│   └── /verify-super-pin            POST   Validate admin PIN
├── /customer
│   ├── /profile                     GET    Employee profile + balance
│   ├── /transactions                GET    Customer transaction history
│   ├── /checkout                    POST   Complete purchase
│   ├── /feedback                    POST   Submit issue report
│   └── /employees/[employeeCode]    GET    Employee lookup
├── /admin
│   ├── /login                       POST   Admin PIN login → session cookie
│   ├── /logout                      POST   Clear admin session
│   ├── /stats                       GET    Dashboard statistics
│   ├── /users                       GET    List staff users
│   │                                POST   Create staff user
│   ├── /users/[userCode]            PATCH  Update staff user
│   │                                DELETE Delete staff user
│   ├── /today-menu                  GET    List today's menu (admin)
│   │                                POST   Add menu item
│   ├── /today-menu/sebaw            PUT    Toggle Sebaw availability
│   ├── /today-menu/rice             PUT    Set rice prices
│   ├── /today-menu/[menuItemId]     PATCH  Update menu item
│   │                                DELETE Remove menu item
│   ├── /today-menu/[menuItemId]/image GET   Serve reference image
│   │                                POST   Upload reference photo + embed
│   │                                DELETE Remove photo + embedding
│   ├── /transactions                GET    All transactions
│   ├── /feedbacks                   GET    All feedback submissions
│   ├── /employees                   GET    All employees
│   ├── /employees/[employeeCode]    PATCH  Update employee profile
│   └── /ml
│       ├── /rebuild-references      POST   Recompute CLIP embeddings from disk
│       └── /import-vision           POST   Import vision bank prototypes
```

Full details in [API_REFERENCE.md](./API_REFERENCE.md).

---

## 9. Directory Layout

```
tecdia-tray-track-temp/          ← website/ (Next.js app)
├── src/
│   ├── app/                     ← Next.js App Router (pages + API)
│   │   ├── page.tsx             ← Marketing homepage
│   │   ├── layout.tsx           ← Root layout (fonts, HTML)
│   │   ├── customer/            ← Kiosk SPA
│   │   ├── admin/               ← Admin dashboard (7 sub-pages)
│   │   └── api/                 ← 33 API routes
│   ├── components/
│   │   ├── admin/               ← 9 admin components
│   │   ├── camera/              ← ScanOverlay
│   │   ├── customer/            ← 10 kiosk step components
│   │   ├── layout/              ← 7 layout components
│   │   ├── marketing/           ← MarketingTrayShowcase
│   │   └── ui/                  ← 9 reusable atomics
│   ├── hooks/                   ← useCustomerFlow, useCamera, useEmployeeIdScanner
│   ├── lib/                     ← 32 modules (core business + ML logic)
│   ├── services/                ← API client (api.ts)
│   └── types/                   ← Shared TypeScript types
├── scripts/                     ← Node.js + Python utility scripts
├── db/
│   ├── schema.sql               ← Full schema
│   ├── migrations/              ← 9 incremental migrations
│   └── seed_today_menu_example.sql
├── data/                        ← Runtime data (gitignored)
│   ├── ml-cache/                ← CLIP model weights
│   └── menu-images/             ← Reference photos

Dish Localization/               ← YOLO model (best.pt + training notebook)
dish classification/             ← Python training scripts (optional)
docs/
├── IMPLEMENTATION.md            ← Deployment guide
└── SYSTEM_DESIGN.md             ← This document
```

---

## 10. Tech Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router) | Full-stack React framework |
| **Frontend** | React 19 + TypeScript 6 | UI + state management |
| **Styling** | Tailwind CSS 4 | Utility-first CSS |
| **Database** | PostgreSQL 15+ | Relational data store |
| **DB Driver** | `pg` (node-postgres) | PostgreSQL client |
| **ML — CLIP** | `@xenova/transformers` | On-device vision-language model |
| **ML — YOLO** | `ultralytics` (Python) | Dish region detection |
| **Images** | `sharp` + `jimp` | JPEG processing in Node |
| **Python Server** | Flask + waitress | YOLO HTTP sidecar |
| **Auth** | Custom PIN + bcrypt-like hashing | Session cookies (admin + customer) |

Full dependency list in [TECH_STACK.md](./TECH_STACK.md).
