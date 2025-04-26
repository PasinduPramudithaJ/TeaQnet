import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'
import Contend from "./assets/components/layout/Contend";
import 'bootstrap/dist/css/bootstrap.min.css';




function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Contend />} />
      </Routes>
    </Router>
  )

}
export default App
