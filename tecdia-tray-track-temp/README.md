# Tecdia Tray Track (Next.js)

This application contains:
- Customer-side tray flow (ID/email auth -> scan -> review -> payment)
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

This creates core relational tables:
- `customers` (email/password auth)
- `admin_users` (PIN-based admin access, future)
- `menu_items`
- `service_days`
- `service_day_menu_items` (many-to-many availability by day)
- `tray_scans`
- `tray_scan_items`
- `transactions`
- `transaction_items`

## 2) Environment Variables

Create `.env.local` in `tecdia-tray-track-temp`:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=tecdia_tray_track
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_postgres_password
AUTH_SESSION_SECRET=use_a_long_random_string_here
```

You can copy from `.env.example`.

## 3) Install and Run

```powershell
npm install
npm run dev
```

Open [http://localhost:3000/customer](http://localhost:3000/customer).

## 4) Customer Auth Flow (What was added)

- `Use Email` button appears next to `Scan ID Card` on the customer idle screen.
- Email auth page supports:
  - Login (existing customer)
  - Sign up (new customer)
- After successful auth, user is moved to tray scanning.
- Tray scan still uses randomized items from available menu mocks (until ML pipeline is integrated).
- Proceeding from results takes user to payment screen (basic structure retained).

## 5) API Endpoints Added

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

## 6) How To Test Auth End-to-End

1. Start app: `npm run dev`
2. Go to `/customer`
3. Click `Use Email`
4. Choose `Sign Up`
5. Register with:
   - Full name
   - Email
   - Password (8+ chars)
6. Confirm you are routed to tray scanning screen.
7. Refresh page and verify session still recognizes user.
8. Go back to `/customer`, click `Use Email`, switch to `Login`, and login with same credentials.
9. Verify scan -> results -> proceed to payment.

Optional DB checks (in `psql`):

```sql
SELECT id, email, full_name, created_at
FROM customers
ORDER BY created_at DESC;
```

## 7) Notes

- Passwords are stored as salted hashes (`scrypt`) in `customers.password_hash` and `customers.password_salt`.
- Auth session is stored in an HTTP-only signed cookie.
- This is an incremental backend foundation; transactions and daily menu admin writes can be wired next using the existing relational schema.
