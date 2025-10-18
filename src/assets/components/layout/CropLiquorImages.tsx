import React, { useState, useEffect } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Header from "./Header";
import Footer from "./Footer";
import image1 from "../../images/background2.jpg";

interface CroppedImage {
  file: File;
  previewUrl: string;
  croppedUrl?: string;
  prediction?: string;
  confidence?: number;
  error?: string;
}

const CropLiquorImages: React.FC = () => {
  const [images, setImages] = useState<CroppedImage[]>([]);
  const [isCropping, setIsCropping] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [apiUrl, setApiUrl] = useState<string>(`http://${window.location.hostname}:5000`);

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
      const unique = uploaded.filter((img) => !existingKeys.has(img.file.name + img.file.size));
      return [...prev, ...unique];
    });

    e.target.value = "";
  };

  // Crop all images
  const handleCropAll = async () => {
    if (images.length === 0) return alert("Please upload images first!");
    setIsCropping(true);
    try {
      const results = await Promise.all(
        images.map(async (img) => {
          const formData = new FormData();
          formData.append("file", img.file);

          try {
            const res = await fetch(`${apiUrl}/crop_reflection`, { method: "POST", body: formData });
            if (!res.ok) throw new Error("Cropping failed");
            const data = await res.json();
            return { ...img, croppedUrl: data.cropped_image };
          } catch {
            return { ...img, error: "Cropping failed" };
          }
        })
      );
      setImages(results);
    } finally {
      setIsCropping(false);
    }
  };

  // Predict a single image
  const handlePredictSingle = async (img: CroppedImage) => {
    if (!img.croppedUrl) return alert("No cropped image available for prediction!");
    setIsPredicting(true);
    try {
      const base64 = img.croppedUrl.split(",")[1];
      const blob = new Blob([Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))], { type: "image/png" });
      const croppedFile = new File([blob], img.file.name, { type: "image/png" });

      const formData = new FormData();
      formData.append("file", croppedFile);

      const res = await fetch(`${apiUrl}/predict?type=preprocessed`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Prediction failed");
      const data = await res.json();

      setImages((prev) =>
        prev.map((i) => (i.file.name === img.file.name ? { ...i, prediction: data.prediction, confidence: data.confidence } : i))
      );
    } catch {
      setImages((prev) => prev.map((i) => (i.file.name === img.file.name ? { ...i, error: "Prediction failed" } : i)));
    } finally {
      setIsPredicting(false);
    }
  };

  // Predict all cropped images
  const handlePredictAll = async () => {
    const croppedImgs = images.filter((img) => img.croppedUrl);
    if (croppedImgs.length === 0) return alert("No cropped images to predict!");
    setIsPredicting(true);
    try {
      const results = await Promise.all(
        croppedImgs.map(async (img) => {
          const base64 = img.croppedUrl!.split(",")[1];
          const blob = new Blob([Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))], { type: "image/png" });
          const croppedFile = new File([blob], img.file.name, { type: "image/png" });

          const formData = new FormData();
          formData.append("file", croppedFile);

          const res = await fetch(`${apiUrl}/predict?type=preprocessed`, { method: "POST", body: formData });
          if (!res.ok) throw new Error("Prediction failed");
          const data = await res.json();
          return { ...img, prediction: data.prediction, confidence: data.confidence };
        })
      );

      setImages((prev) =>
        prev.map((img) => {
          const updated = results.find((r) => r.file.name === img.file.name);
          return updated || img;
        })
      );
    } finally {
      setIsPredicting(false);
    }
  };

  // Clear all images
  const handleClear = () => setImages([]);

  // Download single image
  const handleDownloadSingle = (croppedUrl: string, name: string) => {
    const link = document.createElement("a");
    link.href = croppedUrl;
    link.download = `cropped_${name}`;
    link.click();
  };

  // Download all cropped images as ZIP
  const handleDownloadAllZip = async () => {
    const zip = new JSZip();
    const croppedImgs = images.filter((img) => img.croppedUrl);

    if (croppedImgs.length === 0) return alert("No cropped images available!");

    for (const img of croppedImgs) {
      const base64Data = img.croppedUrl!.split(",")[1];
      zip.file(`cropped_${img.file.name}`, base64Data, { base64: true });
    }

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "cropped_images.zip");
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
        <h2 className="mb-4">🍵 Tea Liquor Image Cropper & Predictor</h2>
        <p><strong>Backend:</strong> {apiUrl}</p>

        <div className="card p-4 bg-light text-dark shadow-sm mb-4" style={{ width: "90%", maxWidth: "1000px" }}>
          <h5>Upload Tea Liquor Images (Sequence)</h5>
          <input type="file" accept="image/*" multiple onChange={handleUpload} className="form-control mt-2" />

          <div className="mt-3 d-flex justify-content-start flex-wrap">
            <button className="btn btn-primary me-2 mb-2" onClick={handleCropAll} disabled={isCropping || isPredicting}>
              {isCropping ? "Cropping..." : "✂️ Crop All"}
            </button>
            <button className="btn btn-warning me-2 mb-2" onClick={handlePredictAll} disabled={isPredicting || isCropping}>
              {isPredicting ? "Predicting..." : "🔮 Predict All"}
            </button>
            <button className="btn btn-danger me-2 mb-2" onClick={handleClear}>🗑️ Clear All</button>
            {images.some((img) => img.croppedUrl) && (
              <button className="btn btn-success mb-2" onClick={handleDownloadAllZip}>📦 Download All ZIP</button>
            )}
          </div>
        </div>

        {images.length > 0 && (
          <div className="container mt-4">
            <h4 className="text-white mb-3">📸 Cropping & Prediction Results</h4>
            <table className="table table-dark table-striped table-hover">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Original</th>
                  <th>Cropped</th>
                  <th>Prediction</th>
                  <th>Confidence</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {images.map((img, index) => (
                  <tr key={index}>
                    <td>{img.file.name}</td>
                    <td>
                      <img src={img.previewUrl} alt="original" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "5px" }} />
                    </td>
                    <td>
                      {img.croppedUrl ? (
                        <img src={img.croppedUrl} alt="cropped" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "5px" }} />
                      ) : (
                        <span>{img.error ? "❌ Failed" : "⏳ Waiting"}</span>
                      )}
                    </td>
                    <td>{img.prediction || "-"}</td>
                    <td>{img.confidence ? img.confidence.toFixed(2) : "-"}</td>
                    <td>
                      {img.croppedUrl && (
                        <>
                          <button className="btn btn-sm btn-outline-success me-1" onClick={() => handleDownloadSingle(img.croppedUrl!, img.file.name)}>
                            ⬇️ Download
                          </button>
                          <button className="btn btn-sm btn-outline-warning" onClick={() => handlePredictSingle(img)}>
                            🔮 Predict
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4">
          <button className="btn btn-secondary me-2" onClick={() => (window.location.href = "/dashboard")}>🔙 Dashboard</button>
          <button className="btn btn-dark" onClick={() => (window.location.href = "/")}>🏠 Home</button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CropLiquorImages;
