
from ultralytics import YOLO
from pathlib import Path

model_path = "runs/detect/indian_traffic_v1/weights/best.pt"

model = YOLO(model_path)

# Test on one image from your dataset
image_folder = Path("traffic_subset/sample/images")
image_path = next(image_folder.glob("*.jpg"))

results = model.predict(
    source=str(image_path),
    conf=0.25,
    save=True,
    verbose=False
)

result = results[0]
print("Image:", image_path.name)
print("Detected objects:", len(result.boxes))

for box in result.boxes:
    class_id = int(box.cls[0])
    confidence = float(box.conf[0])
    print(
        model.names[class_id],
        f"{confidence:.2f}"
    )

print("Annotated prediction saved.")
