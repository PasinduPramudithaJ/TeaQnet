import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import image1 from "../../images/background2.jpg"; // same background as Dashboard

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Results: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { prediction, confidence, probabilities, info, croppedImage } =
    (location.state as any) || {};

  const chartData = probabilities
    ? {
        labels: Object.keys(probabilities),
        datasets: [
          {
            label: "Prediction Probability (%)",
            data: Object.keys(probabilities).map(
              (k) => (probabilities[k] || 0) * 100
            ),
            backgroundColor: [
              "rgba(255, 111, 97, 0.8)",
              "rgba(107, 91, 149, 0.8)",
              "rgba(136, 176, 75, 0.8)",
              "rgba(255, 165, 0, 0.8)",
            ],
            borderRadius: 8,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // allows chart to fill container
    plugins: {
      legend: { labels: { color: "white" } },
      title: {
        display: true,
        text: "Region Probability Distribution",
        color: "white",
      },
    },
    scales: {
      x: { ticks: { color: "white" } },
      y: { ticks: { color: "white" } },
    },
  };

  // Set chart height only for mobile
  const getChartHeight = () => {
    if (window.innerWidth < 576) return 250; // mobile
    return 400; // desktop
  };

  if (!prediction) {
    return (
      <div
        className="container-fluid d-flex flex-column align-items-center justify-content-center min-vh-100 text-white"
        style={{
          backgroundImage: `url(${image1})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <h3>No Results Found</h3>
        <button className="btn btn-primary mt-3" onClick={() => navigate("/")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div
      className="container-fluid d-flex flex-column align-items-center justify-content-center min-vh-100"
      style={{
        backgroundImage: `url(${image1})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className="p-4 shadow-lg text-white"
        style={{
          maxWidth: "800px",
          width: "95%",
          borderRadius: "20px",
          backdropFilter: "blur(10px)",
          background: "rgba(0, 0, 0, 0.5)",
        }}
      >
        <h2 className="text-center mb-3">🌱 Tea Region Prediction Result</h2>

        {/* Keep image exactly as before */}
        {croppedImage && (
          <div className="text-center">
            <img
              src={croppedImage}
              alt="Cropped"
              className="img-fluid rounded shadow mb-3"
              style={{ maxHeight: "350px", objectFit: "cover" }}
            />
          </div>
        )}

        <div className="alert alert-success text-center">
          ✅ <strong>{prediction}</strong>{" "}
          {confidence && (
            <span>({(confidence * 100).toFixed(1)}% confidence)</span>
          )}
        </div>

        {info && (
          <div className="mt-3">
            <h5>About {prediction}</h5>
            <p>{info.description}</p>
            <p>
              <strong>Origin:</strong> {info.origin}
            </p>
            <p>
              <strong>Flavor Notes:</strong>{" "}
              {info.flavorNotes?.join(", ")}
            </p>
          </div>
        )}

        {/* Chart container responsive for mobile */}
        {chartData && (
          <div
            className="mt-4 bg-dark p-3 rounded"
            style={{
              height: getChartHeight(),
              overflowX: "auto", // allow scroll if needed on very small screens
            }}
          >
            <Bar data={chartData} options={chartOptions} />
          </div>
        )}

        <div className="text-center mt-4">
          <button
            className="btn btn-secondary me-2"
            onClick={() =>
              navigate("/dashboard", {
                state: { croppedImage, prediction, confidence, probabilities, info },
              })
            }
          >
            ⬅️ Back
          </button>
          <button
            className="btn btn-info"
            onClick={() => navigate("/settings")}
          >
            ⚙️ API Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;
