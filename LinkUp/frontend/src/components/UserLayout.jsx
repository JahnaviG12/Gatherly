import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import {
  Menu, Search, Bell, X, Layout, User, Image as ImageIcon,
  CheckSquare, DollarSign, LogOut, Activity, ChevronDown,
  Users, MessageSquare, Archive, Sun, Moon
} from 'lucide-react';
import Logo from '../components/Logo';
import '../pages/UserDashboard.css';

const API = 'http://localhost:5000';

/* ── Notification type → icon map ── */
const NotifIcon = ({ type }) => {
  if (type === 'task')     return <CheckSquare size={16} />;
  if (type === 'activity') return <ImageIcon size={16} />;
  if (type === 'chat')     return <MessageSquare size={16} />;
  return <Bell size={16} />;
};

const UserLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen,    setIsMenuOpen]    = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen,   setIsNotifOpen]   = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [userData,      setUserData]      = useState(null);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('gatherly_theme') || 'light');
  const [notifications, setNotifications] = useState(
    JSON.parse(localStorage.getItem('gatherly_notifications') || '[]')
  );

  /* ── Theme ── */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gatherly_theme', theme);
  }, [theme]);

  useEffect(() => {
    const sync = () => setTheme(localStorage.getItem('gatherly_theme') || 'light');
    window.addEventListener('theme-sync', sync);
    return () => window.removeEventListener('theme-sync', sync);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('gatherly_theme', next);
    document.documentElement.setAttribute('data-theme', next);
    window.dispatchEvent(new Event('theme-sync'));
  };

  /* ── Auth guard ── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem('gatherly_user');
      if (!raw) { navigate('/login'); return; }
      setUserData(JSON.parse(raw));
    } catch {
      localStorage.removeItem('gatherly_user');
      navigate('/login');
    }
  }, [navigate]);

  /* ── Active workspace ── */
  useEffect(() => {
    const read = () => {
      try { setActiveWorkspace(JSON.parse(localStorage.getItem('gatherly_active_workspace') || 'null')); }
      catch { setActiveWorkspace(null); }
    };
    read();
    const onStorage = (e) => { if (e.key === 'gatherly_active_workspace') read(); };
    window.addEventListener('active_workspace_changed', read);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('active_workspace_changed', read);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  /* ── Clear workspace scope on dashboard/workspace list routes ── */
  useEffect(() => {
    const p = location.pathname;
    if (p === '/userdashboard' || p === '/workspace') {
      localStorage.removeItem('gatherly_active_workspace');
      setActiveWorkspace(null);
      window.dispatchEvent(new Event('active_workspace_changed'));
    }
  }, [location.pathname]);

  /* ── Notifications polling ── */
  useEffect(() => {
    const fetchNotifs = async () => {
      if (!userData) return;
      try {
        const notifs = [];
        const readIds = JSON.parse(localStorage.getItem('gatherly_read_notifs') || '[]');
        let spaces = [];
        try {
          const uidStr = userData.email || userData.username;
          const r = await fetch(`${API}/api/spaces/user/${encodeURIComponent(uidStr)}`);
          spaces = r.ok ? await r.json() : JSON.parse(localStorage.getItem('gatherly_workspaces') || '[]');
        } catch { spaces = JSON.parse(localStorage.getItem('gatherly_workspaces') || '[]'); }

        const isUserMember = (space) => {
          const uid = userData._id || userData.id;
          const isCreator = space.creator && (space.creator === uid || (typeof space.creator === 'object' && (space.creator._id === uid || space.creator.id === uid)));
          return isCreator || (Array.isArray(space.members) && space.members.some(m => {
            const mId = typeof m === 'object' ? (m._id || m.id) : String(m);
            return mId === uid || m === uid;
          }));
        };

        // Fusion request notifications
        for (const space of spaces) {
          if (!Array.isArray(space.fusionRequests) || !space.fusionRequests.length) continue;
          const isMember = isUserMember(space);
          space.fusionRequests.forEach(req => {
            if (isMember) {
              const nId = `fusion_in_${req.id}`;
              notifs.push({ id: nId, type: 'system', user: 'Collaboration Invite', text: `"${req.senderName}" wants to fuse with "${space.name}"!`, time: 'Pending', unread: !readIds.includes(nId) });
            }
            const sender = spaces.find(s => (s._id || s.id) === req.senderId);
            if (sender && isUserMember(sender)) {
              const nId = `fusion_out_${req.id}`;
              notifs.push({ id: nId, type: 'system', user: 'Proposal Sent', text: `Proposal from "${sender.name}" to "${space.name}" is pending.`, time: 'Awaiting', unread: !readIds.includes(nId) });
            }
          });
        }

        // Pending task notifications
        for (const space of spaces) {
          if (!isUserMember(space)) continue;
          try {
            const r = await fetch(`${API}/api/tasks/workspace/${space._id || space.id}`);
            if (r.ok) (await r.json()).forEach(t => {
              if (t.status !== 'done' && t.status !== 'completed') {
                const nId = `task_${t._id}`;
                notifs.push({ id: nId, type: 'task', user: 'Task Manager', text: `Pending: '${t.title}' in ${space.name}`, time: 'Needs attention', unread: !readIds.includes(nId) });
              }
            });
          } catch {}
        }

        // Gallery notifications
        for (const space of spaces) {
          if (!isUserMember(space)) continue;
          const gallery = JSON.parse(localStorage.getItem(`gallery_${space._id || space.id}`) || '[]');
          if (gallery.length) {
            const recent = gallery[0];
            const nId = `gal_${recent.id || recent._id || 'recent'}_${space._id || space.id}`;
            notifs.push({ id: nId, type: 'activity', user: recent.uploader || 'A member', text: `uploaded new media to ${space.name}`, time: 'Recently', unread: !readIds.includes(nId) });
          }
        }

        if (!notifs.length) notifs.push({ id: 'sys_welcome', type: 'system', user: 'System', text: 'Welcome! Join a workspace to see real-time updates.', time: 'Just now', unread: false });

        const final = notifs.slice(0, 5);
        setNotifications(final);
        localStorage.setItem('gatherly_notifications', JSON.stringify(final));
        window.dispatchEvent(new Event('notifications_updated'));
      } catch (err) { console.error(err); }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    const onUpdate = () => setNotifications(JSON.parse(localStorage.getItem('gatherly_notifications') || '[]'));
    window.addEventListener('notifications_updated', onUpdate);
    return () => { clearInterval(interval); window.removeEventListener('notifications_updated', onUpdate); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  const handleNotifClick = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, unread: false } : n);
    setNotifications(updated);
    localStorage.setItem('gatherly_notifications', JSON.stringify(updated));
    const readIds = JSON.parse(localStorage.getItem('gatherly_read_notifs') || '[]');
    if (!readIds.includes(id)) { readIds.push(id); localStorage.setItem('gatherly_read_notifs', JSON.stringify(readIds)); }
    window.dispatchEvent(new Event('notifications_updated'));
  };

  const handleLogout = () => {
    ['gatherly_token', 'gatherly_user', 'gatherly_active_workspace'].forEach(k => localStorage.removeItem(k));
    navigate('/login');
  };

  /* ── Derived helpers ── */
  const getActiveTab = () => {
    const p = location.pathname;
    if (p.includes('/workspace'))    return 'Workspace';
    if (p.includes('/notifications')) return 'Notifications';
    if (p.includes('/history'))       return 'History';
    if (p.includes('/gallery'))       return 'Gallery';
    if (p.includes('/teamhub'))       return 'Team Hub';
    if (p.includes('/pulse'))         return 'Community Pulse';
    if (p.includes('/expenses'))      return 'Expenses';
    return 'Dashboard';
  };

  const getWorkspaceFromURL = () => {
    const m = location.pathname.match(/\/workspace\/([a-zA-Z0-9_-]+)/);
    if (!m) return null;
    try {
      const spaces = JSON.parse(localStorage.getItem('gatherly_workspaces') || '[]');
      return spaces.find(s => { const id = s._id || s.id; return (typeof id === 'object' ? (id.$oid || String(id)) : String(id || '')) === m[1]; }) || null;
    } catch { return null; }
  };

  if (!userData) return null;

  const activeTab        = getActiveTab();
  const displayWorkspace = activeWorkspace || getWorkspaceFromURL();
  const getPageUrl       = (page) => displayWorkspace ? `/workspace/${displayWorkspace._id || displayWorkspace.id}/${page}` : `/${page}`;
  const unreadCount      = notifications.filter(n => n.unread).length;

  const dropAnim = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 10 } };

  const navLinks = [
    { to: '/userdashboard', label: 'Dashboard',       tab: 'Dashboard',       icon: <Layout size={18} /> },
    { to: '/notifications', label: 'Notifications',   tab: 'Notifications',   icon: <Bell size={18} /> },
    { to: '/workspace',     label: 'Workspace',        tab: 'Workspace',       icon: <Users size={18} /> },
    { to: getPageUrl('gallery'),   label: 'Gallery',        tab: 'Gallery',         icon: <ImageIcon size={18} /> },
    { to: getPageUrl('teamhub'),   label: 'Team Hub',       tab: 'Team Hub',        icon: <CheckSquare size={18} /> },
    { to: getPageUrl('pulse'),     label: 'Community Pulse',tab: 'Community Pulse', icon: <Activity size={18} /> },
    { to: getPageUrl('expenses'),  label: 'Expenses',       tab: 'Expenses',        icon: <DollarSign size={18} /> },
    { to: getPageUrl('history'),   label: 'History',        tab: 'History',         icon: <Archive size={18} /> },
  ];

  return (
    <div className="dashboard-wrapper">
      {/* HEADER */}
      <header className="dashboard-header">
        <div className="header-left">
          <Link to="/userdashboard" className="brand-link">
            <Logo size={28} />
            <span className="brand-text">Gatherly</span>
          </Link>
          <div className="header-divider" />
          <div className="header-title">{activeTab}</div>
          {displayWorkspace && (() => {
            const color  = displayWorkspace.theme || '#0ea5e9';
            const isHex  = color.startsWith('#');
            return (
              <div className="header-scope-pill" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: isHex ? `${color}14` : 'rgba(14,165,233,0.08)', border: isHex ? `1px solid ${color}2b` : '1px solid rgba(14,165,233,0.15)', color, padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, marginLeft: '0.75rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, display: 'inline-block', boxShadow: isHex ? `0 0 8px ${color}` : '0 0 8px #0ea5e9' }} />
                🔒 {displayWorkspace.name} Scoped
              </div>
            );
          })()}
        </div>

        <div className="header-right">
          {/* Search */}
          <div className="search-bar">
            <Search size={18} color="var(--text-secondary)" />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <span className="search-shortcut">⌘ K</span>
          </div>

          <div className="header-actions">
            {/* Theme toggle */}
            <div className="action-btn-container">
              <button className="icon-btn theme-toggle-btn" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} style={{ transition: 'all 0.3s ease' }}>
                {theme === 'light' ? <Moon size={20} className="theme-icon moon-icon" /> : <Sun size={20} className="theme-icon sun-icon" />}
              </button>
            </div>

            {/* Notifications */}
            <div className="action-btn-container">
              <button className="icon-btn" onClick={() => { setIsNotifOpen(p => !p); setIsProfileOpen(false); }}>
                <Bell size={20} />
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </button>
              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div className="dropdown-panel notif-panel" {...dropAnim}>
                    <div className="dropdown-header"><span>Notifications</span></div>
                    <div className="dropdown-list">
                      {notifications.map(n => (
                        <div className={`dropdown-item ${n.unread ? 'unread' : ''}`} key={n.id} onClick={() => handleNotifClick(n.id)}>
                          <div className={`notif-icon ${n.type}`}><NotifIcon type={n.type} /></div>
                          <div className="dropdown-content">
                            <p><strong>{n.user || ''}</strong> {n.text}</p>
                            <span className="notif-time">{n.time}</span>
                          </div>
                          {n.unread && <div className="unread-dot" />}
                        </div>
                      ))}
                    </div>
                    <Link to="/notifications" className="view-all-notifs" onClick={() => setIsNotifOpen(false)}>View all notifications</Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile */}
            <div className="action-btn-container">
              <button className="profile-btn" onClick={() => { setIsProfileOpen(p => !p); setIsNotifOpen(false); }}>
                <img src={userData.profilePicture || `https://ui-avatars.com/api/?name=${userData.username}&background=0ea5e9&color=fff`} alt="Profile" className="profile-img" />
                <span className="profile-name" style={{ textTransform: 'capitalize' }}>{userData.username}<ChevronDown size={14} /></span>
              </button>
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div className="dropdown-panel profile-panel" {...dropAnim}>
                    <Link to="/profile" className="dropdown-link" onClick={() => setIsProfileOpen(false)}><User size={16} /> Profile</Link>
                    <button className="dropdown-link logout" onClick={handleLogout}><LogOut size={16} /> Logout</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Menu toggle */}
            <button className="icon-btn menu-toggle" onClick={() => setIsMenuOpen(p => !p)}><Menu size={20} /></button>
          </div>
        </div>
      </header>

      {/* SIDE MENU */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div className="menu-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMenuOpen(false)} />
            <motion.div className="side-menu" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.3 }}>
              <div className="menu-header">
                <span>Menu</span>
                <button className="close-btn" onClick={() => setIsMenuOpen(false)}><X size={20} /></button>
              </div>
              <div className="menu-links">
                {navLinks.map(({ to, label, tab, icon }) => (
                  <Link key={tab} to={to} className={`menu-link ${activeTab === tab ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
                    {icon} {label}
                  </Link>
                ))}
              </div>
              <div className="menu-footer" style={{ marginTop: 'auto', padding: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
                <button onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-light)', padding: '0.8rem 1rem', borderRadius: '12px', width: '100%', cursor: 'pointer', color: 'var(--text-dark)', fontWeight: 600, transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary-blue)'; e.currentTarget.style.color = 'var(--primary-blue)'; }}
                  onMouseOut={e  => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-dark)'; }}>
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* PAGE CONTENT */}
      <Outlet context={{ searchQuery }} />
    </div>
  );
};

export default UserLayout;