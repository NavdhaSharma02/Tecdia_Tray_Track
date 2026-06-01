# Tecdia Tray Track

Cafeteria kiosk: employee login → USB camera tray scan → bill → payment.
Admin manages today's menu and reference photos for on-device dish recognition.

## Documentation

| Category | File | Description |
|----------|------|-------------|
| **Start Here** (operator) | [docs/OPERATOR_MANUAL.md](docs/OPERATOR_MANUAL.md) | Hardware setup, staff operations, troubleshooting |
| **Start Here** (deployer) | [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md) | Deployment guide: setup, env, daily workflow |
| Architecture | [docs/REFERENCE.md](docs/REFERENCE.md) | System overview, data flow, architectural decisions |
| | [docs/CODE_MAP.md](docs/CODE_MAP.md) | Feature-flow navigation — locate files by what they do |
| | [docs/DIRECTORY_STRUCTURE.md](docs/DIRECTORY_STRUCTURE.md) | Full project tree with annotations |
| | [docs/CONFIGURATION.md](docs/CONFIGURATION.md) | All environment variables, defaults, source files |
| | [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md) | Security, offline, ML, API, and deployment gaps |
| | [docs/FUTURE_IMPROVEMENTS.md](docs/FUTURE_IMPROVEMENTS.md) | Planned features, UX enhancements, technical debt |
| Database | [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | Tables, columns, indexes, foreign keys, migrations |
| API | [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | All 40 endpoints with request/response shapes |
| ML / Vision | [docs/VISION_ML_PIPELINE.md](docs/VISION_ML_PIPELINE.md) | YOLO detection + CLIP matching pipeline, failure modes |
| | [docs/PYTHON_ML_SCRIPTS.md](docs/PYTHON_ML_SCRIPTS.md) | Python scripts reference (server + training) |
| | [docs/PYTHON_DEV_GUIDE.md](docs/PYTHON_DEV_GUIDE.md) | Python environment setup and training workflow |

## Quick Commands

```powershell
cd website
Copy-Item .env.example .env.local
# Apply db/schema.sql + db/migrations/* (see docs/IMPLEMENTATION.md)
npm install
npm run ml:setup
npm run dev
```

- Kiosk: http://localhost:3000/customer
- Admin: http://localhost:3000/admin/login
