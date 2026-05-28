import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <Link to="/" className="footer-brand-header">
            <Logo size={32} />
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '-0.05em' }}>Gatherly</span>
          </Link>
          <p>
            Your ultimate platform for organizing events, managing shared expenses, and connecting with groups effortlessly. Modern, fast, and secure.
          </p>
          <div className="footer-socials">
            {/* Social links disabled temporarily due to icon compatibility */}
            <a href="#" className="footer-social-link" title="Twitter">𝕏</a>
            <a href="#" className="footer-social-link" title="Instagram">📷</a>
            <a href="#" className="footer-social-link" title="LinkedIn">💼</a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Navigation</h4>
          <div className="footer-links">
            <Link to="/" className="footer-link">Home</Link>
            <Link to="/about" className="footer-link">About Us</Link>
            <Link to="/features" className="footer-link">Features</Link>
            <Link to="/careers" className="footer-link">Careers</Link>
          </div>
        </div>

        <div className="footer-col">
          <h4>Platform</h4>
          <div className="footer-links">
            <Link to="/login" className="footer-link">User Portal</Link>
            <Link to="/press" className="footer-link">Press & Media</Link>
          </div>
        </div>

        <div className="footer-col">
          <h4>Legal</h4>
          <div className="footer-links">
            <Link to="/privacy" className="footer-link">Privacy Policy</Link>
            <Link to="/terms" className="footer-link">Terms & Conditions</Link>
            <Link to="/cookies" className="footer-link">Cookie Policy</Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Gatherly Inc. All rights reserved.</p>
        <div className="footer-bottom-links">
          <Link to="/privacy" className="footer-link">Privacy</Link>
          <Link to="/terms" className="footer-link">Terms</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
