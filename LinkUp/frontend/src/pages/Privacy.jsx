import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Lock, RefreshCw, FileText } from 'lucide-react';
import Logo from '../components/Logo';
import './InfoPages.css';

const Privacy = () => {
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
          <h1>Privacy Policy</h1>
          <p className="subtitle">Last Updated: July 1, 2026. At Gatherly, we believe your personal information belongs to you. This policy outlines how we collect, process, and protect your workspace data.</p>
        </header>

        <section className="info-section">
          <h2>1. Introduction</h2>
          <p>
            Gatherly ("we", "our", or "us") is dedicated to protecting the privacy of our users. This Privacy Policy describes how your personal information is collected, used, and shared when you use the Gatherly collaborative workspace platform. We operate on a fundamental principle: **your data is yours.** We do not sell your personal information to third parties, and we design our application with absolute account isolation in mind.
          </p>
        </section>

        <section className="info-section">
          <h2>2. Information We Collect</h2>
          <p>We only collect the minimum amount of information necessary to provide you with secure, real-time collaboration features:</p>
          <div className="info-grid">
            <div className="info-card">
              <h3><Shield size={20} /> Account Information</h3>
              <p>When you register for an account, we collect your username, email address, and hashed password credentials to authenticate your sessions and manage dashboard profile settings.</p>
            </div>
            <div className="info-card">
              <h3><Eye size={20} /> Workspace Content</h3>
              <p>We store the tasks, shared gallery files, expense records, messages, and poll choices you create inside your workspaces. This data is only accessible to authorized members of each space.</p>
            </div>
            <div className="info-card">
              <h3><Lock size={20} /> Device & Log Data</h3>
              <p>We log basic operational information, including your IP address, browser type, and active websocket state to maintain real-time sync connections and diagnose server latency.</p>
            </div>
          </div>
        </section>

        <section className="info-section">
          <h2>3. How We Use Your Information</h2>
          <p>We process your data strictly to fulfill our service commitments to you:</p>
          <ul className="info-list">
            <li>To operate and maintain your secure collaborative workspaces.</li>
            <li>To manage invites, verify membership, and enforce strict cross-account data isolation.</li>
            <li>To synchronize live chat, task boards, shared ledger updates, and video signaling feeds.</li>
            <li>To compile background notifications for activities only in workspaces where you are a member.</li>
            <li>To prevent fraud, secure database records, and resolve hosting infrastructure conflicts.</li>
          </ul>
        </section>

        <section className="info-section">
          <h2>4. Data Isolation & Security</h2>
          <p>
            We deploy strict user access policies and database filters to guarantee that no account can access workspace records, notifications, files, or logs from workspaces they do not officially belong to. All user passwords are encrypted using high-entropy hashing algorithms, and media attachments uploaded to your workspace gallery are isolated behind workspace-specific identifiers.
          </p>
        </section>

        <section className="info-section">
          <h2>5. Your Rights and Choices</h2>
          <p>You retain full agency over your digital presence on Gatherly:</p>
          <ul className="info-list">
            <li><strong>Access & Export:</strong> You can download or view all expense logs and workspace files created by your team.</li>
            <li><strong>Correction & Modification:</strong> You have the right to update your profile metadata, names, and passwords.</li>
            <li><strong>Deactivation:</strong> Creators can permanently delete their workspaces, which instantly removes all associated tasks, ledger entries, and gallery records from the backend server.</li>
          </ul>
        </section>

        <section className="info-section">
          <h2>6. Contact Us</h2>
          <p>
            If you have questions, feedback, or concerns regarding this Privacy Policy or data handling procedures, feel free to contact the Gatherly privacy team at <strong>privacy@gatherly.io</strong>.
          </p>
        </section>
      </main>
    </div>
  );
};

export default Privacy;
