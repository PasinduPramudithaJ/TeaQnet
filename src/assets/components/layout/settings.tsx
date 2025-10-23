import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

const Settings: React.FC = () => {
  const [apiUrl, setApiUrl] = useState<string>(`http://${window.location.hostname}:5000`);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUrl = localStorage.getItem("backend_url");
    if (savedUrl) {
      setApiUrl(savedUrl);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("backend_url", apiUrl);
    alert("✅ API URL saved!");
    navigate("/super");
  };

  return (
    <>
      <Header />
      <div className="container text-center py-5">
        <h2>⚙️ API Settings</h2>
        <div className="card p-4 shadow-sm mx-auto" style={{ maxWidth: "500px" }}>
          <label className="form-label">Backend API URL</label>
          <input
            type="text"
            className="form-control mb-3"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="http://127.0.0.1:5000"
          />
          <button className="btn btn-primary" onClick={handleSave}>
            💾 Save & Back
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Settings;
