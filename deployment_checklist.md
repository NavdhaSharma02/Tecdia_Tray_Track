# 📋 Tecdia Tray Track - Kiosk Deployment & Operations Checklist

This checklist is designed for canteen administrators and managers. Use it to verify that the kiosk hardware, database, AI model, camera, and settings are fully prepared and functioning properly before, during, and after deployment.

---

## 🔍 Phase 1: Before Deployment (Pre-requisites)

Ensure all hardware and requirements are ready before starting the installation:

- [ ] **Hardware Requirements**
  - **Tablet/PC**: Windows 10 or 11 system with at least 8 GB RAM (16 GB recommended for smooth AI model execution).
  - **Disk Space**: At least 2 GB of free disk space for the application and the local AI cache.
  - **Webcam**: A USB webcam securely mounted directly above the tray area, pointing straight down.

- [ ] **Onsite Configuration Data**
  - **Admin PIN**: A secret 6-digit number (configured in settings) to access the admin panel.
  - **Cashier PIN**: A secret 6-digit number to authorize manual billing overrides at the kiosk.

- [ ] **Software Installations**
  - Node.js (version 20 LTS) installed on the system.
  - PostgreSQL (version 15+) installed and running locally as a Windows service.
  - Python installed *(only if YOLO tray portion localization is used)* with packages:
    - `ultralytics`
    - `flask`
    - `opencv-python-headless`

---

## 🚀 Phase 2: During Deployment (System Setup)

Perform these verification checks during the initial application setup:

- [ ] **Database Connection Check**
  - Confirm the database `tecdia_tray_track` has been created in PostgreSQL.
  - Verify all migration scripts (`db/schema.sql` and files in `db/migrations/`) have been executed.

- [ ] **Environment Configuration (`.env.local`)**
  - Check that database login credentials (host, port, user, password) are correctly filled in the `.env.local` file.
  - Verify `ADMIN_PIN` and `CASHIER_PIN` are set to valid, unique 6-digit numbers.
  - Confirm `ML_INFERENCE_MODE` is set to `clip` (not `simulate`).

- [ ] **AI Model Download**
  - Run:
    ```bash
    npm run ml:setup
    ```
  - Open:
    ```
    http://localhost:3000/api/ml/status
    ```
  - Verify response includes:
    ```json
    {
      "clipEnabled": true,
      "inferenceMode": "clip"
    }
    ```

- [ ] **Local YOLO Detection Server (if active)**
  - Run:
    ```bash
    python scripts/yolo-detect-server.py
    ```
  - Verify it starts without errors at:
    ```
    http://127.0.0.1:5001/detect
    ```

- [ ] **Kiosk Auto-Start Config**
  - Set up Windows Task Scheduler to automatically start:
    - Next.js server: `npm run start`
    - YOLO server (if used)

---

## ☀️ Phase 3: After Deployment (Daily Checks & Verification)

Perform these checks **every morning before opening service**:

- [ ] **Step 1: Check Services & Admin Login**
  - Open:
    ```
    http://localhost:3000/admin/login
    ```
  - Verify login using Admin PIN.

- [ ] **Step 2: Update Today's Menu & Prices**
  - Navigate to the **Menu** page.
  - Toggle **Available today** for all dishes being served.
  - Enter correct prices.
  - Configure:
    - Rice portions (Big & Small)
    - Sebaw availability

- [ ] **Step 3: Upload Reference Photos (Critical for AI Scan)**
  - Upload clear, top-down images for each dish.
  - Wait 30–60 seconds.
  - Confirm **Vision = Ready (green)**.
  - Verify:
    ```
    http://localhost:3000/api/ml/status
    ```
    `todayEmbeddingCount` equals number of active dishes.

- [ ] **Step 4: Test the Kiosk Flow**
  - Open:
    ```
    http://localhost:3000/customer
    ```

  - **ID Scanner Test**
    - Scan employee ID or use email login.
    - Verify employee profile and balance retrieval.

  - **Tray Scan Test**
    - Place tray under camera.
    - Click **Scan Tray**.
    - Ensure:
      - Camera feed appears
      - Scan completes
      - Items are correctly identified with accurate prices

  - **Cashier PIN Override Test**
    - Click **Manual billing**
    - Enter Cashier/Admin PIN
    - Verify manual adjustments unlock

  - **Checkout Test**
    - Select payment method
    - Confirm transaction
    - Verify reset to idle screen

---

## 🛠️ Quick Troubleshooting Guide

| Issue                         | Possible Cause                | How to Fix                                                                 |
|------------------------------|-----------------------------|--------------------------------------------------------------------------|
| **Camera Not Available**     | Connection or permission     | Replug webcam and allow camera access for `localhost`                    |
| **No dishes recognized**     | Missing/poor reference photo | Upload clearer top-down images and ensure **Ready** status               |
| **Could not reach database** | PostgreSQL service stopped   | Restart PostgreSQL via Windows Services                                  |
| **First scan is very slow**  | Model warm-up                | Wait 30–60s after startup; keep server running                           |
| **Wrong item detected**      | Poor reference image         | Re-upload a clearer, properly aligned dish image                         |

---

## 💾 Daily Maintenance

- [ ] Run database backup:
  ```bash
  pg_dump
  ```

- [ ] Copy reference images directory:
  ```
  website/data/menu-images/
  ```
  to an external USB drive

---