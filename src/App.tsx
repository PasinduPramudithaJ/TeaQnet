import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from "./assets/components/layout/Home";
import Login from "./assets/components/User/Login";
import Register from "./assets/components/User/Register";
import Dashboard from "./assets/components/layout/Dashboard";
import Settings from "./assets/components/layout/settings";




function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard/>} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  )

}
export default App
