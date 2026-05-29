# API Reference — Tecdia Tray Track

All endpoints are served from `http://localhost:3000` (production kiosk) or `http://localhost:3000` (dev).

Unless noted, all request/response bodies are JSON. All responses use the standard shape:

```typescript
interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}
```

---

## Table of Contents

| # | Route |
|---|-------|
| 1 | [`GET /api`](#1-get-api) |
| 2 | [`GET /api/health`](#2-get-apihealth) |
| 3 | [`POST /api/scan`](#3-post-apiscan) |
| 4 | [`GET /api/ml/status`](#4-get-apimlstatus) |
| 5 | [`GET /api/menu/today`](#5-get-apimenutoday) |
| 6 | [`POST /api/auth/login`](#6-post-apiauthlogin) |
| 7 | [`POST /api/auth/login-by-employee-code`](#7-post-apiauthlogin-by-employee-code) |
| 8 | [`POST /api/auth/signup`](#8-post-apiauthsignup) |
| 9 | [`POST /api/auth/logout`](#9-post-apiauthlogout) |
| 10 | [`GET /api/auth/me`](#10-get-apiauthme) |
| 11 | [`POST /api/auth/reset-password`](#11-post-apiauthreset-password) |
| 12 | [`POST /api/auth/verify-super-pin`](#12-post-apiauthverify-super-pin) |
| 13 | [`GET /api/customer/profile`](#13-get-apicustomerprofile) |
| 14 | [`GET /api/customer/transactions`](#14-get-apicustomertransactions) |
| 15 | [`POST /api/customer/checkout`](#15-post-apicustomercheckout) |
| 16 | [`POST /api/customer/feedback`](#16-post-apicustomerfeedback) |
| 17 | [`GET /api/customer/employees/[employeeCode]`](#17-get-apicustomeremployeesemployeecode) |
| 18 | [`POST /api/admin/login`](#18-post-apiadminlogin) |
| 19 | [`POST /api/admin/logout`](#19-post-apiadminlogout) |
| 20 | [`GET /api/admin/stats`](#20-get-apiadminstats) |
| 21 | [`GET /api/admin/users`](#21-get-apiadminusers) |
| 22 | [`POST /api/admin/users`](#22-post-apiadminusers) |
| 23 | [`PATCH /api/admin/users/[userCode]`](#23-patch-apiadminusersusercode) |
| 24 | [`DELETE /api/admin/users/[userCode]`](#24-delete-apiadminusersusercode) |
| 25 | [`GET /api/admin/today-menu`](#25-get-apiadmintoday-menu) |
| 26 | [`POST /api/admin/today-menu`](#26-post-apiadmintoday-menu) |
| 27 | [`PATCH /api/admin/today-menu/[menuItemId]`](#27-patch-apiadmintoday-menumenuitemid) |
| 28 | [`DELETE /api/admin/today-menu/[menuItemId]`](#28-delete-apiadmintoday-menumenuitemid) |
| 29 | [`PUT /api/admin/today-menu/sebaw`](#29-put-apiadmintoday-menusebaw) |
| 30 | [`PUT /api/admin/today-menu/rice`](#30-put-apiadmintoday-menurice) |
| 31 | [`GET /api/admin/today-menu/[menuItemId]/image`](#31-get-apiadmintoday-menumenuitemidimage) |
| 32 | [`POST /api/admin/today-menu/[menuItemId]/image`](#32-post-apiadmintoday-menumenuitemidimage) |
| 33 | [`DELETE /api/admin/today-menu/[menuItemId]/image`](#33-delete-apiadmintoday-menumenuitemidimage) |
| 34 | [`GET /api/admin/transactions`](#34-get-apiadmintransactions) |
| 35 | [`GET /api/admin/feedbacks`](#35-get-apiadminfeedbacks) |
| 36 | [`GET /api/admin/employees`](#36-get-apiadminemployees) |
| 37 | [`PATCH /api/admin/employees/[employeeCode]`](#37-patch-apiadminemployeesemployeecode) |
| 38 | [`POST /api/admin/ml/rebuild-references`](#38-post-apiadminmlrebuild-references) |
| 39 | [`POST /api/admin/ml/import-vision`](#39-post-apiadminmlimport-vision) |
| 40 | [`GET|POST /api`](#40-getpost-api) |

---

## 1. `GET /api/health`

Returns server health status.

```
GET /api/health
```

**Response `200`:**

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

## 2. `GET /api/ml/status`

ML inference health check for the kiosk.

```
GET /api/ml/status
```

**Response `200`:**

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

## 3. `POST /api/scan`

Process a tray image and return recognized dishes.

```
POST /api/scan
Content-Type: multipart/form-data
```

**Request:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | File (JPEG) | Yes | Tray photo from USB camera |

**Response `200`:**

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

**Response `422`:** No dishes recognized

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

## 4. `GET /api/menu/today`

List menu items available for scanning today (public kiosk endpoint).

```
GET /api/menu/today
```

**Response `200`:**

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

## 5. `POST /api/auth/login`

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

**Response `200`:**

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

## 6. `POST /api/auth/login-by-employee-code`

Login a customer using only their employee code (no password). Used for ID card scanning.

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

**Response `200`:** Same as login. Sets `CUSTOMER_SESSION_COOKIE`.

**Errors:** `401` — employee not found

---

## 7. `POST /api/auth/signup`

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

**Response `200`:** Customer profile object (same shape as login response). Sets session cookie.

**Errors:** `400` — missing required fields or duplicate employee code

---

## 8. `POST /api/auth/logout`

Clear the customer session cookie.

```
POST /api/auth/logout
```

**Response `200`:**

```json
{ "ok": true }
```

---

## 9. `GET /api/auth/me`

Return currently authenticated customer from session cookie.

```
GET /api/auth/me
```

**Response `200`:**

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

## 10. `POST /api/auth/reset-password`

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

**Response `200`:**

```json
{ "ok": true }
```

**Errors:** `400` — weak password, `403` — wrong admin PIN

---

## 11. `POST /api/auth/verify-super-pin`

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

**Response `200`:**

```json
{
  "ok": true,
  "data": { "role": "admin" }
}
```

**Errors:** `403` — invalid PIN

---

## 12. `GET /api/customer/profile`

Return the authenticated customer's employee profile with live account balance.

```
GET /api/customer/profile
Cookie: customer_session=...
```

**Response `200`:**

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

## 13. `GET /api/customer/transactions`

Return the authenticated customer's transaction history.

```
GET /api/customer/transactions
Cookie: customer_session=...
```

**Response `200`:**

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

## 14. `POST /api/customer/checkout`

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

**Response `200`:**

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

## 15. `POST /api/customer/feedback`

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

**Response `200`:**

```json
{ "ok": true }
```

**Auth:** Requires valid `CUSTOMER_SESSION_COOKIE`.

---

## 16. `GET /api/customer/employees/[employeeCode]`

Look up an employee by employee code (used during kiosk ID scan).

```
GET /api/customer/employees/EMP001
```

**Response `200`:**

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

## 17. `POST /api/admin/login`

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

**Response `200`:**

```json
{
  "ok": true,
  "data": {
    "role": "admin"
  }
}
```

Sets `admin_session` cookie (expires 8 hours).

**Errors:** `401` — wrong PIN, `503` — admin login not configured

---

## 18. `POST /api/admin/logout`

Clear the admin session cookie.

```
POST /api/admin/logout
```

**Response `200`:**

```json
{ "ok": true }
```

---

## 19. `GET /api/admin/stats`

Admin dashboard aggregated statistics.

```
GET /api/admin/stats
```

**Response `200`:**

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

## 20. `GET /api/admin/users`

List all staff users (admin + cashier accounts).

```
GET /api/admin/users
```

**Response `200`:**

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

## 21. `POST /api/admin/users`

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

**Response `200`:** Staff user object.

**Errors:** `403` — wrong admin PIN

---

## 22. `PATCH /api/admin/users/[userCode]`

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

**Response `200`:** Updated staff user object.

**Errors:** `403` — wrong admin PIN, `404` — user not found

---

## 23. `DELETE /api/admin/users/[userCode]`

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

**Response `200`:**

```json
{ "ok": true }
```

**Errors:** `403` — wrong admin PIN, `404` — user not found

---

## 24. `GET /api/admin/today-menu`

List all menu items scheduled for today (admin view, enriched with embedding status).

```
GET /api/admin/today-menu
```

**Response `200`:**

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

## 25. `POST /api/admin/today-menu`

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

**Response `200`:** New menu item object.

**Errors:** `400` — validation error

---

## 26. `PATCH /api/admin/today-menu/[menuItemId]`

Update a menu item on today's menu.

```
PATCH /api/admin/today-menu/uuid
Content-Type: application/json
```

**Request:** Same body shape as POST, all fields optional.

**Constraints:** Cannot change an item into Sebaw or a rice item.

**Response `200`:** Updated menu item object.

**Errors:** `400` — validation error, `404` — not found

---

## 27. `DELETE /api/admin/today-menu/[menuItemId]`

Remove a menu item from today's menu.

```
DELETE /api/admin/today-menu/uuid
```

**Response `200`:**

```json
{ "ok": true }
```

**Constraints:** Permanent items (Sebaw, rice_big, rice_small) cannot be removed.

---

## 28. `PUT /api/admin/today-menu/sebaw`

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

**Response `200`:** Updated menu item object.

---

## 29. `PUT /api/admin/today-menu/rice`

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

**Response `200`:** Array of updated menu item objects.

---

## 30. `GET /api/admin/today-menu/[menuItemId]/image`

Serve the stored reference image for a menu item.

```
GET /api/admin/today-menu/uuid/image
```

**Response `200`:** JPEG image (`Content-Type: image/jpeg`).

**Errors:** `404` — no image stored

---

## 31. `POST /api/admin/today-menu/[menuItemId]/image`

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

**Response `200`:**

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

## 32. `DELETE /api/admin/today-menu/[menuItemId]/image`

Remove the reference photo and admin-uploaded embeddings.

```
DELETE /api/admin/today-menu/uuid/image
```

**Response `200`:**

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

## 33. `GET /api/admin/transactions`

List all cafeteria transactions (admin view).

```
GET /api/admin/transactions
```

**Response `200`:**

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

## 34. `GET /api/admin/feedbacks`

List all customer feedback submissions (admin view).

```
GET /api/admin/feedbacks
```

**Response `200`:**

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

## 35. `GET /api/admin/employees`

List all employees registered in the system.

```
GET /api/admin/employees
```

**Response `200`:**

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

## 36. `PATCH /api/admin/employees/[employeeCode]`

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

**Response `200`:** Updated employee object.

---

## 37. `POST /api/admin/ml/rebuild-references`

Recompute CLIP embeddings from all saved reference photos on disk. Used to rebuild vision embeddings if they become corrupted or out of sync.

```
POST /api/admin/ml/rebuild-references
```

**Response `200`:**

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

## 38. `POST /api/admin/ml/import-vision`

Import / refresh prototype embeddings from the Computer Vision folder into PostgreSQL.

```
POST /api/admin/ml/import-vision
```

**Response `200`:**

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

## 39. `GET|POST /api`

Root API endpoint. Provides API info and an echo endpoint.

### `GET /api`

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

### `POST /api`

Echoes back the request body:

```json
{
  "ok": true,
  "data": { ... }   // whatever was sent
}
```

---

## Cookie Reference

| Cookie Name | Type | Expiry | Set By | Purpose |
|-------------|------|--------|--------|---------|
| `CUSTOMER_SESSION_COOKIE` | HTTP-only | Session | Login/signup endpoints | Customer auth |
| `admin_session` | HTTP-only | 8 hours | `POST /api/admin/login` | Admin auth |

---

## Shared Types

```typescript
// src/types/index.ts

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

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
  paymentMethod: 'immediate' | 'account';
  status: 'completed' | 'pending' | 'failed';
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

type PaymentMethod = 'immediate' | 'account';
type AdminRole = 'admin' | 'cashier';
type FlowStep = 'IDLE' | 'EMAIL_AUTH' | 'PROFILE' | 'SCANNING' | 'BILL' | 'PAYMENT' | 'DONE';
```

All types defined in: `src/types/index.ts`
