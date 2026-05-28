import React, { useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useNavigate,
  Link,
  useOutletContext
} from 'react-router-dom';
import { io } from 'socket.io-client';

import {
  Bell,
  Layout,
  User,
  Image as ImageIcon,
  CheckSquare,
  DollarSign,
  Megaphone,
  Plus,
  ArrowRight,
  Activity,
  MessageSquare,
  Heart,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  Image,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

import './UserDashboard.css';

/* =========================================
   MOCK DATA
========================================= */

const heroImages = [
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80"
];





/* =========================================
   COMPONENT
========================================= */

const UserDashboard = () => {

  const [currentHeroImage, setCurrentHeroImage] = React.useState(0);
  const sliderRef = React.useRef(null);

  const scrollSlider = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const navigate = useNavigate();

  const { searchQuery } =
    useOutletContext();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  let user = {};
  try {
    user = JSON.parse(
      localStorage.getItem('gatherly_user') || '{}'
    );
  } catch (e) {
    console.error("Error parsing gatherly_user:", e);
  }

  /* =========================================
     WORKSPACES
  ========================================= */

  const [workspaces, setWorkspaces] = React.useState(() => {
    try {
      const saved = localStorage.getItem('gatherly_workspaces');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [tasks, setTasks] = React.useState([]);
  const [expenses, setExpenses] = React.useState([]);
  const [activities, setActivities] = React.useState([]);
  const [notifications, setNotifications] = React.useState(
    JSON.parse(localStorage.getItem('gatherly_notifications') || '[]')
  );

  React.useEffect(() => {
    const handleUpdate = () => {
      setNotifications(JSON.parse(localStorage.getItem('gatherly_notifications') || '[]'));
    };
    window.addEventListener('notifications_updated', handleUpdate);
    return () => window.removeEventListener('notifications_updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (user && user.email) {
      fetchDashboard();
    } else {
      // Fallback to local cache if not logged in
      const saved = JSON.parse(localStorage.getItem('gatherly_workspaces') || '[]');
      setWorkspaces(saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // ─── Real-time socket subscription ──────────────────────────────────────────
  useEffect(() => {
    if (!user || !user.email) return;
    const socket = io('http://localhost:5000');

    // When a workspace this user belongs to is updated, re-fetch dashboard
    socket.on('workspace_updated', () => loadDashboardData());
    socket.on('workspace_created', () => loadDashboardData());
    socket.on('member_joined', () => loadDashboardData());

    // Real-time notifications: someone joined a workspace you're in
    socket.on('member_joined', (data) => {
      const notif = {
        id: `notif_${Date.now()}`,
        user: data.member?.name || 'Someone',
        text: `joined your workspace.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'join'
      };
      setNotifications(prev => [notif, ...prev].slice(0, 20));
      const stored = JSON.parse(localStorage.getItem('gatherly_notifications') || '[]');
      localStorage.setItem('gatherly_notifications', JSON.stringify([notif, ...stored].slice(0, 20)));
      window.dispatchEvent(new Event('notifications_updated'));
    });

    return () => socket.disconnect();

    function loadDashboardData() {
      // Refetch using the same function — defined below
      fetchDashboard();
    }
  }, [user.email]);

  const fetchDashboard = async () => {
    try {
      // Use user-specific endpoint so only THIS user's workspaces show
      const userIdentifier = user.email || user.username;
      const res = await fetch(`http://localhost:5000/api/spaces/user/${encodeURIComponent(userIdentifier)}`);
      if (res.ok) {
        const spaces = await res.json();

        setWorkspaces(spaces);
        try {
          localStorage.setItem('gatherly_workspaces', JSON.stringify(spaces));
        } catch (e) { console.warn('Cache save failed', e); }

        let allTasks = [];
        let allExpenses = [];
        let allActivities = [];

        for (const space of spaces) {
          if (space.activities && space.activities.length > 0) {
            const spaceActs = space.activities.map(a => ({ ...a, target: space.name }));
            allActivities.push(...spaceActs);
          }

          try {
            const tRes = await fetch(`http://localhost:5000/api/tasks/workspace/${space._id || space.id}`);
            if (tRes.ok) {
              const spaceTasks = await tRes.json();
              allTasks.push(...spaceTasks.map(t => ({ ...t, workspaceName: space.name })));
            }
          } catch (e) {}

          try {
            const eRes = await fetch(`http://localhost:5000/api/expenses/workspace/${space._id || space.id}`);
            if (eRes.ok) {
              const spaceExpenses = await eRes.json();
              allExpenses.push(...spaceExpenses);
            }
          } catch (e) {}
        }

        allActivities.sort((a, b) => new Date(b.createdAt || b.time) - new Date(a.createdAt || a.time));
        setActivities(allActivities);
        setTasks(allTasks);
        setExpenses(allExpenses);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      const saved = JSON.parse(localStorage.getItem('gatherly_workspaces') || '[]');
      setWorkspaces(saved);
    }
  };

  /* =========================================
     SEARCH
  ========================================= */

  const filteredWorkspaces =
    workspaces.filter((w) => {
      if (!w) return false;
      const query = searchQuery?.toLowerCase() || '';
      const nameMatch = typeof w.name === 'string' && w.name.toLowerCase().includes(query);
      const descMatch = typeof w.description === 'string' && w.description.toLowerCase().includes(query);
      return nameMatch || descMatch;
    });

  const filteredTasks = tasks.filter((t) => {
    if (!t) return false;
    const query = searchQuery?.toLowerCase() || '';
    return (
      (typeof t.title === 'string' && t.title.toLowerCase().includes(query)) ||
      (typeof t.workspaceName === 'string' && t.workspaceName.toLowerCase().includes(query))
    );
  });
  
  // Calculate dynamic expense summary
  const totalExpenses = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const myOwe = expenses.reduce((sum, exp) => {
      if (exp.splits && exp.splits.length > 0) {
          const mySplit = exp.splits.find(s => s.user === user.username);
          if (mySplit) return sum + (Number(mySplit.amount) || 0);
      }
      return sum;
  }, 0);
  const myPaid = expenses.filter(e => e.paidBy === user.username).reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  
  const pendingTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'completed');

  /* =========================================
     OPEN WORKSPACE
  ========================================= */

  const getSpaceId = (ws) => {
    if (!ws) return '';
    const rawId = ws._id || ws.id;
    if (typeof rawId === 'object' && rawId !== null) {
      return rawId.$oid || rawId.toString();
    }
    return String(rawId || '');
  };

  const handleOpenWorkspace = (workspace) => {
    const spaceId = getSpaceId(workspace);
    if (!spaceId) {
      console.error('Cannot open workspace: missing ID', workspace);
      return;
    }
    // Always overwrite active workspace cache with clicked one
    try {
      localStorage.setItem('gatherly_active_workspace', JSON.stringify(workspace));
    } catch(e) {
      console.warn('Quota exceeded saving active workspace', e);
    }
    window.dispatchEvent(new Event('active_workspace_changed'));
    navigate(`/workspace/${spaceId}`);
  };

  /* =========================================
     UI
  ========================================= */

  return (

    <main className="dashboard-main-content">

      {/* HERO */}

      {searchQuery === '' && (

        <section className="hero-section">

          <div className="hero-content">

            <div className="workspace-badge">

              <ShieldCheck size={14} />

              Gatherly Workspace Hub

            </div>

            <h1>

              Welcome back,{` `}

              <span
                className="text-highlight"
                style={{
                  textTransform:
                    'capitalize'
                }}
              >

                {user.username ||
                  'User'}

              </span>

              👋

            </h1>

            <p>

              Your workspaces,
              collaboration,
              expenses, chats,
              tasks and memories —
              all connected in one
              secure place.

            </p>

            <div className="hero-stats">

              <div className="stat-pill">

                <div className="stat-icon-box">

                  <Layout size={18} />

                </div>

                <div className="stat-text">

                  <strong>
                    {
                      workspaces.length
                    }
                  </strong>

                  <span>
                    Active Workspaces
                  </span>

                </div>

              </div>

              <div className="stat-pill">

                <div className="stat-icon-box">

                  <CheckSquare
                    size={18}
                  />

                </div>

                <div className="stat-text">

                  <strong>{pendingTasks.length}</strong>

                  <span>
                    Pending Tasks
                  </span>

                </div>

              </div>

              <div className="stat-pill">

                <div className="stat-icon-box">

                  <Bell size={18} />

                </div>

                <div className="stat-text">

                  <strong>5</strong>

                  <span>
                    New Updates
                  </span>

                </div>

              </div>

            </div>

            <div className="hero-actions">

              <button
                className="btn-primary"
                onClick={() =>
                  navigate(
                    '/workspace#create'
                  )
                }
              >

                <Plus size={18} />

                Create Workspace

              </button>

              <button
                className="btn-outline"
                onClick={() =>
                  navigate(
                    '/workspace#join'
                  )
                }
              >

                <Users size={18} />

                Join Workspace

              </button>

            </div>

          </div>

          <div className="hero-illustration">

            <AnimatePresence mode="wait">
              <motion.img
                key={currentHeroImage}
                src={heroImages[currentHeroImage]}
                alt="workspace"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </AnimatePresence>

          </div>

        </section>

      )}

      {/* SEARCH */}

      {searchQuery !== '' && (

        <div
          style={{
            marginBottom: '2rem'
          }}
        >

          <h2>
            Search Results for "
            {searchQuery}"
          </h2>

          <p
            style={{
              color:
                'var(--text-secondary)'
            }}
          >

            Found{' '}
            {
              filteredWorkspaces.length
            }{' '}

            workspaces and{' '}
            {
              filteredTasks.length
            }{' '}

            tasks.

          </p>

        </div>

      )}

      {/* WORKSPACES (Full Width) */}

      <section className="content-section" style={{ marginBottom: '2rem' }}>

            <div className="section-header">

              <div className="section-title">

                <Layout size={20} />

                My Workspaces

              </div>

              <Link
                to="/workspace"
                className="view-all-link"
              >

                View All{' '}

                <ArrowRight size={16} />

              </Link>

            </div>

            <div className="spaces-slider-container">

              <button className="slider-btn left" onClick={() => scrollSlider('left')}>

                <ChevronLeft
                  size={20}
                />

              </button>

              <div className="spaces-slider" ref={sliderRef}>

                {filteredWorkspaces.map(
                  (workspace, idx) => {
                    const fallbackImages = [
                        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80",
                        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=400&q=80",
                        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80",
                        "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=400&q=80",
                        "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=400&q=80"
                    ];
                    const bgImage = workspace.cover || workspace.img || fallbackImages[idx % fallbackImages.length];
                    const membersList = workspace.members || [];
                    const displayMembers = membersList.slice(0, 3);
                    const remainingCount = membersList.length - 3;
                    return (

                    <motion.div
                      key={getSpaceId(workspace) || idx}
                      className="space-card"
                      onClick={() => handleOpenWorkspace(workspace)}
                      whileHover={{
                        y: -4
                      }}
                    >

                      <div
                        className="space-img"
                        style={{
                          backgroundImage: `url(${bgImage})`
                        }}
                      >

                        <div className="space-avatars-overlap">

                          {displayMembers.length > 0 ? displayMembers.map((m, i) => (
                            <img
                              key={i}
                              src={`https://ui-avatars.com/api/?name=${typeof m === 'object' ? m.username || m.name : m}&background=random&color=fff`}
                              alt="member"
                            />
                          )) : (
                            <img src={`https://ui-avatars.com/api/?name=${workspace.name || 'W'}&background=random&color=fff`} alt="Workspace" />
                          )}

                          {remainingCount > 0 && (
                              <div className="avatar-count">
                                +{remainingCount}
                              </div>
                          )}

                        </div>

                        <div
                          className={`space-badge ${
                            workspace.status ===
                            'Active'
                              ? 'active'
                              : 'planning'
                          }`}
                        >

                          {
                            workspace.status
                          }

                        </div>

                      </div>

                      <div className="space-details">

                        <h3>
                          {
                            workspace.name
                          }
                        </h3>

                        <p>
                          {workspace
                            .description ||
                            workspace.desc}
                        </p>

                        <div className="space-progress-container">
                          <span className="progress-text">
                            {workspace.progress || 0}%
                          </span>

                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${workspace.progress || 0}%`
                              }}
                            ></div>
                          </div>

                        </div>

                        <div className="space-meta">

                          <span>

                            <Users size={14} />

                            {workspace
                              .members
                              ?.length || 0}{' '}

                            Members

                          </span>

                          <span>

                            <Calendar size={14} />

                            {workspace.time ||
                              'Active'}

                          </span>

                        </div>

                      </div>

                    </motion.div>

                  )}
                )}

              </div>

              <button className="slider-btn right" onClick={() => scrollSlider('right')}>

                <ChevronRight
                  size={20}
                />

              </button>

            </div>

          </section>

      <div className="dashboard-grid">

        {/* LEFT */}

        <div className="grid-left">

          {/* ACTIVITY */}

          {searchQuery === '' && (

            <section className="content-section">

              <div className="section-header">

                <div className="section-title">

                  <Activity size={20} />

                  Recent Activity

                </div>

              </div>

                  <div className="activity-list">

                    {activities.length > 0 ? activities.slice(0, 10).map((activity, idx) => (

                      <div
                        className="activity-row"
                        key={activity.id || idx}
                      >

                        <div className="activity-avatar-container">

                          <img
                            src={activity.avatar || `https://ui-avatars.com/api/?name=${activity.user}&background=random&color=fff`}
                            alt=""
                            className="act-avatar"
                          />

                          <div
                            className={`act-icon-badge ${activity.type || 'message'}`}
                          >

                            {(activity.type === 'photo' || activity.action?.includes('image')) && (
                              <ImageIcon size={10} color="white" />
                            )}
                            
                            {(activity.type === 'task' || activity.action?.includes('task')) && (
                              <CheckSquare size={10} color="white" />
                            )}
                            
                            {(activity.type === 'expense' || activity.action?.includes('expense')) && (
                              <DollarSign size={10} color="white" />
                            )}
                            
                            {(!activity.type || activity.type === 'message') && !activity.action?.includes('image') && !activity.action?.includes('task') && !activity.action?.includes('expense') && (
                              <MessageSquare size={10} color="white" />
                            )}

                          </div>

                        </div>

                        <div className="activity-content">

                          <p>

                            <strong>{activity.user}</strong>{' '}
                            {activity.action}{' '}
                            <strong>{activity.target}</strong>

                          </p>

                          <span className="act-time">
                            {activity.time}
                          </span>

                        </div>
                        
                        <div className="activity-stats">
                          <span>
                            <Heart size={14} />
                            {activity.likes || 0}
                          </span>
                          <span>
                            <MessageSquare size={14} />
                            {activity.comments || 0}
                          </span>
                        </div>

                      </div>

                    )) : (
                        <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-gray)'}}>
                            <Activity size={32} style={{margin: '0 auto 1rem auto', opacity: 0.5}} />
                            <p>No recent activity across your workspaces.</p>
                        </div>
                    )}

                  </div>

            </section>

          )}

        </div>

        {/* RIGHT */}

        <div className="grid-right">

          {/* TASKS */}

          <section className="content-section">

            <div className="section-header">

              <div className="section-title">

                <CheckSquare
                  size={18}
                />

                Upcoming Tasks

              </div>

            </div>

            <div className="tasks-list">

              {filteredTasks.length > 0 ? filteredTasks.slice(0, 10).map(
                (task) => (

                  <div
                    className="task-row"
                    key={task._id || task.id}
                  >

                    <div className="task-info">

                      <h4>
                        {task.title}
                      </h4>

                      <p>

                        {
                          task.workspaceName
                        }{' '}

                        • {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Due Date'}

                      </p>

                    </div>

                    <div className="task-priority">

                      <span
                        className={`badge-priority ${(task.priority || 'Medium').toLowerCase()}`}
                      >

                        {
                          task.priority || 'Medium'
                        }

                      </span>

                    </div>

                    <div
                      className="task-progress-line"
                      style={{
                        width: `${task.status === 'done' || task.status === 'completed' ? 100 : task.status === 'in-progress' ? 50 : 0}%`
                      }}
                    ></div>

                  </div>

                )
              ) : (
                  <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-gray)'}}>
                      <CheckSquare size={32} style={{margin: '0 auto 1rem auto', opacity: 0.5}} />
                      <p>No upcoming tasks. You're all caught up!</p>
                  </div>
              )}

            </div>

          </section>

          {/* EXPENSES */}

          {searchQuery === '' && (

            <section className="content-section">

              <div className="section-header">

                <div className="section-title">

                  <DollarSign
                    size={18}
                  />

                  Expense Summary

                </div>

              </div>

              <div className="expense-overview">

                <div className="exp-box">

                  <span className="exp-label">

                    You Owe

                  </span>

                  <span className="exp-val owe">

                    ₹{myOwe.toLocaleString()}

                  </span>

                </div>

                <div className="exp-box">

                  <span className="exp-label">

                    You Paid

                  </span>

                  <span className="exp-val paid">

                    ₹{myPaid.toLocaleString()}

                  </span>

                </div>

              </div>

            </section>

          )}

          {/* NOTIFICATIONS */}

          {searchQuery === '' && (

            <section className="content-section">

              <div className="section-header">

                <div className="section-title">

                  <Bell size={18} />

                  Recent Notifications

                </div>

              </div>

              <div className="notif-list">

                {notifications.map(
                  (n) => (

                    <div
                      className="notif-row"
                      key={n.id}
                    >

                      <div className="notif-text">

                        <p>

                          <strong>
                            {n.user}
                          </strong>{' '}

                          {n.text}

                        </p>

                        <span>
                          {n.time}
                        </span>

                      </div>

                    </div>

                  )
                )}

              </div>

            </section>

          )}

        </div>

      </div>

    </main>
  );
};

export default UserDashboard;