import json
import cv2
import torch
import open_clip
import numpy as np
from PIL import Image
from ultralytics import YOLO
from sklearn.metrics.pairwise import cosine_similarity

# -----------------------------
# LOAD YOLO
# -----------------------------

detector = YOLO(r"C:\Users\nomaa\runs\detect\models\detection\cafeteria_detector-2\weights\best.pt")

# -----------------------------
# LOAD CLIP
# -----------------------------

device = "cpu"

model, _, preprocess = open_clip.create_model_and_transforms(
    "ViT-B-32",
    pretrained="laion2b_s34b_b79k"
)

model.eval()

# -----------------------------
# LOAD EMBEDDINGS
# -----------------------------

embeddings = np.load("data/processed/embeddings/dish_embeddings.npy")

with open("data/processed/embeddings/dish_labels.json", "r") as f:
    labels = json.load(f)

# -----------------------------
# LOAD TODAY MENU
# -----------------------------

with open("data/today_menu.json", "r") as f:
    today_menu = json.load(f)

available_dishes = today_menu["available_dishes"]

# -----------------------------
# LOAD TEST IMAGE
# -----------------------------

image_path = r"D:\tecdia_final\data\raw\tarys\1EE9AE85-EF88-4AE7-BDEF-950B51D6F1F5.jpg"

image = cv2.imread(image_path)

# -----------------------------
# RUN DETECTION
# -----------------------------

results = detector.predict(image, conf=0.4)

# -----------------------------
# PROCESS DETECTIONS
# -----------------------------

for result in results:

    boxes = result.boxes

    for box in boxes:

        cls = int(box.cls[0])

        class_name = detector.names[cls]

        # ONLY classify FOOD
        if class_name != "food":
            continue

        x1, y1, x2, y2 = map(int, box.xyxy[0])

        crop = image[y1:y2, x1:x2]

        # Convert crop to PIL
        crop_pil = Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB))

        # Preprocess
        input_image = preprocess(crop_pil).unsqueeze(0)

        # Get embedding
        with torch.no_grad():
            features = model.encode_image(input_image)

        features /= features.norm(dim=-1, keepdim=True)

        features_np = features.cpu().numpy()

        # Similarity
        similarities = cosine_similarity(features_np, embeddings)[0]

        # Top K
        top_k = similarities.argsort()[-5:][::-1]

        print("\nTOP PREDICTIONS:")

        filtered_predictions = []

        for idx in top_k:

            dish_name = labels[idx]
            score = similarities[idx]

            print(f"{dish_name}: {score:.4f}")

            # FILTER USING TODAY MENU
            if dish_name in available_dishes:
                filtered_predictions.append((dish_name, score))

        # FINAL SELECTION
        if filtered_predictions:

            final_prediction = max(filtered_predictions, key=lambda x: x[1])

            print(f"\nFINAL DISH: {final_prediction[0]}")
            print(f"CONFIDENCE: {final_prediction[1]:.4f}")

        else:
            print("\nNo matching dish in today's menu.")