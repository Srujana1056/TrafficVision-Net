import type { AnalysisResult, EvaluationData } from '../types';
const API_BASE = 'http://127.0.0.1:8000';
export const trafficApi = {
 async health() { const r=await fetch(`${API_BASE}/api/health`); if(!r.ok) throw new Error('Backend unavailable'); return r.json(); },
 async evaluation():Promise<EvaluationData> { const r=await fetch(`${API_BASE}/api/evaluation`); if(!r.ok) throw new Error('Evaluation unavailable'); return r.json(); },
 async analyzeImage(file:File):Promise<AnalysisResult> { const body=new FormData(); body.append('file',file); const r=await fetch(`${API_BASE}/api/image/analyze`,{method:'POST',body}); if(!r.ok) { const e=await r.json().catch(()=>({})); throw new Error(typeof e.detail==='string'?e.detail:'Image analysis failed'); } return r.json(); }
};
