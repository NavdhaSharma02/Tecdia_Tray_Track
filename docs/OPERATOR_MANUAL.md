# Tecdia Tray Track — Technical & Operational Manual

AI-Powered On-Device Vision for Automated Cafeteria Billing

**Built by — Team AOZORA 青空**
Mentor: Samruddhi
Members: Jeffry, Navdha, Kavisha, Nomaan
Interactive manual: https://online.fliphtml5.com/Tecdia/kmyn/

---

## Safety Precautions

- Read this manual thoroughly and follow all safety precautions before operations such as system configuration and program creation.
- Keep this manual handy so that you can refer to it at any time.
- If you have any question concerning any part of this manual, contact the branch office or service engineer.
- Make it a rule to back up every file. Any trouble on the file unit, power failure during file access, or incorrect operation may destroy some of the files you have stored. To prevent data destruction and loss, make file backup a routine task.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Hardware Setup](#2-hardware-setup)
3. [Staff Operations](#3-staff-operations)
4. [How the AI Food Recognition System Works](#4-how-the-ai-food-recognition-system-works)
5. [Troubleshooting](#5-troubleshooting)
6. [Emergency Procedures](#6-emergency-procedures)
7. [Backup & Restore](#7-backup--restore)
8. [Glossary](#8-glossary)
9. [Known Limitations](#9-known-limitations)
10. [Support Contact](#10-support-contact)

---

## 1. System Overview

Tecdia Tray Track is an AI-powered cafeteria kiosk that uses on-device computer vision to recognize dishes and generate bills automatically. The system requires no internet connection during service once the ML model has been downloaded.

### 1.1 Core Components

| Component | Description |
|-----------|-------------|
| **Admin Interface** | Manage today's menu, upload reference photos, monitor vision readiness, view analytics |
| **Customer Kiosk** | Employee login, tray scan, bill review, and checkout |
| **Local App Server** | Runs on the kiosk machine; uses PostgreSQL for data and embeddings |
| **Vision Engine** | On-device YOLO (dish detection) + CLIP (dish classification); no internet required during service |

### 1.2 Key URLs

| Interface | URL |
|-----------|-----|
| Customer Kiosk | `http://localhost:3000/customer` |
| Admin Login | `http://localhost:3000/admin/login` |
| Home / Launcher | `http://localhost:3000/` |
| ML Status API | `http://localhost:3000/api/ml/status` |

### 1.3 Customer Flow

1. **Customer places food tray under USB camera** — The tray is aligned on the matte imaging surface for consistent image capture.

2. **System captures tray image** — The overhead USB camera captures a top-view image. Proper lighting maintains clarity and reduces shadows.

3. **Backend AI/ML pipeline initiates** — The captured image is transferred to the backend for processing: YOLO detects food regions, then CLIP classifies each region against reference photos.

4. **Food detection and classification** — YOLO identifies 6 dish categories (drink, food, meatless soup, rice_big, rice_small, soup). Rice and Sebaw are billed directly. Other regions are matched against CLIP reference embeddings.

5. **Automated pricing and billing** — The backend calculates the total cost using configured pricing.

6. **Bill displayed on kiosk** — Detected items and prices are shown for customer review.

7. **Customer completes payment** — Select payment method and confirm. Session ends.

8. **Data stored** — Transaction details are saved for analytics and future model improvement.

9. **System resets** — Ready for the next customer.

> For a detailed technical description of the ML pipeline, see [VISION_ML_PIPELINE.md](./VISION_ML_PIPELINE.md).

---

## 2. Hardware Setup

### 2.1 Bill of Materials

| Component | Model | Cost (INR) | Cost (PHP) |
|-----------|-------|-----------|-----------|
| Camera | Logitech Brio 4K Webcam | ₹22,490 | ₱14,443 |
| LED Ring Light | DIGITEK DRL-14C 14" | ₹1,199 | ₱779 |
| Overhead Mount | BROLAVIYA Desktop Stand | ₹800 | ₱520 |
| USB 3.0 Cable | Portronics PrintLink | ₹199 | ₱129 |
| Imaging Surface | Matte Black Acrylic Sheet 3mm | ₹900 | ₱578 |
| Barcode Scanner | RETSOL LS-450 | ₹1,250 | ₱802 |
| **TOTAL** | | **₹26,808** | **₱17,215** |

### 2.2 Physical Setup Guidelines

| Parameter | Recommendation |
|-----------|---------------|
| Camera height | 50–70 cm above the food tray |
| Environment | Indoor, controlled lighting, fixed tray placement area |
| Background | Matte black surface below the tray (avoid reflective steel, glossy tables, or patterned backgrounds) |
| Sunlight | Minimize external sunlight exposure |
| Tray placement | Do not stack dishes; keep all food visible with minimal overlap |
| Imaging surface | Keep matte black acrylic sheet clean and in place |

### 2.3 System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS | Windows 10 | Windows 11 |
| RAM | 8 GB | 16 GB |
| Disk | 2 GB free | 5 GB free |
| CPU | x86_64, 4 cores | x86_64, 8+ cores |
| Camera | USB webcam (720p) | USB webcam (1080p) |
| Browser | Chrome / Edge | Chrome / Edge (latest) |
| Software | PostgreSQL 15+, Node.js 20 LTS | Same |

---

## 3. Staff Operations

### 3.1 Admin Setup (Morning Checklist)

Complete these steps every morning before service begins:

1. **Start PostgreSQL** — Ensure the database service is running.
2. **Launch the application** — Run `npm run start` in the terminal of the project directory.
3. **Log in to Admin** — Open `http://localhost:3000/admin/login` and enter the `ADMIN_PIN`.
4. **Upload reference photos** — Go to **Menu**, and for each dish served today: Add/Edit → upload **Reference photo** (plate as it looks on the line) → Save.
5. **Wait for Vision Ready** — The **Vision** column shows **Ready** after CLIP processes each photo (may take 30–60 s on first boot).
6. **Verify ML status** — Open `http://localhost:3000/api/ml/status` and confirm:
   - `clipEnabled: true`
   - `todayEmbeddingCount` equals the number of available dishes with photos
7. **Test scan** — Perform a test tray scan before service begins to verify dish recognition and billing.
8. **Keep the app running** — Do not close the terminal or browser throughout service.

> **Important:** If no reference photo is uploaded for a dish, that dish cannot be recognized automatically. Every served dish must have a photo.

### 3.2 Customer Kiosk Operation

Staff should be familiar with this flow to assist customers:

1. **Open Kiosk** — Point browser to `http://localhost:3000/customer`.
2. **Customer sign-in** — Scan employee ID card using the barcode scanner. If the account doesn't exist, click "Create Account" and scan the ID. Use "Login via mail" if the scanner has issues.
3. **Place tray** — Position tray under the USB camera. Ensure the whole tray is visible.
4. **Scan** — Follow on-screen guidance to capture the tray image. Click the "i" icon near "Position the tray" for scan tips. If scanning has issues, use **Manual Billing** (enter staff PIN) to adjust dishes manually, then "Proceed to payment".
5. **Review bill** — Confirm recognized dishes and total. If something is wrong, click **Feedback** (top-right) to report concerns.
6. **Pay** — Select a payment option and complete checkout. The session ends and returns to the sign-in screen.

#### Tips for Accurate Scans

- Use a clean tray placement (do not stack dishes)
- Keep all food visible to the camera with minimal overlap
- Ensure the matte black imaging surface is clean and in place
- If the app is slow on first scan, allow a few seconds for the AI model to load

### 3.3 Admin Functionalities

| Function | Description |
|----------|-------------|
| **Dashboard** | View daily statistics: transactions, revenue, item popularity |
| **Menu** | Add/edit/remove today's menu items; upload reference photos; set pricing |
| **Sebaw Panel** | Toggle Sebaw availability and set price |
| **Rice Panel** | Set rice (big/small) prices |
| **Users** | Manage staff user accounts |
| **Transactions** | View all past transactions |
| **Feedbacks** | Review customer-submitted feedback |
| **Employees** | Manage employee records |
| **Analytics** | Revenue trends, payment mix, CSV export |

---

## 4. How the AI Food Recognition System Works

The food recognition system works by teaching the AI what each dish looks like before actual customer usage begins. Instead of manually entering food items during billing, the system automatically identifies dishes placed on the tray.

### Step-by-Step Process

1. **Staff uploads reference photos** — Before service, cafeteria staff upload clear photos of each dish served today. These photos act as examples for the AI.

2. **AI "learns" each dish** — The system converts each photo into a special visual signature (a CLIP embedding). This signature is stored in the database for quick comparison during live scanning.

3. **Customer places tray under camera** — The overhead camera captures an image of the tray.

4. **YOLO detects food regions** — The YOLO model divides the tray image into smaller sections and identifies food regions (e.g., "this is rice", "this is a soup bowl").

5. **CLIP classifies each region** — Each detected food region is compared against the stored reference photo signatures. The system finds the best visual match.

6. **Bill is generated** — Recognized items are priced and displayed on the kiosk interface.

### Key Source Files

| File | Role |
|------|------|
| `src/app/api/scan/route.ts` | Handles tray scan requests — receives the image and starts recognition |
| `src/app/api/admin/today-menu/[menuItemId]/image/route.ts` | Manages reference photo uploads by staff |
| `src/lib/tray-inference.ts` | Main decision-making brain — compares tray image with stored food examples |
| `src/lib/clip-embedder.ts` | Converts food photos into AI-readable visual fingerprints |
| `src/lib/embeddings-db.ts` | Stores and retrieves visual fingerprints from the database |
| `src/components/admin/MenuItemForm.tsx` | Admin screen where staff enter menu details and upload images |
| `src/services/api.ts` | Communication layer — functions like `scanTray()` and `uploadMenuItemReferenceImage()` |

> For a detailed technical reference, see [VISION_ML_PIPELINE.md](./VISION_ML_PIPELINE.md) (YOLO + CLIP pipeline, failure modes, performance) and [PYTHON_ML_SCRIPTS.md](./PYTHON_ML_SCRIPTS.md) (Python training scripts).

### Vision-Related API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/scan` | Send tray image for AI food recognition |
| POST | `/api/admin/today-menu/:menuItemId/image` | Upload reference photo for a menu item |
| GET | `/api/admin/today-menu/:menuItemId/image` | Retrieve stored reference photo |
| DELETE | `/api/admin/today-menu/:menuItemId/image` | Remove a reference image |
| GET | `/api/ml/status` | Check if AI recognition system is active |
| GET | `/api/menu/today` | List today's menu items |

> Full API reference with all 40 endpoints: [API_REFERENCE.md](./API_REFERENCE.md)

---

## 5. Troubleshooting

### Technical Issues

**Q: Why does `npm install` show an ENOSPC error?**

A: The system does not have enough available disk space. Free approximately 2 GB or more of disk space, then re-run `npm install`.

**Q: Why does the CLIP model download fail?**

A: The CLIP model requires internet access during initial setup. Run `npm run ml:setup` on a machine with internet, then copy the generated `data/ml-cache` folder to the deployment device.

**Q: Why are embeddings not being saved properly?**

A: The required database migration may not have been applied. Verify that Migration 007 has been executed. Inspect the backend server logs during upload for database-related errors.

**Q: Why is the first scan slower than subsequent scans?**

A: During the first scan, the CLIP model is loaded into memory (cold start). This is expected — once loaded, subsequent scans are significantly faster.

**Q: How can I avoid repeated slow startup delays?**

A: Keep the server running continuously (`npm run start`) throughout operating hours. This prevents the model from unloading.

### Staff / Operational Issues

**Q: Why are no dishes recognized?**

A: Possible causes and fixes:
- Missing reference photos → Upload photos for all dishes
- Low lighting → Improve lighting conditions
- Check that **Vision** column shows **Ready** in the admin menu

**Q: Why is there a wrong item on the bill?**

A: The photo match may be poor. Use **Cashier PIN** to adjust items on the bill, then re-upload a better reference photo for that dish.

**Q: Why does the screen show "Could not reach…"?**

A: The server may not be running. Run `npm run start` and verify PostgreSQL is running.

**Q: Why is it showing "Camera error"?**

A: There is an issue with camera permission or hardware. Allow camera access in the browser, or re-plug the USB webcam if using an external camera.

**Q: Why is there an error showing "App or camera failure"?**

A: This may indicate a process crash. Restart the server process, re-connect the USB webcam, and ensure camera permissions are granted in the browser.

**Q: Why did the scan miss an item?**

A: Likely caused by tray positioning. Ask the customer to reposition the tray and retry, or use staff override (Manual Billing) if needed.

---

## 6. Emergency Procedures

### 6.1 App Crashes Mid-Service

1. **Try to restart the app** — In the terminal, press Ctrl+C to stop, then run `npm run start` again.
2. **If that fails**, restart the computer (click Start → Power → Restart).
3. **After restart**, run `npm run start` in the project directory.
4. **Verify** — Open `http://localhost:3000/api/ml/status` to confirm ML is active.
5. **Resume service** — Re-open customer kiosk at `/customer`.

### 6.2 Database Connection Lost

1. **Check PostgreSQL service** — Open Task Manager → Services tab → find `postgresql-*` → ensure it is running.
2. **If stopped**, right-click and select **Start**.
3. **Restart the app** — Ctrl+C then `npm run start`.
4. **If PostgreSQL fails to start**, run as Administrator:
   ```
   net start postgresql-15
   ```

### 6.3 Camera Failure During Service

1. **Re-plug the USB camera** — Unplug and reconnect the camera.
2. **Reload the kiosk** — Press F5 in the browser.
3. **If the camera still fails**, use **Manual Billing** (staff PIN) so customers are not delayed.
4. **After service**, investigate the camera connection or try a different USB port.

### 6.4 Power Failure

1. **Wait for system to reboot** — The system should restart if configured to auto-start on boot.
2. **Manually start services** if auto-start is not configured:
   - Ensure PostgreSQL is running
   - Run `npm run start` in the project directory
3. **Restore data** — If the database was corrupted, restore from the latest backup (see §7).

---

## 7. Backup & Restore

### 7.1 Daily Backup (After Service)

Run these commands daily after service ends:

```powershell
# Backup database
pg_dump -U postgres -h localhost -d tecdia_tray_track > "backup_$(Get-Date -Format yyyy-MM-dd).sql"

# Backup reference photos
Copy-Item -Recurse website/data/menu-images\ "backup_menu-images_$(Get-Date -Format yyyy-MM-dd)"
```

### 7.2 Restore from Backup

```powershell
# Restore database
psql -U postgres -h localhost -d tecdia_tray_track -f backup_2026-05-29.sql

# Restore reference photos
Copy-Item -Recurse "backup_menu-images_2026-05-29\*" website/data/menu-images\
```

### 7.3 Backup Checklist

- [ ] Database dump saved to external drive or cloud folder
- [ ] `data/menu-images/` folder backed up
- [ ] `.env.local` backed up (contains passwords and PINs)
- [ ] Backup tested at least once (restore to a test machine and verify)

---

## 8. Glossary

| Term | Definition |
|------|-----------|
| **CLIP** | Contrastive Language-Image Pre-training — the AI model that identifies dishes by comparing tray images to reference photos |
| **Embedding** | A numerical "visual fingerprint" that represents what a dish looks like to the AI |
| **Embedding Bank** | The collection of all stored visual fingerprints, used to match detected food against known dishes |
| **YOLO** | You Only Look Once — the AI model that detects and outlines food regions on the tray |
| **ONNX** | Open Neural Network Exchange — the format in which the CLIP model runs (no Python needed) |
| **Reference Photo** | A photo of a dish uploaded by staff that the AI uses as an example for recognition |
| **Cold Start** | The initial delay (~30-60s) when the AI model is first loaded into memory |
| **Sidecar** | A separate process that runs alongside the main app (here, the YOLO Python server) |
| **Manual Billing** | A fallback mode where staff manually enter items instead of using automatic scan |
| **Sebaw** | A cafeteria menu category for side dishes (e.g., egg, fish) |

---

## 9. Known Limitations

This system has several known limitations that operators should be aware of:

- **No multi-device sync** — The kiosk runs on one machine; database and uploads are not replicated across devices.
- **No remote administration** — Admin UI is only accessible on the kiosk machine itself.
- **No receipt printing** — Receipts are shown on screen only.
- **No multi-language UI** — Currently English only.
- **No minimum score threshold** — CLIP always picks the best match, even if similarity is low. Upload high-quality reference photos for best results.
- **Cold start delay** — First scan after boot takes ~30-60s while the model loads.
- **Reference photos required** — Without admin-uploaded photos, dishes cannot be automatically recognized.
- **Single-user kiosk** — Designed for one transaction at a time.

> Full list of known limitations: [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md)

---

## 10. Support Contact

For questions, issues, or service requests, contact:

**Team AOZORA 青空**

- Mentor: Samruddhi
- Members: Jeffry, Navdha, Kavisha, Nomaan

For technical support, refer to the detailed developer documentation in the `docs/` folder:

| Reference | File |
|-----------|------|
| Deployment guide | [IMPLEMENTATION.md](./IMPLEMENTATION.md) |
| Environment variables | [CONFIGURATION.md](./CONFIGURATION.md) |
| ML pipeline details | [VISION_ML_PIPELINE.md](./VISION_ML_PIPELINE.md) |
| Python training | [PYTHON_DEV_GUIDE.md](./PYTHON_DEV_GUIDE.md) |
| Full API reference | [API_REFERENCE.md](./API_REFERENCE.md) |
| Project tree | [DIRECTORY_STRUCTURE.md](./DIRECTORY_STRUCTURE.md) |
| Known limitations | [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) |
