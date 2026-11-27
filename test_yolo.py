
from pathlib import Path
from collections import Counter
from ultralytics import YOLO

# Find the extracted traffic images
image_dir = Path("traffic_subset/sample/images")
image_path = next(image_dir.glob("*.jpg"), None)

if image_path is None:
    raise FileNotFoundError(f"No images found in {image_dir.resolve()}")

print("Image:", image_path)

# Load pretrained YOLOv8 nano model
model = YOLO("yolov8n.pt")

# Run object detection
results = model.predict(
    source=str(image_path),
    conf=0.25,
    save=True
)

# Display detected classes and counts
for result in results:
    names = result.names
    counts = Counter(
        names[int(class_id)]
        for class_id in result.boxes.cls.tolist()
    )

    print("\nDetected objects:")
    if counts:
        for name, count in counts.items():
            print(f"{name}: {count}")
    else:
        print("No objects detected.")

print("\nDetection complete.")
print("Open the runs/detect/predict folder to view the result.")
