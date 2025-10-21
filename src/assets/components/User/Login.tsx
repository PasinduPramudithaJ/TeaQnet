import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import backgroundImage from '../../images/background2.jpg';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard if already signed in
    const isSignedIn = localStorage.getItem('isSignedIn') === 'true';
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = storedUser.email==='pramudithapasindu48@gmail.com' && storedUser.password==='1234';
    if (isSignedIn) {
      if (isAdmin) {
        navigate('/super');
      } else {
        navigate('/dashboard');
      }
    }
  }, [navigate]);
   
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedUserAdmin = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = storedUserAdmin.email==='pramudithapasindu48@gmail.com' && storedUserAdmin.password==='1234';

    if (storedUserAdmin.email === email && storedUserAdmin.password === password) {
      // Mark as signed in
      localStorage.setItem('isSignedIn', 'true');
      alert('Login Successful!');
      if (isAdmin) {
        navigate('/super');
      } else {
        navigate('/dashboard');
      }
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
          minHeight: '80vh',
        }}
      >
        <div
          className="card p-4 shadow-lg"
          style={{
            width: '100%',
            maxWidth: '400px',
            borderRadius: '1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
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
                Register now!
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
