import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link, useOutletContext } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  Bell, Layout, CheckSquare, DollarSign, Plus, ArrowRight,
  Activity, MessageSquare, Heart, Calendar, Users, ChevronLeft,
  ChevronRight, Image as ImageIcon, ShieldCheck
} from 'lucide-react';
import './UserDashboard.css';

/* ── Constants ────────────────────────────────────────────────────────────── */

const heroImages = [
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80",
];

const fallbackImages = [
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=400&q=80",
];

const API = 'http://localhost:5000';

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const getSpaceId = (ws) => {
  if (!ws) return '';
  const rawId = ws._id || ws.id;
  if (typeof rawId === 'object' && rawId !== null) return rawId.$oid || rawId.toString();
  return String(rawId || '');
};

const ActivityIcon = ({ activity }) => {
  const t = activity.type || '';
  const a = activity.action || '';
  if (t === 'photo' || a.includes('image'))     return <ImageIcon size={10} color="white" />;
  if (t === 'task' || a.includes('task'))       return <CheckSquare size={10} color="white" />;
  if (t === 'expense' || a.includes('expense')) return <DollarSign size={10} color="white" />;
  return <MessageSquare size={10} color="white" />;
};

/* ── Component ────────────────────────────────────────────────────────────── */

const UserDashboard = () => {
  const navigate = useNavigate();
  const { searchQuery } = useOutletContext();
  const sliderRef = useRef(null);

  const [currentHeroImage, setCurrentHeroImage] = React.useState(0);
  const [workspaces, setWorkspaces] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('gatherly_workspaces') || '[]'); } catch { return []; }
  });
  const [tasks, setTasks]             = React.useState([]);
  const [expenses, setExpenses]       = React.useState([]);
  const [activities, setActivities]   = React.useState([]);
  const [notifications, setNotifications] = React.useState(
    JSON.parse(localStorage.getItem('gatherly_notifications') || '[]')
  );

  const unreadNotifsCount = React.useMemo(() => {
    try {
      const readIds = JSON.parse(localStorage.getItem('gatherly_read_notifs') || '[]');
      return notifications.filter(n => !readIds.includes(n.id || n._id)).length;
    } catch {
      return notifications.length;
    }
  }, [notifications]);

  let user = {};
  try { user = JSON.parse(localStorage.getItem('gatherly_user') || '{}'); } catch (e) { console.error(e); }

  /* ── Data Fetching ──────────────────────────────────────────────────────── */

  const fetchDashboard = async () => {
    try {
      const id = user.email || user.username;
      const res = await fetch(`${API}/api/spaces/user/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error('fetch failed');
      const spaces = await res.json();
      setWorkspaces(spaces);
      try { localStorage.setItem('gatherly_workspaces', JSON.stringify(spaces)); } catch {}

      let allTasks = [], allExpenses = [], allActivities = [];
      for (const space of spaces) {
        if (space.activities?.length) allActivities.push(...space.activities.map(a => ({ ...a, target: space.name })));
        try {
          const tRes = await fetch(`${API}/api/tasks/workspace/${space._id || space.id}`);
          if (tRes.ok) allTasks.push(...(await tRes.json()).map(t => ({ ...t, workspaceName: space.name })));
        } catch {}
        try {
          const eRes = await fetch(`${API}/api/expenses/workspace/${space._id || space.id}`);
          if (eRes.ok) allExpenses.push(...await eRes.json());
        } catch {}
      }
      allActivities.sort((a, b) => new Date(b.createdAt || b.time) - new Date(a.createdAt || a.time));
      setActivities(allActivities);
      setTasks(allTasks);
      setExpenses(allExpenses);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      try { setWorkspaces(JSON.parse(localStorage.getItem('gatherly_workspaces') || '[]')); } catch {}
    }
  };

  /* ── Effects ────────────────────────────────────────────────────────────── */

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentHeroImage(p => (p + 1) % heroImages.length), 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?.email) fetchDashboard();
    else try { setWorkspaces(JSON.parse(localStorage.getItem('gatherly_workspaces') || '[]')); } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handle = () => setNotifications(JSON.parse(localStorage.getItem('gatherly_notifications') || '[]'));
    window.addEventListener('notifications_updated', handle);
    return () => window.removeEventListener('notifications_updated', handle);
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    const socket = io(API);
    socket.on('workspace_updated', fetchDashboard);
    socket.on('workspace_created', fetchDashboard);
    socket.on('member_joined', (data) => {
      fetchDashboard();
      const notif = {
        id: `notif_${Date.now()}`,
        user: data.member?.name || 'Someone',
        text: 'joined your workspace.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'join',
      };
      setNotifications(prev => [notif, ...prev].slice(0, 20));
      const stored = JSON.parse(localStorage.getItem('gatherly_notifications') || '[]');
      localStorage.setItem('gatherly_notifications', JSON.stringify([notif, ...stored].slice(0, 20)));
      window.dispatchEvent(new Event('notifications_updated'));
    });
    return () => socket.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.email]);

  /* ── Derived State ──────────────────────────────────────────────────────── */

  const q = searchQuery?.toLowerCase() || '';
  const filteredWorkspaces = workspaces.filter(w => w && (w.name?.toLowerCase().includes(q) || w.description?.toLowerCase().includes(q)));
  const filteredTasks      = tasks.filter(t => t && (t.title?.toLowerCase().includes(q) || t.workspaceName?.toLowerCase().includes(q)));
  const pendingTasks       = tasks.filter(t => t.status !== 'done' && t.status !== 'completed');

  const myOwe  = expenses.reduce((s, e) => { const sp = e.splits?.find(x => x.user === user.username); return s + (sp ? Number(sp.amount) || 0 : 0); }, 0);
  const myPaid = expenses.filter(e => e.paidBy === user.username).reduce((s, e) => s + (Number(e.amount) || 0), 0);

  /* ── Handlers ───────────────────────────────────────────────────────────── */

  const scrollSlider = (dir) => sliderRef.current?.scrollBy({ left: dir === 'left' ? -350 : 350, behavior: 'smooth' });

  const handleOpenWorkspace = (ws) => {
    const id = getSpaceId(ws);
    if (!id) return console.error('Cannot open workspace: missing ID', ws);
    try { localStorage.setItem('gatherly_active_workspace', JSON.stringify(ws)); } catch {}
    window.dispatchEvent(new Event('active_workspace_changed'));
    navigate(`/workspace/${id}`);
  };



  /* ── Render ─────────────────────────────────────────────────────────────── */

  return (
    <main className="dashboard-main-content">

      {/* HERO */}
      {searchQuery === '' && (
        <section className="hero-section">
          <div className="hero-content">
            <div className="workspace-badge"><ShieldCheck size={14} /> Gatherly Workspace Hub</div>
            <h1>Welcome back, <span className="text-highlight" style={{ textTransform: 'capitalize' }}>{user.username || 'User'}</span> 👋</h1>
            <p>Your workspaces, collaboration, expenses, chats, tasks and memories — all connected in one secure place.</p>
            <div className="hero-stats">
              <div className="stat-pill">
                <div className="stat-icon-box"><Layout size={18} /></div>
                <div className="stat-text"><strong>{workspaces.length}</strong><span>Active Workspaces</span></div>
              </div>
              <div className="stat-pill">
                <div className="stat-icon-box"><CheckSquare size={18} /></div>
                <div className="stat-text"><strong>{pendingTasks.length}</strong><span>Pending Tasks</span></div>
              </div>
              <div className="stat-pill">
                <div className="stat-icon-box"><Bell size={18} /></div>
                <div className="stat-text"><strong>{unreadNotifsCount}</strong><span>New Updates</span></div>
              </div>
            </div>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => navigate('/workspace#create')}><Plus size={18} /> Create Workspace</button>
              <button className="btn-outline" onClick={() => navigate('/workspace#join')}><Users size={18} /> Join Workspace</button>
            </div>
          </div>
          <div className="hero-illustration">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentHeroImage} src={heroImages[currentHeroImage]} alt="workspace"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
              />
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* SEARCH HEADER */}
      {searchQuery !== '' && (
        <div style={{ marginBottom: '2rem' }}>
          <h2>Search Results for "{searchQuery}"</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Found {filteredWorkspaces.length} workspaces and {filteredTasks.length} tasks.</p>
        </div>
      )}

      {/* WORKSPACES */}
      <section className="content-section" style={{ marginBottom: '2rem' }}>
        <div className="section-header">
          <div className="section-title"><Layout size={20} /> My Workspaces</div>
          <Link to="/workspace" className="view-all-link">View All <ArrowRight size={16} /></Link>
        </div>
        <div className="spaces-slider-container">
          <button className="slider-btn left"  onClick={() => scrollSlider('left')}><ChevronLeft size={20} /></button>
          <div className="spaces-slider" ref={sliderRef}>
            {filteredWorkspaces.map((ws, idx) => {
              const bgImage = ws.cover || ws.img || fallbackImages[idx % fallbackImages.length];
              const membersList    = Array.isArray(ws.members) ? ws.members : [];
              const displayMembers = membersList.slice(0, 3);
              const remaining      = membersList.length - 3;
              return (
                <motion.div key={getSpaceId(ws) || idx} className="space-card" onClick={() => handleOpenWorkspace(ws)} whileHover={{ y: -4 }}>
                  <div className="space-img" style={{ backgroundImage: `url(${bgImage})` }}>
                    <div className="space-avatars-overlap">
                      {displayMembers.length > 0
                        ? displayMembers.map((m, i) => <img key={i} src={`https://ui-avatars.com/api/?name=${typeof m === 'object' ? m.username || m.name : m}&background=random&color=fff`} alt="member" />)
                        : <img src={`https://ui-avatars.com/api/?name=${ws.name || 'W'}&background=random&color=fff`} alt="Workspace" />
                      }
                      {remaining > 0 && <div className="avatar-count">+{remaining}</div>}
                    </div>
                    <div className={`space-badge ${ws.status === 'Active' ? 'active' : 'planning'}`}>{ws.status}</div>
                  </div>
                  <div className="space-details">
                    <h3>{ws.name}</h3>
                    <p>{ws.description || ws.desc}</p>
                    <div className="space-progress-container">
                      <span className="progress-text">{ws.progress || 0}%</span>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${ws.progress || 0}%` }} /></div>
                    </div>
                    <div className="space-meta">
                      <span><Users size={14} /> {ws.members?.length || 0} Members</span>
                      <span><Calendar size={14} /> {ws.time || 'Active'}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <button className="slider-btn right" onClick={() => scrollSlider('right')}><ChevronRight size={20} /></button>
        </div>
      </section>

      <div className="dashboard-grid">

        {/* LEFT — ACTIVITY */}
        <div className="grid-left">
          {searchQuery === '' && (
            <section className="content-section">
              <div className="section-header">
                <div className="section-title"><Activity size={20} /> Recent Activity</div>
              </div>
              <div className="activity-list">
                {activities.length > 0 ? activities.slice(0, 10).map((act, idx) => (
                  <div className="activity-row" key={act.id || idx}>
                    <div className="activity-avatar-container">
                      <img src={act.avatar || `https://ui-avatars.com/api/?name=${act.user}&background=random&color=fff`} alt="" className="act-avatar" />
                      <div className={`act-icon-badge ${act.type || 'message'}`}><ActivityIcon activity={act} /></div>
                    </div>
                    <div className="activity-content">
                      <p><strong>{act.user}</strong> {act.action} <strong>{act.target}</strong></p>
                      <span className="act-time">{act.time}</span>
                    </div>
                    <div className="activity-stats">
                      <span><Heart size={14} /> {act.likes || 0}</span>
                      <span><MessageSquare size={14} /> {act.comments || 0}</span>
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-gray)' }}>
                    <Activity size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>No recent activity across your workspaces.</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT — TASKS / EXPENSES / NOTIFICATIONS */}
        <div className="grid-right">

          {/* Tasks */}
          <section className="content-section">
            <div className="section-header">
              <div className="section-title"><CheckSquare size={18} /> Upcoming Tasks</div>
            </div>
            <div className="tasks-list">
              {filteredTasks.length > 0 ? filteredTasks.slice(0, 10).map((task) => (
                <div className="task-row" key={task._id || task.id}>
                  <div className="task-info">
                    <h4>{task.title}</h4>
                    <p>{task.workspaceName} • {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Due Date'}</p>
                  </div>
                  <div className="task-priority">
                    <span className={`badge-priority ${(task.priority || 'Medium').toLowerCase()}`}>{task.priority || 'Medium'}</span>
                  </div>
                  <div className="task-progress-line" style={{ width: `${task.status === 'done' || task.status === 'completed' ? 100 : task.status === 'in-progress' ? 50 : 0}%` }} />
                </div>
              )) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-gray)' }}>
                  <CheckSquare size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p>No upcoming tasks. You're all caught up!</p>
                </div>
              )}
            </div>
          </section>

          {/* Expenses */}
          {searchQuery === '' && (
            <section className="content-section">
              <div className="section-header">
                <div className="section-title"><DollarSign size={18} /> Expense Summary</div>
              </div>
              <div className="expense-overview">
                <div className="exp-box"><span className="exp-label">You Owe</span><span className="exp-val owe">₹{myOwe.toLocaleString()}</span></div>
                <div className="exp-box"><span className="exp-label">You Paid</span><span className="exp-val paid">₹{myPaid.toLocaleString()}</span></div>
              </div>
            </section>
          )}

          {/* Notifications */}
          {searchQuery === '' && (
            <section className="content-section">
              <div className="section-header">
                <div className="section-title"><Bell size={18} /> Recent Notifications</div>
              </div>
              <div className="notif-list">
                {notifications.map((n) => (
                  <div className="notif-row" key={n.id}>
                    <div className="notif-text">
                      <p><strong>{n.user}</strong> {n.text}</p>
                      <span>{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </main>
  );
};

export default UserDashboard;