import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import LandingPage      from './pages/LandingPage';
import Logo             from './components/Logo';
import AboutUs          from './pages/AboutUs';
import Features         from './pages/Features';
import Careers          from './pages/Careers';
import PressMedia       from './pages/PressMedia';
import UserDashboard    from './pages/UserDashboard';
import AuthPage         from './pages/AuthPage';
import WorkspacePage    from './pages/WorkspacePage';
import GalleryPage      from './pages/GalleryPage';
import TeamHub          from './pages/TeamHub';
import CommunityPulse   from './pages/CommunityPulse';
import ExpensesPage     from './pages/ExpensesPage';
import UserProfile      from './pages/UserProfile';
import NotificationsPage from './pages/NotificationsPage';
import HistoryPage      from './pages/HistoryPage';
import UserLayout       from './components/UserLayout';
import Footer           from './components/Footer';
import InvitePage       from './pages/InvitePage';

/* ── Simple page wrapper for static content routes ── */
const PageTemplate = ({ title, content }) => (
  <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
    <nav style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
        <Logo size={40} />
        <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '-0.05em' }}>Gatherly</span>
      </Link>
    </nav>
    <main style={{ flex: 1, padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontSize: '2.5rem', margin: '1.5rem 0', color: 'var(--accent-primary)' }}>{title}</h1>
      <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--text-primary)', opacity: 0.9 }}>{content}</p>
      <Link to="/userdashboard" style={{ display: 'inline-block', marginTop: '2rem', padding: '0.75rem 1.5rem', backgroundColor: 'var(--accent-primary)', color: 'white', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 'bold' }}>
        Back to Dashboard
      </Link>
    </main>
  </div>
);

/* ── Error Boundary ── */
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null, info: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('ErrorBoundary caught an error', error, info); this.setState({ info }); }
  render() {
    if (this.state.hasError) return (
      <div style={{ padding: '2rem', background: '#ffebee', color: '#c62828', minHeight: '100vh' }}>
        <h2>Something went wrong.</h2>
        <p>If this happens repeatedly, please reload the app or check the developer console for details.</p>
        <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
          <button onClick={() => window.location.reload()} style={{ padding: '0.5rem 1rem' }}>Reload App</button>
          <button onClick={() => this.setState({ hasError: false, error: null, info: null })} style={{ padding: '0.5rem 1rem' }}>Try Recover</button>
          <button onClick={() => { navigator.clipboard?.writeText((this.state.error?.toString()) + '\n\n' + (this.state.info?.componentStack || '')); alert('Error details copied to clipboard'); }} style={{ padding: '0.5rem 1rem' }}>Copy Details</button>
        </div>
        <details style={{ whiteSpace: 'pre-wrap' }}>
          <summary>Show Error Details</summary>
          <div style={{ marginTop: '0.5rem' }}>{this.state.error?.toString()}<br />{this.state.info?.componentStack}</div>
        </details>
      </div>
    );
    return this.props.children;
  }
}

/* ── App ── */
function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('gatherly_theme');
    if (saved) return saved;
    try {
      const u = JSON.parse(localStorage.getItem('gatherly_user') || '{}');
      if (u.theme && u.theme !== 'system') return u.theme;
    } catch {}
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gatherly_theme', theme);
  }, [theme]);

  useEffect(() => {
    const onThemeChange = () => {
      try {
        const u = JSON.parse(localStorage.getItem('gatherly_user') || '{}');
        if (u.theme) setTheme(u.theme === 'system' ? 'light' : u.theme);
      } catch {}
    };
    const onSync = () => setTheme(localStorage.getItem('gatherly_theme') || 'light');
    window.addEventListener('user-theme-changed', onThemeChange);
    window.addEventListener('theme-sync', onSync);
    return () => { window.removeEventListener('user-theme-changed', onThemeChange); window.removeEventListener('theme-sync', onSync); };
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('gatherly_theme', next);
    window.dispatchEvent(new Event('theme-sync'));
  };

  return (
    <ErrorBoundary>
      <Router>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <div style={{ flex: 1 }}>
            <Routes>
              <Route path="/"       element={<LandingPage theme={theme} toggleTheme={toggleTheme} />} />
              <Route path="/login"  element={<AuthPage />} />
              <Route path="/invite/:code" element={<InvitePage />} />

              <Route element={<UserLayout />}>
                <Route path="/userdashboard"                        element={<UserDashboard />} />
                <Route path="/workspace"                            element={<WorkspacePage />} />
                <Route path="/workspace/:workspaceId"               element={<WorkspacePage />} />
                <Route path="/workspace/:workspaceId/gallery"       element={<GalleryPage />} />
                <Route path="/workspace/:workspaceId/teamhub"       element={<TeamHub />} />
                <Route path="/workspace/:workspaceId/pulse"         element={<CommunityPulse />} />
                <Route path="/workspace/:workspaceId/expenses"      element={<ExpensesPage />} />
                <Route path="/workspace/:workspaceId/history"       element={<HistoryPage />} />
                <Route path="/gallery"       element={<GalleryPage />} />
                <Route path="/teamhub"       element={<TeamHub />} />
                <Route path="/pulse"         element={<CommunityPulse />} />
                <Route path="/expenses"      element={<ExpensesPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/history"       element={<HistoryPage />} />
                <Route path="/profile"       element={<UserProfile />} />
                <Route path="/settings"      element={<PageTemplate title="Settings" content="Manage your account preferences." />} />
              </Route>

              <Route path="/about"   element={<AboutUs />} />
              <Route path="/features" element={<Features />} />
              <Route path="/careers"  element={<Careers />} />
              <Route path="/press"    element={<PressMedia />} />
              <Route path="/privacy"  element={<PageTemplate title="Privacy Policy" content="Your data is yours. We do not sell your personal information to third parties." />} />
              <Route path="/terms"    element={<PageTemplate title="Terms of Service" content="By using Gatherly, you agree to our community guidelines and terms of service." />} />
              <Route path="/cookies"  element={<PageTemplate title="Cookie Policy" content="We use essential cookies to keep you logged in and ensure security." />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;