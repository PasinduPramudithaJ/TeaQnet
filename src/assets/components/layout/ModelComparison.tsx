import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import image1 from "../../images/background2.jpg";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
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
  error?: string;
}

interface ImagePrediction {
  file: File;
  previewUrl: string;
  resultResNet18?: PredictionResponse;
  resultResNet4?: PredictionResponse;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#D885F9", "#FF6B6B"];

const ModelComparison: React.FC = () => {
  const [images, setImages] = useState<ImagePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rowLoadingIndex, setRowLoadingIndex] = useState<number | null>(null);
  const [apiUrl, setApiUrl] = useState<string>(`http://${window.location.hostname}:5000`);
  const [selectedImageType, setSelectedImageType] = useState<string>("raw");
  const tableRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();


  useEffect(() => {
    const savedUrl = localStorage.getItem("backend_url");
    if (savedUrl) setApiUrl(savedUrl);
  }, []);

  // Upload images
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const uploaded = Array.from(files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages((prev) => {
      const existingKeys = new Set(prev.map((img) => img.file.name + img.file.size));
      const unique = uploaded.filter((img) => !existingKeys.has(img.file.name + img.file.size));
      return [...prev, ...unique];
    });
    e.target.value = "";
  };

  // Predict all images using both models
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

        const fetchModel = async (modelName: string): Promise<PredictionResponse> => {
          try {
            const res = await fetch(
              `${apiUrl}/predict?model=${modelName}&type=${selectedImageType}`,
              { method: "POST", body: formData }
            );
            return await res.json();
          } catch {
            return { error: "Prediction failed" };
          }
        };

        const [resNet18, resNet4] = await Promise.all([
          fetchModel("tea_4_region_model_restnet18"),
          fetchModel("tea_4_region_model_restnet4"),
        ]);

        return { ...img, resultResNet18: resNet18, resultResNet4: resNet4 };
      });

      const updatedResults = await Promise.all(promises);
      setImages(updatedResults);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Predict a single image (per-row)
  const handlePredictSingle = async (index: number) => {
    const img = images[index];
    if (!img) return;

    setRowLoadingIndex(index);
    try {
      const formData = new FormData();
      formData.append("file", img.file);

      const fetchModel = async (modelName: string): Promise<PredictionResponse> => {
        try {
          const res = await fetch(
            `${apiUrl}/predict?model=${modelName}&type=${selectedImageType}`,
            { method: "POST", body: formData }
          );
          return await res.json();
        } catch {
          return { error: "Prediction failed" };
        }
      };

      const [resNet18, resNet4] = await Promise.all([
        fetchModel("tea_4_region_model_restnet18"),
        fetchModel("tea_4_region_model_restnet4"),
      ]);

      setImages((prev) => {
        const updated = [...prev];
        updated[index] = { ...img, resultResNet18: resNet18, resultResNet4: resNet4 };
        return updated;
      });
    } catch {
      setImages((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...img,
          resultResNet18: { error: "Prediction failed" },
          resultResNet4: { error: "Prediction failed" },
        };
        return updated;
      });
    } finally {
      setRowLoadingIndex(null);
    }
  };

  const handleClear = () => setImages([]);

  // Charts
  const validResults = images.filter(
    (img) => img.resultResNet18?.prediction && img.resultResNet4?.prediction
  );

  const agreementCount = {
    agree: validResults.filter((img) => img.resultResNet18?.prediction === img.resultResNet4?.prediction).length,
    disagree: validResults.filter((img) => img.resultResNet18?.prediction !== img.resultResNet4?.prediction).length,
  };

  const pieData = [
    { name: "Agreement", value: agreementCount.agree },
    { name: "Disagreement", value: agreementCount.disagree },
  ];

  const barData = validResults.map((img) => ({
    name: img.file.name,
    resnet18: img.resultResNet18?.confidence ? img.resultResNet18.confidence * 100 : 0,
    resnet4: img.resultResNet4?.confidence ? img.resultResNet4.confidence * 100 : 0,
  }));

  // Download PDF
  const handleDownloadPDF = async () => {
    if (!tableRef.current) return;
    const canvas = await html2canvas(tableRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save("model_comparison.pdf");
  };

   // Download as CSV
  const handleDownloadCSV = () => {
    if (images.length === 0) return;
    const csvHeader = ["Image Name", "Restnet18 Prediction", "Restnet18 Confidence", "Restnet4 Prediction", "Restnet4 Confidence", "Status"];
    const csvRows = images.map((img) => [
      img.file.name,
      img.resultResNet18?.prediction || "—",
      img.resultResNet18?.confidence ? (img.resultResNet18.confidence * 100).toFixed(2) + "%" : "—",
      img.resultResNet4?.prediction || "—",
      img.resultResNet4?.confidence ? (img.resultResNet4.confidence * 100).toFixed(2) + "%" : "—",
      img.resultResNet18?.error ? "Failed" : img.resultResNet18 ? "Done" : "Waiting",
    ]);
    const csvContent = [csvHeader.join(","), ...csvRows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "tea_model_comparisonpredictions.csv";
    link.click();
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
        <h2 className="mb-4">Model Comparison</h2>

        <div className="card p-4 bg-light text-dark shadow-sm mb-4" style={{ width: "80%", maxWidth: "900px" }}>
          <h5>Select Image Type</h5>
          <div className="dropdown mb-3">
            <button
              className="btn btn-secondary dropdown-toggle"
              type="button"
              id="imageTypeDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              {selectedImageType === "raw" ? "Raw Image (Auto Crop)" : "Preprocessed (Already Cropped)"}
            </button>
            <ul className="dropdown-menu" aria-labelledby="imageTypeDropdown">
              <li>
                <button className="dropdown-item" type="button" onClick={() => setSelectedImageType("raw")}>
                  Raw Image (Auto Crop)
                </button>
              </li>
              <li>
                <button className="dropdown-item" type="button" onClick={() => setSelectedImageType("preprocessed")}>
                  Preprocessed (Already Cropped)
                </button>
              </li>
            </ul>
          </div>

          <h5>Upload Multiple Tea Images</h5>
          <input type="file" accept="image/*" multiple onChange={handleUpload} className="form-control mt-2" />

          <div className="mt-3 d-flex justify-content-center flex-wrap">
            <button className="btn btn-primary me-2 mb-2" onClick={handlePredictAll} disabled={isLoading}>
              {isLoading ? "Predicting..." : "🔮 Predict All"}
            </button>
            <button className="btn btn-danger me-2 mb-2" onClick={handleClear}>🗑️ Clear All</button>
            {images.length > 0 && (
              <><button
                className="btn btn-success me-2 mb-2 dropdown-toggle"
                type="button"
                id="downloadDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                ⬇️ Download Results
              </button><ul className="dropdown-menu" aria-labelledby="downloadDropdown">
                  <li><button className="dropdown-item" onClick={handleDownloadPDF}>📄 PDF</button></li>
                  <li><button className="dropdown-item" onClick={handleDownloadCSV}>📊 CSV</button></li>
                </ul></>
            )}
          </div>
        </div>

        {/* Charts */}
        {validResults.length > 0 && (
          <div className="container mt-4">
            <h4 className="text-white mb-3">📊 Model Comparison Summary</h4>
            <div className="row">
              <div className="col-md-6 mb-4">
                <div className="bg-white rounded p-3 shadow-sm">
                  <h6>🥧 Agreement vs Disagreement</h6>
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

              <div className="col-md-6 mb-4">
                <div className="bg-white rounded p-3 shadow-sm">
                  <h6>📈 Confidence Comparison per Image</h6>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData}>
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="resnet18" fill="#82ca9d" name="ResNet18" />
                      <Bar dataKey="resnet4" fill="#8884d8" name="ResNet4" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Scrollable Table with Predict per Row */}
        {images.length > 0 && (
          <div
            className="container mt-4 bg-white text-dark p-3 rounded shadow"
            ref={tableRef}
            style={{
              maxHeight: images.length > 10 ? "1020px" : "auto",
              overflowY: images.length > 10 ? "scroll" : "visible",
            }}
          >
            <div className="table-responsive">
              <table className="table table-striped table-bordered align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>#</th>
                    <th>Image</th>
                    <th>Image Name</th>
                    <th>ResNet18 Prediction</th>
                    <th>ResNet18 Confidence</th>
                    <th>ResNet4 Prediction</th>
                    <th>ResNet4 Confidence</th>
                    <th>Status</th>
                    <th>Action</th>
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
                      <td>{img.resultResNet18?.prediction || "—"}</td>
                      <td>
                        {img.resultResNet18?.confidence
                          ? (img.resultResNet18.confidence * 100).toFixed(2) + "%"
                          : "—"}
                      </td>
                      <td>{img.resultResNet4?.prediction || "—"}</td>
                      <td>
                        {img.resultResNet4?.confidence
                          ? (img.resultResNet4.confidence * 100).toFixed(2) + "%"
                          : "—"}
                      </td>
                      <td>
                        {img.resultResNet18?.error || img.resultResNet4?.error
                          ? "❌ Failed"
                          : img.resultResNet18 && img.resultResNet4
                          ? "✅ Done"
                          : "⏳ Waiting"}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          disabled={rowLoadingIndex === i}
                          onClick={() => handlePredictSingle(i)}
                        >
                          {rowLoadingIndex === i ? "⏳ Predicting..." : "🔮 Predict"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-4">
      <button 
           className="btn btn-primary me-2"
           onClick={() => navigate(-1)}
            >
          ← Back
       </button>
          <button
            className="btn btn-secondary me-2"
            onClick={() => (window.location.href = "/dashboard")}
          >
            Dashboard
          </button>
          <button
            className="btn btn-dark"
            onClick={() => (window.location.href = "/")}
          >
            🏠 Home
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ModelComparison;
