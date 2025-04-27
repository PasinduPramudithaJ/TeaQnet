import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import image1 from '../../../assets/images/teaplant5.jpg';
import image4 from '../../../assets/images/teaplant4.jpg';
import image6 from '../../../assets/images/teaplant6.jpg';
import image3 from '../../../assets/images/teaplant3.jpg';

const Contend: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Update isMobile state based on window width
  useEffect(() => {
    const updateMobile = () => {
      setIsMobile(window.innerWidth < 768); // adjust threshold as needed
    };
    updateMobile();
    window.addEventListener('resize', updateMobile);
    return () => window.removeEventListener('resize', updateMobile);
  }, []);

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
        const file = new File([blob], "captured_photo.jpg", { type: blob.type });
        setSelectedImage(file);
      }
    } catch (error) {
      console.error('Camera error:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const handleAnalyze = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedImage) {
      alert("Please upload or capture a tea image first!");
      return;
    }
    console.log('Analyzing image:', selectedImage);
  };

  return (
    <>
      <div className="bg-light min-vh-100 d-flex flex-column">
        {/* Hero Section */}
        <div 
          className="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center py-5"
          style={{
            backgroundImage: `url(${image1})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: 'white',
          }}
        >
          <motion.h1
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="display-3 fw-bold mb-3"
          >
            TeaVision
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="lead mb-4"
          >
            Revolutionizing Tea Quality Assessment through Deep Learning
          </motion.p>

          {/* Upload Form */}
          <form onSubmit={handleAnalyze} className="d-flex flex-column align-items-center" style={{ gap: "1rem" }}>
            <input
              type="file"
              accept="image/*"
              className="form-control"
              style={{ maxWidth: "300px" }}
              onChange={handleUpload}
            />

            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                className="img-thumbnail mt-3 img-fluid"
                style={{ maxWidth: '100%' }}
              />
            )}

            <div className="d-flex gap-3 mt-3 flex-column flex-sm-row">
              <button type="submit" className="btn btn-outline-light btn-lg">Analyze Tea Sample</button>
              <button type="button" className="btn btn-light btn-lg text-success">Learn More</button>
              {isMobile && (
                <button type="button" className="btn btn-warning btn-lg" onClick={handleCaptureImage}>
                  📷 Capture Photo
                </button>
              )}
            </div>
          </form>
        </div>

        {/* About Section */}
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-12 col-md-6 mb-4 mb-md-0">
              <img
                src={image4}
                alt="Fresh Tea Leaves"
                className="img-fluid rounded shadow"
              />
            </div>
            <div className="col-12 col-md-6">
              <h2 className="mb-4 text-success">About TeaVision</h2>
              <p className="lead text-muted">
                TeaVision utilizes AI and deep learning models to assess tea quality based on liquor color profiles.
                Our smart solution ensures consistent and expert-level grading for premium tea quality assurance.
              </p>
              <button className="btn btn-success mt-3">Discover More</button>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-success text-white py-5">
          <div className="container text-center">
            <h2 className="mb-5">How It Works</h2>
            <div className="row">
              {[
                {
                  img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
                  title: "1. Upload",
                  desc: "Upload a high-quality tea liquor image through our secure platform."
                },
                {
                  img: image6,
                  title: "2. Analyze",
                  desc: "Our AI analyzes color gradients and unique features for precise grading."
                },
                {
                  img: image3,
                  title: "3. Get Results",
                  desc: "Instantly receive an expert-level tea quality report and insights."
                }
              ].map((step, index) => (
                <div key={index} className="col-12 col-md-4 mb-4">
                  <div className="card h-100 shadow-sm border-0">
                    <img
                      src={step.img}
                      alt={step.title}
                      width={300}
                      height={400}
                      className="card-img-top"
                      style={{ objectFit: 'cover' }}
                    />
                    <div className="card-body">
                      <h5 className="card-title text-success">{step.title}</h5>
                      <p className="card-text text-muted">{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default Contend;
