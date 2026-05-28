import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users,
  Layout,
  CreditCard,
  Shield,
  Sun,
  Moon,
  ShieldCheck
} from 'lucide-react';

import Logo from '../components/Logo';
import './LandingPage.css';

const slideshowData = [
  {
    title: 'Goa Trip 2026',
    subtitle: '12 Members • Active',
    gradient:
      'linear-gradient(135deg, var(--accent-primary), var(--accent-hover))'
  },
  {
    title: 'Startup Hackathon',
    subtitle: '4 Teams • Active',
    gradient: 'linear-gradient(135deg, #8b5cf6, #c084fc)'
  },
  {
    title: "Sarah's Wedding",
    subtitle: '50 Members • Planning',
    gradient: 'linear-gradient(135deg, #ec4899, #f472b6)'
  }
];

const LandingPage = ({ theme, toggleTheme }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(
        (prev) => (prev + 1) % slideshowData.length
      );
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="landing-wrapper">

      {/* Proper Header Section */}
      <nav
        className="navbar container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '1rem 0'
        }}
      >

        {/* LEFT SIDE LOGO */}
        <Link
          to="/"
          className="logo"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '10px',
            flex: 1,
            textDecoration: 'none'
          }}
        >
          <Logo size={40} />
          <span className="logo-text">Gatherly</span>
        </Link>

        {/* RIGHT SIDE NAVIGATION */}
        <div
          className="nav-links"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '1.5rem',
            flex: 1
          }}
        >
          <Link to="/features">Features</Link>

          <a href="#access">Login / Access</a>

          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle Theme"
          >
            {theme === 'light'
              ? <Moon size={20} />
              : <Sun size={20} />}
          </button>
        </div>
      </nav>

      {/* Hero Section with Slideshow */}
      <header className="hero container">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="hero-title">
            Collaborate seamlessly in <br />
            <span className="text-gradient">
              private temporary workspaces.
            </span>
          </h1>

          <p className="hero-subtitle">
            Gatherly is the ultimate social platform
            for trips, events, college groups,
            and project teams.
            Build connections, manage tasks,
            and stay organized.
          </p>

          {/* Go to Dashboard button removed */}
        </motion.div>

        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.2
          }}
        >
          <div className="glass-card mockup">

            <div className="mockup-header">
              <div className="dot red"></div>
              <div className="dot yellow"></div>
              <div className="dot green"></div>
            </div>

            <div className="mockup-body">

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="mockup-banner"
                  style={{
                    background:
                      slideshowData[currentSlide].gradient
                  }}
                >
                  <h3>
                    {slideshowData[currentSlide].title}
                  </h3>

                  <p>
                    {slideshowData[currentSlide].subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="mockup-content">
                <div className="mockup-item skeleton"></div>
                <div className="mockup-item skeleton short"></div>
                <div className="mockup-item skeleton"></div>
              </div>

            </div>
          </div>
        </motion.div>
      </header>

      {/* Features Section */}
      <section
        id="features"
        className="features-section container"
      >

        <div className="landing-section-header">
          <h2>
            Everything you need for your group
          </h2>

          <p>
            No more scattered WhatsApp groups
            and missing photos.
            Gatherly brings it all together.
          </p>
        </div>

        <div className="features-grid">

          <FeatureCard
            icon={<Users className="feat-icon" />}
            title="Private Workspaces"
            desc="Create temporary, invite-only workspaces for any event. When it's over, archive it."
          />

          <FeatureCard
            icon={<Layout className="feat-icon" />}
            title="Shared Gallery & Tasks"
            desc="Keep all photos in one place and track what needs to be done with checklists."
          />

          <FeatureCard
            icon={<CreditCard className="feat-icon" />}
            title="Expense Splitting"
            desc="Easily track who paid for what and settle up without the awkward math."
          />

          <FeatureCard
            icon={<Shield className="feat-icon" />}
            title="Secure & Private"
            desc="Your data is yours. Organizers have full moderation control over their workspaces."
          />

        </div>
      </section>

      {/* Login / Access Section */}
      <section
        id="access"
        className="access-section container"
      >

        <div className="landing-section-header">
          <h2>Access the Platform</h2>

          <p>
            Choose your portal to login to Gatherly.
          </p>
        </div>

        <div className="access-grid" style={{ display: 'flex', justifyContent: 'center' }}>

          <div className="access-card glass-card" style={{ maxWidth: '450px', width: '100%' }}>

            <Users
              size={48}
              className="feat-icon"
              style={{ marginBottom: '1.5rem' }}
            />

            <h3>User Portal</h3>

            <p>
              Access your workspaces,
              interact with your groups,
              and manage your events.
            </p>

            <Link
              to="/login"
              className="btn-primary access-btn"
            >
              User Portal
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
};

const FeatureCard = ({
  icon,
  title,
  desc
}) => (
  <motion.div
    className="feature-card glass-card"
    whileHover={{ y: -5 }}
    transition={{ duration: 0.2 }}
  >
    <div className="icon-wrapper">
      {icon}
    </div>

    <h3>{title}</h3>

    <p>{desc}</p>
  </motion.div>
);

export default LandingPage;