"""
Local YOLO dish-localization detector for tray scan (required in production).

  pip install ultralytics flask opencv-python-headless
  python scripts/yolo-detect-server.py

Defaults to ../Dish Localization/best.pt (override with ML_YOLO_MODEL_PATH).
Set ML_YOLO_SERVICE_URL=http://127.0.0.1:5001/detect in website/.env.

Node calls POST http://127.0.0.1:5001/detect with multipart field "image".
"""

from __future__ import annotations

import os
from io import BytesIO
from pathlib import Path

import cv2
import numpy as np
from flask import Flask, jsonify, request
from ultralytics import YOLO

app = Flask(__name__)

_REPO_ROOT = Path(__file__).resolve().parents[2]
_DEFAULT_MODEL = _REPO_ROOT / "Dish Localization" / "best.pt"

MODEL_PATH = os.environ.get("ML_YOLO_MODEL_PATH", str(_DEFAULT_MODEL))
CONF = float(os.environ.get("ML_YOLO_CONF", "0.4"))

# Classes returned to Node (comma-separated override). Drink is excluded by default.
_DEFAULT_CLASSES = "drink,food,meatless soup,rice_big,rice_small,soup"
EMIT_CLASSES = frozenset(
    c.strip()
    for c in os.environ.get("ML_YOLO_EMIT_CLASSES", _DEFAULT_CLASSES).split(",")
    if c.strip()
)

detector = YOLO(MODEL_PATH)


@app.post("/detect")
def detect():
    file = request.files.get("image")
    if not file:
        return jsonify({"ok": False, "error": "Missing image field."}), 400

    data = file.read()
    arr = np.frombuffer(data, dtype=np.uint8)
    image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if image is None:
        return jsonify({"ok": False, "error": "Invalid image."}), 400

    h, w = image.shape[:2]
    results = detector.predict(image, conf=CONF, verbose=False)
    boxes = []

    for result in results:
        for box in result.boxes:
            cls_id = int(box.cls[0])
            class_name = result.names.get(cls_id, "")
            if class_name not in EMIT_CLASSES:
                continue

            x1, y1, x2, y2 = box.xyxy[0].tolist()
            boxes.append(
                {
                    "class": class_name,
                    "x1": x1 / w,
                    "y1": y1 / h,
                    "x2": x2 / w,
                    "y2": y2 / h,
                    "confidence": float(box.conf[0]),
                }
            )

    return jsonify({"ok": True, "boxes": boxes})


if __name__ == "__main__":
    host = os.environ.get("ML_YOLO_HOST", "127.0.0.1")
    port = int(os.environ.get("ML_YOLO_PORT", "5001"))
    print(
        f"YOLO detect server on http://{host}:{port}/detect  "
        f"model={MODEL_PATH}  classes={sorted(EMIT_CLASSES)}"
    )
    app.run(host=host, port=port, threaded=True)
