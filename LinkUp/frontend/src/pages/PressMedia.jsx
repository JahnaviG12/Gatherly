import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Mail, Image as ImageIcon, FileText } from 'lucide-react';
import Logo from '../components/Logo';
import './InfoPages.css';

const PressMedia = () => {
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
          <h1>Press & Media</h1>
          <p className="subtitle">Everything you need to write about Gatherly.</p>
        </header>

        <section className="info-section">
          <h2>About The Company</h2>
          <p>
            Gatherly is a privately held technology company founded in 2026. We are building the definitive social platform for temporary, private group collaboration.
            Unlike traditional social networks designed for infinite scrolling and public broadcasting, Gatherly is designed for focused, private interactions that naturally conclude when an event ends.
          </p>
        </section>

        <section className="info-section">
          <h2>Brand Assets</h2>
          <p>Please do not alter the colors or proportions of our logo when using it in media publications.</p>

          <div className="info-grid">
            <div className="info-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Logo size={80} className="feat-icon" style={{ marginBottom: '1.5rem' }} />
              <h3>Brand Kit</h3>
              <p style={{ marginBottom: '1.5rem' }}>Includes high-resolution logos, brand guidelines, and color palettes.</p>
              <button className="btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <Download size={18} /> Download (.zip)
              </button>
            </div>

            <div className="info-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <ImageIcon size={80} className="feat-icon" style={{ marginBottom: '1.5rem' }} />
              <h3>Product Screenshots</h3>
              <p style={{ marginBottom: '1.5rem' }}>High-fidelity mockups of the Gatherly mobile and web interfaces.</p>
              <button className="btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <Download size={18} /> Download (.zip)
              </button>
            </div>
          </div>
        </section>

        <section className="info-section">
          <h2>Recent Press Releases</h2>
          <ul className="info-list" style={{ listStyle: 'none', paddingLeft: 0 }}>
            <li style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
              <p style={{ color: 'var(--accent-primary)', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem' }}>May 19, 2026</p>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Gatherly Announces Platform Launch</h3>
              <p style={{ margin: 0, opacity: 0.8 }}>Gatherly officially launches its public beta to help users coordinate summer trips and events without the hassle of group chats.</p>
            </li>
          </ul>
        </section>

        <section className="info-section">
          <h2>Press Contact</h2>
          <p>For press inquiries, interviews, or additional resources, please contact our media relations team:</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <Mail className="feat-icon" />
            <a href="mailto:press@gatherly.com" style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>press@gatherly.com</a>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PressMedia;
