from pathlib import Path

from ultralytics import YOLO
import cv2

_REPO_ROOT = Path(__file__).resolve().parents[2]
model = YOLO(_REPO_ROOT / "Dish Localization" / "best.pt")

results = model.predict(
    source=r"data\raw\tarys",
    conf=0.4,
    save=True,
    show=False
)

print("Detection completed.")