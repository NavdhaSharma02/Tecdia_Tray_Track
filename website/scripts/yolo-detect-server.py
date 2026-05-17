"""
Local YOLO dish-localization detector for tray scan (required in production).

  pip install ultralytics flask opencv-python-headless waitress
  python scripts/yolo-detect-server.py

Defaults to ../Dish Localization/best.pt (override with ML_YOLO_MODEL_PATH).
Set ML_YOLO_SERVICE_URL=http://127.0.0.1:5001/detect in website/.env.

Node calls POST http://127.0.0.1:5001/detect with multipart field "image".
GET  http://127.0.0.1:5001/health for readiness checks.
"""

from __future__ import annotations

import os
import sys
from io import BytesIO
from pathlib import Path

import cv2
import numpy as np
from flask import Flask, jsonify, request

app = Flask(__name__)

_REPO_ROOT = Path(__file__).resolve().parents[2]
_DEFAULT_MODEL = _REPO_ROOT / "Dish Localization" / "best.pt"

MODEL_PATH = Path(os.environ.get("ML_YOLO_MODEL_PATH", str(_DEFAULT_MODEL)))
CONF = float(os.environ.get("ML_YOLO_CONF", "0.4"))

_DEFAULT_CLASSES = "drink,food,meatless soup,rice_big,rice_small,soup"
EMIT_CLASSES = frozenset(
    c.strip()
    for c in os.environ.get("ML_YOLO_EMIT_CLASSES", _DEFAULT_CLASSES).split(",")
    if c.strip()
)

_detector = None
_load_error: str | None = None


def _load_detector():
    global _detector, _load_error
    if _detector is not None:
        return _detector
    if _load_error is not None:
        raise RuntimeError(_load_error)

    if not MODEL_PATH.is_file():
        _load_error = f"Model not found: {MODEL_PATH}"
        raise RuntimeError(_load_error)

    try:
        from ultralytics import YOLO

        _detector = YOLO(str(MODEL_PATH))
        return _detector
    except Exception as exc:  # noqa: BLE001
        _load_error = str(exc)
        raise RuntimeError(_load_error) from exc


@app.get("/health")
def health():
    try:
        _load_detector()
        return jsonify(
            {
                "ok": True,
                "model": str(MODEL_PATH),
                "classes": sorted(EMIT_CLASSES),
            }
        )
    except Exception as exc:  # noqa: BLE001
        return jsonify({"ok": False, "error": str(exc), "model": str(MODEL_PATH)}), 503


@app.post("/detect")
def detect():
    try:
        detector = _load_detector()
    except RuntimeError as exc:
        return jsonify({"ok": False, "error": str(exc)}), 503

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


def _serve(host: str, port: int) -> None:
    try:
        from waitress import serve as waitress_serve

        print(f"YOLO detect server (waitress) on http://{host}:{port}")
        waitress_serve(app, host=host, port=port, threads=4)
    except ImportError:
        print(
            f"YOLO detect server (flask) on http://{host}:{port}  "
            "(pip install waitress for a more stable server)"
        )
        app.run(host=host, port=port, threaded=True)


if __name__ == "__main__":
    import threading

    host = os.environ.get("ML_YOLO_HOST", "127.0.0.1")
    port = int(os.environ.get("ML_YOLO_PORT", "5001"))
    print(
        f"model={MODEL_PATH}  classes={sorted(EMIT_CLASSES)}  "
        f"health=http://{host}:{port}/health  detect=http://{host}:{port}/detect",
        flush=True,
    )

    def _warm() -> None:
        try:
            _load_detector()
            print("Model loaded.", flush=True)
        except RuntimeError as exc:
            print(f"WARNING: model not ready: {exc}", file=sys.stderr, flush=True)

    threading.Thread(target=_warm, daemon=True, name="yolo-warm").start()
    _serve(host, port)
