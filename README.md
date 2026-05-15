# Tecida Tray Track

Cafeteria kiosk: employee login → USB camera tray scan → bill → payment. Admin manages today's menu and **reference photos** for on-device dish recognition.

## Implement it

**[docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md)** — setup, env, daily workflow, checklist (start here).

## Repo layout

| Path | Role |
|------|------|
| `tecdia-tray-track-temp/` | Next.js app + CLIP inference |
| `docs/IMPLEMENTATION.md` | Deployment guide |
| `New_Trained_File/` | Optional Python YOLO training (not required for kiosk) |

## Quick commands

```powershell
cd tecdia-tray-track-temp
Copy-Item .env.example .env.local
# Apply db/schema.sql + db/migrations/* (see IMPLEMENTATION.md)
npm install
npm run ml:setup
npm run dev
```

- Kiosk: http://localhost:3000/customer  
- Admin: http://localhost:3000/admin/login
