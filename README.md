# Tecdia_Tray_Track

### Repo Layout

```text
Tecida_Tray_Track/
├─ .git/
├─ .gitignore
├─ README.md
├─ package-lock.json
├─ Computer Vision/
│  └─ makingBoxesExploration.ipynb
└─ tecdia-tray-track-temp/
   ├─ .env.example
   ├─ .env.local
   ├─ .gitignore
   ├─ README.md
   ├─ package.json
   ├─ package-lock.json
   ├─ next.config.mjs
   ├─ postcss.config.mjs
   ├─ eslint.config.mjs
   ├─ jsconfig.json
   ├─ tsconfig.json
   ├─ tsconfig.tsbuildinfo
   ├─ next-env.d.ts
   ├─ public/
   │  └─ bg2.jpg
   └─ src/
      ├─ middleware.ts
      ├─ app/
      │  ├─ globals.css
      │  ├─ layout.tsx
      │  ├─ loading.tsx
      │  ├─ error.tsx
      │  ├─ not-found.tsx
      │  ├─ page.tsx
      │  ├─ api/
      │  │  ├─ route.ts
      │  │  └─ health/
      │  │     └─ route.ts
      │  ├─ customer/
      │  │  ├─ layout.tsx
      │  │  └─ page.tsx
      │  └─ admin/
      │     ├─ layout.tsx
      │     ├─ page.tsx
      │     ├─ login/
      │     │  └─ page.tsx
      │     ├─ analytics/
      │     │  └─ page.tsx
      │     ├─ menu/
      │     │  └─ page.tsx
      │     ├─ transactions/
      │     │  └─ page.tsx
      │     └─ users/
      │        └─ page.tsx
      ├─ components/
      │  ├─ admin/
      │  │  ├─ MenuEditor.tsx
      │  │  ├─ MenuItemForm.tsx
      │  │  ├─ StatsGrid.tsx
      │  │  ├─ TransactionTable.tsx
      │  │  └─ UserTable.tsx
      │  ├─ camera/
      │  │  ├─ CameraPreview.tsx
      │  │  └─ ScanOverlay.tsx
      │  ├─ customer/
      │  │  ├─ DoneScreen.tsx
      │  │  ├─ EmployeeProfile.tsx
      │  │  ├─ FoodResults.tsx
      │  │  ├─ IdleScreen.tsx
      │  │  ├─ PaymentScreen.tsx
      │  │  └─ TrayScanView.tsx
      │  ├─ layout/
      │  │  ├─ AdminSidebar.tsx
      │  │  ├─ FlowStepper.tsx
      │  │  ├─ Header.tsx
      │  │  └─ TecdiaLogo.tsx
      │  └─ ui/
      │     ├─ Badge.tsx
      │     ├─ Button.tsx
      │     ├─ Card.tsx
      │     ├─ Input.tsx
      │     ├─ Modal.tsx
      │     ├─ Spinner.tsx
      │     └─ StatCard.tsx
      ├─ hooks/
      │  ├─ useCamera.ts
      │  └─ useCustomerFlow.tsx
      ├─ lib/
      │  ├─ constants.ts
      │  ├─ mock-data.ts
      │  └─ utils.ts
      ├─ services/
      │  └─ api.ts
      └─ types/
         └─ index.ts
