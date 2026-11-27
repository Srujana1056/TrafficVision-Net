
import tarfile
import json
from pathlib import Path

archive = Path(
    "traffic_subset/downloads/data/train-00000-of-00646.tar"
)

output = Path("traffic_subset/sample")
images_dir = output / "images"
annotations_dir = output / "annotations"

images_dir.mkdir(parents=True, exist_ok=True)
annotations_dir.mkdir(parents=True, exist_ok=True)

image_count = 0
json_count = 0

with tarfile.open(archive, "r") as tar:
    for member in tar:
        if not member.isfile():
            continue

        name = Path(member.name).name
        suffix = Path(name).suffix.lower()

        # Extract only JPG images and JSON annotations.
        if suffix not in {".jpg", ".json"}:
            continue

        target_dir = images_dir if suffix == ".jpg" else annotations_dir
        target = target_dir / name

        source = tar.extractfile(member)
        if source is None:
            continue

        with source, target.open("wb") as destination:
            destination.write(source.read())

        if suffix == ".jpg":
            image_count += 1
        else:
            json_count += 1

print("Extraction complete!")
print("Images:", image_count)
print("JSON annotations:", json_count)
print("Images saved to:", images_dir)
print("Annotations saved to:", annotations_dir)

# Display one annotation to inspect its structure.
sample_json = next(annotations_dir.glob("*.json"), None)

if sample_json:
    print("\nExample annotation:", sample_json.name)
    with sample_json.open("r", encoding="utf-8") as file:
        data = json.load(file)
    print(json.dumps(data, indent=2)[:5000])
