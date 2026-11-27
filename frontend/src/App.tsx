
import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import {
  NavLink,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  LayoutDashboard,
  Image,
  ScanLine,
  BarChart3,
  TrendingUp,
  Activity,
  FileText,
  ArrowRight,
  UploadCloud,
  Car,
  Crosshair,
  Download,
  LoaderCircle,
  CheckCircle,
  Radar,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

import { trafficApi } from "./services/api";
import type { AnalysisResult, AnalysisRecord, EvaluationData } from "./types";

const API_BASE = "http://127.0.0.1:8000";

const navigation = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/video-analysis", label: "Image Analysis", icon: Image },
  { to: "/detection", label: "Traffic Detection", icon: ScanLine },
  { to: "/analytics", label: "Traffic Analytics", icon: BarChart3 },
  { to: "/forecast", label: "Congestion Forecast", icon: TrendingUp },
  { to: "/evaluation", label: "Model Evaluation", icon: Activity },
  { to: "/reports", label: "Reports", icon: FileText },
];

const colors = [
  "#20d2c5",
  "#4285f4",
  "#f4bc4f",
  "#ef6461",
  "#a78bfa",
  "#34d399",
  "#94a3b8",
];

function classData(result: AnalysisResult) {
  const m = result.metrics;

  return [
    { name: "Cars", value: m.cars },
    { name: "Motorcycles", value: m.motorcycles },
    { name: "Buses", value: m.buses },
    { name: "Trucks", value: m.trucks },
    { name: "Autorickshaws", value: m.autorickshaws },
    { name: "Bicycles", value: m.bicycles },
    { name: "Other Vehicles", value: m.otherVehicles },
  ];
}

function confidenceText(result: AnalysisResult | null) {
  return result?.confidence != null
    ? `${result.confidence.toFixed(2)}%`
    : "N/A";
}

function Card({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      <div className="card-head">
        <div>
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
      </div>

      <div className="card-body">{children}</div>
    </section>
  );
}

function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow">
          <i /> AI TRAFFIC RESEARCH SYSTEM
        </div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail?: string;
  icon?: typeof Car;
}) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span>{label}</span>

        {Icon && (
          <div className="metric-icon primary">
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="metric-value">{value}</div>

      {detail && (
        <div className="metric-detail">{detail}</div>
      )}
    </div>
  );
}

function EmptyState({
  message = "Upload and analyze a traffic image to view results.",
}: {
  message?: string;
}) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        padding: 45,
        textAlign: "center",
      }}
    >
      <ScanLine size={42} color="#20d2c5" />

      <p className="muted" style={{ margin: "18px 0" }}>
        {message}
      </p>

      <button
        className="primary"
        onClick={() => navigate("/video-analysis")}
      >
        <UploadCloud size={17} />
        Analyze Image
      </button>
    </div>
  );
}

function TrafficImage({
  src,
  alt = "Analyzed traffic image",
}: {
  src: string;
  alt?: string;
}) {
  return (
    <div
      style={{
        background: "#0b111b",
        borderRadius: 8,
        overflow: "hidden",
        textAlign: "center",
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: "100%",
          maxHeight: 520,
          objectFit: "contain",
          display: "block",
        }}
      />
    </div>
  );
}

function TrafficSummary({
  result,
}: {
  result: AnalysisResult;
}) {
  return (
    <div className="summary">
      {classData(result).map((item) => (
        <div className="summary-row" key={item.name}>
          <span>{item.name}</span>
          <strong>{item.value}</strong>
        </div>
      ))}

      <div className="summary-total">
        <strong>Total Vehicles</strong>
        <b>{result.metrics.totalVehicles}</b>
      </div>
    </div>
  );
}

function ClassChart({
  result,
}: {
  result: AnalysisResult;
}) {
  if (result.metrics.totalVehicles === 0) {
    return <p className="muted">No vehicles detected.</p>;
  }

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={classData(result)}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={95}
            paddingAngle={3}
          >
            {classData(result).map((item, index) => (
              <Cell
                key={item.name}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{
              background: "#151f2c",
              border: "1px solid #2c3d4e",
              color: "#fff",
            }}
            itemStyle={{ color: "#fff" }}
          />

          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function VehicleBarChart({
  result,
}: {
  result: AnalysisResult;
}) {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={classData(result)}>
          <CartesianGrid
            stroke="#263544"
            vertical={false}
          />

          <XAxis
            dataKey="name"
            stroke="#94a3b8"
            fontSize={10}
            interval={0}
          />

          <YAxis
            stroke="#94a3b8"
            allowDecimals={false}
          />

          <Tooltip
            contentStyle={{
              background: "#151f2c",
              border: "1px solid #2c3d4e",
              color: "#fff",
            }}
            itemStyle={{ color: "#fff" }}
          />

          <Bar
            dataKey="value"
            name="Vehicles"
            fill="#20d2c5"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function HistoryChart({
  history,
}: {
  history: AnalysisRecord[];
}) {
  const data = history.map((record, index) => ({
    name: `Image ${index + 1}`,
    vehicles: record.result.metrics.totalVehicles,
  }));

  if (data.length === 0) {
    return <p className="muted">No analysis history yet.</p>;
  }

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="#263544" />

          <XAxis
            dataKey="name"
            stroke="#94a3b8"
          />

          <YAxis
            stroke="#94a3b8"
            allowDecimals={false}
          />

          <Tooltip
            contentStyle={{
              background: "#151f2c",
              border: "1px solid #2c3d4e",
              color: "#fff",
            }}
            itemStyle={{ color: "#fff" }}
          />

          <Line
            type="linear"
            dataKey="vehicles"
            stroke="#20d2c5"
            strokeWidth={3}
            dot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function Dashboard({
  result,
  history,
}: {
  result: AnalysisResult | null;
  history: AnalysisRecord[];
}) {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Traffic Intelligence Dashboard"
        subtitle="AI-powered vehicle detection and traffic image analysis"
        action={
          <button
            className="primary"
            onClick={() => navigate("/video-analysis")}
          >
            <ScanLine size={17} />
            Analyze New Image
          </button>
        }
      />

      <div className="metrics-grid">
        <MetricCard
          label="Detected Vehicles"
          value={
            result
              ? String(result.metrics.totalVehicles)
              : "—"
          }
          icon={Car}
          detail="Latest analyzed image"
        />

        <MetricCard
          label="Detection Confidence"
          value={confidenceText(result)}
          icon={Crosshair}
          detail="Mean vehicle detection confidence"
        />

        <MetricCard
          label="Images Analyzed"
          value={String(history.length)}
          icon={Image}
          detail="Current analysis history"
        />

        <MetricCard
          label="Estimated Density"
          value={result ? `${result.metrics.density.toFixed(2)}%` : "—"}
          detail={result?.metrics.congestion}
          icon={Radar}
        />
      </div>

      {!result ? (
        <Card title="Traffic Analysis">
          <EmptyState />
        </Card>
      ) : (
        <>
          <div className="dashboard-grid">
            <Card
              title="Latest Traffic Analysis"
              description="Actual YOLO vehicle detections"
            >
              <TrafficImage src={result.annotatedImage} />
            </Card>

            <Card title="Traffic Summary">
              <TrafficSummary result={result} />
            </Card>
          </div>

          <div className="two-grid mt">
            <Card title="Vehicle Class Distribution">
              <ClassChart result={result} />
            </Card>

            <Card title="Vehicle Counts by Category">
              <VehicleBarChart result={result} />
            </Card>
          </div>

          <Card
            title="Vehicle Counts Across Images"
            description="Observed counts from analyzed images, not a time-based traffic forecast"
            className="mt"
          >
            <HistoryChart history={history} />
          </Card>
        </>
      )}
    </div>
  );
}

function ImageAnalysis({
  onComplete,
}: {
  onComplete: (record: AnalysisRecord) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] =
    useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  function chooseFile(selected?: File) {
    if (!selected || loading) return;

    setError("");

    if (!/\.(jpg|jpeg|png)$/i.test(selected.name)) {
      setError("Please select a JPG, JPEG or PNG image.");
      return;
    }

    if (selected.size > 20 * 1024 * 1024) {
      setError("Image size must not exceed 20 MB.");
      return;
    }

    setFile(selected);
    setResult(null);
  }

  async function analyze() {
    if (!file || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await trafficApi.analyzeImage(file);

      setResult(response);

      const metadata = response as AnalysisResult & {
        id?: string;
        filename?: string;
        date?: string;
      };

      onComplete({
        id: metadata.id ?? crypto.randomUUID(),
        filename: metadata.filename ?? file.name,
        date: metadata.date ?? new Date().toISOString(),
        result: response,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Image analysis failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Image Analysis"
        subtitle="Upload roadside traffic images for actual AI-powered vehicle detection"
      />

      <div
        className="upload-zone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          chooseFile(event.dataTransfer.files[0]);
        }}
      >
        <div>
          <UploadCloud size={48} />

          <h3>Upload Traffic Image</h3>

          <p>Drag and drop an image or browse files</p>

          <small>JPG, JPEG, PNG · Maximum 20 MB</small>

          <label
            className="primary"
            style={{ cursor: "pointer" }}
          >
            <Image size={17} />
            Choose Image

            <input
              type="file"
              hidden
              accept=".jpg,.jpeg,.png"
              disabled={loading}
              onChange={(event) =>
                chooseFile(event.target.files?.[0])
              }
            />
          </label>
        </div>
      </div>

      {error && (
        <div
          className="mt"
          style={{
            padding: 15,
            color: "#ff7777",
            background: "#381f25",
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      )}

      {file && (
        <Card title="Selected Image" className="mt">
          <div className="meta-grid">
            <div>
              <small>Filename</small>
              <strong>{file.name}</strong>
            </div>

            <div>
              <small>File Size</small>
              <strong>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </strong>
            </div>

            <div>
              <small>Input Type</small>
              <strong>Image</strong>
            </div>

            <div>
              <small>Model</small>
              <strong>Custom YOLO</strong>
            </div>

            <div>
              <small>Status</small>
              <strong>
                {loading
                  ? "Processing"
                  : result
                  ? "Completed"
                  : "Ready"}
              </strong>
            </div>
          </div>

          <div className="mt">
            {preview && (
              <TrafficImage
                src={preview}
                alt="Original traffic image"
              />
            )}
          </div>

          <button
            className="primary full mt"
            disabled={loading}
            onClick={() => void analyze()}
          >
            {loading ? (
              <LoaderCircle className="spin" size={18} />
            ) : (
              <ScanLine size={18} />
            )}

            {loading
              ? "Running YOLO Detection..."
              : "Start Image Analysis"}
          </button>
        </Card>
      )}

      {loading && (
        <Card title="AI Processing" className="mt">
          <p>
            The trained model is analyzing your image.
            Please wait for the backend response.
          </p>
        </Card>
      )}

      {result && (
        <>
          <div
            className="mt"
            style={{
              color: "#34d399",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <CheckCircle size={20} />
            Image analysis completed successfully
          </div>

          <div className="analysis-grid mt">
            <Card title="AI Processed Image">
              <TrafficImage src={result.annotatedImage} />
            </Card>

            <Card title="Detection Results">
              <div className="result-big">
                {result.metrics.totalVehicles}
                <span> vehicles</span>
              </div>

              <TrafficSummary result={result} />

              <div className="result-row">
                <span>Mean Confidence</span>
                <strong>{confidenceText(result)}</strong>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Detection({
  result,
}: {
  result: AnalysisResult | null;
}) {
  return (
    <div>
      <PageHeader
        title="Vehicle Detection"
        subtitle="Actual bounding boxes, vehicle classes and detection confidence"
      />

      {!result ? (
        <Card title="Detection Results">
          <EmptyState />
        </Card>
      ) : (
        <>
          <div className="analysis-grid">
            <Card title="Processed Traffic Image">
              <TrafficImage src={result.annotatedImage} />
            </Card>

            <Card title="Detection Statistics">
              <MetricCard
                label="Vehicles Detected"
                value={String(result.metrics.totalVehicles)}
                icon={Radar}
              />

              <TrafficSummary result={result} />
            </Card>
          </div>

          <Card
            title="Individual Vehicle Detections"
            description="Coordinates are measured in image pixels"
            className="mt"
          >
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Detection ID</th>
                    <th>Vehicle Class</th>
                    <th>Confidence</th>
                    <th>Bounding Box</th>
                  </tr>
                </thead>

                <tbody>
                  {result.detections.map((detection) => (
                    <tr key={detection.id}>
                      <td>{detection.id}</td>

                      <td>{detection.className}</td>

                      <td>
                        {(detection.confidence * 100).toFixed(2)}%
                      </td>

                      <td>
                        {detection.bbox
                          .map((value) => value.toFixed(1))
                          .join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {result.detections.length === 0 && (
                <p className="muted">No vehicles detected.</p>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Analytics({
  result,
  history,
}: {
  result: AnalysisResult | null;
  history: AnalysisRecord[];
}) {
  return (
    <div>
      <PageHeader
        title="Traffic Analytics"
        subtitle="Vehicle count and classification analysis from uploaded traffic images"
      />

      {!result ? (
        <Card title="Traffic Analytics">
          <EmptyState />
        </Card>
      ) : (
        <>
          <div className="metrics-grid">
            <MetricCard
              label="Vehicles in Latest Frame"
              value={String(result.metrics.totalVehicles)}
              icon={Car}
            />

            <MetricCard
              label="Detection Confidence"
              value={confidenceText(result)}
              icon={Crosshair}
            />

            <MetricCard
              label="Estimated Traffic Density"
              value={`${result.metrics.density.toFixed(2)}%`}
              detail="Vehicle box coverage of image"
            />

            <MetricCard
              label="Estimated Congestion"
              value={result.metrics.congestion}
              detail="Uncalibrated coverage indicator"
            />
          </div>

          <div className="two-grid">
            <Card title="Vehicle Class Distribution">
              <ClassChart result={result} />
            </Card>

            <Card title="Vehicle Category Counts">
              <VehicleBarChart result={result} />
            </Card>
          </div>

          <Card
            title="Image-wise Vehicle Counts"
            description="Independent observations from uploaded images"
            className="mt"
          >
            <HistoryChart history={history} />
          </Card>

          <Card title="Analysis History" className="mt">
            <HistoryTable history={history} />
          </Card>
        </>
      )}
    </div>
  );
}

function Forecast({ result, history }: {
  result: AnalysisResult | null;
  history: AnalysisRecord[];
}) {
  const [timed, setTimed] = useState(false);
  const [interval, setIntervalMinutes] = useState(5);
  const counts = history.map(r => r.result.metrics.totalVehicles);
  const n = counts.length;
  const meanX = (n - 1) / 2;
  const meanY = n ? counts.reduce((a,b) => a+b, 0) / n : 0;
  const denominator = counts.reduce((a, _, i) => a + (i-meanX)**2, 0);
  const slope = denominator ? counts.reduce((a,y,i) => a+(i-meanX)*(y-meanY),0)/denominator : 0;
  const ready = n >= 3 && (!timed || interval > 0);
  const horizons = timed ? [5,10,15] : [1,2,3];
  const predictions = ready ? horizons.map(h => ({
    label: timed ? `+${h} min` : `Next ${h}`,
    predicted: Math.max(0, Math.round(meanY + slope*(n-1+(timed ? h/interval : h)-meanX)))
  })) : [];
  const chartData = [
    ...counts.map((observed,i) => ({label: `Image ${i+1}`, observed, predicted: ready && i===n-1 ? observed : null})),
    ...predictions.map(p => ({...p, observed: null}))
  ];
  return <div>
    <PageHeader title="Congestion Forecast" subtitle="Experimental linear regression baseline using actual YOLO counts" />
    <div className="metrics-grid">
      <MetricCard label="Current Frame Count" value={result ? String(result.metrics.totalVehicles) : "—"} icon={Car} />
      <MetricCard label="Estimated Density" value={result ? `${result.metrics.density.toFixed(2)}%` : "—"} detail="Image box coverage proxy" />
      <MetricCard label="Current Congestion" value={result?.metrics.congestion ?? "—"} detail="Uncalibrated indicator" />
      <MetricCard label="Vehicle Count Trend" value={!ready ? "Collecting data" : slope > 0.01 ? "Increasing" : slope < -0.01 ? "Decreasing" : "Stable"} />
    </div>
    <Card title="Forecast Settings" className="mt">
      <label style={{display:"flex", gap:10, alignItems:"center"}}>
        <input type="checkbox" checked={timed} onChange={e=>setTimed(e.target.checked)} />
        All analyzed images are from the same fixed camera, in capture order, at equal known intervals.
      </label>
      {timed && <label style={{display:"block",marginTop:16}}>Capture interval (minutes): <input type="number" min="0.01" step="any" value={interval} onChange={e=>setIntervalMinutes(Number(e.target.value))} style={{padding:8,marginLeft:8,width:100}} /></label>}
      <p className="muted">{timed ? "Time-based estimates assume the capture interval you entered is correct." : "Image-index extrapolation only; random images do not support time-based traffic forecasting."}</p>
      <p className="muted">Observations available: {n}. At least 3 are required. Use only a consistent sequence for meaningful forecasts.</p>
    </Card>
    {ready ? <>
      <div className="three-grid mt">
        {predictions.map(p=><MetricCard key={p.label} label={p.label} value={String(p.predicted)} detail="Estimated vehicles per frame" />)}
      </div>
      <Card title="Observed vs Predicted Vehicle Counts" description="Linear regression baseline · not a validated congestion model" className="mt">
        <div style={{width:"100%",height:320}}><ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid stroke="#263544" />
            <XAxis dataKey="label" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" allowDecimals={false} />
            <Tooltip contentStyle={{background:"#151f2c",border:"1px solid #2c3d4e",color:"#fff"}} />
            <Legend />
            <Line type="linear" dataKey="observed" name="Observed" stroke="#20d2c5" strokeWidth={3} dot={{r:5}} />
            <Line type="linear" dataKey="predicted" name="Predicted" stroke="#f4bc4f" strokeWidth={3} strokeDasharray="6 4" dot={{r:5}} />
          </LineChart>
        </ResponsiveContainer></div>
      </Card>
    </> : <Card title="Collect More Observations" className="mt"><EmptyState message="Analyze at least three sequential traffic images and enter a valid capture interval if using time-based forecasting." /></Card>}
    <Card title="Forecast Limitations" className="mt"><p className="muted">Predictions are calculated from detected vehicle counts, not sample values. This experimental baseline does not estimate validated congestion levels, traffic flow, speed or uncertainty intervals. A flat forecast is possible when observed counts are stable.</p></Card>
  </div>;
}

function Evaluation({ result }: { result: AnalysisResult | null }) {
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    trafficApi.evaluation().then(setEvaluation).catch((e) => setError(String(e)));
  }, []);
  const percent = (n?: number) => n == null ? "—" : `${(n * 100).toFixed(2)}%`;
  return <div>
    <PageHeader title="Model Evaluation" subtitle="Actual YOLO validation results from results.csv" />
    <div className="metrics-grid">
      <MetricCard label="Precision" value={percent(evaluation?.precision)} />
      <MetricCard label="Recall" value={percent(evaluation?.recall)} />
      <MetricCard label="mAP@50" value={percent(evaluation?.map50)} />
      <MetricCard label="mAP@50:95" value={percent(evaluation?.map5095)} />
    </div>
    <Card title="Validation Status" className="mt">
      <p>{error || (evaluation?.available ? `Final training epoch: ${evaluation.epoch}` : evaluation?.message || "Loading validation metrics...")}</p>
      <p>Checkpoint: last.pt · Latest image mean confidence: {confidenceText(result)}</p>
      <p className="muted">Detection confidence is not validation accuracy. Graphs are original training-run artifacts and may reflect a different checkpoint.</p>
    </Card>
    <div className="two-grid mt">
      {evaluation?.graphs?.map(name => <Card key={name} title={name.replace(/_/g, " ")}><TrafficImage src={`${API_BASE}/evaluation-graphs/${name}`} alt={name} /></Card>)}
    </div>
  </div>;
}

function HistoryTable({
  history,
}: {
  history: AnalysisRecord[];
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Image</th>
            <th>Vehicles</th>
            <th>Cars</th>
            <th>Motorcycles</th>
            <th>Buses</th>
            <th>Trucks</th>
            <th>Density (%)</th>
            <th>Congestion</th>
            <th>Confidence</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {[...history].reverse().map((record) => (
            <tr key={record.id}>
              <td>
                {new Date(record.date).toLocaleString()}
              </td>

     <td>{record.filename}</td>

              <td>{record.result.metrics.totalVehicles}</td>
              <td>{record.result.metrics.cars}</td>
              <td>{record.result.metrics.motorcycles}</td>
              <td>{record.result.metrics.buses}</td>
              <td>{record.result.metrics.trucks}</td>
              <td>{record.result.metrics.density.toFixed(2)}</td>
              <td>{record.result.metrics.congestion}</td>
              <td>{confidenceText(record.result)}</td>

              <td style={{ color: "#34d399" }}>
                {record.result.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {history.length === 0 && (
        <p className="muted" style={{ padding: 20 }}>
          No analyses available.
        </p>
      )}
    </div>
  );
}

function Reports({
  history,
}: {
  history: AnalysisRecord[];
}) {
  function downloadCSV() {
    const escapeCSV = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const headers = [
      "Date",
      "Image",
      "Total Vehicles",
      "Cars",
      "Motorcycles",
      "Buses",
      "Trucks",
      "Autorickshaws",
      "Bicycles",
      "Other Vehicles",
      "Estimated Density (%)",
      "Estimated Congestion",
      "Mean Detection Confidence (%)",
      "Status",
    ];

    const rows = history.map((record) => {
      const m = record.result.metrics;

      return [
        record.date,
        record.filename,
        m.totalVehicles,
        m.cars,
        m.motorcycles,
        m.buses,
        m.trucks,
        m.autorickshaws,
        m.bicycles,
        m.otherVehicles,
        m.density,
        m.congestion,
        record.result.confidence,
        record.result.status,
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      })
    );

    const link = document.createElement("a");

    link.href = url;
    link.download = "trafficvision-analysis.csv";
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div>
      <PageHeader
        title="Reports & Results"
        subtitle="Review and export actual traffic image analysis results"
        action={
          <button
            className="primary"
            disabled={history.length === 0}
            onClick={downloadCSV}
          >
            <Download size={18} />
            Download CSV
          </button>
        }
      />

      <div className="small-metrics">
        <MetricCard
          label="Images Analyzed"
          value={String(history.length)}
          icon={Image}
        />

        <MetricCard
          label="Vehicle Detections Across Images"
          value={String(
            history.reduce(
              (sum, record) =>
                sum + record.result.metrics.totalVehicles,
              0
            )
          )}
          icon={Car}
          detail="Not a count of unique vehicles"
        />

        <MetricCard
          label="Completed Analyses"
          value={String(
            history.filter(
              (record) => record.result.status === "completed"
            ).length
          )}
          icon={CheckCircle}
        />
      </div>

      <Card
        title="Previous Analyses"
        description="Actual AI-generated detection records"
        className="mt"
      >
        <HistoryTable history={history} />
      </Card>
    </div>
  );
}

export default function App() {
  const [result, setResult] =
    useState<AnalysisResult | null>(null);

  const [history, setHistory] =
    useState<AnalysisRecord[]>([]);

  const [online, setOnline] = useState(false);

  const location = useLocation();

  const pageTitle =
    navigation.find(
      (item) => item.to === location.pathname
    )?.label ?? "TrafficVision-Net";

  useEffect(() => {
    let active = true;

    async function checkHealth() {
      try {
        const health = await trafficApi.health();

        if (active) {
          setOnline(
            health.status === "online" &&
            health.model_ready === true
          );
        }
      } catch {
        if (active) setOnline(false);
      }
    }

    async function loadHistory() {
      try {
        const response = await fetch(
          `${API_BASE}/api/reports`
        );

        if (!response.ok) return;

        const records = await response.json();

        if (!Array.isArray(records) || !active) return;

        const formatted: AnalysisRecord[] = records
          .filter(
            (item) =>
              item.mock === false &&
              item.metrics &&
              item.annotatedImage
          )
          .map((item) => ({
            id: item.id,
            filename: item.filename,
            date: item.date,
            result: item,
          }));

        setHistory((previous) => {
          const merged = new Map<string, AnalysisRecord>();

          [...formatted, ...previous].forEach((record) =>
            merged.set(record.id, record)
          );

          return [...merged.values()];
        });

        if (formatted.length > 0) {
          setResult(
            (previous) =>
              previous ??
              formatted[formatted.length - 1].result
          );
        }
      } catch {
        // Analysis history is unavailable while backend is offline.
      }
    }

    void checkHealth();
    void loadHistory();

    const interval = setInterval(checkHealth, 15000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  function handleComplete(record: AnalysisRecord) {
    setResult(record.result);

    setHistory((previous) => [
      ...previous.filter((item) => item.id !== record.id),
      record,
    ]);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-head">
          <div className="brand">
            <div className="brand-mark">
              <Activity size={25} />
            </div>

            <div>
              <div className="brand-name">
                TrafficVision-Net
              </div>

              <div className="brand-sub">
                AI Traffic Intelligence
              </div>
            </div>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav className="nav">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
            >
              <Icon size={17} />
              <span>{label}</span>

              <ArrowRight
                className="nav-arrow"
                size={14}
              />
            </NavLink>
          ))}
        </nav>

        <div className="system-status">
          <strong>System Status</strong>

          <span
            style={{
              color: online ? "#34d399" : "#ff7777",
            }}
          >
            {online
              ? "● AI Engine Online"
              : "● AI Engine Unavailable"}
          </span>
        </div>
      </aside>

      <div className="main-wrap">
        <header className="topbar">
          <div>
            <h1>{pageTitle}</h1>

            <div className="operational">
              {online
                ? "● Operational · Real AI inference"
                : "● Backend unavailable"}
            </div>
          </div>

          <div className="top-actions">
            <span
              style={{
                color: online ? "#34d399" : "#ff7777",
                fontSize: 11,
                fontWeight: 700,
                padding: "8px 12px",
                border: "1px solid currentColor",
                borderRadius: 5,
              }}
            >
              {online ? "MODEL CONNECTED" : "OFFLINE"}
            </span>
          </div>
        </header>

        <main className="main">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  result={result}
                  history={history}
                />
              }
            />

            <Route
              path="/video-analysis"
              element={
                <ImageAnalysis
                  onComplete={handleComplete}
                />
              }
            />

            <Route
              path="/detection"
              element={<Detection result={result} />}
            />

            <Route
              path="/analytics"
              element={
                <Analytics
                  result={result}
                  history={history}
                />
              }
            />

            <Route
              path="/forecast"
              element={<Forecast result={result} history={history} />}
            />

            <Route
              path="/evaluation"
              element={<Evaluation result={result} />}
            />

            <Route
              path="/reports"
              element={<Reports history={history} />}
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}