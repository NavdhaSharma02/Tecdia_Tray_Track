# Python Development Guide — Tecdia Tray Track

How to set up a Python environment, prepare training data, train YOLO models, build CLIP embedding banks, and run end-to-end tests.

---

## 1. Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Python | 3.10+ | 3.12+ recommended |
| pip | Latest | `python -m pip install --upgrade pip` |
| Virtual env | — | `venv` (stdlib) or `conda` |

---

## 2. Environment Setup

### 2.1 Create a virtual environment

From the repo root:
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 2.2 Install dependencies

**YOLO production server only:**
```powershell
pip install ultralytics flask opencv-python-headless waitress
```

**Full training environment (all scripts):**
```powershell
pip install ultralytics open-clip-torch torch pillow numpy scikit-learn opencv-python-headless tqdm
```

On some machines `torch` is pulled by `ultralytics` automatically. If not, install separately:
```powershell
pip install torch --index-url https://download.pytorch.org/whl/cpu
```

### 2.3 Verify installation

```powershell
python -c "from ultralytics import YOLO; print('YOLO OK')"
python -c "import open_clip; print('open-clip OK')"
```

---

## 3. Data Preparation

### 3.1 Directory Structure

Training scripts expect data under `dish classification/`. See [DIRECTORY_STRUCTURE.md](./DIRECTORY_STRUCTURE.md) for the full `dish classification/` tree, including `scripts/`, `data/` (raw, processed, detection_dataset), `embeddings/`, and `yolo/`.

### 3.2 data.yaml

The dataset config at `dish classification/data/data.yaml`:

```yaml
path: .                            # relative root
train: ../train/images              # training images
val: ../val/images                  # validation images
names:
  0: drink
  1: food
  2: meatless soup
  3: rice_big
  4: rice_small
  5: soup
```

**Note:** The `train:` and `val:` paths are relative to the `data:` directory. Training images and YOLO-format `.txt` labels should be placed in `detection_dataset/train/` and `detection_dataset/val/`.

### 3.3 today_menu.json

Used by `predict_dish.py` to filter predictions to only dishes served today:

```json
{
  "date": "2026-05-15",
  "available_dishes": [
    "fried_chicken",
    "bangus_daing",
    "vegetable_guinamay"
  ]
}
```

---

## 4. Training Workflow

### 4.1 Train YOLO detector

```powershell
cd dish classification
python scripts/train_detector.py
```

This runs YOLOv8n training with the configuration in [`PYTHON_ML_SCRIPTS.md §3.1`](./PYTHON_ML_SCRIPTS.md#train_detectorpy). Output goes to `models/detection/cafeteria_detector/`.

**To deploy the trained model:**
1. Copy the best weights to `Dish Localization/best.pt`
2. Restart the YOLO Flask server (or let auto-restart on next scan)

### 4.2 Build CLIP embedding bank

```powershell
cd dish classification
python scripts/build_embeddings.py
```

This iterates `data/raw/menu_items/{dish_name}/*.jpg` and encodes each image through CLIP ViT-B/32. Outputs:
- `data/processed/embeddings/dish_embeddings.npy` — Float32 matrix (N × 512)
- `data/processed/embeddings/dish_labels.json` — Array of dish names

**To test the embeddings:**
```powershell
python scripts/predict_dish.py
```

This runs the full pipeline (YOLO → CLIP → cosine similarity → best-match) on a hardcoded test image.

### 4.3 Quick YOLO smoke test

```powershell
cd dish classification
python scripts/test_detetctor.py
```

Runs YOLO detection on all images in `data/raw/trays/` and saves annotated outputs.

---

## 5. Computer Vision Folder

The production kiosk auto-syncs embeddings from the **Computer Vision folder** into the PostgreSQL embedding bank on each scan. This folder defaults to `../Computer Vision` relative to the `website/` directory.

### 5.1 Folder contents

```
Computer Vision/
├── image_embeddings.npy     ← Float32 matrix (N × 512)
├── image_metadata.json      ← Array of { path, class_name, class_idx }
├── text_embeddings.npy      ← Optional; text-based CLIP embeddings
└── label_map.json           ← { class_name: class_idx }
```

### 5.2 Generating the folder

The `dish classification/embeddings/` directory already contains these files. After training, copy them to the expected location:

```powershell
Copy-Item -Recurse "dish classification/embeddings/*" "Computer Vision/"
```

Or use the admin API endpoint:
```
POST /api/admin/ml/import-vision
```

This triggers `syncComputerVisionFolder()` which:
1. Loads `.npy` files from the Computer Vision folder
2. Maps class names to menu items via `dish-name-match.ts`
3. Inserts new prototypes into `menu_item_embedding_bank`
4. Skips already-synced rows (via fingerprint)

### 5.3 Aliases

To map training class names to kiosk menu item names, place a `menu_aliases.json` file in the Computer Vision folder:

```json
{
  "fried_chicken": "chicken adobo",
  "veg_guinamay": "vegetable guisado"
}
```

---

## 6. Integration with Production Kiosk

```
Python training scripts               Kiosk production (Node.js)
─────────────────────                 ──────────────────────────
train_detector.py  ──→ best.pt ─────→ yolo-detect-server.py (Flask :5001)
                    (Dish Localization/)      ↓
build_embeddings.py ──→ .npy files ─────→ vision-bank-sync.ts
                    (Computer Vision/)         ↓
                                         menu_item_embedding_bank (PostgreSQL)
                                              ↓
predict_dish.py    (standalone test)    tray-inference.ts (CLIP match)
```

| Artifact | Produced By | Consumed By |
|----------|-------------|-------------|
| `Dish Localization/best.pt` | `train_detector.py` | `yolo-detect-server.py` (Flask) |
| `Computer Vision/image_embeddings.npy` | `build_embeddings.py` | `vision-bank-sync.ts` → embedding bank |
| `Computer Vision/image_metadata.json` | Manual/labeling | `computer-vision-bank.ts` |
| `Computer Vision/label_map.json` | Manual/labeling | `computer-vision-bank.ts` |
| `Computer Vision/menu_aliases.json` | Manual (optional) | `dish-name-match.ts` |

---

## 7. Related Documentation

| Document | What It Covers |
|----------|----------------|
| [`PYTHON_ML_SCRIPTS.md`](./PYTHON_ML_SCRIPTS.md) | Reference for each Python script (args, behavior, endpoints) |
| [`VISION_ML_PIPELINE.md`](./VISION_ML_PIPELINE.md) | Production kiosk ML pipeline (YOLO detection, CLIP matching, failure modes) |
| [`IMPLEMENTATION.md`](./IMPLEMENTATION.md) | Deployment guide for the Windows tablet kiosk |
