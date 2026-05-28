import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';

import {
  Menu,
  Search,
  Bell,
  X,
  Layout,
  User,
  Image as ImageIcon,
  CheckSquare,
  DollarSign,
  LogOut,
  Activity,
  ChevronDown,
  Users,
  MessageSquare,
  Archive,
  Sun,
  Moon
} from 'lucide-react';

import Logo from '../components/Logo';
import '../pages/UserDashboard.css';

// Real notifications will be fetched and managed dynamically in the component

const UserLayout = () => {

  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const [theme, setTheme] = useState(localStorage.getItem('gatherly_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gatherly_theme', theme);
  }, [theme]);

  useEffect(() => {
    const syncTheme = () => {
      setTheme(localStorage.getItem('gatherly_theme') || 'light');
    };
    window.addEventListener('theme-sync', syncTheme);
    return () => window.removeEventListener('theme-sync', syncTheme);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('gatherly_theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      window.dispatchEvent(new Event('theme-sync'));
      return newTheme;
    });
  };

  const [searchQuery, setSearchQuery] = useState('');

  const [userData, setUserData] = useState(null);

  const [activeWorkspace, setActiveWorkspace] =
    useState(null);

  const [notifications, setNotifications] = useState(
    JSON.parse(localStorage.getItem('gatherly_notifications') || '[]')
  );

  useEffect(() => {
    const fetchRealNotifications = async () => {
      if (!userData) return;
      try {
        const notifs = [];
        const readIds = JSON.parse(localStorage.getItem('gatherly_read_notifs') || '[]');
        
        // Always fetch fresh workspaces list to get real-time fusion request alerts
        let spaces = [];
        const res = await fetch('http://localhost:5000/api/spaces');
        if (res.ok) {
          spaces = await res.json();
        } else {
          spaces = JSON.parse(localStorage.getItem('gatherly_workspaces') || '[]');
        }

        // Add high-priority Workspace Fusion invitations
        for (const space of spaces) {
          const isCreator = space.creator && (
            space.creator === userData._id || 
            space.creator === userData.id || 
            (typeof space.creator === 'object' && (space.creator._id === userData._id || space.creator.id === userData.id))
          );
          
          const isMember = isCreator || (Array.isArray(space.members) && space.members.some(m => {
            const mId = typeof m === 'object' ? (m._id || m.id) : String(m);
            return mId === userData._id || mId === userData.id || m === userData._id || m === userData.id;
          }));

          if (Array.isArray(space.fusionRequests) && space.fusionRequests.length > 0) {
            space.fusionRequests.forEach(req => {
              // 1. If current user is a member of the RECEIVER space: show Invite Notification
              if (isMember) {
                const nId = `fusion_in_${req.id}`;
                notifs.push({
                  id: nId,
                  type: 'system',
                  user: 'Collaboration Invite',
                  text: `"${req.senderName}" wants to fuse and collaborate with "${space.name}"!`,
                  time: 'Pending decision',
                  unread: !readIds.includes(nId)
                });
              }

              // 2. If current user is a member of the SENDER space: show Outgoing Request Notification
              const senderSpace = spaces.find(s => (s._id || s.id) === req.senderId);
              if (senderSpace) {
                const isSenderCreator = senderSpace.creator && (
                  senderSpace.creator === userData._id || 
                  senderSpace.creator === userData.id || 
                  (typeof senderSpace.creator === 'object' && (senderSpace.creator._id === userData._id || senderSpace.creator.id === userData.id))
                );
                const isSenderMember = isSenderCreator || (Array.isArray(senderSpace.members) && senderSpace.members.some(m => {
                  const mId = typeof m === 'object' ? (m._id || m.id) : String(m);
                  return mId === userData._id || mId === userData.id || m === userData._id || m === userData.id;
                }));

                if (isSenderMember) {
                  const nId = `fusion_out_${req.id}`;
                  notifs.push({
                    id: nId,
                    type: 'system',
                    user: 'Proposal Sent',
                    text: `Collaboration proposal sent from "${senderSpace.name}" to "${space.name}" is pending.`,
                    time: 'Awaiting answer',
                    unread: !readIds.includes(nId)
                  });
                }
              }
            });
          }
        }

        for (const space of spaces) {
          try {
            const tRes = await fetch(`http://localhost:5000/api/tasks/workspace/${space._id || space.id}`);
            if (tRes.ok) {
              const tasks = await tRes.json();
              tasks.forEach(t => {
                if (t.status !== 'done' && t.status !== 'completed') {
                  const nId = `task_${t._id}`;
                  notifs.push({
                    id: nId,
                    type: 'task',
                    user: 'Task Manager',
                    text: `Pending task: '${t.title}' in ${space.name}`,
                    time: 'Needs attention',
                    unread: !readIds.includes(nId)
                  });
                }
              });
            }
          } catch(e) {}
        }

        for (const space of spaces) {
          const gallery = JSON.parse(localStorage.getItem(`gallery_${space._id || space.id}`) || '[]');
          if (gallery.length > 0) {
            const recent = gallery[0];
            const nId = `gal_${recent.id || recent._id || 'recent'}_${space._id || space.id}`;
            notifs.push({
              id: nId,
              type: 'activity',
              user: recent.uploader || 'A member',
              text: `uploaded new media to ${space.name}`,
              time: 'Recently',
              unread: !readIds.includes(nId)
            });
          }
        }

        if (notifs.length === 0) {
          notifs.push({
            id: 'sys_welcome',
            type: 'system',
            user: 'System',
            text: 'Welcome! Join a workspace to see real-time updates.',
            time: 'Just now',
            unread: false
          });
        }
        
        const finalNotifs = notifs.slice(0, 5);
        setNotifications(finalNotifs);
        localStorage.setItem('gatherly_notifications', JSON.stringify(finalNotifs));
        window.dispatchEvent(new Event('notifications_updated'));
      } catch (err) {
        console.error(err);
      }
    };

    fetchRealNotifications();
    const interval = setInterval(fetchRealNotifications, 15000);
    
    const handleUpdate = () => setNotifications(JSON.parse(localStorage.getItem('gatherly_notifications') || '[]'));
    window.addEventListener('notifications_updated', handleUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications_updated', handleUpdate);
    };
  }, []);

  const handleNotifClick = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, unread: false } : n);
    setNotifications(updated);
    localStorage.setItem('gatherly_notifications', JSON.stringify(updated));
    
    const readIds = JSON.parse(localStorage.getItem('gatherly_read_notifs') || '[]');
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem('gatherly_read_notifs', JSON.stringify(readIds));
    }
    
    window.dispatchEvent(new Event('notifications_updated'));
  };

  /* ========================================= */
  /* AUTH */
  /* ========================================= */

  useEffect(() => {

    try {

      const user =
        localStorage.getItem('gatherly_user');

      if (!user) {
        navigate('/login');
        return;
      }

      setUserData(JSON.parse(user));

    } catch (error) {

      console.error('User Parse Error:', error);

      localStorage.removeItem('gatherly_user');

      navigate('/login');
    }

  }, [navigate]);

  /* ========================================= */
  /* ACTIVE WORKSPACE */
  /* ========================================= */

  useEffect(() => {

    const checkActiveWorkspace = () => {

      try {

        const savedWorkspace =
          localStorage.getItem(
            'gatherly_active_workspace'
          );

        if (savedWorkspace) {

          setActiveWorkspace(
            JSON.parse(savedWorkspace)
          );

        } else {

          setActiveWorkspace(null);
        }

      } catch (error) {

        console.error(
          'Workspace Parse Error:',
          error
        );

        setActiveWorkspace(null);
      }
    };

    checkActiveWorkspace();

    window.addEventListener(
      'active_workspace_changed',
      checkActiveWorkspace
    );

    const handleStorageChange = (e) => {
      if (e.key === 'gatherly_active_workspace') {
        checkActiveWorkspace();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(
        'active_workspace_changed',
        checkActiveWorkspace
      );
      window.removeEventListener('storage', handleStorageChange);
    };

  }, []);

  /* ========================================= */
  /* AUTO-CLEAR WORKSPACE SCOPE */
  /* ========================================= */

  useEffect(() => {
    const path = location.pathname;
    if (path === '/userdashboard' || path === '/workspace') {
      localStorage.removeItem('gatherly_active_workspace');
      setActiveWorkspace(null);
      // Dispatch event in case other components are listening
      window.dispatchEvent(new Event('active_workspace_changed'));
    }
  }, [location.pathname]);

  /* ========================================= */
  /* LOADING */
  /* ========================================= */

  if (!userData) {
    return null;
  }

  /* ========================================= */
  /* LOGOUT */
  /* ========================================= */

  const handleLogout = () => {

    localStorage.removeItem('gatherly_token');

    localStorage.removeItem('gatherly_user');

    localStorage.removeItem(
      'gatherly_active_workspace'
    );

    navigate('/login');
  };

  /* ========================================= */
  /* MENU */
  /* ========================================= */

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  /* ========================================= */
  /* ACTIVE TAB */
  /* ========================================= */

  const getActiveTab = () => {

    const path = location.pathname;

    if (path.includes('/workspace'))
      return 'Workspace';

    if (path.includes('/notifications'))
      return 'Notifications';

    if (path.includes('/history'))
      return 'History';

    if (path.includes('/gallery'))
      return 'Gallery';

    if (path.includes('/teamhub'))
      return 'Team Hub';

    if (path.includes('/pulse'))
      return 'Community Pulse';

    if (path.includes('/expenses'))
      return 'Expenses';

    return 'Dashboard';
  };

  const getWorkspaceFromURL = () => {
    const path = location.pathname;
    const match = path.match(/\/workspace\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      const spaceId = match[1];
      try {
        const savedSpaces = JSON.parse(localStorage.getItem('gatherly_workspaces') || '[]');
        const found = savedSpaces.find(s => {
          const sId = s._id || s.id;
          const sIdStr = typeof sId === 'object' ? (sId.$oid || String(sId)) : String(sId || '');
          return sIdStr === spaceId;
        });
        if (found) return found;
      } catch (e) {}
    }
    return null;
  };

  const displayWorkspace = activeWorkspace || getWorkspaceFromURL();

  // Helper to generate correct URL based on workspace context
  const getPageUrl = (page) => {
    if (displayWorkspace) {
      const workspaceId = displayWorkspace._id || displayWorkspace.id;
      return `/workspace/${workspaceId}/${page}`;
    }
    return `/${page}`;
  };
  const activeTab = getActiveTab();

  return (

    <div className="dashboard-wrapper">

      {/* ========================================= */}
      {/* HEADER */}
      {/* ========================================= */}

      <header className="dashboard-header">

        <div className="header-left">

          <Link
            to="/userdashboard"
            className="brand-link"
          >

            <Logo size={28} />

            <span className="brand-text">
              Gatherly
            </span>

          </Link>

          <div className="header-divider"></div>

          <div className="header-title">
            {activeTab}
          </div>

          {displayWorkspace && (() => {
            const themeColor = displayWorkspace.theme || '#0ea5e9';
            const isHex = themeColor.startsWith('#');
            const bgVal = isHex ? `${themeColor}14` : 'rgba(14, 165, 233, 0.08)';
            const borderVal = isHex ? `1px solid ${themeColor}2b` : '1px solid rgba(14, 165, 233, 0.15)';
            const dotShadow = isHex ? `0 0 8px ${themeColor}` : '0 0 8px #0ea5e9';

            return (
              <div
                className="header-scope-pill"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: bgVal,
                  border: borderVal,
                  color: themeColor,
                  padding: '0.3rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  marginLeft: '0.75rem'
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: themeColor,
                    display: 'inline-block',
                    boxShadow: dotShadow
                  }}
                ></span>
                🔒 {displayWorkspace.name} Scoped
              </div>
            );
          })()}

        </div>

        {/* RIGHT */}

        <div className="header-right">

          {/* SEARCH */}

          <div className="search-bar">

            <Search
              size={18}
              color="var(--text-secondary)"
            />

            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
            />

            <span className="search-shortcut">
              ⌘ K
            </span>

          </div>

          <div className="header-actions">

            {/* THEME TOGGLE */}
            <div className="action-btn-container">
              <button
                className="icon-btn theme-toggle-btn"
                onClick={toggleTheme}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                style={{ transition: 'all 0.3s ease' }}
              >
                {theme === 'light' ? (
                  <Moon size={20} className="theme-icon moon-icon" />
                ) : (
                  <Sun size={20} className="theme-icon sun-icon" />
                )}
              </button>
            </div>

            {/* NOTIFICATION */}

            <div className="action-btn-container">

              <button
                className="icon-btn"
                onClick={() => {

                  setIsNotifOpen(!isNotifOpen);

                  setIsProfileOpen(false);
                }}
              >

                <Bell size={20} />

                {notifications.filter(n => n.unread).length > 0 && (
                  <span className="notif-badge">
                    {notifications.filter(n => n.unread).length}
                  </span>
                )}

              </button>

              <AnimatePresence>

                {isNotifOpen && (

                  <motion.div
                    className="dropdown-panel notif-panel"
                    initial={{
                      opacity: 0,
                      y: 10
                    }}
                    animate={{
                      opacity: 1,
                      y: 0
                    }}
                    exit={{
                      opacity: 0,
                      y: 10
                    }}
                  >

                    <div className="dropdown-header">
                      <span>Notifications</span>
                    </div>

                    <div className="dropdown-list">
                      {notifications.map((n) => (
                        <div 
                          className={`dropdown-item ${n.unread ? 'unread' : ''}`} 
                          key={n.id}
                          onClick={() => handleNotifClick(n.id)}
                        >
                          <div className={`notif-icon ${n.type}`}>
                            {n.type === 'task' && <CheckSquare size={16} />}
                            {n.type === 'activity' && <ImageIcon size={16} />}
                            {n.type === 'system' && <Bell size={16} />}
                            {n.type === 'chat' && <MessageSquare size={16} />}
                            {(!n.type || !['task', 'activity', 'system', 'chat'].includes(n.type)) && <Bell size={16} />}
                          </div>
                          <div className="dropdown-content">
                            <p>
                              <strong>{n.user || ''}</strong> {n.text}
                            </p>
                            <span className="notif-time">{n.time}</span>
                          </div>
                          {n.unread && <div className="unread-dot"></div>}
                        </div>
                      ))}
                    </div>
                    <Link to="/notifications" className="view-all-notifs" onClick={() => setIsNotifOpen(false)}>
                      View all notifications
                    </Link>

                  </motion.div>

                )}

              </AnimatePresence>

            </div>

            {/* PROFILE */}

            <div className="action-btn-container">

              <button
                className="profile-btn"
                onClick={() => {

                  setIsProfileOpen(
                    !isProfileOpen
                  );

                  setIsNotifOpen(false);
                }}
              >

                <img
                  src={
                    userData.profilePicture ||
                    `https://ui-avatars.com/api/?name=${userData.username}&background=0ea5e9&color=fff`
                  }
                  alt="Profile"
                  className="profile-img"
                />

                <span
                  className="profile-name"
                  style={{
                    textTransform: 'capitalize'
                  }}
                >

                  {userData.username}

                  <ChevronDown size={14} />

                </span>

              </button>

              <AnimatePresence>

                {isProfileOpen && (

                  <motion.div
                    className="dropdown-panel profile-panel"
                    initial={{
                      opacity: 0,
                      y: 10
                    }}
                    animate={{
                      opacity: 1,
                      y: 0
                    }}
                    exit={{
                      opacity: 0,
                      y: 10
                    }}
                  >

                    <Link
                      to="/profile"
                      className="dropdown-link"
                      onClick={() =>
                        setIsProfileOpen(false)
                      }
                    >

                      <User size={16} />

                      Profile

                    </Link>



                    <button
                      className="dropdown-link logout"
                      onClick={handleLogout}
                    >

                      <LogOut size={16} />

                      Logout

                    </button>

                  </motion.div>

                )}

              </AnimatePresence>

            </div>

            {/* MENU */}

            <button
              className="icon-btn menu-toggle"
              onClick={toggleMenu}
            >

              <Menu size={20} />

            </button>

          </div>

        </div>

      </header>

      {/* ========================================= */}
      {/* RIGHT SIDEBAR */}
      {/* ========================================= */}

      <AnimatePresence>

        {isMenuOpen && (

          <>

            <motion.div
              className="menu-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMenu}
            />

            <motion.div
              className="side-menu"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{
                type: 'tween',
                duration: 0.3
              }}
            >

              <div className="menu-header">

                <span>Menu</span>

                <button
                  className="close-btn"
                  onClick={toggleMenu}
                >

                  <X size={20} />

                </button>

              </div>

              <div className="menu-links">

                <Link
                  to="/userdashboard"
                  className={`menu-link ${
                    activeTab === 'Dashboard'
                      ? 'active'
                      : ''
                  }`}
                  onClick={toggleMenu}
                >

                  <Layout size={18} />

                  Dashboard

                </Link>

                <Link
                  to="/notifications"
                  className={`menu-link ${
                    activeTab === 'Notifications'
                      ? 'active'
                      : ''
                  }`}
                  onClick={toggleMenu}
                >
                  <Bell size={18} />
                  Notifications
                </Link>

                <Link
                  to="/workspace"
                  className={`menu-link ${
                    activeTab === 'Workspace'
                      ? 'active'
                      : ''
                  }`}
                  onClick={toggleMenu}
                >

                  <Users size={18} />

                  Workspace

                </Link>

                <Link
                  to={getPageUrl('gallery')}
                  className={`menu-link ${
                    activeTab === 'Gallery'
                      ? 'active'
                      : ''
                  }`}
                  onClick={toggleMenu}
                >

                  <ImageIcon size={18} />

                  Gallery

                </Link>

                <Link
                  to={getPageUrl('teamhub')}
                  className={`menu-link ${
                    activeTab === 'Team Hub'
                      ? 'active'
                      : ''
                  }`}
                  onClick={toggleMenu}
                >

                  <CheckSquare size={18} />

                  Team Hub

                </Link>

                <Link
                  to={getPageUrl('pulse')}
                  className={`menu-link ${
                    activeTab ===
                    'Community Pulse'
                      ? 'active'
                      : ''
                  }`}
                  onClick={toggleMenu}
                >

                  <Activity size={18} />

                  Community Pulse

                </Link>

                <Link
                  to={getPageUrl('expenses')}
                  className={`menu-link ${
                    activeTab === 'Expenses'
                      ? 'active'
                      : ''
                  }`}
                  onClick={toggleMenu}
                >

                  <DollarSign size={18} />

                  Expenses

                </Link>

                <Link
                  to={getPageUrl('history')}
                  className={`menu-link ${
                    activeTab === 'History'
                      ? 'active'
                      : ''
                  }`}
                  onClick={toggleMenu}
                >
                  <Archive size={18} />
                  History
                </Link>

              </div>

              <div className="menu-footer" style={{ marginTop: 'auto', padding: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
                <button 
                  onClick={toggleTheme}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-light)', padding: '0.8rem 1rem', borderRadius: '12px', width: '100%', cursor: 'pointer', color: 'var(--text-dark)', fontWeight: 600, transition: 'all 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary-blue)'; e.currentTarget.style.color = 'var(--primary-blue)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-dark)'; }}
                >
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