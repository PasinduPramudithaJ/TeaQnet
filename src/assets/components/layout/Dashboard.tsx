import React, { useState, useEffect } from "react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import image1 from "../../images/background2.jpg";
import { FiLogOut } from "react-icons/fi"; // 🔑 Import logout icon

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
  const [isLoading, setIsLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState<string>("https://tea-region-backend.onrender.com");
  const [lastPrediction, setLastPrediction] = useState<PredictionResponse | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Check signed-in status
  useEffect(() => {
    const isSignedIn = localStorage.getItem("isSignedIn") === "true";
    if (!isSignedIn) {
      navigate("/login"); // Redirect if not signed in
    }
  }, [navigate]);

  // Restore backend URL from localStorage
  useEffect(() => {
    const savedUrl = localStorage.getItem("backend_url");
    if (savedUrl) setApiUrl(savedUrl);
  }, []);

  // Restore state from Results if user comes back
  useEffect(() => {
    if (location.state) {
      const stateData = location.state as PredictionResponse;
      setLastPrediction(stateData);
      if (stateData.croppedImage) setPreviewUrl(stateData.croppedImage);
    }
  }, [location.state]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setLastPrediction(null);
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
        setLastPrediction(null);
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
      const response = await fetch(`${apiUrl}/predict`, { method: "POST", body: formData });
      const data: PredictionResponse = await response.json();
      if (data.error) throw new Error(data.error);
      navigate("/results", { state: data });
    } catch (err: any) {
      alert("Prediction failed: " + err.message);
    }
    setIsLoading(false);
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setLastPrediction(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("isSignedIn");
    navigate("/");
  };

  return (
    <>
       <Header></Header>
      <div
        className="flex-grow-1 d-flex flex-column align-items-center justify-content-start text-center py-5"
        style={{
          backgroundImage: `url(${image1})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "white",
          minHeight: "80vh",
          position: "relative",
        }}
      >
        {/* 🔝 Logout button at top-right corner */}
        <button
          onClick={handleLogout}
          className="btn btn-danger position-absolute"
          style={{ top: 8, right: 8 }}
          title="Logout"
        >
          <FiLogOut size={12} />
        </button>

        <h2 className="text-center mb-4">Tea Region Dashboard</h2>
        <p>
          <strong>Backend:</strong> {apiUrl}
        </p>

        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-5">
              <div className="card shadow-sm p-3 mb-4 text-center">
                <h5>Upload or Capture Tea Image</h5>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="form-control mt-2"
                />
                <button
                  className="btn btn-warning mt-2"
                  onClick={handleCaptureImage}
                >
                  📷 Capture Photo
                </button>
              </div>
            </div>

            {previewUrl && (
              <div className="col-md-5">
                <div className="card shadow-sm p-3 text-center">
                  <img src={previewUrl} alt="Preview" className="img-fluid rounded mb-3" />
                  <button
                    className="btn btn-primary mb-2"
                    onClick={handlePredict}
                    disabled={isLoading}
                  >
                    {isLoading ? "Predicting..." : "🔮 Predict Region"}
                  </button>
                  <button className="btn btn-danger mt-2" onClick={handleClearImage}>
                    🗑️ Clear Image
                  </button>

                  {lastPrediction?.prediction && (
                    <div className="alert alert-info mt-3">
                      <strong>Last Prediction:</strong> {lastPrediction.prediction}{" "}
                      {lastPrediction.confidence &&
                        `(${(lastPrediction.confidence * 100).toFixed(1)}% confidence)`}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <button
            className="btn btn-primary text-white me-2"
            onClick={() => navigate("/multi")}
          >
            🔮 Multiple Predictions
          </button>
          <button className="btn btn-dark" onClick={() => navigate("/")}>
            🏠 Home
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Dashboard;
