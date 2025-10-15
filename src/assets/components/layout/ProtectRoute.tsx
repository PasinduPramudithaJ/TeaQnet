// ProtectedRoute.tsx
import React, { JSX } from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const isSignedIn = localStorage.getItem("isSignedIn") === "true";
  return isSignedIn ? children : <Navigate to="/" replace />;
};

export default ProtectedRoute;
