import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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

// ProtectedRoute component
const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const isSignedIn = localStorage.getItem("isSignedIn") === "true";
  return isSignedIn ? children : <Navigate to="/login" replace />;
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
          path="/super" 
          element={
            <ProtectedRoute>
              <SuperDashboard />
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

        {/* Catch-all route to redirect unknown paths to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
