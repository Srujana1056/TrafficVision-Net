from pathlib import Path
from uuid import uuid4
from datetime import datetime
import csv
import json
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .ml.image_pipeline import analyze_image, get_model
app = FastAPI(title='TrafficVision-Net API',version='1.1.0')
app.add_middleware(CORSMiddleware,allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ],allow_credentials=True,allow_methods=['*'],allow_headers=['*'])
ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT/'data'/'images'
RECORDS = ROOT/'data'/'analysis_records'
RUN = ROOT/'runs'/'detect'/'indian_traffic_v1'
for p in (DATA_DIR,RECORDS): p.mkdir(parents=True,exist_ok=True)
app.mount('/images',StaticFiles(directory=str(DATA_DIR)),name='images')
from fastapi.responses import FileResponse
GRAPHS = ['results.png','BoxF1_curve.png','BoxPR_curve.png','BoxP_curve.png','BoxR_curve.png','confusion_matrix.png','confusion_matrix_normalized.png','labels.jpg']
@app.get('/evaluation-graphs/{name}')
def graph(name:str):
    if name not in GRAPHS or not (RUN/name).is_file(): raise HTTPException(404,'Graph not found')
    return FileResponse(RUN/name)
@app.get('/api/health')
def health():
    try: return dict(status='online',service='TrafficVision-Net',model_ready=True,model='last.pt',classes=get_model().names)
    except Exception as e: return dict(status='online',model_ready=False,error=str(e))
@app.post('/api/image/analyze')
def process_image(file:UploadFile=File(...)):
    filename=file.filename or 'image.jpg'
    ext=Path(filename).suffix.lower()
    if ext not in ('.jpg','.jpeg','.png'): raise HTTPException(400,'Only JPG, JPEG and PNG are supported')
    content=file.file.read(20*1024*1024+1)
    if len(content)>20*1024*1024: raise HTTPException(413,'Image exceeds 20 MB')
    id=str(uuid4()); path=DATA_DIR/(id+ext)
    path.write_bytes(content)
    try:
        result=analyze_image(path)
        result.update(id=id,filename=filename,date=datetime.now().isoformat(),originalImage='/images/'+path.name,model='last.pt')
        temp=RECORDS/(id+'.tmp'); temp.write_text(json.dumps(result),encoding='utf-8'); temp.replace(RECORDS/(id+'.json'))
        return result
    except Exception as e:
        path.unlink(missing_ok=True)
        raise HTTPException(500,str(e))
@app.get('/api/reports')
def reports():
    return sorted([json.loads(p.read_text(encoding='utf-8')) for p in RECORDS.glob('*.json')],key=lambda r:r['date'])
@app.get('/api/analysis/latest')
def latest_analysis():
    records=reports(); return records[-1] if records else None
@app.get('/api/analysis/{analysis_id}')
def get_analysis(analysis_id:str):
    try: name=str(__import__('uuid').UUID(analysis_id))
    except ValueError: raise HTTPException(404,'Analysis not found')
    path=RECORDS/(name+'.json')
    if not path.is_file(): raise HTTPException(404,'Analysis not found')
    return json.loads(path.read_text(encoding='utf-8'))
@app.get('/api/traffic/{analysis_id}')
def traffic(analysis_id:str): return get_analysis(analysis_id)['metrics']
@app.get('/api/forecast/{analysis_id}')
def forecast(analysis_id:str):
    get_analysis(analysis_id)
    return dict(available=False,forecast=[],message='Timestamped same-camera frames required')
@app.get('/api/evaluation')
def evaluation():
    try:
        with (RUN/'results.csv').open(encoding='utf-8-sig') as f:
            rows=[{k.strip():v for k,v in r.items()} for r in csv.DictReader(f)]
        r=rows[-1]
        return dict(available=True,epoch=int(float(r['epoch'])),precision=float(r['metrics/precision(B)']),recall=float(r['metrics/recall(B)']),map50=float(r['metrics/mAP50(B)']),map5095=float(r['metrics/mAP50-95(B)']),graphs=[n for n in GRAPHS if (RUN/n).is_file()])
    except Exception as e: return dict(available=False,message=str(e))
