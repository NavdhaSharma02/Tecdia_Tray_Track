"""
Local YOLO food-region detector for the kiosk (optional).

  pip install ultralytics flask opencv-python-headless
  set ML_YOLO_MODEL_PATH=C:\path\to\best.pt
  python scripts/yolo-detect-server.py

Node calls POST http://127.0.0.1:5001/detect with multipart field "image".
"""

from __future__ import annotations

import os
from io import BytesIO

import cv2
import numpy as np
from flask import Flask, jsonify, request
from ultralytics import YOLO

app = Flask(__name__)

MODEL_PATH = os.environ.get(
    "ML_YOLO_MODEL_PATH",
    r"C:\Users\nomaa\runs\detect\models\detection\cafeteria_detector-2\weights\best.pt",
)
CONF = float(os.environ.get("ML_YOLO_CONF", "0.4"))
FOOD_CLASS = os.environ.get("ML_YOLO_FOOD_CLASS", "food")

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
            if class_name != FOOD_CLASS:
                continue

            x1, y1, x2, y2 = box.xyxy[0].tolist()
            boxes.append(
                {
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
    print(f"YOLO detect server on http://{host}:{port}/detect  model={MODEL_PATH}")
    app.run(host=host, port=port, threaded=True)
