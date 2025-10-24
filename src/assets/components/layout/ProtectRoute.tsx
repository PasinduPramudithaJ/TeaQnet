import React, { JSX } from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const isSignedIn = localStorage.getItem("isSignedIn") === "true";
  const storedUser = localStorage.getItem("user");
  const existingUser = JSON.parse(storedUser || '{}');
  const adminEmail = "pramudithapasindu48@gmail.com";
  const location = useLocation();

  if (!isSignedIn) {
    // Not signed in → redirect to login
    return <Navigate to="/" replace />;
  }

  if (location.pathname === "/super") {
    // Trying to access /super page
    if (!existingUser && existingUser.email !== adminEmail) return <Navigate to="/dashboard" replace />;
  }

  // Admin auto-redirect to /super if logged in and visiting normal user pages
   if (storedUser) {
    const user = JSON.parse(storedUser);
    if (user.email === adminEmail && location.pathname !== "/super") {
      return <Navigate to="/super" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
