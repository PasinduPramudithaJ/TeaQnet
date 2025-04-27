
import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  // Scroll to top function
  

  // Scroll to middle of the page
  const scrollToMiddle = () => {
    window.scrollTo({
      top: document.body.scrollHeight / 5,
      behavior: 'smooth',
    });
  };

  // Scroll to bottom of the page
  const scrollToBottom = () => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    });
  };

  return (
    <nav className="navbar navbar-expand-lg" style={{ backgroundColor: '#14690A' }}>
      <div className="container-fluid">
        <Link className="navbar-brand text-white" to="/" >
          <b>TeaVision</b>
        </Link>
        {/* Navbar Toggler for mobile view */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{ backgroundColor: 'white', opacity: 0.8 }}
        >
          <span className="navbar-toggler-icon text-white"></span>
        </button>
        {/* Navbar Menu Items */}
        <div className="collapse navbar-collapse" id="navbarNav" style={{ justifyContent: 'flex-end' }}>
          <ul className="navbar-nav ms-auto">
            <li className="nav-item" style={{ color: 'yellow' }}>
              <Link
                className="nav-link active text-white flex items-center"
                aria-current="page"
                to="/"
                  // Change color on hover
                 // Scroll to top when clicked
              >
                <i className="fas fa-home mr-2"></i><b>Home</b>
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className="nav-link text-white"
                to="/"
                onClick={scrollToMiddle}  // Scroll to middle when clicked
              >
                <b>About</b>
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className="nav-link text-white"
                to="/"
                onClick={scrollToBottom}  // Scroll to bottom when clicked
              >
                <b>Contact</b>
              </Link>
            </li>

            <li className="nav-item">
              <Link
                className="nav-link text-white"
                to="/login"
                  // Scroll to bottom when clicked
              >
                <b>SignIn</b>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Header;
