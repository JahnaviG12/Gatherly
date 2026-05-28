import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Menu, Search, Bell, X, ShieldCheck, Users, Layout, 
  Flag, MessageSquare, Megaphone, BarChart3, Settings, LogOut,
  TrendingUp, Activity, CheckCircle, Trash2, Ban, Eye
} from 'lucide-react';
import Logo from '../components/Logo';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    // Basic verification check (will redirect if not logged in as admin)
    const adminUser = localStorage.getItem('gatherly_admin_user');
    if (!adminUser) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('gatherly_admin_token');
    localStorage.removeItem('gatherly_admin_user');
    navigate('/admin/login');
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="admin-wrapper">
      
      {/* HEADER */}
      <header className="admin-header">
        <div className="admin-header-left">
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Logo size={36} />
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '-0.05em' }}>Gatherly</span>
          </Link>
          <div className="admin-page-title">
            <ShieldCheck size={20} color="var(--accent-primary)" /> Admin Portal
          </div>
        </div>

        <div className="admin-header-right">
          <button className="admin-icon-btn"><Search size={20} /></button>
          <button className="admin-icon-btn" style={{ position: 'relative' }}>
            <Bell size={20} />
            <span style={{ position: 'absolute', top: '2px', right: '4px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }}></span>
          </button>
          
          <div className="admin-profile">
            <ShieldCheck size={20} />
          </div>
          
          <button className="admin-icon-btn" onClick={toggleMenu} style={{ marginLeft: '0.5rem' }}>
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* SLIDING HAMBURGER MENU */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              className="admin-menu-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMenu}
            />
            <motion.div 
              className="admin-side-menu"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
            >
              <div className="admin-menu-header">
                <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>Management</span>
                <button className="admin-icon-btn" onClick={toggleMenu}><X size={24} /></button>
              </div>
              <div className="admin-menu-links">
                <a href="#dashboard" onClick={() => { setActiveTab('dashboard'); toggleMenu(); }} className={`admin-menu-link ${activeTab === 'dashboard' ? 'active' : ''}`}><Activity size={20} /> Dashboard Overview</a>
                <a href="#users" onClick={() => { setActiveTab('users'); toggleMenu(); }} className={`admin-menu-link ${activeTab === 'users' ? 'active' : ''}`}><Users size={20} /> Users Management</a>
                <a href="#spaces" onClick={() => { setActiveTab('spaces'); toggleMenu(); }} className={`admin-menu-link ${activeTab === 'spaces' ? 'active' : ''}`}><Layout size={20} /> Active Spaces</a>
                <a href="#reports" onClick={() => { setActiveTab('reports'); toggleMenu(); }} className={`admin-menu-link ${activeTab === 'reports' ? 'active' : ''}`}><Flag size={20} /> Moderation & Reports</a>
                <a href="#reviews" onClick={() => { setActiveTab('reviews'); toggleMenu(); }} className={`admin-menu-link ${activeTab === 'reviews' ? 'active' : ''}`}><MessageSquare size={20} /> Platform Reviews</a>
                <a href="#announcements" onClick={() => { setActiveTab('announcements'); toggleMenu(); }} className={`admin-menu-link ${activeTab === 'announcements' ? 'active' : ''}`}><Megaphone size={20} /> Announcements</a>
                <a href="#analytics" onClick={() => { setActiveTab('analytics'); toggleMenu(); }} className={`admin-menu-link ${activeTab === 'analytics' ? 'active' : ''}`}><BarChart3 size={20} /> System Analytics</a>
                
                <div style={{ borderTop: '1px solid var(--border-color)', margin: '1rem 0' }}></div>
                
                <a href="#settings" className="admin-menu-link"><Settings size={20} /> Global Settings</a>
                <button onClick={handleLogout} className="admin-menu-link logout" style={{ border: 'none', background: 'transparent', cursor: 'pointer', width: '100%' }}><LogOut size={20} /> Secure Logout</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <main className="admin-content">
        
        {/* 1. Welcome Section */}
        <section className="admin-welcome">
          <div className="admin-welcome-text">
            <h1>System Operational.</h1>
            <p>Welcome back, Administrator. All platform services are currently running smoothly.</p>
          </div>
          <div>
            <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.5rem 1rem', borderRadius: '2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={18} /> All Systems Go
            </span>
          </div>
        </section>

        {/* 2. Analytics Cards */}
        <div className="admin-stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}><Users size={24} /></div>
            <div className="stat-details">
              <h4>Total Users</h4>
              <div className="value">12,450</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}><Layout size={24} /></div>
            <div className="stat-details">
              <h4>Active Spaces</h4>
              <div className="value">3,218</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}><TrendingUp size={24} /></div>
            <div className="stat-details">
              <h4>Total Uploads</h4>
              <div className="value">45.2k</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><Flag size={24} /></div>
            <div className="stat-details">
              <h4>Pending Reports</h4>
              <div className="value">14</div>
            </div>
          </div>
        </div>

        {/* 3. User Management */}
        <section id="users" className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title"><Users size={20} /> User Management</h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input type="text" placeholder="Search users..." style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Name / Email</th>
                  <th>Join Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>#USR-0921</td>
                  <td><strong>Alex Mercer</strong><br/><span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>alex@example.com</span></td>
                  <td>May 12, 2026</td>
                  <td><span className="status-badge status-active">Active</span></td>
                  <td>
                    <button className="action-btn"><Eye size={16} /></button>
                    <button className="action-btn danger"><Ban size={16} /></button>
                  </td>
                </tr>
                <tr>
                  <td>#USR-0922</td>
                  <td><strong>Sarah Jenkins</strong><br/><span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>sarah@example.com</span></td>
                  <td>May 10, 2026</td>
                  <td><span className="status-badge status-active">Active</span></td>
                  <td>
                    <button className="action-btn"><Eye size={16} /></button>
                    <button className="action-btn danger"><Ban size={16} /></button>
                  </td>
                </tr>
                <tr>
                  <td>#USR-0923</td>
                  <td><strong>SuspiciousBot</strong><br/><span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>bot@spam.com</span></td>
                  <td>May 18, 2026</td>
                  <td><span className="status-badge status-blocked">Blocked</span></td>
                  <td>
                    <button className="action-btn"><Eye size={16} /></button>
                    <button className="action-btn danger"><Trash2 size={16} /></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
          
          {/* 4. Reports & Moderation */}
          <section id="reports" className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title"><Flag size={20} /> Recent Reports</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: '0.5rem', borderLeft: '4px solid #ef4444' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#ef4444' }}>Abusive Comment</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>10 mins ago</span>
                </div>
                <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>User reported for using inappropriate language in "Goa Trip 2026" space.</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button style={{ padding: '0.4rem 0.8rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Delete Content</button>
                  <button style={{ padding: '0.4rem 0.8rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-primary)' }}>Dismiss</button>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Platform Announcements */}
          <section id="announcements" className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title"><Megaphone size={20} /> Global Announcements</h2>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <input type="text" placeholder="Announcement Title" style={{ width: '100%', padding: '0.75rem', marginBottom: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
              <textarea placeholder="Type your message to all users..." rows="3" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'none' }}></textarea>
            </div>
            <button style={{ width: '100%', padding: '0.75rem', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}>Publish Announcement</button>
          </section>
          
        </div>

        {/* 6. Activity Analytics (Mock Chart) */}
        <section id="analytics" className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title"><BarChart3 size={20} /> Weekly Platform Activity</h2>
          </div>
          <div className="mock-chart">
            <div className="bar-wrapper"><div className="bar" style={{ height: '40%' }}></div><span className="bar-label">Mon</span></div>
            <div className="bar-wrapper"><div className="bar" style={{ height: '55%' }}></div><span className="bar-label">Tue</span></div>
            <div className="bar-wrapper"><div className="bar" style={{ height: '30%' }}></div><span className="bar-label">Wed</span></div>
            <div className="bar-wrapper"><div className="bar" style={{ height: '70%' }}></div><span className="bar-label">Thu</span></div>
            <div className="bar-wrapper"><div className="bar" style={{ height: '85%' }}></div><span className="bar-label">Fri</span></div>
            <div className="bar-wrapper"><div className="bar" style={{ height: '100%' }}></div><span className="bar-label">Sat</span></div>
            <div className="bar-wrapper"><div className="bar" style={{ height: '60%' }}></div><span className="bar-label">Sun</span></div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default AdminDashboard;
