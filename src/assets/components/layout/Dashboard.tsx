import React, { useState, useEffect } from "react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import image1 from "../../images/background2.jpg";
import { FiLogOut, FiCamera, FiRefreshCw, FiGrid } from "react-icons/fi";

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
  const [apiUrl, setApiUrl] = useState<string>(`http://${window.location.hostname}:5000`);
  const [lastPrediction, setLastPrediction] = useState<PredictionResponse | null>(null);
  const [selectedImageType, setSelectedImageType] = useState<string>("raw");

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isSignedIn = localStorage.getItem("isSignedIn") === "true";
    if (!isSignedIn) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    const savedUrl = localStorage.getItem("backend_url");
    if (savedUrl) setApiUrl(savedUrl);
  }, []);

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
    if (!selectedImage) return alert("Please upload or capture an image first.");

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", selectedImage);

    try {
      const response = await fetch(`${apiUrl}/predict?type=${selectedImageType}`, {
        method: "POST",
        body: formData,
      });
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
      <Header />
      <div
        className="flex-grow-1 d-flex flex-column align-items-center justify-content-start py-5"
        style={{
          backgroundImage: `url(${image1})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "85vh",
          position: "relative",
          color: "#fff",
        }}
      >
        {/* Logout */}
        <button
          onClick={handleLogout}
          className="btn btn-danger position-absolute"
          style={{ top: 12, right: 12 }}
          title="Logout"
        >
          <FiLogOut size={18} /> Logout
        </button>

        <h2 className="text-center mb-4 text-shadow">🍵 Tea Region Dashboard</h2>

        <div className="container">
          <div className="row justify-content-center gy-4">
            {/* Image selection card */}
            <div className="col-md-5">
              <div className="card shadow-lg p-4 bg-light text-dark text-center">
                <h5 className="mb-3">Select Image Type</h5>
                <div className="dropdown mb-3">
                  <button
                    className="btn btn-secondary dropdown-toggle w-100"
                    type="button"
                    id="imageTypeDropdown"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {selectedImageType === "raw" ? "Raw Image (Auto Crop)" : "Preprocessed (Cropped)"}
                  </button>
                  <ul className="dropdown-menu w-100" aria-labelledby="imageTypeDropdown">
                    <li>
                      <button className="dropdown-item" onClick={() => setSelectedImageType("raw")}>
                        Raw Image (Auto Crop)
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item" onClick={() => setSelectedImageType("preprocessed")}>
                        Preprocessed (Already Cropped)
                      </button>
                    </li>
                  </ul>
                </div>

                <h5>Upload or Capture Tea Image</h5>
                <input type="file" accept="image/*" onChange={handleUpload} className="form-control mt-2" />
                <button className="btn btn-warning mt-2 w-100 d-flex align-items-center justify-content-center gap-2" onClick={handleCaptureImage}>
                  <FiCamera /> Capture Photo
                </button>
              </div>
            </div>

            {/* Preview and actions card */}
            {previewUrl && (
              <div className="col-md-5">
                <div className="card shadow-lg p-3 bg-dark text-light text-center">
                  <div className="preview-container mb-3" style={{ position: "relative" }}>
                    <img src={previewUrl} alt="Preview" className="img-fluid rounded" style={{ maxHeight: "300px", objectFit: "contain" }} />
                  </div>

                  <button
                    className="btn btn-primary mb-2 w-100 d-flex align-items-center justify-content-center gap-2"
                    onClick={handlePredict}
                    disabled={isLoading}
                  >
                    {isLoading ? "Predicting..." : <><FiGrid /> Predict Region</>}
                  </button>
                  <button className="btn btn-danger mt-2 w-100 d-flex align-items-center justify-content-center gap-2" onClick={handleClearImage}>
                    <FiRefreshCw /> Clear Image
                  </button>

                  {lastPrediction?.prediction && (
                    <div className="alert alert-info mt-3">
                      <strong>Last Prediction:</strong> {lastPrediction.prediction}{" "}
                      {lastPrediction.confidence && `(${(lastPrediction.confidence * 100).toFixed(1)}% confidence)`}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="d-flex justify-content-center mt-4 gap-3 flex-wrap">
            <button className="btn btn-primary me-2" onClick={() => navigate(-1)}>← Back</button>
            <button className="btn btn-success w-auto d-flex align-items-center gap-2" onClick={() => navigate("/multi")}>
              🔮 Multiple Predictions
            </button>
            <button className="btn btn-info w-auto d-flex align-items-center gap-2" onClick={() => navigate("/crop")}>
              ✂️ Go to Crop Page
            </button>
            <button className="btn btn-dark w-auto" onClick={() => navigate("/")}>
              🏠 Home
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Dashboard;
