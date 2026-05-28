import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import Logo from '../components/Logo';
import './Auth.css';

const AdminAuthPage = () => {

  // PREDEFINED ADMIN CREDENTIALS
  const ADMIN_EMAIL = 'admin@gatherly.com';
  const ADMIN_PASSWORD = 'Admin@123';

  const [formData, setFormData] = useState({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // HANDLE INPUT CHANGES
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // HANDLE LOGIN
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {

      // CHECK PREDEFINED ADMIN LOGIN
      if (
        formData.email === ADMIN_EMAIL &&
        formData.password === ADMIN_PASSWORD
      ) {

        // CREATE DUMMY ADMIN DATA
        const adminData = {
          name: 'Gatherly Admin',
          email: ADMIN_EMAIL,
          role: 'admin',
          token: 'gatherly_admin_secure_token'
        };

        // STORE IN LOCAL STORAGE
        localStorage.setItem(
          'gatherly_admin_token',
          adminData.token
        );

        localStorage.setItem(
          'gatherly_admin_user',
          JSON.stringify(adminData)
        );

        // REDIRECT TO DASHBOARD
        navigate('/admin/dashboard');

      } else {

        // INVALID LOGIN
        setError('Invalid admin email or password');

      }

    } catch (err) {

      setError('Server error. Please try again later.');

    } finally {

      setLoading(false);

    }
  };

  return (
    <div className="auth-wrapper">

      {/* LEFT SIDEBAR */}
      <div
        className="auth-sidebar"
        style={{
          background:
            'linear-gradient(135deg, #1e293b, #0f172a)'
        }}
      >

        {/* BACKGROUND BLOBS */}
        <div
          className="blob blob-1"
          style={{
            background:
              'rgba(56, 189, 248, 0.15)'
          }}
        ></div>

        <div
          className="blob blob-2"
          style={{
            background:
              'rgba(16, 185, 129, 0.15)'
          }}
        ></div>

        <div
          className="blob blob-3"
          style={{
            background:
              'rgba(99, 102, 241, 0.15)'
          }}
        ></div>

        {/* LOGO */}
        <div>
          <Link
            to="/"
            style={{
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            <Logo size={60} />
          </Link>
        </div>

        {/* SIDEBAR CONTENT */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >

          <ShieldCheck
            size={80}
            color="var(--accent-primary)"
            style={{ marginBottom: '2rem' }}
          />

          <h1
            style={{
              color: 'var(--accent-primary)',
              fontSize: '3.5rem',
              fontWeight: 800,
              marginBottom: '1rem',
              lineHeight: 1.1
            }}
          >
            Admin Portal.
          </h1>

          <p
            style={{
              fontSize: '1.25rem',
              opacity: 0.9,
              maxWidth: '450px',
              lineHeight: 1.6
            }}
          >
            Secure access for Gatherly administrators.
            Manage users, monitor active spaces,
            and maintain platform integrity.
          </p>

        </div>
      </div>

      {/* RIGHT LOGIN SECTION */}
      <div className="auth-main">

        <div className="auth-container">

          {/* HEADER */}
          <div className="auth-header">

            <h2>Administrator Login</h2>

            <p>
              Please provide your authorized credentials.
            </p>

          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* LOGIN FORM */}
          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >

            {/* EMAIL */}
            <div className="form-group">

              <label>Admin Email</label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="admin@gatherly.com"
              />

            </div>

            {/* PASSWORD */}
            <div className="form-group">

              <label>Security Password</label>

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />

            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              className="auth-btn"
              disabled={loading}
              style={{ background: '#0f172a' }}
            >

              {loading
                ? 'Authenticating...'
                : 'Secure Login'}

            </button>

          </form>

          {/* DEMO CREDENTIALS */}
          <div
            style={{
              marginTop: '2rem',
              padding: '1rem',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.05)',
              border: '1px solid rgba(15, 23, 42, 0.08)'
            }}
          >

            <h4
              style={{
                marginBottom: '0.75rem',
                color: '#0f172a'
              }}
            >
              Demo Admin Credentials
            </h4>

            <p style={{ marginBottom: '0.5rem' }}>
              <strong>Email:</strong>
              {' '}
              admin@gatherly.com
            </p>

            <p>
              <strong>Password:</strong>
              {' '}
              Admin@123
            </p>

          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminAuthPage;