import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import backgroundImage from '../../images/background2.jpg'; // Adjust the path as necessary

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (storedUser.email === email && storedUser.password === password) {
      alert('Login Successful!');
      navigate('/dashboard');
    } else {
      alert('Invalid Credentials');
    }
  };

  return (
    <>
      <Header />
      <div
        className="d-flex justify-content-center align-items-center"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed', 
          minHeight: '80vh',// Keeps the background fixed during scroll
        }}
      >
        <div
          className="card p-4 shadow-lg"
          style={{
            width: '100%',
            maxWidth: '400px',
            borderRadius: '1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.8)', // Slight transparency to make it readable
          }}
        >
          <h2 className="text-center mb-4 text-primary">Login</h2>
          <form onSubmit={handleLogin}>
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
              <button type="submit" className="btn btn-primary">
                Login
              </button>
            </div>
          </form>
          <div className="text-center mt-3">
            <small className="text-muted">
              Don't have an account?{' '}
              <Link className="text-success text-decoration-none" to="/register">
                &nbsp;Register now!
              </Link>
            </small>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Login;
