import React, { useState, useRef } from "react";
import Header from "./Header";
import { useNavigate } from "react-router-dom";
import Footer from "./Footer";
import image1 from "../../images/background2.jpg";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

const regions = ["Region","Dimbula Region", "Ruhuna Region", "Sabaragamuwa Region"]; // Example Region options
const grades = ["Grade","BOP", "BOPF", "OP","DUST"]; // Example Grade options

const PolyphenolPredict: React.FC = () => {
  const [data, setData] = useState<PolyRow[]>([]);
  const [results, setResults] = useState<PolyResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiUrl] = useState<string>(`http://${window.location.hostname}:5000`);
  const tableRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // -------------------------- CSV Upload --------------------------
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear previous data/results
    setData([]);
    setResults([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      if (!csv) return;

      const lines = csv.trim().split(/\r?\n/);
      if (lines.length < 2) {
        alert("CSV must contain at least one data row!");
        return;
      }

      const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const regionIdx = header.findIndex((h) => h === "region");
      const gradeIdx = header.findIndex((h) => h === "grade");
      const sampleIdx = header.findIndex((h) => h === "sample");
      const absorbanceIdx = header.findIndex((h) => h.includes("absorbance"));
      const concentrationIdx = header.findIndex((h) => h.includes("concentration"));

      if (absorbanceIdx === -1 || concentrationIdx === -1) {
        alert("CSV must have headers: Absorbance, Concentration");
        return;
      }

      const parsed = lines
        .slice(1)
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

      if (parsed.length === 0) {
        alert("No valid numeric rows found in CSV!");
        return;
      }

      setData(parsed);
      setResults(Array(parsed.length).fill({}));
    };

    reader.readAsText(file);
  };

  // -------------------------- Manual Add --------------------------
  const handleManualAdd = (
    region: string,
    grade: string,
    Absorbance: number,
    Concentration: number
  ) => {
    setData((prev) => [
      ...prev,
      { Region: region, Grade: grade, Sample: `Sample-${prev.length + 1}`, Absorbance, Concentration },
    ]);
    setResults((prev) => [...prev, {}]);
  };

  const handleClear = () => {
    setData([]);
    setResults([]);
  };

  // -------------------------- Download CSV --------------------------
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

  // -------------------------- Download PDF --------------------------
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

  // -------------------------- Predict All --------------------------
  const handlePredictAll = async () => {
    if (data.length === 0) {
      alert("No data to predict!");
      return;
    }
    setIsLoading(true);
    try {
      const payload = data.map((row) => ({
        Absorbance: row.Absorbance,
        Concentration: row.Concentration,
      }));
      const response = await fetch(`${apiUrl}/predict_polyphenol_region`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: payload }),
      });
      const resData: PolyResult[] = await response.json();
      setResults(resData);
    } catch {
      alert("Prediction failed!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div
        className="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center py-5"
        style={{
          backgroundImage: `url(${image1})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "white",
          minHeight: "85vh",
        }}
      >
        <h2 className="mb-3">☕ Polyphenol-based Region Classification</h2>
        <div className="card p-4 bg-light text-dark shadow-sm mb-4" style={{ width: "80%", maxWidth: "900px" }}>
          <h5>Upload Polyphenol Data (CSV)</h5>
          <input
            type="file"
            accept=".csv"
            className="form-control mb-3"
            onChange={handleCSVUpload}
          />

          <h5>Or Add Sample Manually</h5>
          <ManualAddForm onAdd={handleManualAdd} />

          <div className="mt-3 d-flex justify-content-center flex-wrap">
            <button
              className="btn btn-info me-2 mb-2"
              onClick={handlePredictAll}
              disabled={isLoading}
            >
              {isLoading ? "Predicting..." : "🔮 Predict All"}
            </button>

            <button className="btn btn-danger me-2 mb-2" onClick={handleClear}>
              🗑️ Clear All
            </button>

            {results.length > 0 && (
              <>
                <button className="btn btn-success me-2 mb-2" onClick={handleDownloadCSV}>
                  📊 Export CSV
                </button>
                <button className="btn btn-secondary me-2 mb-2" onClick={handleDownloadPDF}>
                  📄 Export PDF
                </button>
              </>
            )}
          </div>
        </div>

        {/* Table */}
        {data.length > 0 && (
          <div
            ref={tableRef}
            className="container mt-4 bg-white text-dark p-3 rounded shadow"
            style={{ maxHeight: "800px", overflowY: "auto" }}
          >
            <table className="table table-bordered align-middle table-striped">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Region</th>
                  <th>Grade</th>
                  <th>Absorbance</th>
                  <th>Concentration</th>
                  <th>Prediction</th>
                  <th>Result</th>
                  <th>Action</th>
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
                        <button
                          className="btn btn-sm btn-info"
                          onClick={async () => {
                            try {
                              const response = await fetch(`${apiUrl}/predict_polyphenol_region`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ data: [{ Absorbance: row.Absorbance, Concentration: row.Concentration }] }),
                              });
                              const resData: PolyResult[] = await response.json();
                              setResults((prev) => {
                                const newResults = [...prev];
                                newResults[i] = resData[0];
                                return newResults;
                              });
                            } catch {
                              alert("Prediction failed for this row!");
                            }
                          }}
                        >
                          🔮 Predict
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4">
          <button 
           className="btn btn-primary me-2"
           onClick={() => navigate(-1)}
            >
          ← Back
       </button>
          <button className="btn btn-dark me-2" onClick={() => (window.location.href = "/dashboard")}>
            Dashboard
          </button>
          <button className="btn btn-secondary" onClick={() => (window.location.href = "/")}>
            🏠 Home
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
};

// -------------------------- Manual Add Form with Dropdowns --------------------------
const ManualAddForm: React.FC<{
  onAdd: (region: string, grade: string, Abs: number, Conc: number) => void;
}> = ({ onAdd }) => {
  const [abs, setAbs] = useState("");
  const [conc, setConc] = useState("");
  const [region, setRegion] = useState(regions[0]);
  const [grade, setGrade] = useState(grades[0]);

  return (
    <div className="d-flex justify-content-center align-items-center mb-3 flex-wrap">
      <select
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        className="form-select me-2 mb-2"
        style={{ maxWidth: "165px" }}
      >
        {regions.map((r, idx) => (
          <option key={idx} value={r}>{r}</option>
        ))}
      </select>

      <select
        value={grade}
        onChange={(e) => setGrade(e.target.value)}
        className="form-select me-2 mb-2"
        style={{ maxWidth: "150px" }}
      >
        {grades.map((g, idx) => (
          <option key={idx} value={g}>{g}</option>
        ))}
      </select>

      <input
        type="number"
        placeholder="Absorbance"
        value={abs}
        onChange={(e) => setAbs(e.target.value)}
        className="form-control me-2 mb-2"
        style={{ maxWidth: "150px" }}
      />
      <input
        type="number"
        placeholder="Concentration"
        value={conc}
        onChange={(e) => setConc(e.target.value)}
        className="form-control me-2 mb-2"
        style={{ maxWidth: "150px" }}
      />
      <button
        className="btn btn-outline-primary mb-2"
        onClick={() => {
          if (abs && conc) {
            onAdd(region, grade, parseFloat(abs), parseFloat(conc));
            setAbs("");
            setConc("");
          }
        }}
      >
        ➕ Add
      </button>
    </div>
  );
};

export default PolyphenolPredict;
