
import json
from pathlib import Path
from collections import Counter

annotation_dir = Path("traffic_subset/sample/annotations")
files = list(annotation_dir.glob("*.json"))

category_counts = Counter()
total_boxes = 0

for file in files:
    with file.open("r", encoding="utf-8") as f:
        data = json.load(f)

    for label in data.get("labels", []):
        category_counts[label.get("category", "unknown")] += 1
        total_boxes += 1

print("Annotation files:", len(files))
print("Total labeled objects:", total_boxes)
print("\nObjects by category:")

for category, count in category_counts.most_common():
    print(f"{category}: {count}")
