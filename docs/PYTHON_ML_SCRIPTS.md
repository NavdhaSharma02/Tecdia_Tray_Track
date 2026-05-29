# Python ML Scripts — Tecdia Tray Track

## 1. Script Inventory

| Script | Location | Category | Purpose |
|--------|----------|----------|---------|
| `yolo-detect-server.py` | `website/scripts/` | Production | YOLO Flask detection server |
| `train_detector.py` | `dish classification/scripts/` | Training | YOLOv8 training |
| `build_embeddings.py` | `dish classification/scripts/` | Training | Build CLIP embedding bank |
| `predict_dish.py` | `dish classification/scripts/` | Training | End-to-end detection test |
| `test_detetctor.py` | `dish classification/scripts/` | Training | Quick YOLO inference smoke test |

---

## 2. Production Script

### `yolo-detect-server.py`

**Path:** `C:\Users\haswa\OneDrive\Documents\GitHub\Tecdia_Tray_Track\website\scripts\yolo-detect-server.py`

Flask server that runs the YOLOv8 dish-localization model. Receives tray images from the Node.js kiosk and returns normalized bounding boxes.

**Run:**
```
python scripts/yolo-detect-server.py
```

**Dependencies:** `ultralytics`, `flask`, `waitress`, `opencv-python-headless`, `numpy`

**Endpoints:**

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/health` | Readiness check (loads model, returns class list) |
| POST | `/detect` | Multipart `image` field → JSON `{ ok, boxes[] }` |

**Request:**
```
POST /detect
Content-Type: multipart/form-data
  image: <JPEG file>
```

**Response:**
```json
{
  "ok": true,
  "boxes": [
    { "class": "food", "x1": 0.12, "y1": 0.34, "x2": 0.45, "y2": 0.67, "confidence": 0.87 }
  ]
}
```

Each box is normalized 0–1 relative to image dimensions.

**Env vars:** see [CONFIGURATION.md](./CONFIGURATION.md) §5 (YOLO Python vars).

**Model loading:**
- Lazy singleton — loaded on first `/health` or `/detect` request
- Model path is resolved relative to the repo root
- If model file is missing → endpoint returns HTTP 503 with error message

**Server:**
- Uses `waitress` (production WSGI) when available
- Falls back to Flask's built-in dev server with threading
- Model warming runs in a background daemon thread at startup

---

## 3. Training Scripts

### `train_detector.py`

**Path:** `C:\Users\haswa\OneDrive\Documents\GitHub\Tecdia_Tray_Track\dish classification\scripts\train_detector.py`

Trains a YOLOv8n model on a custom cafeteria dataset.

**Usage:** `python dish classification/scripts/train_detector.py`

**Training configuration:**

| Parameter | Value |
|-----------|-------|
| Base model | `yolov8n.pt` (pretrained) |
| Data config | `data/data.yaml` |
| Epochs | 100 |
| Image size | 640 |
| Batch size | 4 |
| Patience | 20 (early stopping) |
| Device | `cpu` |
| Workers | 2 |
| Optimizer | AdamW (lr=0.0005) |

**Augmentation:**
- HSV: hue ±1.5%, sat ±70%, val ±40%
- Geometric: rotation ±10°, translation ±10%, scale ±30%
- Flip: horizontal 50%
- Mosaic: 100%

**Output:** `models/detection/cafeteria_detector/`

---

### `build_embeddings.py`

**Path:** `C:\Users\haswa\OneDrive\Documents\GitHub\Tecdia_Tray_Track\dish classification\scripts\build_embeddings.py`

Computes CLIP embeddings for menu item reference images using `open-clip-torch`. Generates `.npy` + JSON files consumed by the Computer Vision folder sync pipeline.

**Usage:** `python dish classification/scripts/build_embeddings.py`

**CLIP model:** `ViT-B-32` with `laion2b_s34b_b79k` pretrained weights (CPU)

**Pipeline:**
1. Iterates `data/raw/menu_items/{dish_name}/*.jpg`
2. Preprocesses each image via CLIP transforms
3. Encodes with CLIP, L2-normalizes
4. Saves `data/processed/embeddings/dish_embeddings.npy` + `dish_labels.json`

**Output files:**

| File | Format | Contents |
|------|--------|----------|
| `dish_embeddings.npy` | NumPy array (.npy) | Float32 matrix, shape `(N, 512)` |
| `dish_labels.json` | JSON array | `["dish_name_1", "dish_name_2", ...]` |

---

### `predict_dish.py`

**Path:** `C:\Users\haswa\OneDrive\Documents\GitHub\Tecdia_Tray_Track\dish classification\scripts\predict_dish.py`

End-to-end test script: YOLO detects regions → CLIP encodes crops → cosine similarity against precomputed embedding bank → best-match classification with threshold fallback.

**Usage:** `python dish classification/scripts/predict_dish.py`

**Pipeline:**
1. YOLO detects regions in a hardcoded test image
2. Rice classes → print and skip
3. Food crops → CLIP encode → cosine similarity vs `dish_embeddings.npy`
4. Top-5 predictions printed
5. Filters to today's menu items (loaded from `data/today_menu.json`)
6. Applies threshold algorithm:

```
If top prediction is on today's menu:
  → use it directly
Else:
  If best menu match score > 0.65 AND score gap < 0.12:
    → use best menu match
  Else:
    → UNKNOWN (manual verification)
```

**Note:** This replicates the old similarity-threshold algorithm that the production Node.js pipeline has since replaced with best-match-only (no threshold).

---

### `test_detetctor.py`

**Path:** `C:\Users\haswa\OneDrive\Documents\GitHub\Tecdia_Tray_Track\dish classification\scripts\test_detetctor.py`

Quick smoke test for the YOLO detector. Runs inference on all images in `data/raw/tarys/` and saves annotated outputs.

**Usage:** `python dish classification/scripts/test_detetctor.py`

**Configuration:**
- Model: `Dish Localization/best.pt`
- Confidence: 0.4
- Output: Saved labeled images in YOLO's default predict output directory

---

## 4. Dependencies

| Script | Packages | Install Command |
|--------|----------|-----------------|
| `yolo-detect-server.py` | `ultralytics`, `flask`, `waitress`, `opencv-python-headless`, `numpy` | `pip install ultralytics flask opencv-python-headless waitress` |
| `train_detector.py` | `ultralytics` | Same as above |
| `build_embeddings.py` | `open-clip-torch`, `torch`, `PIL`, `numpy`, `tqdm` | `pip install open-clip-torch torch pillow numpy tqdm` |
| `predict_dish.py` | `ultralytics`, `open-clip-torch`, `torch`, `PIL`, `numpy`, `scikit-learn`, `opencv-python-headless` | `pip install ultralytics open-clip-torch torch pillow numpy scikit-learn opencv-python-headless` |
| `test_detetctor.py` | `ultralytics`, `opencv-python-headless` | `pip install ultralytics opencv-python-headless` |

Depending on the machine, you may also need `torch` for `ultralytics`.

---

## 5. Integration Points

| Script | Integrates With | Link |
|--------|-----------------|------|
| `yolo-detect-server.py` | Production Node.js tray scan pipeline | [VISION_ML_PIPELINE.md](./VISION_ML_PIPELINE.md) §2 |
| `build_embeddings.py` | Computer Vision folder sync → embedding bank | [VISION_ML_PIPELINE.md](./VISION_ML_PIPELINE.md) §4.5 |
| `predict_dish.py` | Training-only (standalone) | — |
| `train_detector.py` | Produces `best.pt` → YOLO server | — |
