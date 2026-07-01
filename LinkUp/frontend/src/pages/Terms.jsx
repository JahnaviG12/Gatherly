import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, UserCheck, ShieldAlert, FileSignature, AlertCircle, HelpCircle } from 'lucide-react';
import Logo from '../components/Logo';
import './InfoPages.css';

const Terms = () => {
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
          <h1>Terms of Service</h1>
          <p className="subtitle">Last Updated: July 1, 2026. Welcome to Gatherly. Please read these terms carefully before creating workspaces and collaborating with your team.</p>
        </header>

        <section className="info-section">
          <h2>1. Agreement to Terms</h2>
          <p>
            By creating an account, launching a workspace, or using the collaborative features on Gatherly ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you are prohibited from using or accessing our application.
          </p>
        </section>

        <section className="info-section">
          <h2>2. Account Registration and Security</h2>
          <p>To ensure a secure environment for all users, you must agree to the following conditions:</p>
          <div className="info-grid">
            <div className="info-card">
              <h3><UserCheck size={20} /> Account Identity</h3>
              <p>You must provide accurate profile credentials during registration. You are solely responsible for all activities and tasks executed under your account identity.</p>
            </div>
            <div className="info-card">
              <h3><ShieldAlert size={20} /> Credential Safety</h3>
              <p>You must keep your password secure and confidential. Gatherly will not be liable for any loss or damage arising from your failure to protect your login tokens.</p>
            </div>
            <div className="info-card">
              <h3><FileSignature size={20} /> Workspace Authority</h3>
              <p>Workspace creators act as administrators and hold full authority to invite members, edit channels, configure tasks, split budgets, and permanently delete data.</p>
            </div>
          </div>
        </section>

        <section className="info-section">
          <h2>3. Acceptable Use and Content Policies</h2>
          <p>Collaborative features are designed to build connection, not friction. You agree to use the Platform in a responsible manner:</p>
          <ul className="info-list">
            <li><strong>No Harassment:</strong> Respect your project teammates and friends. Profanity, cyberbullying, or harassment in chats, polls, or tasks is strictly forbidden.</li>
            <li><strong>Content Integrity:</strong> You represent that you own or have the rights to any photos, documents, or videos uploaded to the workspace gallery. Do not upload illegal or infringing material.</li>
            <li><strong>Security and Stability:</strong> You must not upload viruses, execute denial-of-service attempts, or manipulate sockets/APIs to bypass database access controls.</li>
          </ul>
        </section>

        <section className="info-section">
          <h2>4. Budget & Financial Ledger Disclaimer</h2>
          <p>
            The Platform provides shared ledger and expense-splitting calculators for convenience. Gatherly is not a banking service, payment processor, or certified financial institution. Any payment agreements, settlements, or debt clearances recorded within a workspace are private obligations between the workspace members. We are not responsible for enforcing payments or correcting ledger disputes.
          </p>
        </section>

        <section className="info-section">
          <h2>5. Limitation of Liability</h2>
          <p>
            The Gatherly platform is provided on an **"as is"** and **"as available"** basis. We make no guarantees regarding server uptime, data persistence, or that the service will be entirely bug-free. In no event shall Gatherly be liable for any data loss, workflow interruptions, or indirect damages resulting from the use or inability to use the Platform.
          </p>
        </section>

        <section className="info-section">
          <h2>6. Contact and Clarification</h2>
          <p>
            For questions or requests regarding clarifications on these Terms of Service, please reach out to our legal support desk at <strong>support@gatherly.io</strong>.
          </p>
        </section>
      </main>
    </div>
  );
};

export default Terms;
