# Tecdia Tray Track (Next.js)

Run from this folder. Full deployment steps: **[../docs/IMPLEMENTATION.md](../docs/IMPLEMENTATION.md)**.

```powershell
Copy-Item .env.example .env.local
npm install
npm run ml:setup
npm run dev
```

| URL | Use |
|-----|-----|
| `/customer` | Kiosk |
| `/admin/login` | Staff |
| `/api/ml/status` | Vision health check |
