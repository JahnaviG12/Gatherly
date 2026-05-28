import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Target, Heart, Shield } from 'lucide-react';
import Logo from '../components/Logo';
import './InfoPages.css';

const AboutUs = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="info-page">
      <nav className="info-navbar container">
        <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <Logo size={40} />
          <span className="logo-text" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '-0.05em' }}>Gatherly</span>
        </Link>
        <Link to="/" className="back-link"> </Link>
      </nav>

      <main className="info-content container">
        <header className="info-header">
          <h1>About Us</h1>
          <p className="subtitle">Bringing people together, one space at a time. We believe in the power of shared experiences without the digital clutter.</p>
        </header>

        <section className="info-section">
          <h2>Our Mission</h2>
          <p>
            At Gatherly, our mission is to eliminate the chaos of group coordination. Whether you're planning a weekend getaway with college friends, organizing a large wedding, or collaborating on a hackathon project, we provide the tools you need in a single, unified, and completely private environment.
          </p>
          <p>
            We realized that existing solutions—like endless WhatsApp groups, scattered Google Drive links, and messy split-expense apps—create more friction than harmony. We built Gatherly to solve exactly that.
          </p>
        </section>

        <section className="info-section">
          <h2>Our Core Values</h2>
          <div className="info-grid">
            <div className="info-card">
              <h3><Shield size={24} /> Absolute Privacy</h3>
              <p>Your spaces are temporary and invite-only. We don't scrape your event data for ads, and organizers have full control over their communities.</p>
            </div>
            <div className="info-card">
              <h3><Target size={24} /> Purpose-Built</h3>
              <p>Every feature, from the shared gallery to the expense splitter, is designed specifically to make managing temporary groups flawless.</p>
            </div>
            <div className="info-card">
              <h3><Heart size={24} /> Human Connection</h3>
              <p>Technology should get out of the way so you can focus on what matters: the actual event, the trip, and the people you're with.</p>
            </div>
          </div>
        </section>

        <section className="info-section">
          <h2>The Journey</h2>
          <p>
            Gatherly started in 2026 as a simple idea during a highly disorganized Goa trip. After spending more time figuring out who paid for what and where the photos were instead of enjoying the beach, our founders knew there had to be a better way. Today, Gatherly is the ultimate platform for creating seamless temporary spaces.
          </p>
        </section>
      </main>
    </div>
  );
};

export default AboutUs;
