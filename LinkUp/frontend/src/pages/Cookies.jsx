import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cookie, ShieldCheck, Zap, Lock, Settings } from 'lucide-react';
import Logo from '../components/Logo';
import './InfoPages.css';

const Cookies = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="info-page">
      <nav className="info-navbar container">
        <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <Logo size={40} />
          <span className="logo-text" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '-0.05em' }}>Gatherly</span>
        </Link>
        <Link to="/userdashboard" className="back-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 'bold' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </nav>

      <main className="info-content container">
        <header className="info-header">
          <h1>Cookie Policy</h1>
          <p className="subtitle">Last Updated: July 1, 2026. Gatherly uses essential cookies and local storage tokens to keep you logged in and secure your real-time collaboration sessions.</p>
        </header>

        <section className="info-section">
          <h2>1. What Are Cookies?</h2>
          <p>
            Cookies are small text files stored on your computer or mobile device by your web browser when you visit websites. Along with cookies, we utilize web browser local storage (`localStorage`) to hold configuration state, UI theme choices, and local workspace backups. This is done to improve application responsiveness and keep your session authenticated.
          </p>
        </section>

        <section className="info-section">
          <h2>2. How We Use Cookies & Local Storage</h2>
          <p>We do not use tracking or advertising cookies. We only use functional tokens to run our application:</p>
          <div className="info-grid">
            <div className="info-card">
              <h3><Lock size={20} /> Authentication & Session</h3>
              <p>We use essential identifiers to keep you authenticated as you navigate through workspaces. This prevents you from needing to log in repeatedly when refreshing your browser.</p>
            </div>
            <div className="info-card">
              <h3><Settings size={20} /> Preferences Sync</h3>
              <p>We store theme preferences (such as light mode or dark mode) and sidebar state locally, so the interface loads in your preferred configuration automatically.</p>
            </div>
            <div className="info-card">
              <h3><Zap size={20} /> Local Cache & Speed</h3>
              <p>We save local copies of your workspaces, member avatars, and read notification IDs to limit API requests to our backend servers, resulting in a much faster user experience.</p>
            </div>
          </div>
        </section>

        <section className="info-section">
          <h2>3. Third-Party Cookies</h2>
          <p>
            Gatherly values your data integrity and privacy. We **do not host third-party marketing, analytics, or behavioral targeting scripts** on our application. Any cookies set during your usage are strictly originating from our own domain servers to deliver requested services.
          </p>
        </section>

        <section className="info-section">
          <h2>4. Managing and Clearing Cookies</h2>
          <p>
            If you wish to delete or disable cookies and local storage, you can do so directly within your browser settings. However, please note that blocking essential cookies will log you out, and key collaboration tools, real-time message notifications, and workspace tools will not function correctly without active local storage.
          </p>
        </section>

        <section className="info-section">
          <h2>5. Contact Us</h2>
          <p>
            If you have any questions regarding our use of cookies or local storage settings, you can reach our operations team at <strong>ops@gatherly.io</strong>.
          </p>
        </section>
      </main>
    </div>
  );
};

export default Cookies;
