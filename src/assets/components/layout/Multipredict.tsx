import React, { useState, useEffect, useRef } from "react";
import Header from "./Header";
import Footer from "./Footer";
import image1 from "../../images/background2.jpg";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

const MultiPredict: React.FC = () => {
  const [images, setImages] = useState<ImagePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState<string>("http://10.120.199.186:5000");

  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedUrl = localStorage.getItem("backend_url");
    if (savedUrl) setApiUrl(savedUrl);
  }, []);

  // ✅ Allow unlimited uploads (append + prevent duplicates)
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

  // 🔮 Predict all images
  const handlePredictAll = async () => {
    if (images.length === 0) {
      alert("Please upload at least one image.");
      return;
    }

    setIsLoading(true);
    const updatedResults: ImagePrediction[] = [];

    for (const img of images) {
      const formData = new FormData();
      formData.append("file", img.file);

      try {
        const response = await fetch(`${apiUrl}/predict`, {
          method: "POST",
          body: formData,
        });
        const data: PredictionResponse = await response.json();
        updatedResults.push({ ...img, result: data });
      } catch (error) {
        updatedResults.push({
          ...img,
          result: { error: "Prediction failed" },
        });
      }
    }

    setImages(updatedResults);
    setIsLoading(false);
  };

  const handleClear = () => setImages([]);

  // 🧾 Download table as PDF
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

  // 🖼️ Download table as PNG
  const handleDownloadImage = async () => {
    if (!tableRef.current) return;
    const canvas = await html2canvas(tableRef.current, { scale: 2 });
    const link = document.createElement("a");
    link.download = "tea_region_predictions.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // 📊 Download results as CSV
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

        <div
          className="card p-4 bg-light text-dark shadow-sm mb-4"
          style={{ width: "80%", maxWidth: "900px" }}
        >
          <h5>Upload Multiple Tea Images</h5>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="form-control mt-2"
          />
          <div className="mt-3 d-flex justify-content-center flex-wrap">
            <button
              className="btn btn-primary me-2 mb-2"
              onClick={handlePredictAll}
              disabled={isLoading}
            >
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
                <ul
                  className="dropdown-menu"
                  aria-labelledby="downloadDropdown"
                >
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={handleDownloadImage}
                    >
                      🖼️ Download as Image (PNG)
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={handleDownloadPDF}
                    >
                      📄 Download as PDF
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={handleDownloadCSV}
                    >
                      📊 Download as CSV
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {images.length > 0 && (
          <div
            className="container mt-4 bg-white text-dark p-3 rounded shadow"
            ref={tableRef}
          >
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
                          <span className="fw-bold text-success">
                            {img.result.prediction}
                          </span>
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
         {/* 🔙 Navigation Buttons */}
          <div className="mt-4">
            <button
              className="btn btn-secondary me-2"
              onClick={() => (window.location.href = "/dashboard")}
            >
              🔙 Back to Dashboard
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

export default MultiPredict;
