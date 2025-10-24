import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from "./assets/components/layout/Home";
import Login from "./assets/components/User/Login";
import Register from "./assets/components/User/Register";
import Dashboard from "./assets/components/layout/Dashboard";
import Settings from "./assets/components/layout/settings";
import Results from "./assets/components/layout/Results";
import Multipredict from "./assets/components/layout/Multipredict";
import { JSX } from "react";
import ModelComparison from "./assets/components/layout/ModelComparison";
import CropLiquorImages from "./assets/components/layout/CropLiquorImages";
import SuperDashboard from "./assets/components/layout/SuperDashboard";
import PolyphenolPredict from "./assets/components/layout/PolyphenolPredict";

// Enhanced ProtectedRoute component
const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const isSignedIn = localStorage.getItem("isSignedIn") === "true";
  const storedUser = localStorage.getItem("user");
  const adminEmail = "pramudithapasindu48@gmail.com";
  const location = useLocation();

  // If user not signed in, redirect to login
  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  // Check user data
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user && user.email === adminEmail;

  // Restrict access to /super
  if (location.pathname === "/super" && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  // Otherwise allow
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/results"
          element={
            <ProtectedRoute>
              <Results />
            </ProtectedRoute>
          }
        />
        <Route
          path="/multi"
          element={
            <ProtectedRoute>
              <Multipredict />
            </ProtectedRoute>
          }
        />
        <Route
          path="/comparison"
          element={
            <ProtectedRoute>
              <ModelComparison />
            </ProtectedRoute>
          }
        />
        <Route
          path="/crop"
          element={
            <ProtectedRoute>
              <CropLiquorImages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/polyphenol"
          element={
            <ProtectedRoute>
              <PolyphenolPredict />
            </ProtectedRoute>
          }
        />
        <Route
          path="/super"
          element={
            <ProtectedRoute>
              <SuperDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
