from ultralytics import YOLO
import cv2

model = YOLO(r"C:\Users\nomaa\runs\detect\models\detection\cafeteria_detector-2\weights\best.pt")

results = model.predict(
    source=r"data\raw\tarys",
    conf=0.4,
    save=True,
    show=False
)

print("Detection completed.")