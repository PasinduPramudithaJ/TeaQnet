import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiLogOut, FiCamera, FiGrid, FiLayers, FiScissors,
  FiServer, FiHome, FiSettings, FiCheckCircle, FiAlertCircle, FiActivity
} from "react-icons/fi";
import Header from "./Header";
import Footer from "./Footer";
import image1 from "../../images/background2.jpg";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { motion } from "framer-motion";

interface PredictionResponse {
  prediction?: string;
  confidence?: number;
  error?: string;
}

interface BackendStatus {
  status: string;
  message?: string;
  model_loaded?: boolean;
  cpu?: number;
  memory?: number;
}

const SuperDashboard: React.FC = () => {
  const [apiUrl, setApiUrl] = useState<string>(`http://${window.location.hostname}:5000`);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImageType, setSelectedImageType] = useState<string>("raw");
  const [lastPrediction, setLastPrediction] = useState<PredictionResponse | null>(null);
  const [predictionHistory, setPredictionHistory] = useState<PredictionResponse[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>("Checking...");
  const [backendInfo, setBackendInfo] = useState<BackendStatus | null>(null);

  const navigate = useNavigate();

  // ✅ Health check
  useEffect(() => {
    const checkHealth = async () => {
      const url = `http://${window.location.hostname}:5000`;
      setApiUrl(url);
      try {
        const res = await fetch(`${url}/health`);
        const data = await res.json();
        if (res.status === 200) {
          setConnectionStatus("🟢 Connected");
          setBackendInfo({
            status: data.status,
            message: data.message,
            model_loaded: data.model_loaded,
            cpu: data.cpu,
            memory: data.memory,
          });
        } else {
          setConnectionStatus("🔴 Unreachable");
        }
      } catch {
        setConnectionStatus("🔴 Offline");
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000); // auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // ✅ Image upload
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setLastPrediction(null);
    }
  };

  // ✅ Camera capture
  const handleCapture = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });
      if (photo.webPath) {
        setPreviewUrl(photo.webPath);
        const blob = await fetch(photo.webPath).then((r) => r.blob());
        const file = new File([blob], "captured_photo.jpg", { type: blob.type });
        setSelectedImage(file);
      }
    } catch {
      alert("Camera access failed. Please check permissions.");
    }
  };

  // ✅ Predict
  const handlePredict = async () => {
    if (!selectedImage) return alert("Please select or capture an image first!");
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedImage);
      const res = await fetch(`${apiUrl}/predict?type=${selectedImageType}`, {
        method: "POST",
        body: formData,
      });
      const data: PredictionResponse = await res.json();
      setLastPrediction(data);
      setPredictionHistory((prev) => [data, ...prev.slice(0, 4)]); // keep last 5
    } catch {
      alert("Prediction failed. Check backend or network.");
    }
    setIsLoading(false);
  };

  const handleClear = () => {
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
        className="flex-grow-1 d-flex flex-column align-items-center py-5 text-light"
        style={{
          backgroundImage: `url(${image1})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "88vh",
          position: "relative",
        }}
      >
        {/* Logout */}
        <button
          onClick={handleLogout}
          className="btn btn-danger position-absolute"
          style={{ top: 12, right: 12 }}
        >
          <FiLogOut /> Logout
        </button>

        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-shadow mb-3 text-center">🌿 TeaQnet Admin Dashboard</h2>
          <h6 className="text-shadow mb-3 text-center">Backend: {apiUrl}</h6>
          <h6 className="text-shadow mb-3 text-center">{connectionStatus}</h6>
        </motion.div>

        {/* Backend Status Panel */}
        {backendInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card bg-dark text-light shadow-lg mb-4 p-3 text-center"
            style={{ maxWidth: 600, borderRadius: 20 }}
          >
            <h5><FiActivity /> Backend Health</h5>
            <p className="mb-1">{backendInfo.message}</p>
            {backendInfo.model_loaded ? (
              <span className="badge bg-success"><FiCheckCircle /> Model Loaded</span>
            ) : (
              <span className="badge bg-danger"><FiAlertCircle /> Model Missing</span>
            )}
            {backendInfo.cpu !== undefined && (
              <div className="mt-2 small">
                <p>CPU: {backendInfo.cpu}% | Memory: {backendInfo.memory}%</p>
              </div>
            )}
          </motion.div>
        )}

        <div className="container">
          <div className="row justify-content-center gy-4">
            {/* Image upload card */}
            <motion.div
              className="col-md-5"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="card bg-light text-dark shadow-lg p-4 text-center rounded-4">
                <h5>Select Image Type</h5>
                <select
                  className="form-select mb-3"
                  value={selectedImageType}
                  onChange={(e) => setSelectedImageType(e.target.value)}
                >
                  <option value="raw">Raw (Auto Crop)</option>
                  <option value="preprocessed">Preprocessed (Cropped)</option>
                </select>

                <input
                  type="file"
                  accept="image/*"
                  className="form-control mb-3"
                  onChange={handleUpload}
                />
                <button className="btn btn-warning w-100 mb-2" onClick={handleCapture}>
                  <FiCamera /> Capture Image
                </button>
              </div>
            </motion.div>

            {/* Preview card */}
            {previewUrl && (
              <motion.div
                className="col-md-5"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="card bg-dark text-light shadow-lg p-3 text-center rounded-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="img-fluid rounded mb-3"
                    style={{ maxHeight: "250px", objectFit: "contain" }}
                  />
                  <button
                    className="btn btn-success w-100 mb-2"
                    onClick={handlePredict}
                    disabled={isLoading}
                  >
                    {isLoading ? "Predicting..." : <><FiGrid /> Predict Now</>}
                  </button>
                  <button className="btn btn-danger w-100" onClick={handleClear}>
                    Clear
                  </button>

                  {lastPrediction && (
                    <div className="alert alert-info mt-3 rounded-3">
                      <b>Result:</b> {lastPrediction.prediction || "—"} <br />
                      {lastPrediction.confidence &&
                        <small>Confidence: {(lastPrediction.confidence * 100).toFixed(2)}%</small>}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Prediction history */}
          {predictionHistory.length > 0 && (
            <motion.div
              className="card bg-secondary text-light mt-5 shadow-lg rounded-4 p-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h5>🧾 Recent Predictions</h5>
              <ul className="list-group list-group-flush">
                {predictionHistory.map((item, index) => (
                  <li key={index} className="list-group-item bg-transparent text-light d-flex justify-content-between">
                    <span>{item.prediction}</span>
                    <span>{(item.confidence! * 100).toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Navigation buttons */}
          <motion.div
            className="row justify-content-center mt-5 g-3"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {[
              { label: "Multi Predict", icon: <FiLayers />, route: "/multi", color: "primary" },
              { label: "Crop Tool", icon: <FiScissors />, route: "/crop", color: "info" },
              { label: "Models", icon: <FiServer />, route: "/comparison", color: "secondary" },
              { label: "Settings", icon: <FiSettings />, route: "/settings", color: "warning" },
              { label: "Home", icon: <FiHome />, route: "/", color: "dark" },
            ].map((btn, idx) => (
              <div key={idx} className="col-md-2 col-6">
                <button
                  className={`btn btn-${btn.color} w-100`}
                  onClick={() => navigate(btn.route)}
                >
                  {btn.icon} {btn.label}
                </button>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SuperDashboard;
