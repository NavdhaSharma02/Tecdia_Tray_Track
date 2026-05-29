# API Reference — Tecdia Tray Track

All endpoints at `http://localhost:3000`. Unless noted, all bodies are JSON. Standard response shape:

```typescript
interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}
```

---

## 1. Endpoints

| # | Method | Route | Purpose |
|---|--------|-------|---------|
| 1 | GET | `/api/health` | Server health (status, uptime) |
| 2 | GET | `/api/ml/status` | ML health (clipEnabled, todayEmbeddingCount) |
| 3 | POST | `/api/scan` | Tray image → ScannedItem[] (multipart: `image`) |
| 4 | GET | `/api/menu/today` | Today's menu items (public) |
| 5 | POST | `/api/auth/login` | Customer email+password login |
| 6 | POST | `/api/auth/login-by-employee-code` | Login by employee code only |
| 7 | POST | `/api/auth/signup` | Register new customer |
| 8 | POST | `/api/auth/logout` | Clear customer session |
| 9 | GET | `/api/auth/me` | Current customer from session |
| 10 | POST | `/api/auth/reset-password` | Admin-reset password (needs admin PIN) |
| 11 | POST | `/api/auth/verify-super-pin` | Validate admin PIN |
| 12 | GET | `/api/customer/profile` | Employee profile + balance |
| 13 | GET | `/api/customer/transactions` | Customer transaction history |
| 14 | POST | `/api/customer/checkout` | Complete purchase |
| 15 | POST | `/api/customer/feedback` | Submit issue report |
| 16 | GET | `/api/customer/employees/[employeeCode]` | Employee lookup |
| 17 | POST | `/api/admin/login` | Admin PIN login → `admin_session` cookie |
| 18 | POST | `/api/admin/logout` | Clear admin session |
| 19 | GET | `/api/admin/stats` | Dashboard statistics |
| 20 | GET | `/api/admin/users` | List staff users |
| 21 | POST | `/api/admin/users` | Create staff user (needs adminPin) |
| 22 | PATCH | `/api/admin/users/[userCode]` | Update staff user |
| 23 | DELETE | `/api/admin/users/[userCode]` | Delete staff user |
| 24 | GET | `/api/admin/today-menu` | Today's menu (admin, with embedding status) |
| 25 | POST | `/api/admin/today-menu` | Add menu item |
| 26 | PATCH | `/api/admin/today-menu/[menuItemId]` | Update menu item |
| 27 | DELETE | `/api/admin/today-menu/[menuItemId]` | Remove menu item |
| 28 | PUT | `/api/admin/today-menu/sebaw` | Toggle Sebaw availability |
| 29 | PUT | `/api/admin/today-menu/rice` | Set rice prices |
| 30 | GET | `/api/admin/today-menu/[menuItemId]/image` | Serve reference image |
| 31 | POST | `/api/admin/today-menu/[menuItemId]/image` | Upload reference photo + embed |
| 32 | DELETE | `/api/admin/today-menu/[menuItemId]/image` | Remove photo + embedding |
| 33 | GET | `/api/admin/transactions` | All transactions |
| 34 | GET | `/api/admin/feedbacks` | All feedback submissions |
| 35 | GET | `/api/admin/employees` | All employees |
| 36 | PATCH | `/api/admin/employees/[employeeCode]` | Update employee |
| 37 | POST | `/api/admin/ml/rebuild-references` | Rebuild CLIP embeddings from disk |
| 38 | POST | `/api/admin/ml/import-vision` | Import vision bank prototypes |
| 39 | GET | `/api` | API info (name, version) |
| 40 | POST | `/api` | Echo body |

---

## 2. Request / Response Details

### 2.1 `GET /api/health`

```
GET /api/health
```

Response `200`:
```json
{
  "ok": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-05-29T10:00:00.000Z",
    "uptime": 12345
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Always `"ok"` |
| `timestamp` | string | ISO 8601 timestamp |
| `uptime` | number | Process uptime in seconds |

---

### 2.2 `GET /api/ml/status`

```
GET /api/ml/status
```

Response `200`:
```json
{
  "ok": true,
  "data": {
    "inferenceMode": "clip",
    "clipEnabled": true,
    "todayEmbeddingCount": 12,
    "modelId": "Xenova/clip-vit-base-patch32",
    "cacheDir": "./data/ml-cache"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `inferenceMode` | string | `"clip"` or `"simulate"` |
| `clipEnabled` | boolean | CLIP model loaded |
| `todayEmbeddingCount` | number | Menu items with embeddings today |
| `modelId` | string | CLIP model identifier |
| `cacheDir` | string | Model cache directory path |

---

### 2.3 `POST /api/scan`

```
POST /api/scan
Content-Type: multipart/form-data
```

**Request:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | File (JPEG) | Yes | Tray photo from USB camera |

Response `200`:
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "name": "chicken adobo",
      "category": "Main Course",
      "price": 55.00,
      "quantity": 1,
      "confidence": 0.87,
      "calories": 350
    },
    {
      "id": "uuid",
      "name": "rice_big",
      "category": "rice_big",
      "price": 15.00,
      "quantity": 1,
      "confidence": 0.95,
      "calories": null
    }
  ],
  "meta": {
    "mode": "grid",
    "message": "3/5 crops matched"
  }
}
```

Response `422` — No dishes recognized:
```json
{
  "ok": false,
  "error": "No dishes recognized in the tray image.",
  "meta": { "mode": "grid", "message": "0 crops matched" }
}
```

**Errors:** `422` — no dishes recognized

**Source:** `src/app/api/scan/route.ts`, `src/lib/tray-inference.ts`

---

### 2.4 `GET /api/menu/today`

```
GET /api/menu/today
```

Response `200`:
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "name": "chicken adobo",
      "category": "Main Course",
      "price": 55.00,
      "available": true,
      "calories": 350
    }
  ]
}
```

**Source:** `src/app/api/menu/today/route.ts`

---

### 2.5 `POST /api/auth/login`

Authenticate a customer by email and password.

```
POST /api/auth/login
Content-Type: application/json
```

**Request:**
```json
{
  "email": "employee@company.com",
  "password": "userPassword123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Customer email |
| `password` | string | Yes | Customer password |

Response `200`:
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "employeeCode": "EMP001",
    "email": "employee@company.com",
    "fullName": "Juan Dela Cruz",
    "department": "Engineering",
    "createdAt": "2026-01-15T...",
    "accountBalance": 250.00
  }
}
```

Sets `CUSTOMER_SESSION_COOKIE` HTTP-only cookie.

**Errors:** `401` — invalid credentials

---

### 2.6 `POST /api/auth/login-by-employee-code`

Login a customer using only their employee code.

```
POST /api/auth/login-by-employee-code
Content-Type: application/json
```

**Request:**
```json
{
  "employeeCode": "EMP001"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `employeeCode` | string | Yes | Employee code |

Response `200`: Same shape as login. Sets `CUSTOMER_SESSION_COOKIE`.

**Errors:** `401` — employee not found

---

### 2.7 `POST /api/auth/signup`

Register a new customer account.

```
POST /api/auth/signup
Content-Type: application/json
```

**Request:**
```json
{
  "employeeCode": "EMP001",
  "email": "employee@company.com",
  "fullName": "Juan Dela Cruz",
  "department": "Engineering",
  "password": "optionalPassword"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `employeeCode` | string | Yes | Employee identifier |
| `email` | string | Yes | Valid email address |
| `fullName` | string | Yes | Full name |
| `department` | string | Yes | Department name |
| `password` | string | No | Auto-generated if missing or < 8 chars |

Response `200`: Customer profile object (same as login response). Sets session cookie.

**Errors:** `400` — missing required fields or duplicate employee code

---

### 2.8 `POST /api/auth/logout`

Clear the customer session cookie.

```
POST /api/auth/logout
```

Response `200`:
```json
{ "ok": true }
```

---

### 2.9 `GET /api/auth/me`

Return currently authenticated customer from session cookie.

```
GET /api/auth/me
```

Response `200`:
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "employeeCode": "EMP001",
    "email": "employee@company.com",
    "fullName": "Juan Dela Cruz",
    "department": "Engineering",
    "createdAt": "2026-01-15T...",
    "accountBalance": 250.00
  }
}
```

Returns `{ customer: null }` if no valid session.

---

### 2.10 `POST /api/auth/reset-password`

Admin-reset a customer's password. Requires admin PIN for authorization.

```
POST /api/auth/reset-password
Content-Type: application/json
```

**Request:**
```json
{
  "email": "employee@company.com",
  "adminPin": "123456",
  "newPassword": "newSecurePass123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Customer email |
| `adminPin` | string | Yes | Admin PIN for authorization |
| `newPassword` | string | Yes | Min 8 characters |

Response `200`:
```json
{ "ok": true }
```

**Errors:** `400` — weak password, `403` — wrong admin PIN

---

### 2.11 `POST /api/auth/verify-super-pin`

Validate an admin or super-user PIN.

```
POST /api/auth/verify-super-pin
Content-Type: application/json
```

**Request:**
```json
{
  "pin": "123456"
}
```

Response `200`:
```json
{
  "ok": true,
  "data": { "role": "admin" }
}
```

**Errors:** `403` — invalid PIN

---

### 2.12 `GET /api/customer/profile`

Return the authenticated customer's employee profile with live account balance.

```
GET /api/customer/profile
Cookie: customer_session=...
```

Response `200`:
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "name": "Juan Dela Cruz",
    "department": "Engineering",
    "email": "employee@company.com",
    "avatar": null,
    "accountBalance": 250.00,
    "joinDate": "2026-01-15",
    "status": "active",
    "totalTransactions": 42,
    "totalSpent": 2310.50,
    "lastTransactionAt": "2026-05-28T12:30:00Z",
    "primaryPaymentMethod": "account"
  }
}
```

**Auth:** Requires valid `CUSTOMER_SESSION_COOKIE`.

---

### 2.13 `GET /api/customer/transactions`

Return the authenticated customer's transaction history.

```
GET /api/customer/transactions
Cookie: customer_session=...
```

Response `200`:
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "employeeId": "uuid",
      "date": "2026-05-28T12:30:00Z",
      "items": [
        { "name": "chicken adobo", "qty": 1, "price": 55.00 }
      ],
      "total": 70.00,
      "paymentMethod": "account",
      "status": "completed"
    }
  ]
}
```

**Auth:** Requires valid `CUSTOMER_SESSION_COOKIE`.

---

### 2.14 `POST /api/customer/checkout`

Complete a checkout / create a transaction.

```
POST /api/customer/checkout
Content-Type: application/json
Cookie: customer_session=...
```

**Request:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "chicken adobo",
      "category": "Main Course",
      "price": 55.00,
      "quantity": 1,
      "confidence": 0.87,
      "calories": 350
    }
  ],
  "paymentMethod": "immediate"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `items` | `ScannedItem[]` | Yes | Items to purchase |
| `paymentMethod` | `"immediate"` or `"account"` | Yes | Payment method |

Response `200`:
```json
{
  "ok": true,
  "data": {
    "transactionId": "uuid",
    "employeeId": "uuid",
    "items": [ ... ],
    "total": 70.00,
    "paymentMethod": "immediate",
    "date": "2026-05-29T10:00:00Z",
    "status": "completed"
  }
}
```

**Auth:** Requires valid `CUSTOMER_SESSION_COOKIE`.

---

### 2.15 `POST /api/customer/feedback`

Submit feedback from the authenticated customer.

```
POST /api/customer/feedback
Content-Type: application/json
Cookie: customer_session=...
```

**Request:**
```json
{
  "issueText": "The chicken adobo was too salty today.",
  "transactionId": "uuid"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `issueText` | string | Yes | Feedback text |
| `transactionId` | string or null | No | Related transaction ID |

Response `200`:
```json
{ "ok": true }
```

**Auth:** Requires valid `CUSTOMER_SESSION_COOKIE`.

---

### 2.16 `GET /api/customer/employees/[employeeCode]`

Look up an employee by employee code.

```
GET /api/customer/employees/EMP001
```

Response `200`:
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "employeeCode": "EMP001",
    "fullName": "Juan Dela Cruz",
    "email": "employee@company.com",
    "department": "Engineering"
  }
}
```

**Errors:** `404` — employee not found

---

### 2.17 `POST /api/admin/login`

Authenticate an admin user by PIN. Sets a secure HTTP-only session cookie.

```
POST /api/admin/login
Content-Type: application/json
```

**Request:**
```json
{
  "pin": "123456"
}
```

Response `200`:
```json
{
  "ok": true,
  "data": { "role": "admin" }
}
```

Sets `admin_session` cookie (expires 8 hours).

**Errors:** `401` — wrong PIN, `503` — admin login not configured

---

### 2.18 `POST /api/admin/logout`

Clear the admin session cookie.

```
POST /api/admin/logout
```

Response `200`:
```json
{ "ok": true }
```

---

### 2.19 `GET /api/admin/stats`

Admin dashboard aggregated statistics.

```
GET /api/admin/stats
```

Response `200`:
```json
{
  "ok": true,
  "data": {
    "mealsToday": 142,
    "revenueToday": 7810.00,
    "activeUsers": 89,
    "popularItem": "chicken adobo",
    "avgMealCost": 55.00,
    "monthlyRevenue": 156200.00,
    "yearlyRevenue": 1874400.00
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `mealsToday` | number | Completed transactions today |
| `revenueToday` | number | Sum of today's totals |
| `activeUsers` | number | Unique customers today |
| `popularItem` | string | Best-selling dish name |
| `avgMealCost` | number | Average transaction total |
| `monthlyRevenue` | number | Current month total |
| `yearlyRevenue` | number | Current year total |

---

### 2.20 `GET /api/admin/users`

List all staff users (admin + cashier accounts).

```
GET /api/admin/users
```

Response `200`:
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "name": "Maria Admin",
      "email": "admin@company.com",
      "role": "admin",
      "status": "active",
      "shift": "Morning",
      "scope": "Full access"
    }
  ]
}
```

---

### 2.21 `POST /api/admin/users`

Create a new staff user.

```
POST /api/admin/users
Content-Type: application/json
```

**Request:**
```json
{
  "adminPin": "123456",
  "userCode": "USR002",
  "name": "New Cashier",
  "email": "cashier@company.com",
  "role": "cashier",
  "shift": "Afternoon",
  "status": "active",
  "description": "Cashier for afternoon shift"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `adminPin` | string | Yes | Authorization |
| `userCode` | string | No | Auto-generated if omitted |
| `name` | string | Yes | Display name |
| `email` | string | Yes | Login email |
| `role` | `"admin"` or `"cashier"` | Yes | Access level |
| `shift` | string | No | Schedule label |
| `status` | `"active"` / `"invited"` / `"suspended"` | No | Default `"active"` |
| `description` | string | No | Notes |

Response `200`: Staff user object.

**Errors:** `403` — wrong admin PIN

---

### 2.22 `PATCH /api/admin/users/[userCode]`

Update a staff user by user code.

```
PATCH /api/admin/users/USR002
Content-Type: application/json
```

**Request:**
```json
{
  "adminPin": "123456",
  "name": "Updated Name",
  "role": "admin",
  "status": "suspended"
}
```

Same fields as POST (all optional except `adminPin`).

Response `200`: Updated staff user object.

**Errors:** `403` — wrong admin PIN, `404` — user not found

---

### 2.23 `DELETE /api/admin/users/[userCode]`

Delete a staff user by user code.

```
DELETE /api/admin/users/USR002
Content-Type: application/json
```

**Request:**
```json
{
  "adminPin": "123456"
}
```

Response `200`:
```json
{ "ok": true }
```

**Errors:** `403` — wrong admin PIN, `404` — user not found

---

### 2.24 `GET /api/admin/today-menu`

List all menu items scheduled for today (admin view, enriched with embedding status).

```
GET /api/admin/today-menu
```

Response `200`:
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "name": "chicken adobo",
      "category": "Main Course",
      "price": 55.00,
      "available": true,
      "calories": 350,
      "hasEmbedding": true,
      "embeddingCount": 1,
      "hasReferencePhoto": true
    }
  ]
}
```

Extra fields beyond the public menu:

| Field | Type | Description |
|-------|------|-------------|
| `hasEmbedding` | boolean | CLIP prototype exists |
| `embeddingCount` | number | Number of prototypes |
| `hasReferencePhoto` | boolean | Image file stored on disk |

---

### 2.25 `POST /api/admin/today-menu`

Add a new item to today's menu (also adds it to the master catalog).

```
POST /api/admin/today-menu
Content-Type: application/json
```

**Request:**
```json
{
  "name": "chicken teriyaki",
  "category": "Main Course",
  "price": 60.00,
  "calories": 400,
  "available": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Lowercase dish name |
| `category` | string | Yes | `"Main Course"`, `"Soup"`, etc. |
| `price` | number | Yes | Must be >= 0 |
| `calories` | number or null | No | Deprecated: always stores null |
| `available` | boolean | No | Default `true` |

**Validation rules:**
- Name must be lowercase with spaces only (regex: `^[a-z]+(?: [a-z]+)*$`)
- Cannot create Sebaw or rice items (use dedicated endpoints)
- Name + category must be unique

Response `200`: New menu item object.

**Errors:** `400` — validation error

---

### 2.26 `PATCH /api/admin/today-menu/[menuItemId]`

Update a menu item on today's menu.

```
PATCH /api/admin/today-menu/uuid
Content-Type: application/json
```

**Request:** Same body shape as POST, all fields optional.

**Constraints:** Cannot change an item into Sebaw or a rice item.

Response `200`: Updated menu item object.

**Errors:** `400` — validation error, `404` — not found

---

### 2.27 `DELETE /api/admin/today-menu/[menuItemId]`

Remove a menu item from today's menu.

```
DELETE /api/admin/today-menu/uuid
```

Response `200`:
```json
{ "ok": true }
```

**Constraints:** Permanent items (Sebaw, rice_big, rice_small) cannot be removed.

---

### 2.28 `PUT /api/admin/today-menu/sebaw`

Toggle whether free Sebaw soup is available on today's menu.

```
PUT /api/admin/today-menu/sebaw
Content-Type: application/json
```

**Request:**
```json
{
  "available": true
}
```

Response `200`: Updated menu item object.

---

### 2.29 `PUT /api/admin/today-menu/rice`

Set prices for the permanent rice items.

```
PUT /api/admin/today-menu/rice
Content-Type: application/json
```

**Request:**
```json
{
  "rice_big": 15.00,
  "rice_small": 10.00
}
```

Both fields optional. Only provided prices are updated.

Response `200`: Array of updated menu item objects.

---

### 2.30 `GET /api/admin/today-menu/[menuItemId]/image`

Serve the stored reference image for a menu item.

```
GET /api/admin/today-menu/uuid/image
```

Response `200`: JPEG image (`Content-Type: image/jpeg`).

**Errors:** `404` — no image stored

---

### 2.31 `POST /api/admin/today-menu/[menuItemId]/image`

Upload one or more reference photos for a menu item. Computes CLIP embeddings and stores them.

```
POST /api/admin/today-menu/uuid/image
Content-Type: multipart/form-data
```

**Request:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | File (JPEG) | No* | Single image upload |
| `images` | File[] (JPEG) | No* | Multiple image upload |
| *At least one of `image` or `images` must be provided. |

**Processing:**
1. Saves JPEG to `data/menu-images/{id}.jpg`
2. Runs CLIP embedding via `clip-embedder.ts`
3. Stores embedding in `menu_item_day_embeddings` + `menu_item_embedding_bank`
4. If embedding fails, the photo is still saved (warning returned)

Response `200`:
```json
{
  "ok": true,
  "data": {
    "saved": true,
    "embedded": true,
    "embeddingCount": 3
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `saved` | boolean | Image written to disk |
| `embedded` | boolean | CLIP embedding generated |
| `embeddingCount` | number | Total embeddings for this item |

---

### 2.32 `DELETE /api/admin/today-menu/[menuItemId]/image`

Remove the reference photo and admin-uploaded embeddings.

```
DELETE /api/admin/today-menu/uuid/image
```

Response `200`:
```json
{
  "ok": true,
  "data": {
    "removedImage": true,
    "removedEmbeddings": true,
    "removedDayEmbeddings": true
  }
}
```

---

### 2.33 `GET /api/admin/transactions`

List all cafeteria transactions (admin view).

```
GET /api/admin/transactions
```

Response `200`:
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "employeeId": "uuid",
      "date": "2026-05-29T10:00:00Z",
      "items": [
        { "name": "chicken adobo", "qty": 1, "price": 55.00 }
      ],
      "total": 70.00,
      "paymentMethod": "immediate",
      "status": "completed"
    }
  ]
}
```

---

### 2.34 `GET /api/admin/feedbacks`

List all customer feedback submissions (admin view).

```
GET /api/admin/feedbacks
```

Response `200`:
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "customerId": "uuid",
      "customerEmail": "employee@company.com",
      "customerName": "Juan Dela Cruz",
      "transactionId": "uuid",
      "issueText": "The chicken adobo was too salty today.",
      "createdAt": "2026-05-29T10:05:00Z"
    }
  ]
}
```

---

### 2.35 `GET /api/admin/employees`

List all employees registered in the system.

```
GET /api/admin/employees
```

Response `200`:
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "employeeCode": "EMP001",
      "fullName": "Juan Dela Cruz",
      "email": "employee@company.com",
      "department": "Engineering"
    }
  ]
}
```

---

### 2.36 `PATCH /api/admin/employees/[employeeCode]`

Update an employee profile by employee code.

```
PATCH /api/admin/employees/EMP001
Content-Type: application/json
```

**Request:**
```json
{
  "employeeCode": "EMP002",
  "fullName": "Updated Name",
  "department": "Finance"
}
```

All fields optional.

Response `200`: Updated employee object.

---

### 2.37 `POST /api/admin/ml/rebuild-references`

Recompute CLIP embeddings from all saved reference photos on disk.

```
POST /api/admin/ml/rebuild-references
```

Response `200`:
```json
{
  "ok": true,
  "data": {
    "processed": 12,
    "failed": 0,
    "skipped": 0
  }
}
```

---

### 2.38 `POST /api/admin/ml/import-vision`

Import / refresh prototype embeddings from the Computer Vision folder into PostgreSQL.

```
POST /api/admin/ml/import-vision
```

Response `200`:
```json
{
  "ok": true,
  "data": {
    "totalPrototypesInBank": 85,
    "syncResult": { ... }
  }
}
```

---

### 2.39 `GET /api`

Returns API metadata:
```json
{
  "ok": true,
  "data": {
    "name": "Tecdia Tray Track",
    "version": "0.1.0",
    "endpoints": [ ... ]
  }
}
```

### 2.40 `POST /api`

Echoes back the request body:
```json
{
  "ok": true,
  "data": { ... }   // whatever was sent
}
```

---

## 3. Cookie Reference

| Cookie | Type | Expiry | Set By |
|--------|------|--------|--------|
| `CUSTOMER_SESSION_COOKIE` | HTTP-only | Session | Login/signup |
| `admin_session` | HTTP-only | 8 hours | `POST /api/admin/login` |

---

## 4. Shared Types

```typescript
// src/types/index.ts
type FlowStep = "IDLE" | "EMAIL_AUTH" | "PROFILE" | "SCANNING" | "BILL" | "PAYMENT" | "DONE";
type PaymentMethod = "immediate" | "account";
type AdminRole = "admin" | "cashier";
type BillingMode = "scan" | "manual";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string | null;
  available: boolean;
  calories: number | null;
  hasEmbedding?: boolean;
  embeddingCount?: number;
  hasReferencePhoto?: boolean;
}

interface ScannedItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  confidence: number;
  calories: number | null;
}

interface Transaction {
  id: string;
  employeeId: string;
  date: string;
  items: TransactionItem[];
  total: number;
  paymentMethod: PaymentMethod;
  status: "completed" | "pending" | "failed";
}

interface TransactionItem {
  name: string;
  qty: number;
  price: number;
}

interface AuthCustomer {
  id: string;
  employeeCode: string;
  email: string;
  fullName: string;
  department: string;
  createdAt: string;
  accountBalance?: number;
}

interface AdminStats {
  mealsToday: number;
  revenueToday: number;
  activeUsers: number;
  popularItem: string;
  avgMealCost: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
}

interface Employee {
  id: string;
  name: string;
  department: string;
  email: string;
  avatar: string | null;
  accountBalance: number;
  joinDate: string;
  status?: "active" | "on_leave" | "inactive";
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: "active" | "invited" | "suspended";
  shift: string;
  scope: string;
}

interface FeedbackEntry {
  id: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  transactionId: string | null;
  issueText: string;
  createdAt: string;
}

interface Receipt {
  transactionId: string;
  employeeId: string;
  items: ScannedItem[];
  total: number;
  paymentMethod: PaymentMethod;
  date: string;
  status: string;
}
```

All types defined in: `src/types/index.ts`
