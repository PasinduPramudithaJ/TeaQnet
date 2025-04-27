import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import backgroundImage from '../../images/background.jpeg'; // Adjust the path as necessary

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('user', JSON.stringify({ email, password }));
    alert('Registered Successfully!');
    navigate('/login');
  };

  return (
    <>
      <Header />
      <div
        className="d-flex justify-content-center align-items-center"
        style={{
          backgroundImage: `url(${backgroundImage})`, // Add your image path here
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          minHeight: '80vh',
        }}
      >
        
        <div
          className="card p-4 shadow-lg"
          style={{
            width: '100%',
            maxWidth: '400px',
            borderRadius: '1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.8)', // Add slight transparency to card background for better readability
          }}
        >
          <h2 className="text-center mb-4 text-success">Register</h2>
          <form onSubmit={handleRegister}>
            <div className="mb-3">
              <label className="form-label">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="form-control"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="form-control"
              />
            </div>
            <div className="d-grid">
              <button type="submit" className="btn btn-success">
                Register
              </button>
            </div>
          </form>
          <div className="text-center mt-3">
            <small className="text-muted">
              Already have an account?{' '}
              <Link className="text-decoration-none" to={'/login'}>
                &nbsp;Login now!
              </Link>
            </small>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Register;
