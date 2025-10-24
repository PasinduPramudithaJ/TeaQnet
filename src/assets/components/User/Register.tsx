import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import backgroundImage from '../../images/background.jpeg'; // Adjust the path as necessary

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const adminEmail = 'pramudithapasindu48@gmail.com';

  useEffect(() => {
    // If user is already signed in, redirect accordingly
    const isSignedIn = localStorage.getItem('isSignedIn') === 'true';
    const storedUser = localStorage.getItem('user');
    if (isSignedIn && storedUser) {
      const user = JSON.parse(storedUser);
      if (user.email === adminEmail) {
        navigate('/super');
      } else {
        navigate('/dashboard');
      }
    }
  }, [navigate]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      alert('Please fill in all fields.');
      return;
    }

    const storedUser = localStorage.getItem('user');

    // Prevent overwriting admin or duplicate users
    if (storedUser) {
      const existingUser = JSON.parse(storedUser);
      if (existingUser.email === email) {
        alert('This email is already registered.');
        return;
      }
    }

    // Save user credentials
    const newUser = { email, password };
    localStorage.setItem('user', JSON.stringify(newUser));

    // If admin registers, auto sign in and redirect to /super
    if (email === adminEmail) {
      localStorage.setItem('isSignedIn', 'true');
      alert('Admin registered successfully!');
      navigate('/super');
      return;
    }

    // Normal user flow
    alert('Registered successfully! Please log in.');
    navigate('/login');
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
                Login now!
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
