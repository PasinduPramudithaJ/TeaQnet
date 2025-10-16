import React, { useState, useEffect, useRef } from "react";
import Header from "./Header";
import Footer from "./Footer";
import image1 from "../../images/background2.jpg";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface PredictionResponse {
  prediction?: string;
  confidence?: number;
  probabilities?: Record<string, number>;
  info?: {
    description: string;
    origin: string;
    flavorNotes: string[];
  };
  croppedImage?: string;
  error?: string;
}

interface ImagePrediction {
  file: File;
  previewUrl: string;
  result?: PredictionResponse;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#D885F9", "#FF6B6B"];

const MultiPredict: React.FC = () => {
  const [images, setImages] = useState<ImagePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState<string>("https://tea-region-backend.onrender.com");
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedUrl = localStorage.getItem("backend_url");
    if (savedUrl) setApiUrl(savedUrl);
  }, []);

  // Handle file uploads
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const uploaded = Array.from(files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((prev) => {
      const existingKeys = new Set(prev.map((img) => img.file.name + img.file.size));
      const unique = uploaded.filter(
        (img) => !existingKeys.has(img.file.name + img.file.size)
      );
      return [...prev, ...unique];
    });

    e.target.value = "";
  };

  // Predict all images
  const handlePredictAll = async () => {
    if (images.length === 0) {
      alert("Please upload at least one image.");
      return;
    }

    setIsLoading(true);
    try {
      const promises = images.map(async (img) => {
        const formData = new FormData();
        formData.append("file", img.file);
        try {
          const response = await fetch(`${apiUrl}/predict`, {
            method: "POST",
            body: formData,
          });
          const data: PredictionResponse = await response.json();
          return { ...img, result: data };
        } catch (error) {
          return { ...img, result: { error: "Prediction failed" } };
        }
      });

      const updatedResults = await Promise.all(promises);
      setImages(updatedResults);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => setImages([]);

  // Download table as PDF
  const handleDownloadPDF = async () => {
    if (!tableRef.current) return;
    const canvas = await html2canvas(tableRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save("tea_region_predictions.pdf");
  };

  // Download as PNG
  const handleDownloadImage = async () => {
    if (!tableRef.current) return;
    const canvas = await html2canvas(tableRef.current, { scale: 2 });
    const link = document.createElement("a");
    link.download = "tea_region_predictions.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Download as CSV
  const handleDownloadCSV = () => {
    if (images.length === 0) return;
    const csvHeader = ["Image Name", "Prediction", "Confidence", "Status"];
    const csvRows = images.map((img) => [
      img.file.name,
      img.result?.prediction || "—",
      img.result?.confidence ? (img.result.confidence * 100).toFixed(2) + "%" : "—",
      img.result?.error ? "Failed" : img.result ? "Done" : "Waiting",
    ]);
    const csvContent = [
      csvHeader.join(","),
      ...csvRows.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "tea_region_predictions.csv";
    link.click();
  };

  // === Chart Data Generation ===
  const validResults = images.filter((img) => img.result?.prediction && !img.result?.error);
  const predictionCounts: Record<string, number> = {};
  const confidenceSums: Record<string, number> = {};
  validResults.forEach((img) => {
    const pred = img.result!.prediction!;
    const conf = img.result!.confidence || 0;
    predictionCounts[pred] = (predictionCounts[pred] || 0) + 1;
    confidenceSums[pred] = (confidenceSums[pred] || 0) + conf;
  });

  const pieData = Object.keys(predictionCounts).map((key) => ({
    name: key,
    value: predictionCounts[key],
  }));

  const barData = Object.keys(confidenceSums).map((key) => ({
    name: key,
    avgConfidence: (confidenceSums[key] / predictionCounts[key]) * 100,
  }));

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
        <h2 className="mb-4">Multiple Tea Region Prediction</h2>
        <p>
          <strong>Backend:</strong> {apiUrl}
        </p>

        <div className="card p-4 bg-light text-dark shadow-sm mb-4" style={{ width: "80%", maxWidth: "900px" }}>
          <h5>Upload Multiple Tea Images</h5>
          <input type="file" accept="image/*" multiple onChange={handleUpload} className="form-control mt-2" />
          <div className="mt-3 d-flex justify-content-center flex-wrap">
            <button className="btn btn-primary me-2 mb-2" onClick={handlePredictAll} disabled={isLoading}>
              {isLoading ? "Predicting..." : "🔮 Predict All"}
            </button>
            <button className="btn btn-danger me-2 mb-2" onClick={handleClear}>
              🗑️ Clear All
            </button>

            {images.length > 0 && (
              <div className="dropdown mb-2">
                <button
                  className="btn btn-success dropdown-toggle"
                  type="button"
                  id="downloadDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  ⬇️ Download Results
                </button>
                <ul className="dropdown-menu" aria-labelledby="downloadDropdown">
                  <li>
                    <button className="dropdown-item" onClick={handleDownloadImage}>
                      🖼️ Download as Image (PNG)
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item" onClick={handleDownloadPDF}>
                      📄 Download as PDF
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item" onClick={handleDownloadCSV}>
                      📊 Download as CSV
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* === Charts Section === */}
        {validResults.length > 0 && (
          <div className="container mt-4">
            <h4 className="text-white mb-3">📊 Prediction Summary</h4>
            <div className="row">
              {/* Pie Chart */}
              <div className="col-md-6 mb-4">
                <div className="bg-white rounded p-3 shadow-sm">
                  <h6>🥧 Prediction Distribution</h6>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} label>
                        {pieData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="col-md-6 mb-4">
                <div className="bg-white rounded p-3 shadow-sm">
                  <h6>📈 Average Confidence per Region</h6>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData}>
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="avgConfidence" fill="#82ca9d" barSize={60} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table Section */}
        {images.length > 0 && (
          <div className="container mt-4 bg-white text-dark p-3 rounded shadow" ref={tableRef}>
            <div className="table-responsive">
              <table className="table table-striped table-bordered align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>#</th>
                    <th>Image</th>
                    <th>Image Name</th>
                    <th>Prediction</th>
                    <th>Confidence</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {images.map((img, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td className="text-center">
                        <img
                          src={img.previewUrl}
                          alt={`preview-${i}`}
                          width="80"
                          height="80"
                          style={{
                            objectFit: "cover",
                            borderRadius: "6px",
                            border: "1px solid #ccc",
                          }}
                        />
                      </td>
                      <td>{img.file.name}</td>
                      <td>
                        {img.result?.prediction ? (
                          <span className="fw-bold text-success">{img.result.prediction}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        {img.result?.confidence
                          ? (img.result.confidence * 100).toFixed(2) + "%"
                          : "—"}
                      </td>
                      <td>
                        {img.result?.error ? (
                          <span className="text-danger fw-bold">❌ Failed</span>
                        ) : img.result ? (
                          <span className="text-success fw-bold">✅ Done</span>
                        ) : (
                          <span className="text-warning">⏳ Waiting</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 🔙 Navigation */}
        <div className="mt-4">
          <button className="btn btn-secondary me-2" onClick={() => (window.location.href = "/dashboard")}>
            🔙 Back to Dashboard
          </button>
          <button className="btn btn-dark" onClick={() => (window.location.href = "/")}>
            🏠 Home
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MultiPredict;
