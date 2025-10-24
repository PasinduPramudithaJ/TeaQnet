import React, { useState, useRef } from "react";
import Header from "./Header";
import { useNavigate } from "react-router-dom";
import Footer from "./Footer";
import image1 from "../../images/background2.jpg";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ScatterChart, Scatter
} from "recharts";

interface PolyResult {
  prediction?: string;
  confidence?: number;
  error?: string;
}

interface PolyRow {
  Region?: string;
  Grade?: string;
  Sample?: string;
  Absorbance: number;
  Concentration: number;
}

const regions = ["Region","Dimbula Region", "Ruhuna Region", "Sabaragamuwa Region"];
const grades = ["Grade","BOP", "BOPF", "OP","DUST"];
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA336A"];

const PolyphenolPredict: React.FC = () => {
  const [data, setData] = useState<PolyRow[]>([]);
  const [results, setResults] = useState<PolyResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Multi-backend URLs (local + cloud)
  const [apiUrls] = useState<string[]>([
    `http://${window.location.hostname}:5000`,
    `https://polyphenol-based-region-classification.onrender.com` // <-- replace with your actual deployed API URL
  ]);
  const [activeApiUrl, setActiveApiUrl] = useState(apiUrls[0]);

  const tableRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // ---------------------- CSV Upload ----------------------
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setData([]);
    setResults([]);
    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      if (!csv) return;
      const lines = csv.trim().split(/\r?\n/);
      const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const regionIdx = header.findIndex((h) => h === "region");
      const gradeIdx = header.findIndex((h) => h === "grade");
      const sampleIdx = header.findIndex((h) => h === "sample");
      const absorbanceIdx = header.findIndex((h) => h.includes("absorbance"));
      const concentrationIdx = header.findIndex((h) => h.includes("concentration"));

      const parsed = lines.slice(1)
        .map((line) => line.split(",").map((v) => v.trim()))
        .filter((cols) => cols.length > Math.max(absorbanceIdx, concentrationIdx))
        .map((cols) => ({
          Region: regionIdx !== -1 ? cols[regionIdx] : "",
          Grade: gradeIdx !== -1 ? cols[gradeIdx] : "",
          Sample: sampleIdx !== -1 ? cols[sampleIdx] : "",
          Absorbance: parseFloat(cols[absorbanceIdx]),
          Concentration: parseFloat(cols[concentrationIdx]),
        }))
        .filter((obj) => !isNaN(obj.Absorbance) && !isNaN(obj.Concentration));
      setData(parsed);
      setResults(Array(parsed.length).fill({}));
    };
    reader.readAsText(file);
  };

  const handleManualAdd = (region: string, grade: string, Absorbance: number, Concentration: number) => {
    setData((prev) => [...prev, { Region: region, Grade: grade, Sample: `Sample-${prev.length + 1}`, Absorbance, Concentration }]);
    setResults((prev) => [...prev, {}]);
  };

  const handleClear = () => {
    setData([]);
    setResults([]);
  };

  // ---------------------- Smart Fetch Helper ----------------------
  const smartFetch = async (endpoint: string, body: any) => {
    let response: Response | null = null;
    for (const url of apiUrls) {
      try {
        const res = await fetch(`${url}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          setActiveApiUrl(url);
          response = res;
          break;
        }
      } catch {
        console.warn(`⚠️ Backend failed: ${url}`);
      }
    }
    return response;
  };

  // ---------------------- Predict All ----------------------
  const handlePredictAll = async () => {
    if (data.length === 0) {
      alert("No data to predict!");
      return;
    }
    setIsLoading(true);
    try {
      const payload = { data: data.map((row) => ({ Absorbance: row.Absorbance, Concentration: row.Concentration })) };
      const response = await smartFetch("/predict_polyphenol_region", payload);
      if (!response) throw new Error("All backends offline");
      const resData: PolyResult[] = await response.json();
      setResults(resData);
    } catch {
      alert("❌ Prediction failed on all servers!");
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------- Predict Single ----------------------
  const handlePredictSingle = async (i: number, row: PolyRow) => {
    try {
      const payload = { data: [{ Absorbance: row.Absorbance, Concentration: row.Concentration }] };
      const response = await smartFetch("/predict_polyphenol_region", payload);
      if (!response) throw new Error("All backends failed");
      const resData: PolyResult[] = await response.json();
      setResults((prev) => {
        const newResults = [...prev];
        newResults[i] = resData[0];
        return newResults;
      });
    } catch {
      alert("Prediction failed for this sample!");
    }
  };

  // ---------------------- Download CSV ----------------------
  const handleDownloadCSV = () => {
    if (results.length === 0) return;
    const header = ["Region", "Grade", "Sample", "Absorbance", "Concentration", "Prediction", "Confidence", "Result"];
    const rows = data.map((row, i) => {
      const res = results[i] || {};
      const isCorrect = row.Region === res.prediction;
      return [
        row.Region || "—",
        row.Grade || "—",
        row.Sample || `Sample-${i + 1}`,
        row.Absorbance,
        row.Concentration,
        res.prediction || "—",
        res.confidence ? (res.confidence * 100).toFixed(2) + "%" : "—",
        res.prediction ? (isCorrect ? "✅ Correct" : "❌ Failed") : "—",
      ];
    });
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "polyphenol_predictions.csv";
    link.click();
  };

  // ---------------------- Download PDF ----------------------
  const handleDownloadPDF = async () => {
    if (!tableRef.current) return;
    const canvas = await html2canvas(tableRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save("polyphenol_predictions.pdf");
  };

  // ---------------------- Visualization Data ----------------------
  const barData = regions.slice(1).map((r) => {
    const filtered = data.filter((d) => d.Region === r);
    return {
      Region: r,
      Absorbance: filtered.reduce((a, c) => a + c.Absorbance, 0) / (filtered.length || 1),
      Concentration: filtered.reduce((a, c) => a + c.Concentration, 0) / (filtered.length || 1),
    };
  });

  const gradeCounts = grades.slice(1).map((g) => ({
    Grade: g,
    count: data.filter((d) => d.Grade === g).length,
  }));

  // ---------------------- UI ----------------------
  return (
    <>
      <Header />
      <div
        className="flex-grow-1 d-flex flex-column align-items-center text-center py-5"
        style={{ backgroundImage: `url(${image1})`, backgroundSize: "cover", backgroundPosition: "center", color: "white", minHeight: "85vh" }}
      >
        <h2 className="mb-3">☕ Polyphenol-based Region Classification</h2>
        <h6 style={{ color: "#0f0" }}>Active Backend: {activeApiUrl}</h6>

        <div className="card p-4 bg-light text-dark shadow-sm mb-4" style={{ width: "80%", maxWidth: "900px" }}>
          <h5>Upload Polyphenol Data (CSV)</h5>
          <input type="file" accept=".csv" className="form-control mb-3" onChange={handleCSVUpload} />
          <h5>Or Add Sample Manually</h5>
          <ManualAddForm onAdd={handleManualAdd} />
          <div className="mt-3 d-flex justify-content-center flex-wrap">
            <button className="btn btn-info me-2 mb-2" onClick={handlePredictAll} disabled={isLoading}>
              {isLoading ? "Predicting..." : "🔮 Predict All"}
            </button>
            <button className="btn btn-danger me-2 mb-2" onClick={handleClear}>🗑️ Clear All</button>
            {results.length > 0 && <>
              <button className="btn btn-success me-2 mb-2" onClick={handleDownloadCSV}>📊 Export CSV</button>
              <button className="btn btn-secondary me-2 mb-2" onClick={handleDownloadPDF}>📄 Export PDF</button>
            </>}
          </div>
        </div>

        {/* Visualization Section */}
        {data.length > 0 && (
          <div className="p-4 mb-5 shadow rounded bg-white">
            <h4 style={{ color: "black", textAlign: "center", marginBottom: "20px" }}>📊 Polyphenol Data Visualizations</h4>
            <div className="d-flex flex-column flex-md-row flex-nowrap" style={{ gap: "30px", overflowX: "auto" }}>
              {/* Bar Chart */}
              <div className="flex-shrink-0">
                <h5 style={{ color: "black", textAlign: "center" }}>📊 Avg Absorbance & Concentration</h5>
                <BarChart width={400} height={300} data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="Region" tick={{ fill: "black" }} />
                  <YAxis tick={{ fill: "black" }} />
                  <Tooltip contentStyle={{ color: "black" }} />
                  <Legend />
                  <Bar dataKey="Absorbance" fill="#8884d8" />
                  <Bar dataKey="Concentration" fill="#82ca9d" />
                </BarChart>
              </div>

              {/* Pie Chart */}
              <div className="flex-shrink-0">
                <h5 style={{ color: "black", textAlign: "center" }}>🥧 Sample Distribution by Grade</h5>
                <PieChart width={300} height={300}>
                  <Pie data={gradeCounts} dataKey="count" nameKey="Grade" cx="50%" cy="50%" outerRadius={100}>
                    {gradeCounts.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </div>

              {/* Scatter Chart */}
              <div className="flex-shrink-0">
                <h5 style={{ color: "black", textAlign: "center" }}>⚡ Absorbance vs Concentration</h5>
                <ScatterChart width={400} height={300}>
                  <CartesianGrid />
                  <XAxis type="number" dataKey="Absorbance" tick={{ fill: "black" }} />
                  <YAxis type="number" dataKey="Concentration" tick={{ fill: "black" }} />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter name="Samples" data={data} fill="#8884d8" />
                </ScatterChart>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        {data.length > 0 && (
          <div ref={tableRef} className="container mt-4 bg-white text-dark p-3 rounded shadow" style={{ maxHeight: "800px", overflowY: "auto" }}>
            <table className="table table-bordered align-middle table-striped">
              <thead className="table-dark">
                <tr>
                  <th>#</th><th>Region</th><th>Grade</th><th>Absorbance</th><th>Concentration</th><th>Prediction</th><th>Result</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => {
                  const res = results[i] || {};
                  const isCorrect = row.Region === res.prediction;
                  return (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{row.Region || "—"}</td>
                      <td>{row.Grade || "—"}</td>
                      <td>{row.Absorbance}</td>
                      <td>{row.Concentration}</td>
                      <td>{res.prediction || "—"}</td>
                      <td>{res.prediction ? (isCorrect ? "✅ Correct" : "❌ Failed") : "—"}</td>
                      <td>
                        <button className="btn btn-sm btn-info" onClick={() => handlePredictSingle(i, row)}>🔮 Predict</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4">
          <button className="btn btn-primary me-2" onClick={() => navigate(-1)}>← Back</button>
          <button className="btn btn-dark me-2" onClick={() => navigate("/dashboard")}>Dashboard</button>
          <button className="btn btn-secondary" onClick={() => navigate("/")}>🏠 Home</button>
        </div>
      </div>
      <Footer />
    </>
  );
};

// ---------------------- Manual Add Form ----------------------
const ManualAddForm: React.FC<{ onAdd: (region: string, grade: string, Abs: number, Conc: number) => void }> = ({ onAdd }) => {
  const [abs, setAbs] = useState("");
  const [conc, setConc] = useState("");
  const [region, setRegion] = useState(regions[0]);
  const [grade, setGrade] = useState(grades[0]);

  return (
    <div className="d-flex justify-content-center align-items-center mb-3 flex-wrap">
      <select value={region} onChange={(e) => setRegion(e.target.value)} className="form-select me-2 mb-2" style={{ maxWidth: "165px" }}>
        {regions.map((r, idx) => <option key={idx} value={r}>{r}</option>)}
      </select>
      <select value={grade} onChange={(e) => setGrade(e.target.value)} className="form-select me-2 mb-2" style={{ maxWidth: "150px" }}>
        {grades.map((g, idx) => <option key={idx} value={g}>{g}</option>)}
      </select>
      <input type="number" placeholder="Absorbance" value={abs} onChange={(e) => setAbs(e.target.value)} className="form-control me-2 mb-2" style={{ maxWidth: "150px" }} />
      <input type="number" placeholder="Concentration" value={conc} onChange={(e) => setConc(e.target.value)} className="form-control me-2 mb-2" style={{ maxWidth: "150px" }} />
      <button className="btn btn-outline-primary mb-2" onClick={() => { if(abs && conc){ onAdd(region, grade, parseFloat(abs), parseFloat(conc)); setAbs(""); setConc(""); } }}>➕ Add</button>
    </div>
  );
};

export default PolyphenolPredict;
