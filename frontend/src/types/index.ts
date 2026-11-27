export interface TrafficMetrics {
 totalVehicles:number; cars:number; motorcycles:number; buses:number; trucks:number; autorickshaws:number; bicycles:number; otherVehicles:number; density:number; congestion:string;
}
export interface Detection { id:number; className:string; confidence:number; bbox:[number,number,number,number]; }
export interface AnalysisResult { status:string; mock:boolean; metrics:TrafficMetrics; confidence:number|null; detections:Detection[]; forecast:unknown[]; annotatedImage:string; }
export interface AnalysisRecord { id:string; filename:string; date:string; result:AnalysisResult; }
export interface EvaluationData { available:boolean; epoch?:number; precision?:number; recall?:number; map50?:number; map5095?:number; graphs?:string[]; message?:string; }
