# Tecdia Tray Track: Official Deployment & Operations Guide

This procedural guide is designed for canteen administrators and management staff. Please follow these numbered steps sequentially to ensure the Tray Track kiosk is correctly installed, configured, and ready for daily customer service.

PDF: https://drive.google.com/file/d/1mB_ythpSmMgIi8EY6-Q5ihgoEq5du5pI/view?usp=sharing

---

## Phase 1: Pre-Deployment Prerequisites
*Complete these steps before attempting to install or run the software.*

### 1. Verify Hardware Readiness
* **Computer Terminal:** Ensure the system is running Windows 10 or 11 with at least 8 GB of RAM (16 GB is highly recommended for smooth AI performance).
* **Storage Space:** Confirm there is a minimum of 2 GB of free disk space available for the application and the local AI memory cache.
* **Camera Setup:** Ensure a standard USB webcam is securely mounted directly above the tray scanning area, pointing straight down.

### 2. Set Security Credentials
* **Admin PIN:** Decide on a secret 6-digit number. You will use this to log into the administrative dashboard.
* **Cashier PIN:** Decide on a separate 6-digit number. Cashiers will use this to authorize manual billing overrides at the kiosk if an error occurs.

### 3. Confirm Required Software Installations
*(Note: If you are unsure how to check these, ask your IT support staff to verify.)*
* **Node.js:** Version 20 LTS must be installed.
* **PostgreSQL:** Version 15 or higher must be installed and running as a background Windows service.
* **Python:** Must be installed (if using the YOLO localization feature) with the following specific packages: `ultralytics`, `flask`, and `opencv-python-headless`.

---

## Phase 2: First-Time System Setup
*Complete these steps during the initial installation of the kiosk.*

### 1. Verify the Database Connection
* Check your PostgreSQL software to confirm that a database named `tecdia_tray_track` has been successfully created.
* Confirm that all setup scripts located in your installation folders (`db/schema.sql` and `db/migrations/`) have been executed by your technical team.

### 2. Configure System Settings
* Locate the file named `.env.local` in your main software folder and open it with a standard text editor (like Notepad).
* Ensure your database login credentials (host, port, user, password) are correctly entered.
* Enter your chosen 6-digit `ADMIN_PIN` and `CASHIER_PIN` into their respective lines.
* Ensure the line reading `ML_INFERENCE_MODE` is strictly set to `clip` (do not use `simulate`).
* Save and close the file.

### 3. Initialize the AI Model
* Open your computer's Command Prompt (Terminal).
* Type exactly: `npm run ml:setup` and press **Enter**.
* Open your web browser and go to: `http://localhost:3000/api/ml/status`
* Look at the text on the screen. It should say `"clipEnabled": true` and `"inferenceMode": "clip"`.

### 4. Start the YOLO Detection Server (If Applicable)
* Open a new Command Prompt window.
* Type exactly: `python scripts/yolo-detect-server.py` and press **Enter**.
* Open your web browser and go to: `http://127.0.0.1:5001/detect`. If the page loads without an error message, it is running correctly.

### 5. Configure Automatic Startup
* Use the "Windows Task Scheduler" application to set up the software to run automatically whenever the computer is turned on. You will need to schedule `npm run start` and your Python server (if active).

---

## Phase 3: Daily Morning Routine
*Canteen managers must complete these steps every morning before the cafeteria opens.*

### 1. Log into the Admin Dashboard
* Open your web browser and navigate to: `http://localhost:3000/admin/login`
* Enter your 6-digit Admin PIN to access the system.

### 2. Update the Daily Menu
* Click on the **Menu** tab inside the dashboard.
* Turn on the **"Available today"** switch for every dish you are serving today.
* Double-check that all prices are accurate.
* Configure specific daily options, such as Rice portion sizes (Big/Small) and Sebaw availability.

### 3. Calibrate the AI Vision System (Critical Step)
* Using the dashboard, upload a clear, top-down photograph for every active dish on today's menu.
* Wait 30 to 60 seconds for the AI to process the images.
* Look for the **"Vision = Ready"** indicator to turn green.
* Go to `http://localhost:3000/api/ml/status` to verify that the system has successfully registered an image for every dish available today.

### 4. Conduct a Full System Test
Open a new browser tab to `http://localhost:3000/customer` and act as a customer to test the following:
* **ID Scanner Test:** Scan a test ID card or log in with an email. Ensure the correct employee profile and account balance appear.
* **Tray Scan Test:** Place a test tray under the camera and click **Scan Tray**. Ensure the camera feed appears, the scan completes smoothly, and the system correctly identifies the food and calculates the price.
* **Cashier Override Test:** Click on **Manual billing** and enter your Cashier PIN. Ensure the system unlocks and allows you to adjust the bill manually.
* **Checkout Test:** Select a payment method and finalize the transaction. Ensure the screen resets properly for the next customer.

---

## End-of-Day Maintenance
*Complete these two steps at closing to secure your data.*

### 1. Backup the Database
* Open your Command Prompt and run the `pg_dump` command (as configured by your IT team) to save today's transaction data.

### 2. Save Reference Images
* Navigate to the `website/data/menu-images/` folder on your computer.
* Copy this entire folder onto a secure external USB drive to ensure your AI training photos are not lost.

---

## Quick Troubleshooting Reference

| Common Issue | Likely Cause | Required Action |
| :--- | :--- | :--- |
| **Camera Feed is Blank** | Disconnected wire or missing permissions. | Unplug and securely replug the webcam. Ensure your web browser has been granted permission to access the camera. |
| **Food is Not Recognized** | The reference photo is poor or missing. | Take a new, clear, directly top-down photo of the dish and upload it via the Admin Dashboard. Wait for the green "Ready" status. |
| **"Could not reach database"** | The background data service has stopped. | Open the "Windows Services" app, locate PostgreSQL, right-click, and select "Restart". |
| **The first scan takes too long** | The AI model is "warming up". | This is normal. Wait 30–60 seconds after turning the system on before processing the first customer. |
| **Wrong food item charged** | The AI is confused by a bad reference image. | Delete the current reference photo for that dish and upload a clearer, properly aligned image. |