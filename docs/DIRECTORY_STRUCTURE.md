# Directory Structure — Tecdia Tray Track

```
project root/
│
├── website/                          ← Next.js app (kiosk + admin)
│   ├── src/
│   │   ├── app/                      ← App Router
│   │   │   ├── page.tsx              ← Marketing homepage
│   │   │   ├── layout.tsx            ← Root layout
│   │   │   ├── customer/             ← Kiosk SPA
│   │   │   ├── admin/                ← 7 admin sub-pages
│   │   │   └── api/                  ← 38 API route files
│   │   ├── components/
│   │   │   ├── admin/                ← 9 components
│   │   │   ├── camera/               ← ScanOverlay
│   │   │   ├── customer/             ← 10 components
│   │   │   ├── layout/               ← 7 components
│   │   │   ├── marketing/            ← MarketingTrayShowcase
│   │   │   └── ui/                   ← 9 atoms (Button, Input, Card, etc.)
│   │   ├── hooks/                    ← useCustomerFlow, useCamera, useEmployeeIdScanner
│   │   ├── lib/                      ← 32 modules (business + ML logic)
│   │   ├── services/                 ← api.ts (frontend API client)
│   │   └── types/                    ← index.ts (shared TypeScript types)
│   ├── scripts/                      ← Node.js + Python utilities
│   │   └── yolo-detect-server.py     ← YOLO Flask detection server
│   ├── db/
│   │   ├── schema.sql
│   │   ├── migrations/               ← 9 incremental SQL migrations
│   │   └── seed_today_menu_example.sql
│   ├── data/                         ← runtime (gitignored)
│   │   ├── ml-cache/                 ← CLIP model weights
│   │   └── menu-images/              ← Reference photos
│   ├── .env.example
│   ├── package.json
│   └── ...
│
├── Dish Localization/                ← YOLO model
│   └── best.pt                       ← Trained YOLOv8 weights
│
├── dish classification/              ← Python training (optional)
│   ├── scripts/
│   │   ├── train_detector.py         ← YOLOv8 trainer
│   │   ├── build_embeddings.py       ← CLIP embedding builder
│   │   ├── predict_dish.py           ← End-to-end detection test
│   │   └── test_detetctor.py         ← YOLO smoke test
│   ├── data/
│   │   ├── data.yaml                 ← YOLO dataset config
│   │   ├── today_menu.json           ← Test menu for predict_dish.py
│   │   ├── dish_mapping.csv          ← Dish name mappings
│   │   ├── raw/
│   │   │   ├── trays/                ← Tray images for YOLO training/eval
│   │   │   └── menu_items/{dish}/    ← Per-dish reference images for CLIP
│   │   ├── processed/embeddings/
│   │   │   ├── dish_embeddings.npy   ← CLIP embedding matrix (N×512)
│   │   │   └── dish_labels.json      ← Labels matching .npy rows
│   │   └── detection_dataset/
│   │       ├── train/images/         ← YOLO training images
│   │       ├── train/labels/         ← YOLO training labels
│   │       ├── val/images/           ← YOLO validation images
│   │       └── val/labels/           ← YOLO validation labels
│   ├── embeddings/                   ← Output: Computer Vision folder
│   │   ├── image_embeddings.npy
│   │   ├── image_metadata.json
│   │   ├── text_embeddings.npy
│   │   └── label_map.json
│   └── yolo/
│       └── best.pt
│
├── New_Trained_File/                 ← Legacy YOLO training output
│
└── docs/                             ← Documentation
    ├── ARCHITECTURE.md               ← (extracted into REFERENCE.md)
    ├── IMPLEMENTATION.md             ← Deployment guide
    ├── REFERENCE.md                  ← Master reference
    ├── API_REFERENCE.md              ← Full endpoint specs
    ├── DATABASE_SCHEMA.md            ← Column-level schema, indexes, FKs
    ├── VISION_ML_PIPELINE.md         ← ML pipeline, thresholds, failure modes
    ├── PYTHON_ML_SCRIPTS.md          ← Python scripts reference
    ├── PYTHON_DEV_GUIDE.md           ← Python dev setup, training workflow
    ├── CONFIGURATION.md              ← All env vars, defaults, source files
    ├── KNOWN_LIMITATIONS.md          ← Security, offline, ML, API limitations
    ├── OPERATOR_MANUAL.md            ← Operator-facing setup, operations, troubleshooting
    ├── CODE_MAP.md                   ← Feature-flow navigation (where each file lives)
    ├── FUTURE_IMPROVEMENTS.md        ← Planned features, UX enhancements, technical debt
    └── DIRECTORY_STRUCTURE.md        ← This document
```

**Note:** `New_Trained_File/` and `dish classification/` are optional — not required to run the kiosk. Only `website/`, `Dish Localization/best.pt`, and the database are needed for production.

---

## Key

| Notation | Meaning |
|----------|---------|
| `directory/` | Directory |
| `file.ext` | File |
| ← | Description |
| `{dish}` | Per-dish subdirectory (variable name) |
