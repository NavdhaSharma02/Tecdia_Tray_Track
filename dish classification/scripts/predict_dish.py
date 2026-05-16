import json
import cv2
import torch
import open_clip
import numpy as np
from PIL import Image
from ultralytics import YOLO
from sklearn.metrics.pairwise import cosine_similarity

from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[2]
detector = YOLO(_REPO_ROOT / "Dish Localization" / "best.pt")

device = "cpu"

model, _, preprocess = open_clip.create_model_and_transforms(
    "ViT-B-32",
    pretrained="laion2b_s34b_b79k"
)

model.eval()

embeddings = np.load(
    "data/processed/embeddings/dish_embeddings.npy"
)

with open(
    "data/processed/embeddings/dish_labels.json",
    "r"
) as f:
    labels = json.load(f)

with open(
    "data/today_menu.json",
    "r"
) as f:
    today_menu = json.load(f)

available_dishes = today_menu["available_dishes"]

image_path = (
    r"D:\tecdia_final\data\raw\tarys\1EE9AE85-EF88-4AE7-BDEF-950B51D6F1F5.jpg"
)

image = cv2.imread(image_path)

results = detector.predict(
    image,
    conf=0.4
)

UNKNOWN_THRESHOLD = 0.65
MAX_SCORE_GAP = 0.12

for result in results:

    boxes = result.boxes

    for box in boxes:

        cls = int(box.cls[0])

        class_name = detector.names[cls]

        if class_name in ("rice_big", "rice_small"):
            print(f"\nRICE: {class_name}")
            continue

        if class_name != "food":
            continue

        x1, y1, x2, y2 = map(int, box.xyxy[0])

        crop = image[y1:y2, x1:x2]

        crop_pil = Image.fromarray(
            cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
        )

        input_image = preprocess(crop_pil).unsqueeze(0)

        with torch.no_grad():
            features = model.encode_image(input_image)

        features /= features.norm(dim=-1, keepdim=True)

        features_np = features.cpu().numpy()

        similarities = cosine_similarity(
            features_np,
            embeddings
        )[0]

        top_k = similarities.argsort()[-5:][::-1]

        print("\nTOP PREDICTIONS:")

        filtered_predictions = []

        for idx in top_k:

            dish_name = labels[idx]
            score = similarities[idx]

            print(f"{dish_name}: {score:.4f}")

            if dish_name in available_dishes:
                filtered_predictions.append(
                    (dish_name, score)
                )

        top_prediction_idx = top_k[0]

        top_prediction_name = labels[top_prediction_idx]
        top_prediction_score = similarities[top_prediction_idx]

        if top_prediction_name in available_dishes:

            print(f"\nFINAL DISH: {top_prediction_name}")
            print(f"CONFIDENCE: {top_prediction_score:.4f}")

        elif filtered_predictions:

            best_menu_prediction = max(
                filtered_predictions,
                key=lambda x: x[1]
            )

            menu_name = best_menu_prediction[0]
            menu_score = best_menu_prediction[1]

            score_gap = (
                top_prediction_score - menu_score
            )

            print(
                f"\nTop prediction not in today's menu."
            )

            print(
                f"Best menu match: {menu_name}"
            )

            print(
                f"Score gap: {score_gap:.4f}"
            )

            if (
                menu_score > UNKNOWN_THRESHOLD
                and score_gap < MAX_SCORE_GAP
            ):

                print(f"\nFINAL DISH: {menu_name}")
                print(f"CONFIDENCE: {menu_score:.4f}")

            else:

                print("\nFINAL DISH: UNKNOWN")
                print("Manual verification required.")

        else:

            print("\nFINAL DISH: UNKNOWN")
            print("No matching dish in today's menu.")