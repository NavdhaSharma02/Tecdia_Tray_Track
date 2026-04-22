# Tecdia Tray Track (Next.js)

This application contains:

- Customer-side tray flow (ID/email auth → scan → review → payment)
- Admin-side dashboard/menu/analytics/users/transactions views
- API routes under `src/app/api`

## 1) Local PostgreSQL Setup (Windows)

### Install PostgreSQL

1. Download installer from [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/).
2. Install PostgreSQL 15+ with:
   - `pgAdmin`
   - Command-line tools (`psql`)
3. During install, set and remember the `postgres` superuser password.

### Create the database

Open PowerShell and run:

```powershell
psql -U postgres -h localhost -p 5432
```

Then inside `psql`:

```sql
CREATE DATABASE tecdia_tray_track;
\c tecdia_tray_track
```

### Apply schema

From project root (`tecdia-tray-track-temp`) run:

```powershell
psql -U postgres -h localhost -d tecdia_tray_track -f db/schema.sql
```

If you created the database **before** calories were made optional, apply the migration:

```powershell
psql -U postgres -h localhost -d tecdia_tray_track -f db/migrations/002_menu_calories_nullable.sql
```

### Optional: seed one example item for today

So the kiosk has something to scan before you use the admin UI:

```powershell
psql -U postgres -h localhost -d tecdia_tray_track -f db/seed_today_menu_example.sql
```

Core relational tables:

- `customers` (email/password auth)
- `admin_users` (reserved for future per-user admin accounts)
- `menu_items` (catalog row per dish; `calories` may be `NULL` = “N/A”)
- `service_days` (one row per calendar date the cafeteria operates)
- `service_day_menu_items` (which catalog items appear **today**, and `available` for today)
- `tray_scans`, `tray_scan_items`, `transactions`, `transaction_items`

## 2) Environment Variables

Create `.env.local` in `tecdia-tray-track-temp`:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=tecdia_tray_track
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_postgres_password
AUTH_SESSION_SECRET=use_a_long_random_string_here

# Exactly 6 digits. Checked only on the server (never use NEXT_PUBLIC_ for this).
ADMIN_PIN=123456
```

You can copy from `.env.example`.

## 3) Install and Run

```powershell
npm install
npm run dev
```

Open [http://localhost:3000/customer](http://localhost:3000/customer).

## 4) Customer flow and session behavior

- **Email / password**: each visit starts unauthenticated; the app does **not** restore a prior customer from a cookie after refresh.
- After login or signup, an HTTP-only cookie keeps the session **only until** you log out, cancel from the tray scan step, or **finish payment** (success screen then returns to the ID screen and clears the cookie).
- On the **tray scanning** step only, **Cancel and log out** returns to the main ID screen and clears the cookie.
- After the tray scan completes (**Bill** step onward), the customer must complete checkout; there is no exit button until the flow finishes or staff intervene via browser refresh (which clears in-memory state; cookie is still cleared after payment).

Tray **simulated scan** loads **today’s available** rows from PostgreSQL (`GET /api/menu/today`) and randomizes detected items. If today’s menu is empty, the scan step shows an error until staff add items under **Admin → Menu**.

## 5) Admin: PIN and today’s menu

- Admin login is at `/admin/login`. Enter the **6-digit** `ADMIN_PIN` from `.env.local`. The PIN is validated with `POST /api/admin/login` (never embedded in client source).
- **Menu Management** reads and writes **today’s** menu: `GET/POST /api/admin/today-menu`, `PATCH/DELETE /api/admin/today-menu/:menuItemId`.
- Editing **name, price, calories** (number or **N/A** → stored as `NULL`), **category** (dropdown), and **availability** persists in Postgres.

### Useful SQL (inspect today’s lineup)

```sql
SELECT mi.name, mi.category, mi.base_price, mi.calories, sdmi.available
FROM service_day_menu_items sdmi
JOIN menu_items mi ON mi.id = sdmi.menu_item_id
JOIN service_days sd ON sd.id = sdmi.service_day_id
WHERE sd.service_date = CURRENT_DATE
ORDER BY mi.name;
```

## 6) API reference (customer + admin)

**Customer auth**

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

**Menu**

- `GET /api/menu/today` — available items for the kiosk scan
- `GET /api/admin/today-menu` — all items scheduled for today (admin UI)
- `POST /api/admin/today-menu` — add catalog + link to today
- `PATCH /api/admin/today-menu/:menuItemId` — update item + today’s availability
- `DELETE /api/admin/today-menu/:menuItemId` — remove item from **today’s** menu (catalog row remains unless you remove all day links; safe with existing FKs)

**Admin**

- `POST /api/admin/login` — body `{ "pin": "123456" }`

## 7) How to test quickly

1. Set `ADMIN_PIN` and Postgres vars in `.env.local`, apply schema (+ migration if needed), optionally run `seed_today_menu_example.sql`.
2. `npm run dev` → `/admin/login` → open **Menu** and confirm items match the DB query above.
3. `/customer` → **Use Email** → sign up or log in → **Scan Tray** → review → pay → after the thank-you screen you should land back on the **ID** step; the next customer must log in again.
4. On the scan step, use **Cancel and log out** to verify you return to the ID screen without finishing payment.

```sql
SELECT id, email, full_name, created_at
FROM customers
ORDER BY created_at DESC;
```

## 8) Notes

- Customer passwords use salted `scrypt` hashes in `customers`.
- Customer session cookie is HTTP-only, signed, and cleared on logout / cancel / completed payment.
- Admin panel access still uses `sessionStorage` after a successful PIN check; only the PIN verification runs on the server.
