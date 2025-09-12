import React, { useState, useEffect } from "react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import image1 from "../../images/background2.jpg";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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

const Dashboard: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [probabilities, setProbabilities] = useState<Record<string, number> | null>(null);
  const [info, setInfo] = useState<any>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState<string>("http://localhost:5000"); // default
  const navigate = useNavigate();

  useEffect(() => {
    const savedUrl = localStorage.getItem("backend_url");
    if (savedUrl) {
      setApiUrl(savedUrl);
    }
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      resetResults();
    }
  };

  const handleCaptureImage = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      if (photo.webPath) {
        setPreviewUrl(photo.webPath);
        const response = await fetch(photo.webPath);
        const blob = await response.blob();
        const file = new File([blob], "captured_photo.jpg", { type: blob.type });
        setSelectedImage(file);
        resetResults();
      }
    } catch (error) {
      console.error("Camera error:", error);
      alert("Unable to access camera.");
    }
  };

  const handlePredict = async () => {
    if (!selectedImage) {
      alert("Please upload or capture an image first.");
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", selectedImage);

    try {
      const response = await fetch(`${apiUrl}/predict`, {
        method: "POST",
        body: formData,
      });
      const data: PredictionResponse = await response.json();

      if (data.error) throw new Error(data.error);

      setPrediction(data.prediction || null);
      setConfidence(data.confidence || null);
      setProbabilities(data.probabilities || null);
      setInfo(data.info || null);
      setCroppedImage(data.croppedImage || null);
    } catch (err: any) {
      alert("Prediction failed: " + err.message);
    }

    setIsLoading(false);
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    resetResults();
  };

  const resetResults = () => {
    setPrediction(null);
    setConfidence(null);
    setProbabilities(null);
    setInfo(null);
    setCroppedImage(null);
  };

  const chartData = probabilities
    ? {
        labels: Object.keys(probabilities),
        datasets: [
          {
            label: "Prediction Probability",
            data: Object.values(probabilities).map((v) => v * 100),
            backgroundColor: "rgba(75, 192, 192, 0.6)",
          },
        ],
      }
    : null;

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
          minHeight: "60vh",
        }}
      >
        <h2 className="text-center mb-4">Tea Region Dashboard</h2>
        <p><strong>Backend:</strong> {apiUrl}</p>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-5">
              <div className="card shadow-sm p-3 mb-4 text-center">
                <h5>Upload or Capture Tea Image</h5>
                <input type="file" accept="image/*" onChange={handleUpload} className="form-control mt-2" />
                <button className="btn btn-warning mt-2" onClick={handleCaptureImage}>
                  📷 Capture Photo
                </button>
              </div>
            </div>

            {previewUrl && (
              <div className="col-md-5">
                <div className="card shadow-sm p-3 text-center">
                  <img src={previewUrl} alt="Preview" className="img-fluid rounded mb-3" />
                  <button className="btn btn-primary mb-2" onClick={handlePredict} disabled={isLoading}>
                    {isLoading ? "Predicting..." : "🔮 Predict Region"}
                  </button>

                  {croppedImage && (
                    <div className="mt-3">
                      <h6>Cropped Image:</h6>
                      <img src={croppedImage} alt="Cropped" className="img-fluid rounded mb-3" />
                    </div>
                  )}

                  {prediction && (
                    <div className="alert alert-success mt-2">
                      ✅ Prediction: <strong>{prediction}</strong>{" "}
                      {confidence && <span>({(confidence * 100).toFixed(1)}% confident)</span>}
                    </div>
                  )}

                  {info && (
                    <div className="card mt-2 p-2 bg-light text-dark">
                      <h6>About {prediction}</h6>
                      <p>{info.description}</p>
                      <p><strong>Origin:</strong> {info.origin}</p>
                      <p><strong>Flavor Notes:</strong> {info.flavorNotes?.join(", ")}</p>
                    </div>
                  )}

                  {chartData && (
                    <div className="mt-3">
                      <Bar data={chartData} options={{ responsive: true }} />
                    </div>
                  )}

                  <button className="btn btn-danger mt-2" onClick={handleClearImage}>
                    🗑️ Clear Image
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="text-center mt-4">
            <button className="btn btn-success me-2" onClick={() => navigate("/")}>
              ⬅️ Back to Home
            </button>
            <button className="btn btn-info" onClick={() => navigate("/settings")}>
              ⚙️ API Settings
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Dashboard;
