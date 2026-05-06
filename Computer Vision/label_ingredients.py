# import ssl
# ssl._create_default_https_context = ssl._create_unverified_context

# import os
# import certifi
# os.environ["SSL_CERT_FILE"] = certifi.where()
# os.environ["REQUESTS_CA_BUNDLE"] = certifi.where()

"""
Auto-label food ingredients using Gemini API (google-genai SDK).

Strategy:
  - ALL classes in ONE call per image
  - 4.5s delay between requests to stay under 15 RPM
  - Checkpoint after every image — resume safely anytime
  - Daily quota detection — stops immediately, no wasted retries

Folder structure:
  root_folder/
    subfolder1/image1.jpg ...
    subfolder2/image3.png ...

Output per subfolder:
  annotations.xml     <- import into CVAT
                         Task → Actions → Upload annotations → CVAT 1.1
  .progress.json      <- checkpoint, auto-deleted when folder finishes
"""

import httpx
import io
import json
import re
import time
import base64
import xml.etree.ElementTree as ET
from xml.dom import minidom
from pathlib import Path
from PIL import Image
from google import genai
from google.genai import types

# ─────────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────────

GEMINI_API_KEY = "" # edit this
ROOT_FOLDER    = "./root_dir_name" # edit this

INGREDIENTS = [
    # Proteins — meat
    'pork_belly', 'pork_shoulder', 'pork_loin', 'pork_intestine',
    'pork_liver', 'pork_lungs', 'pork_heart', 'pork_blood',
    'pork_skin_chicharon', 'pork_longganisa', 'chorizo',
    'beef_sirloin', 'beef_short_ribs', 'beef_oxtail', 'beef_tripe',
    'beef_liver', 'beef_tapa',
    'goat_meat',
    'chicken_breast', 'chicken_thigh', 'chicken_feet', 'chicken_head',
    'chicken_gizzard', 'chicken_inasal', 'chicken_longganisa',
    'hotdog', 'etag_cured_pork', 'pinuneg_blood_sausage',

    # Proteins — seafood
    'bangus_milkfish', 'tilapia', 'tulingan_tuna', 'catfish',
    'sardines_canned', 'stingray', 'shark_meat',
    'shrimp_whole', 'shrimp_battered',
    'squid_rings', 'crab_whole', 'crab_roe_aligue',
    'mussels', 'clams', 'fish_balls',

    # Eggs
    'hard_boiled_egg', 'quail_egg', 'salted_egg', 'balut',
    'tokneneng_battered_egg', 'penoy',

    # Tofu & soy
    'tofu_cubes', 'tausi_black_beans', 'kesong_puti',

    # Rice & noodles
    'white_rice', 'turmeric_rice', 'adlai_grains',
    'bihon_rice_noodles', 'sotanghon_vermicelli', 'misua',
    'canton_egg_noodles', 'lomi_noodles', 'landang_tapioca',

    # Vegetables — leafy
    'kangkong', 'alugbati', 'pechay', 'mustasa', 'lettuce',
    'malunggay_leaves', 'jute_leaves_saluyot', 'dahon_ng_sili',
    'alibangbang_leaves', 'maguey_leaves', 'garlic_chives_kuchay',
    'pandan_leaf', 'banana_leaf',

    # Vegetables — pods & beans
    'sitaw_string_beans', 'sigarilyas_winged_beans', 'okra',
    'patani_lima_beans', 'bataw_hyacinth_beans',
    'pigeon_peas_kadyos', 'green_peas', 'edamame', 'togue_bean_sprouts',
    'corn_kernels', 'corn_cob',

    # Vegetables — gourds & roots
    'kalabasa_squash', 'ampalaya_bitter_gourd', 'sayote',
    'upo_bottle_gourd', 'patola_sponge_gourd', 'winter_melon',
    'gabi_taro', 'kamote_sweet_potato', 'potato_cubes',
    'labanos_radish', 'singkamas_jicama', 'water_chestnut',
    'bamboo_shoots', 'banana_stalk_ubad',

    # Vegetables — aromatics & others
    'garlic_minced', 'garlic_fried_bits', 'white_onion', 'red_onion',
    'scallions', 'ginger', 'galangal_langkawas', 'lemongrass',
    'tomato', 'bell_pepper_red', 'bell_pepper_green',
    'siling_haba_green_chili', 'siling_labuyo_red_chili',
    'talong_eggplant', 'cucumber', 'carrot', 'mushrooms',
    'green_papaya', 'jackfruit_young',

    # Fruits
    'calamansi', 'santol', 'guava', 'bilimbi_kamias',
    'tamarind', 'batwan_fruit', 'pineapple', 'saba_banana',
    'mango',

    # Pastes, sauces & condiments
    'bagoong_shrimp_paste', 'bagoong_monamon_fish_paste',
    'chili_garlic_sauce', 'oyster_sauce', 'liver_sauce',
    'banana_ketchup', 'vinegar_dip', 'soy_sauce_dip',
    'spiced_vinegar_sinamak', 'annatto_oil', 'coconut_latik_syrup',
    'coconut_latik_curds', 'chili_garlic_oil', 'mango_relish',

    # Dairy & fats
    'evaporated_milk', 'carabao_milk_pastillas',

    # Dry spices & toppings
    'annatto_seeds', 'safflower_kasubha', 'black_peppercorns',
    'star_anise', 'bay_leaves', 'turmeric_powder',
    'red_yeast_rice_angkak', 'toasted_rice_powder',
    'peanuts_crushed', 'pili_nuts', 'raisins',
    'chicharon_crumbles', 'sesame_seeds',

    # Salt & sugar
    'rock_salt', 'muscovado_sugar', 'cane_sugar_glaze', 'arnibal_syrup',

    # Street food
    'isaw_skewer', 'betamax_blood_cube', 'proben_fried',
    'kwek_kwek_orange', 'binatog_corn_snack', 'fish_balls_skewer',
    'pork_barbecue_skewer',

    # Fermented / preserved
    'fermented_rice_buro', 'pickled_papaya_atchara',
    'pickled_bamboo_atchara', 'kimchi',
]

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
SEND_SIZE        = (1024, 1024)   # resize before sending for consistent coordinates

MODEL_NAME      = "gemini-3.1-flash-lite-preview"
RPM_LIMIT       = 15
RPD_LIMIT       = 500
MIN_DELAY       = 60.0 / RPM_LIMIT + 0.5   # ~4.5s
MAX_RETRY_DELAY = 90.0
EXTRA_BUFFER    = 3.0
MAX_RETRIES     = 3

# ─────────────────────────────────────────────────────────────────


class DailyQuotaExhausted(Exception):
    pass


def classify_429(error: Exception) -> tuple[str, float | None]:
    text = str(error)
    is_daily = (
        "PerDay" in text
        or "per_day" in text.lower()
        or ("limit: 0" in text and "Day" in text)
    )
    m = re.search(r'retry_delay\s*\{[^}]*seconds:\s*(\d+)', text)
    if not m:
        m = re.search(r'retry in\s+([\d.]+)s', text, re.IGNORECASE)
    retry_secs = float(m.group(1)) if m else None
    return ("daily" if is_daily else "minute"), retry_secs


def build_prompt(ingredients: list[str]) -> str:
    return (
        "You are a food ingredient detector for a computer vision labelling dataset.\n\n"
        f"Detect ALL visible ingredients from this list:\n{', '.join(ingredients)}\n\n"
        "Rules:\n"
        "- Only label ingredients that are clearly visible in the image.\n"
        "- Return ONLY a valid JSON array. No markdown, no explanation, nothing else.\n"
        '- Each element: {"label": "<exact name from list>", '
        '"box_2d": [y_min, x_min, y_max, x_max]}\n'
        "- box_2d values are integers 0-1000 "
        "(0,0 = top-left corner, 1000,1000 = bottom-right corner).\n"
        "- If none of the listed ingredients are visible, return: []\n"
    )


def call_gemini(client: genai.Client, image_bytes: bytes,
                ingredients: list[str]) -> list[dict]:
    """
    Single Gemini call with all ingredients.
    Raises DailyQuotaExhausted if daily limit hit.
    Retries up to MAX_RETRIES for per-minute limits.
    """
    prompt  = build_prompt(ingredients)
    backoff = 0.0

    for attempt in range(1, MAX_RETRIES + 1):
        sleep_for = max(MIN_DELAY, backoff)
        if attempt > 1:
            print(f"\n    ⏱  sleeping {sleep_for:.0f}s "
                  f"(attempt {attempt}/{MAX_RETRIES}) ...", end="", flush=True)
        else:
            time.sleep(MIN_DELAY)

        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                    prompt,
                ]
            )
            raw = response.text.strip()
            if raw.startswith("```"):
                parts = raw.split("```")
                raw   = parts[1] if len(parts) > 1 else raw
                if raw.startswith("json"):
                    raw = raw[4:]
            raw = raw.strip()
            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                print(f"\n    ⚠  JSON parse error. Raw: {raw[:150]}")
                return []

        except Exception as e:
            if "429" in str(e):
                kind, suggested = classify_429(e)
                if kind == "daily":
                    raise DailyQuotaExhausted(
                        f"Daily quota exhausted ({RPD_LIMIT} requests/day). "
                        "Resets at midnight Pacific. Re-run tomorrow — "
                        "checkpoint will resume from where you stopped."
                    ) from e
                wait    = (suggested + EXTRA_BUFFER) if suggested else min(MAX_RETRY_DELAY, 15 * attempt)
                backoff = wait
                print(f"\n    ⚠  429 rate limit — waiting {wait:.0f}s ...", end="", flush=True)
                if attempt == MAX_RETRIES:
                    print(f"\n    ❌  Failed after {MAX_RETRIES} retries — skipping.")
                    return []
                
            elif "503" in str(e) or "UNAVAILABLE" in str(e):
                # Don't count against MAX_RETRIES — just keep waiting until it recovers
                wait = 20
                print(f"\n    ⚠  503 model busy — waiting {wait}s ...", end="", flush=True)
                time.sleep(wait)
                continue   # retry without incrementing the attempt counter

            else:
                print(f"\n    ❌  Error: {e}")
                if attempt == MAX_RETRIES:
                    return []
                backoff = MIN_DELAY * 2

    return []


def label_image(client: genai.Client, img_path: Path,
                ingredients: list[str]) -> tuple[list[dict], int, int]:
    with Image.open(img_path) as im:
        im = im.convert("RGB")
        orig_w, orig_h = im.size
        im.thumbnail(SEND_SIZE, Image.LANCZOS)
        send_w, send_h = im.size
        buf = io.BytesIO()
        im.save(buf, format="JPEG", quality=90)
        image_bytes = buf.getvalue()

    # Pass raw bytes directly — no base64 needed with new SDK
    raw_boxes   = call_gemini(client, image_bytes, ingredients)
    valid_labels = set(ingredients)
    pixel_boxes: list[dict] = []

    for item in raw_boxes:
        try:
            label = item["label"]
            if label not in valid_labels:
                normalized = label.strip().lower().replace(" ", "_")
                if normalized in valid_labels:
                    label = normalized
                else:
                    continue

            y_min, x_min, y_max, x_max = item["box_2d"]

            # Step 1: 0-1000 → send image pixels
            x0 = x_min / 1000 * send_w
            y0 = y_min / 1000 * send_h
            x1 = x_max / 1000 * send_w
            y1 = y_max / 1000 * send_h

            # Step 2: send image pixels → original image pixels
            scale_x = orig_w / send_w
            scale_y = orig_h / send_h
            xtl = int(x0 * scale_x)
            ytl = int(y0 * scale_y)
            xbr = int(x1 * scale_x)
            ybr = int(y1 * scale_y)

            # Clamp to image bounds
            xtl = max(0, min(xtl, orig_w))
            ytl = max(0, min(ytl, orig_h))
            xbr = max(0, min(xbr, orig_w))
            ybr = max(0, min(ybr, orig_h))

            if xbr <= xtl or ybr <= ytl:
                continue

            pixel_boxes.append({"label": label,
                                 "xtl": xtl, "ytl": ytl,
                                 "xbr": xbr, "ybr": ybr})
        except (KeyError, TypeError, ValueError):
            continue

    return pixel_boxes, orig_w, orig_h


# ── CVAT XML ─────────────────────────────────────────────────────

def build_cvat_xml(image_annotations: list[dict]) -> str:
    root = ET.Element("annotations")
    ET.SubElement(root, "version").text = "1.1"
    for idx, img in enumerate(image_annotations):
        el = ET.SubElement(root, "image")
        el.set("id",     str(idx))
        el.set("name",   img["filename"])
        el.set("width",  str(img["width"]))
        el.set("height", str(img["height"]))
        for box in img["boxes"]:
            b = ET.SubElement(el, "box")
            b.set("label",    box["label"])
            b.set("occluded", "0")
            b.set("xtl",      str(box["xtl"]))
            b.set("ytl",      str(box["ytl"]))
            b.set("xbr",      str(box["xbr"]))
            b.set("ybr",      str(box["ybr"]))
    xml_str = minidom.parseString(
        ET.tostring(root, encoding="unicode")
    ).toprettyxml(indent="  ")
    return "\n".join(xml_str.split("\n")[1:])


# ── Checkpoints ──────────────────────────────────────────────────

def cp_path(folder: Path) -> Path:
    return folder / ".progress.json"

def load_checkpoint(folder: Path) -> dict:
    p = cp_path(folder)
    if p.exists():
        try:
            return json.loads(p.read_text())
        except Exception:
            pass
    return {"done": [], "annotations": []}

def save_checkpoint(folder: Path, state: dict):
    cp_path(folder).write_text(json.dumps(state, indent=2))

def delete_checkpoint(folder: Path):
    p = cp_path(folder)
    if p.exists():
        p.unlink()


# ── Per-folder processing ─────────────────────────────────────────

def process_folder(client: genai.Client, folder: Path,
                   ingredients: list[str], requests_used: list[int]) -> bool:
    image_files = sorted([
        f for f in folder.iterdir()
        if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS
    ])
    if not image_files:
        return True
    
    if not cp_path(folder).exists() and (folder / "annotations.xml").exists():
        print(f"\n📁  {folder.name}  — already complete, skipping ✅")
        return True

    print(f"\n📁  {folder.name}  ({len(image_files)} image(s))")

    state             = load_checkpoint(folder)
    done_set          = set(state["done"])
    image_annotations = state["annotations"]

    if done_set:
        print(f"    ↩  Resuming: {len(done_set)} done, "
              f"{len(image_files) - len(done_set)} remaining")

    pending = [f for f in image_files if f.name not in done_set]

    for img_path in pending:
        print(f"  🖼  {img_path.name}  "
              f"[{requests_used[0]+1}/{RPD_LIMIT} req today] ...",
              end=" ", flush=True)

        try:
            boxes, w, h = label_image(client, img_path, ingredients)
            requests_used[0] += 1

        except DailyQuotaExhausted as e:
            save_checkpoint(folder, state)
            if image_annotations:
                (folder / "annotations.xml").write_text(
                    build_cvat_xml(image_annotations), encoding="utf-8")
            print(f"\n\n🛑  {e}\n")
            return False

        except Exception as e:
            print(f"❌  {e}")
            continue

        print(f"✅  {len(boxes)} label(s)")
        image_annotations.append({
            "filename": img_path.name,
            "width": w, "height": h, "boxes": boxes,
        })
        state["done"].append(img_path.name)
        state["annotations"] = image_annotations

        save_checkpoint(folder, state)
        (folder / "annotations.xml").write_text(
            build_cvat_xml(image_annotations), encoding="utf-8")

    print(f"  💾  Done → {folder / 'annotations.xml'}")
    delete_checkpoint(folder)
    return True


# ── Main ─────────────────────────────────────────────────────────

def main():
    client = genai.Client(
        api_key=GEMINI_API_KEY,
        http_options={"httpx_client": httpx.Client(verify=False)}
    )

    root = Path(ROOT_FOLDER)
    if not root.exists():
        print(f"❌  ROOT_FOLDER not found: {root.resolve()}")
        return

    subfolders = sorted([d for d in root.iterdir() if d.is_dir()])
    if not subfolders:
        subfolders = [root]
    # temporary debug — remove after fixing
    
    total_images = sum(
        len([f for f in d.iterdir()
             if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS])
        for d in subfolders
    )

    days_needed = total_images // RPD_LIMIT + (1 if total_images % RPD_LIMIT else 0)
    print(f"🥘  {len(INGREDIENTS)} classes | 1 Gemini call per image")
    print(f"⏱   {MIN_DELAY:.1f}s between requests ({RPM_LIMIT} RPM limit)")
    print(f"📅  {RPD_LIMIT} images/day | {total_images} total images | ~{days_needed} day(s)")
    print(f"💾  Checkpoint after every image\n")

    requests_used = [0]

    for folder in subfolders:
        keep_going = process_folder(client, folder, INGREDIENTS, requests_used)
        if not keep_going:
            print("Re-run tomorrow to continue. Progress is saved.")
            return

    print(f"\n✅  All done! Used {requests_used[0]} requests.")
    print("Import each annotations.xml into CVAT:")
    print("  Task → Actions → Upload annotations → CVAT 1.1 format")


if __name__ == "__main__":
    main()
