
import json
import random
import shutil
from collections import Counter, defaultdict
from pathlib import Path

from PIL import Image

SOURCE_IMAGES = Path("traffic_subset/sample/images")
SOURCE_LABELS = Path("traffic_subset/sample/annotations")
OUTPUT = Path("traffic_subset/yolo_dataset")

# Keep all 12 annotation categories distinct.
CLASSES = [
    "car",
    "motorcycle",
    "rider",
    "person",
    "autorickshaw",
    "truck",
    "vehicle fallback",
    "bicycle",
    "bus",
    "traffic sign",
    "animal",
    "traffic light",
]
CLASS_TO_ID = {name: i for i, name in enumerate(CLASSES)}

random.seed(42)

# Match each image with its annotation.
pairs = []
for image_path in SOURCE_IMAGES.glob("*.jpg"):
    json_path = SOURCE_LABELS / f"{image_path.stem}.json"
    if json_path.exists():
        pairs.append((image_path, json_path))

if not pairs:
    raise RuntimeError("No matching JPG and JSON pairs found.")

# Group frames from the same source clip to reduce data leakage.
groups = defaultdict(list)
for image_path, json_path in pairs:
    clip_id = image_path.stem.rsplit("_", 1)[0]
    groups[clip_id].append((image_path, json_path))

group_ids = list(groups)
random.shuffle(group_ids)

# Assign whole clips to approximately 70/20/10 splits.
splits = {"train": [], "val": [], "test": []}
targets = {
    "train": len(pairs) * 0.70,
    "val": len(pairs) * 0.20,
    "test": len(pairs) * 0.10,
}

for clip_id in group_ids:
    group_items = groups[clip_id]
    # Fill the split furthest below its target.
    split_name = max(
        splits,
        key=lambda name: targets[name] - len(splits[name])
    )
    splits[split_name].extend(group_items)

for split_name, items in splits.items():
    image_out = OUTPUT / "images" / split_name
    label_out = OUTPUT / "labels" / split_name
    image_out.mkdir(parents=True, exist_ok=True)
    label_out.mkdir(parents=True, exist_ok=True)

    for image_path, json_path in items:
        with Image.open(image_path) as image:
            width, height = image.size

        with json_path.open("r", encoding="utf-8") as file:
            annotation = json.load(file)

        yolo_lines = []

        for obj in annotation.get("labels", []):
            category = obj.get("category")
            if category not in CLASS_TO_ID:
                continue

            box = obj.get("box2d", {})
            try:
                x1 = float(box["x1"])
                y1 = float(box["y1"])
                x2 = float(box["x2"])
                y2 = float(box["y2"])
            except (KeyError, TypeError, ValueError):
                continue

            # Clip boxes to image boundaries.
            x1 = max(0, min(x1, width))
            x2 = max(0, min(x2, width))
            y1 = max(0, min(y1, height))
            y2 = max(0, min(y2, height))

            if x2 <= x1 or y2 <= y1:
                continue

            xc = ((x1 + x2) / 2) / width
            yc = ((y1 + y2) / 2) / height
            bw = (x2 - x1) / width
            bh = (y2 - y1) / height

            class_id = CLASS_TO_ID[category]
            yolo_lines.append(
                f"{class_id} {xc:.6f} {yc:.6f} "
                f"{bw:.6f} {bh:.6f}"
            )

        shutil.copy2(image_path, image_out / image_path.name)

        label_path = label_out / f"{image_path.stem}.txt"
        label_path.write_text(
            "\n".join(yolo_lines),
            encoding="utf-8"
        )

# Write YOLO dataset configuration.
yaml_path = OUTPUT / "data.yaml"
yaml_text = (
    f"path: {OUTPUT.resolve().as_posix()}\n"
    "train: images/train\n"
    "val: images/val\n"
    "test: images/test\n"
    f"nc: {len(CLASSES)}\n"
    "names:\n"
)
for class_id, name in enumerate(CLASSES):
    yaml_text += f"  {class_id}: '{name}'\n"

yaml_path.write_text(yaml_text, encoding="utf-8")

print("\nDataset preparation complete!")
print("Matched image/annotation pairs:", len(pairs))
print("Distinct source clips:", len(group_ids))
for split_name, items in splits.items():
    print(f"{split_name}: {len(items)} images")
print("Classes:", len(CLASSES))
print("Configuration:", yaml_path)
