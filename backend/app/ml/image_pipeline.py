from pathlib import Path
from collections import Counter
from functools import lru_cache
from threading import Lock
from ultralytics import YOLO
import cv2
import numpy as np
import base64
ROOT = Path(__file__).resolve().parents[3]
MODEL_PATH = ROOT / 'runs/detect/indian_traffic_v1/weights/last.pt'
VEHICLE_CLASSES = {'car','motorcycle','bus','truck','autorickshaw','bicycle','vehicle fallback'}
lock = Lock()
@lru_cache(maxsize=1)
def get_model():
    return YOLO(str(MODEL_PATH))
def analyze_image(image_path):
    with lock:
        model = get_model()
        ids = [i for i,n in model.names.items() if n in VEHICLE_CLASSES]
        result = model.predict(source=str(image_path),conf=0.25,imgsz=640,classes=ids,verbose=False)[0]
    h,w = result.orig_shape
    mask = np.zeros((h,w),dtype=np.uint8)
    counts = Counter()
    detections = []
    for box in result.boxes:
        name = result.names[int(box.cls.item())]
        coords = box.xyxy[0].tolist()
        x1,y1,x2,y2 = coords
        mask[max(0,int(y1)):min(h,int(np.ceil(y2))),max(0,int(x1)):min(w,int(np.ceil(x2)))] = 1
        counts[name] += 1
        detections.append(dict(id=len(detections)+1,className=name,confidence=round(float(box.conf.item()),4),bbox=coords))
    density = round(float(mask.mean()*100),2)
    congestion = 'Low' if density < 10 else 'Moderate' if density < 25 else 'High' if density < 40 else 'Very high'
    ok,buffer = cv2.imencode('.jpg',result.plot())
    if not ok: raise RuntimeError('Image encoding failed')
    return dict(status='completed',mock=False,metrics=dict(totalVehicles=sum(counts.values()),cars=counts['car'],motorcycles=counts['motorcycle'],buses=counts['bus'],trucks=counts['truck'],autorickshaws=counts['autorickshaw'],bicycles=counts['bicycle'],otherVehicles=counts['vehicle fallback'],density=density,congestion=congestion),confidence=sum(d['confidence'] for d in detections)/len(detections)*100 if detections else None,detections=detections,forecast=[],annotatedImage='data:image/jpeg;base64,'+base64.b64encode(buffer.tobytes()).decode())
