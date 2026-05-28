import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Briefcase, Zap, Globe, Coffee } from 'lucide-react';
import Logo from '../components/Logo';
import './InfoPages.css';

const Careers = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="info-page">
      <nav className="info-navbar container">
        <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <Logo size={40} />
          <span className="logo-text" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '-0.05em' }}>Gatherly</span>
        </Link>
        <Link to="/" className="back-link"></Link>
      </nav>

      <main className="info-content container">
        <header className="info-header">
          <h1>Careers at Gatherly</h1>
          <p className="subtitle">Join us in building the future of organized social collaboration.</p>
        </header>

        <section className="info-section">
          <h2>Why Work With Us?</h2>
          <p>
            At Gatherly, we are tackling the universal problem of group coordination. We are a fast-growing, fully remote team of designers, engineers, and community builders who believe that software should make real-world interactions better, not replace them.
          </p>
        </section>

        <section className="info-section">
          <h2>Perks & Benefits</h2>
          <div className="info-grid">
            <div className="info-card">
              <h3><Globe size={24} /> Work Anywhere</h3>
              <p>We are a remote-first company. Work from the comfort of your home, a cafe, or while traveling the world.</p>
            </div>
            <div className="info-card">
              <h3><Zap size={24} /> Competitive Equity</h3>
              <p>We believe our early employees should own a piece of what they are building. We offer generous equity packages.</p>
            </div>
            <div className="info-card">
              <h3><Coffee size={24} /> Unlimited PTO</h3>
              <p>We focus on output, not hours logged. Take the time you need to recharge and spend time with your loved ones.</p>
            </div>
          </div>
        </section>

        <section className="info-section">
          <h2>Open Positions</h2>

          <div className="info-card" style={{ marginBottom: '1.5rem' }}>
            <h3>Senior Frontend Engineer (React)</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontWeight: 'bold' }}>Remote • Full-time</p>
            <p>You will lead the development of our core web application interface using React, Framer Motion, and modern CSS architectures.</p>
            <button className="btn-primary" style={{ marginTop: '1rem' }}>Apply Now</button>
          </div>

          <div className="info-card" style={{ marginBottom: '1.5rem' }}>
            <h3>Backend Engineer (Node.js)</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontWeight: 'bold' }}>Remote • Full-time</p>
            <p>Help us scale our MongoDB and Express architecture to support millions of concurrent users uploading media and settling expenses.</p>
            <button className="btn-primary" style={{ marginTop: '1rem' }}>Apply Now</button>
          </div>

          <div className="info-card">
            <h3>Product Designer</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontWeight: 'bold' }}>Remote • Full-time</p>
            <p>Own the user experience of Gatherly. Transform complex group dynamics into simple, beautiful, and intuitive interfaces.</p>
            <button className="btn-primary" style={{ marginTop: '1rem' }}>Apply Now</button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Careers;
