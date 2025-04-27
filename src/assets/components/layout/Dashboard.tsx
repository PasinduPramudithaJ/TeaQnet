import React, { useState } from "react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import image1 from "../../images/background2.jpg"; // Adjust the path as necessary

const Dashboard: React.FC = () => {
  const [, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
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
        const file = new File([blob], "captured_photo.jpg", {
          type: blob.type,
        });
        setSelectedImage(file);
      }
    } catch (error) {
      console.error("Camera error:", error);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
  };

  return (
    <><><Header /><div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center py-5"
    style={{
      backgroundImage: `url(${image1})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      color: "white",
      minHeight: '60vh',
    }}>
          <h2 className="text-center mb-4">Dashboard</h2>
          <div className="d-flex flex-column align-items-center justify-content-center">
              <input
                  type="file"
                  accept="image/*"
                  className="form-control"
                  onChange={handleUpload}
                  style={{ maxWidth: "300px" }} />
              {previewUrl && (
                  <img
                      src={previewUrl}
                      alt="Preview"
                      className="img-thumbnail mt-3 img-fluid"
                      style={{ maxWidth: "100%" }} />
              )}
              <button
                  className="btn btn-warning mt-3"
                  onClick={handleCaptureImage}
              >
                  📷 Capture Photo
              </button>
              {previewUrl && (
                  <button
                      className="btn btn-danger mt-3"
                      onClick={handleClearImage}
                  >
                      🗑️ Clear Image
                  </button>
              )}
              <button
                  className="btn btn-success mt-3"
                  onClick={() => navigate("/")} // Navigate back to the home page
              >
                  Back to Home
              </button>
          </div>
      </div></><Footer /></>
  );
};

export default Dashboard;
