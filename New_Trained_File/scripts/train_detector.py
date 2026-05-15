from ultralytics import YOLO

model = YOLO("yolov8n.pt")

model.train(
    data="data/data.yaml",
    epochs=100,
    imgsz=640,
    batch=4,
    patience=20,
    device="cpu",
    workers=2,

    hsv_h=0.015,
    hsv_s=0.7,
    hsv_v=0.4,

    degrees=10,
    translate=0.1,
    scale=0.3,

    fliplr=0.5,
    mosaic=1.0,

    optimizer="AdamW",
    lr0=0.0005,

    pretrained=True,

    project="models/detection",
    name="cafeteria_detector"
)