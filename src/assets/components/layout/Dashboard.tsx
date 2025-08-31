import React, { useState } from "react";
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
  error?: string;
}

interface RegionInfo {
  description: string;
  origin: string;
  flavorNotes: string[];
}

// Info for each tea region
const regionData: Record<string, RegionInfo> = {
  Sabaragamuwa: {
    description: "Known for strong aroma and dark color.",
    origin: "Sabaragamuwa province",
    flavorNotes: ["Malty", "Earthy", "Rich"],
  },
  Central: {
    description: "Balanced flavor, bright color.",
    origin: "Central highlands",
    flavorNotes: ["Floral", "Light", "Aromatic"],
  },
  Southern: {
    description: "Smooth taste, golden color.",
    origin: "Southern lowlands",
    flavorNotes: ["Sweet", "Mellow", "Smooth"],
  },
};

const Dashboard: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [probabilities, setProbabilities] = useState<Record<string, number> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Upload image from device
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setPrediction(null);
      setConfidence(null);
      setProbabilities(null);
    }
  };

  // Capture image using camera
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
        setPrediction(null);
        setConfidence(null);
        setProbabilities(null);
      }
    } catch (error) {
      console.error("Camera error:", error);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  // Predict region
  const handlePredict = async () => {
    if (!selectedImage) {
      alert("Please upload or capture an image first.");
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", selectedImage);

    const urls = [
      "http://localhost:5000/predict",
      "http://10.215.59.186:5000/predict",
    ];

    let data: PredictionResponse | null = null;
    let errorMsg = "";

    for (const serverUrl of urls) {
      try {
        const response = await fetch(serverUrl, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          errorMsg = `Server responded with status ${response.status}`;
          continue;
        }

        data = await response.json();
        break;
      } catch (error) {
        console.error(`Error connecting to ${serverUrl}:`, error);
        errorMsg = String(error);
      }
    }

    if (data && data.prediction) {
      setPrediction(data.prediction);
      setConfidence(data.confidence || null);
      setProbabilities(data.probabilities || null);
    } else {
      alert("Prediction failed: " + (data?.error || errorMsg || "Unknown error"));
    }

    setIsLoading(false);
  };

  // Clear selected image
  const handleClearImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setPrediction(null);
    setConfidence(null);
    setProbabilities(null);
  };

  // Prepare chart data
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
        <div className="container">
          <div className="row justify-content-center">
            {/* Upload / Capture Card */}
            <div className="col-md-5">
              <div className="card shadow-sm p-3 mb-4 text-center">
                <h5>Upload or Capture Tea Image</h5>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="form-control mt-2"
                />
                <button className="btn btn-warning mt-2" onClick={handleCaptureImage}>
                  📷 Capture Photo
                </button>
              </div>
            </div>

            {/* Preview & Prediction Card */}
            {previewUrl && (
              <div className="col-md-5">
                <div className="card shadow-sm p-3 text-center">
                  <img src={previewUrl} alt="Preview" className="img-fluid rounded mb-3" />
                  <button className="btn btn-primary mb-2" onClick={handlePredict} disabled={isLoading}>
                    {isLoading ? "Predicting..." : "🔮 Predict Region"}
                  </button>

                  {prediction && (
                    <div className="alert alert-success mt-2">
                      ✅ Prediction: <strong>{prediction}</strong>
                      {confidence && <span> ({(confidence * 100).toFixed(1)}% confident)</span>}
                    </div>
                  )}

                  {/* Extra region info */}
                  {prediction && regionData[prediction] && (
                    <div className="card mt-2 p-2 bg-light text-dark">
                      <h6>About {prediction}</h6>
                      <p>{regionData[prediction].description}</p>
                      <p>
                        <strong>Origin:</strong> {regionData[prediction].origin}
                      </p>
                      <p>
                        <strong>Flavor Notes:</strong>{" "}
                        {regionData[prediction].flavorNotes.join(", ")}
                      </p>
                    </div>
                  )}

                  {/* Probability Chart */}
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

          {/* Navigation */}
          <div className="text-center mt-4">
            <button className="btn btn-success" onClick={() => navigate("/")}>
              ⬅️ Back to Home
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Dashboard;
