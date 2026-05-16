import os
import json
import torch
import open_clip
import numpy as np
from PIL import Image
from tqdm import tqdm

# -----------------------------
# LOAD CLIP MODEL
# -----------------------------

device = "cpu"

model, _, preprocess = open_clip.create_model_and_transforms(
    "ViT-B-32",
    pretrained="laion2b_s34b_b79k"
)

tokenizer = open_clip.get_tokenizer("ViT-B-32")

model.eval()

# -----------------------------
# PATHS
# -----------------------------

DATASET_PATH = "data/raw/menu_items"
OUTPUT_FILE = "data/processed/embeddings/dish_embeddings.npy"
LABELS_FILE = "data/processed/embeddings/dish_labels.json"

# -----------------------------
# STORAGE
# -----------------------------

embeddings = []
labels = []

# -----------------------------
# LOOP THROUGH DISHES
# -----------------------------

for dish_name in tqdm(os.listdir(DATASET_PATH)):

    dish_folder = os.path.join(DATASET_PATH, dish_name)

    if not os.path.isdir(dish_folder):
        continue

    for image_name in os.listdir(dish_folder):

        image_path = os.path.join(dish_folder, image_name)

        try:
            image = preprocess(Image.open(image_path)).unsqueeze(0)

            with torch.no_grad():
                image_features = model.encode_image(image)

            image_features /= image_features.norm(dim=-1, keepdim=True)

            embeddings.append(image_features.squeeze().numpy())
            labels.append(dish_name)

        except Exception as e:
            print(f"Error processing {image_path}: {e}")

# -----------------------------
# SAVE
# -----------------------------

embeddings = np.array(embeddings)

os.makedirs("data/processed/embeddings", exist_ok=True)

np.save(OUTPUT_FILE, embeddings)

with open(LABELS_FILE, "w") as f:
    json.dump(labels, f)

print("Embeddings saved successfully.")