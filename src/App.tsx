import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from "./assets/components/layout/Home";
import Login from "./assets/components/User/Login";
import Register from "./assets/components/User/Register";




function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  )

}
export default App
