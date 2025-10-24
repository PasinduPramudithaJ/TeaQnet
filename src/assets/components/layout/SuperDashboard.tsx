import React, { JSX, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiLogOut, FiLayers, FiScissors,
  FiServer, FiHome, FiSettings, FiCheckCircle, FiAlertCircle, FiActivity,
  FiGrid
} from "react-icons/fi";
import Header from "./Header";
import Footer from "./Footer";
import image1 from "../../images/background2.jpg";
import { motion } from "framer-motion";


interface BackendStatus {
  status: string;
  message?: string;
  model_loaded?: boolean;
  cpu?: number;
  memory?: number;
}

interface FeatureBlock {
  label: string;
  icon: JSX.Element;
  route: string;
  color: string;
  description: string;
}

const featureBlocks: FeatureBlock[] = [
  { label: "Single Predict", icon: <FiActivity />, route: "/dashboard", color: "success", description: "Perform prediction for a single tea liquor sample." },
  { label: "Multi Predict", icon: <FiLayers />, route: "/multi", color: "primary", description: "Upload multiple images for batch prediction." },
  { label: "Crop & Predict Tool", icon: <FiScissors />, route: "/crop", color: "info", description: "Crop and preprocess your images before prediction." },
  { label: "Model Comparison", icon: <FiServer />, route: "/comparison", color: "secondary", description: "Compare different models and their performance." },
  { label: "API Settings", icon: <FiSettings />, route: "/settings", color: "warning", description: "Change API and model settings (Admin Only)" },
   { label: "Polyphenol Based Predict", icon: <FiGrid />, route: "/polyphenol", color: "success", description: "Predict polyphenol content from tea leaf images." },
  { label: "Home", icon: <FiHome />, route: "/", color: "dark", description: "Return to the main homepage. New features coming soon!" },
];

const SuperDashboard: React.FC = () => {
  const [apiUrl, setApiUrl] = useState<string>(`http://${window.location.hostname}:5000`);
  const [connectionStatus, setConnectionStatus] = useState<string>("Checking...");
  const [backendInfo, setBackendInfo] = useState<BackendStatus | null>(null);

  const navigate = useNavigate();

  // Health check
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
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);





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
          <h2 className="text-shadow mb-3 text-center">🌿 TeaQnet Admin</h2>
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

        {/* Feature Blocks */}
        <div className="container mt-4">
          <div className="row justify-content-center g-4">
            {featureBlocks.map((block, idx) => (
              <div key={idx} className="col-md-3 col-6">
                <motion.div
                   whileHover={{ scale: 1.05 }}
                   className={`card text-light shadow-lg p-4 rounded-4 text-center bg-${block.color}`}
                   style={{ cursor: "pointer", minHeight: "220px" }}
>
           <div className="display-4 mb-3">{block.icon}</div>
              <h5>{block.label}</h5>
               <p className="small">{block.description}</p>
  
               {/* Centered button */}
             <div className="d-flex justify-content-center mt-3">
                <button
                  className="btn btn-light w-75"
                  onClick={() => navigate(block.route)}
                 >
                  Go
                </button>
              </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SuperDashboard;
