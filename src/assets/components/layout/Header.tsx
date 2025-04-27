import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => (
  <nav className="navbar navbar-expand-lg" style={{ backgroundColor: '#14690A' }}>
    <div className="container-fluid">
      <Link className="navbar-brand text-white" to="/"><b>TeaVision</b></Link>
      {/* Navbar Toggler for mobile view */}
      <button 
        className="navbar-toggler" 
        type="button" 
        data-bs-toggle="collapse" 
        data-bs-target="#navbarNav" 
        aria-controls="navbarNav" 
        aria-expanded="false" 
        aria-label="Toggle navigation"
        style={{ backgroundColor: 'white',opacity: 0.8 }}
      >
        <span className="navbar-toggler-icon text-white"></span>
      </button>
      {/* Navbar Menu Items */}
      <div className="collapse navbar-collapse" id="navbarNav" style={{ justifyContent: 'flex-end' }}>
        <ul className="navbar-nav ms-auto">
          <li className="nav-item" style={{ color: 'yellow' }}>  
            <Link className="nav-link active text-white flex items-center" aria-current="page" to="/">
              <i className="fas fa-home mr-2"></i><b>Home</b>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-white" to="/">
              <b>About</b>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-white" to="/">
              <b>Contact</b>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  </nav>
);

export default Header;
