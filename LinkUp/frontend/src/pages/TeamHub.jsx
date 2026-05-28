import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import {
  CheckCircle,
  Clock,
  Calendar,
  CalendarDays,
  AlertCircle,
  Plus,
  MoreHorizontal,
  Flag,
  Paperclip,
  MessageSquare,
  List as ListIcon,
  LayoutGrid,
  X,
  User,
  Megaphone,
  ThumbsUp,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import './TeamHub.css';

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: '#64748b' },
  { id: 'inprogress', title: 'In Progress', color: '#0ea5e9' },
  { id: 'review', title: 'Review', color: '#f59e0b' },
  { id: 'done', title: 'Done', color: '#10b981' }
];

const STATUS_COLORS = {
  todo: '#64748b',
  inprogress: '#0ea5e9',
  review: '#f59e0b',
  done: '#10b981',
};

const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
};

// ── CALENDAR VIEW COMPONENT ──────────────────────────────────────
const CalendarView = ({ tasks }) => {
  const today = new Date();
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const { year, month } = current;
  const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long' });

  // Build grid: leading empty days + actual days
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];

  // Map tasks by their due date string (YYYY-MM-DD)
  const tasksByDate = {};
  tasks.forEach(task => {
    if (task.dueDate) {
      const key = task.dueDate.slice(0, 10);
      if (!tasksByDate[key]) tasksByDate[key] = [];
      tasksByDate[key].push(task);
    }
  });

  const pad = n => String(n).padStart(2, '0');
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const prev = () => setCurrent(c => {
    const d = new Date(c.year, c.month - 1, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const next = () => setCurrent(c => {
    const d = new Date(c.year, c.month + 1, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  return (
    <div className="cal-wrapper">
      {/* NAV */}
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={prev}><ChevronLeft size={18}/></button>
        <h3 className="cal-month-title">{monthName} {year}</h3>
        <button className="cal-nav-btn" onClick={next}><ChevronRight size={18}/></button>
      </div>

      {/* WEEKDAY HEADERS */}
      <div className="cal-grid">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="cal-day-header">{d}</div>
        ))}

        {/* DAY CELLS */}
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="cal-cell empty" />;
          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
          const dayTasks = tasksByDate[dateStr] || [];
          const isToday = dateStr === todayStr;
          return (
            <div key={dateStr} className={`cal-cell ${isToday ? 'today' : ''} ${dayTasks.length > 0 ? 'has-tasks' : ''}`}>
              <span className="cal-day-num">{day}</span>
              <div className="cal-task-chips">
                {dayTasks.slice(0, 3).map(t => (
                  <div
                    key={t.id || t._id}
                    className="cal-chip"
                    style={{ background: STATUS_COLORS[t.status] || '#64748b' }}
                    title={`${t.title} · ${t.status}`}
                  >
                    {t.title.length > 14 ? t.title.slice(0, 13) + '…' : t.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="cal-chip more">+{dayTasks.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* LEGEND */}
      <div className="cal-legend">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <span key={status} className="cal-legend-item">
            <span className="cal-legend-dot" style={{ background: color }} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        ))}
      </div>
    </div>
  );
};
// ────────────────────────────────────────────────────────────────

const TeamHub = () => {
  const { searchQuery } = useOutletContext();
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const [activeWorkspace, setActiveWorkspace] = useState(null);
  
  // Determine workspace context from URL params or localStorage
  useEffect(() => {
    if (workspaceId) {
      // Extract workspace from localStorage by ID
      try {
        const allWorkspaces = JSON.parse(localStorage.getItem('gatherly_workspaces') || '[]');
        const foundWorkspace = allWorkspaces.find(ws => {
          const wsId = ws._id || ws.id;
          const wsIdStr = typeof wsId === 'object' ? (wsId.$oid || String(wsId)) : String(wsId || '');
          return wsIdStr === workspaceId;
        });
        if (foundWorkspace) {
          setActiveWorkspace(foundWorkspace);
          localStorage.setItem('gatherly_active_workspace', JSON.stringify(foundWorkspace));
        }
      } catch (e) {}
    } else {
      // Fallback to active workspace from localStorage
      try {
        const saved = JSON.parse(localStorage.getItem('gatherly_active_workspace'));
        setActiveWorkspace(saved);
      } catch (e) {}
    }
  }, [workspaceId]);

  const [allWorkspaces, setAllWorkspaces] = useState(
    JSON.parse(localStorage.getItem('gatherly_workspaces') || '[]')
  );

  // Synchronize active workspace in real time across tabs and components
  useEffect(() => {
    const syncWorkspace = () => {
      try {
        const saved = localStorage.getItem('gatherly_active_workspace');
        setActiveWorkspace(saved ? JSON.parse(saved) : null);
      } catch (e) {
        setActiveWorkspace(null);
      }
    };

    window.addEventListener('active_workspace_changed', syncWorkspace);
    const handleStorage = (e) => {
      if (e.key === 'gatherly_active_workspace') syncWorkspace();
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('active_workspace_changed', syncWorkspace);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Fetch fresh workspace list from DB so names/covers are always up-to-date
  useEffect(() => {
    fetch('http://localhost:5000/api/spaces')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllWorkspaces(data);
        }
      })
      .catch(() => {/* keep localStorage fallback */});
  }, []);

  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewMode, setViewMode] = useState('kanban');
  const [draggedTask, setDraggedTask] = useState(null);

  const [showTaskModal, setShowTaskModal] = useState(false);

  const [newTask, setNewTask] = useState({
    title: '',
    desc: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
  });

  const currentUser = JSON.parse(
    localStorage.getItem('gatherly_user') || 'null'
  );

  useEffect(() => {
    if (!activeWorkspace) return;

    const fetchTasks = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/tasks/workspace/${activeWorkspace._id || activeWorkspace.id}`);
        if (res.ok) {
          const data = await res.json();
          setTasks(data.map(t => ({...t, id: t._id})));
        }
      } catch (e) {
        console.error('Failed to fetch tasks', e);
      }
    };
    fetchTasks();
  }, [activeWorkspace]);

  const logTeamActivity = async (actionText) => {
    if (!activeWorkspace || !currentUser) return;
    try {
      const spaceRes = await fetch(`http://localhost:5000/api/spaces/${activeWorkspace._id || activeWorkspace.id}`);
      if (!spaceRes.ok) return;
      const spaceData = await spaceRes.json();
      
      const newAct = {
        id: Date.now().toString(),
        user: currentUser.username,
        action: actionText,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };
      const currentActs = spaceData.activities || [];
      const updatedActs = [newAct, ...currentActs].slice(0, 15);
      
      await fetch(`http://localhost:5000/api/spaces/${activeWorkspace._id || activeWorkspace.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activities: updatedActs })
      });
    } catch(e) {
      console.error('Failed to log team activity', e);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;

    try {
      const res = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspace._id || activeWorkspace.id,
          ...newTask,
          creator: currentUser ? (currentUser._id || currentUser.id) : null
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTasks([...tasks, { ...data, id: data._id }]);
        setShowTaskModal(false);
        setNewTask({ title: '', desc: '', priority: 'medium', status: 'todo', dueDate: '' });
        logTeamActivity(`created a new task: "${data.title}"`);
      } else {
        const errText = await res.text();
        console.error("Backend Error:", errText);
        alert(`Failed to create task! Server responded with status ${res.status}. Please make sure your backend is restarted.`);
      }
    } catch(e) {
      console.error(e);
      alert('Failed to connect to the server. Is your backend running?');
    }
  };


  const filteredTasks = tasks.filter((task) => {
    if (!searchQuery) return true;
    return (
      task.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  });

  const handleDragStart = (task) => {
    setDraggedTask(task);
  };

  const handleDrop = async (status) => {
    if (!draggedTask) return;

    const taskId = draggedTask.id;
    // Optimistic UI update
    const updated = tasks.map((task) =>
      task.id === taskId ? { ...task, status } : task
    );
    setTasks(updated);
    setDraggedTask(null);

    // Sync with backend
    try {
      await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (draggedTask.status !== status) {
        logTeamActivity(`moved task "${draggedTask.title}" to ${status}`);
      }
    } catch (e) {
      console.error('Failed to update task status', e);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const updated = tasks.map((task) =>
      (task.id === taskId || task._id === taskId) ? { ...task, status: newStatus } : task
    );
    setTasks(updated);
    if (selectedTask && (selectedTask.id === taskId || selectedTask._id === taskId)) {
      setSelectedTask({ ...selectedTask, status: newStatus });
    }

    try {
      await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const task = tasks.find(t => t.id === taskId || t._id === taskId);
      if (task && task.status !== newStatus) {
        logTeamActivity(`moved task "${task.title}" to ${newStatus}`);
      }
    } catch(e) {
      console.error(e);
    }
  };

  if (!activeWorkspace) {
    const userWorkspaces = allWorkspaces.length > 0 ? allWorkspaces : [];

    return (
      <div className="teamhub-empty-state" style={{flexDirection: 'column', padding: '3rem', alignItems: 'flex-start', justifyContent: 'flex-start', height: '100%', minHeight: '80vh', background: 'var(--bg-main)', color: 'var(--text-dark)', width: '100%'}}>
        
        <motion.button 
          className="modern-exit-fab"
          onClick={() => {
            if (workspaceId) {
              navigate(-1);
            } else {
              navigate('/userdashboard');
            }
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Return to Dashboard"
        >
          <LogOut size={24} />
        </motion.button>

        <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '2rem'}}>
          <h2 style={{fontSize: '2.5rem', margin: 0, fontWeight: 800, color: 'var(--text-dark)'}}>Your Team Hubs</h2>
        </div>
        
        {userWorkspaces.length === 0 ? (
          <div className="teamhub-empty" style={{margin: '0 auto', marginTop: '10%'}}>
            <ShieldCheck size={50} color="var(--accent-primary)"/>
            <h2>No Workspaces Found</h2>
            <p>You haven't joined any workspaces yet.</p>
            <a href="/userdashboard" className="teamhub-open-btn">Go to Dashboard</a>
          </div>
        ) : (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2.5rem', width: '100%'}}>
            {userWorkspaces.map(ws => (
              <div key={ws.id || ws._id}
                onClick={() => {
                  // Always fetch the freshest version before entering
                  const wsId = ws._id || ws.id;
                  fetch(`http://localhost:5000/api/spaces/${wsId}`)
                    .then(r => r.json())
                    .then(fresh => {
                      const merged = { ...ws, ...fresh };
                      setActiveWorkspace(merged);
                      localStorage.setItem('gatherly_active_workspace', JSON.stringify(merged));
                      window.dispatchEvent(new Event('active_workspace_changed'));
                    })
                    .catch(() => {
                      setActiveWorkspace(ws);
                      localStorage.setItem('gatherly_active_workspace', JSON.stringify(ws));
                      window.dispatchEvent(new Event('active_workspace_changed'));
                    });
                }}
                style={{cursor: 'pointer', background: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', transition: 'transform 0.2s, box-shadow 0.2s', border: '1px solid var(--border-light)'}}
                onMouseOver={e => {e.currentTarget.style.transform='translateY(-8px)'; e.currentTarget.style.boxShadow='0 20px 40px rgba(0,0,0,0.1)';}}
                onMouseOut={e => {e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 10px 25px rgba(0,0,0,0.05)';}}>
                <div style={{height: '180px', overflow: 'hidden', position: 'relative'}}>
                  <div style={{
                    width: '100%', height: '100%',
                    backgroundImage: `url(${ws.cover || `https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80`})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }} />
                  <div style={{position:'absolute',inset:0,background:'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 60%)'}} />
                </div>
                <div style={{padding: '1.5rem'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem'}}>
                    <div style={{padding: '0.4rem', background: 'rgba(13, 143, 128, 0.1)', borderRadius: '8px', color: 'var(--accent-primary)'}}><CheckCircle size={16}/></div>
                    <h3 style={{margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-dark)'}}>{ws.name}</h3>
                  </div>
                  <p style={{margin: 0, color: 'var(--text-gray)', fontSize: '0.9rem'}}>{ws.description || 'Manage tasks & collaboration'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <main className="teamhub-main-content">
      
      {/* MODERN FLOATING EXIT BUTTON */}
      <motion.button 
        className="modern-exit-fab"
        onClick={() => {
          if (workspaceId) {
            navigate(-1);
          } else {
            setActiveWorkspace(null);
            localStorage.removeItem('gatherly_active_workspace');
            window.dispatchEvent(new Event('active_workspace_changed'));
          }
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Return to Hub Selection"
      >
        <LogOut size={24} />
      </motion.button>

      {/* HEADER */}

      <div className="teamhub-header">

        <div>
          <h1>{activeWorkspace.name} Team Hub</h1>

          <p>
            Workspace collaborative task management
          </p>
        </div>

        <button
          className="create-task-btn"
          onClick={() => setShowTaskModal(true)}
        >
          <Plus size={18} />
          Create Task
        </button>

      </div>

      {/* VIEW SWITCH */}

      <div className="view-switch">

        <button
          className={viewMode === 'kanban' ? 'active' : ''}
          onClick={() => setViewMode('kanban')}
        >
          <LayoutGrid size={16} />
          Kanban
        </button>

        <button
          className={viewMode === 'list' ? 'active' : ''}
          onClick={() => setViewMode('list')}
        >
          <ListIcon size={16} />
          List
        </button>

        <button
          className={viewMode === 'calendar' ? 'active' : ''}
          onClick={() => setViewMode('calendar')}
        >
          <CalendarDays size={16} />
          Calendar
        </button>

      </div>

      {/* KANBAN */}

      {viewMode === 'kanban' ? (

        <div className="kanban-board">

          {COLUMNS.map((column) => (

            <div
              key={column.id}
              className="kanban-column"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(column.id)}
            >

              <div className="kanban-header">

                <div className="kanban-title">

                  <span
                    className="dot"
                    style={{
                      background: column.color
                    }}
                  ></span>

                  {column.title}

                </div>

              </div>

              <div className="kanban-tasks">

                {filteredTasks
                  .filter((task) => task.status === column.id)
                  .map((task) => (

                    <motion.div
                      layout
                      key={task.id}
                      draggable
                      onDragStart={() =>
                        handleDragStart(task)
                      }
                      className="task-card"
                      onClick={() => setSelectedTask(task)}
                    >

                      <div className="task-top">

                        <span
                          className={`priority ${task.priority}`}
                        >
                          {task.priority}
                        </span>

                        <MoreHorizontal size={16} />

                      </div>

                      <h3>{task.title}</h3>

                      <p>{task.desc}</p>

                      <div className="task-footer">

                        <div className="task-date">
                          <Calendar size={14} />
                          {task.dueDate || 'No Date'}
                        </div>

                      </div>

                    </motion.div>

                  ))}

              </div>

            </div>

          ))}

        </div>

      ) : viewMode === 'calendar' ? (

        <CalendarView tasks={filteredTasks} />

      ) : (

        <div className="task-list-view">

          {filteredTasks.map((task) => (

            <div
              className="list-task-card"
              key={task.id}
              onClick={() => setSelectedTask(task)}
            >

              <div className="list-task-left">

                <CheckCircle size={18} />

                <div>

                  <h3>{task.title}</h3>

                  <p>{task.desc}</p>

                </div>

              </div>

              <div className="list-task-right">

                <span className={`priority ${task.priority}`}>
                  {task.priority}
                </span>

                <span>{task.dueDate}</span>

              </div>

            </div>

          ))}

        </div>

      )}

      {/* TASK DRAWER */}

      <AnimatePresence>

        {selectedTask && (

          <motion.div
            className="task-drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTask(null)}
          >

            <motion.div
              className="task-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              onClick={(e) => e.stopPropagation()}
            >

              <div className="drawer-header">

                <h2>{selectedTask.title}</h2>

                <button
                  onClick={() => setSelectedTask(null)}
                >
                  <X size={18} />
                </button>

              </div>

              <div className="drawer-body">

                <div className="drawer-section">

                  <label>Description</label>

                  <p>{selectedTask.desc}</p>

                </div>

                <div className="drawer-grid">

                  <div>
                    <label>Status</label>
                    <select 
                      value={selectedTask.status} 
                      onChange={(e) => handleStatusChange(selectedTask.id || selectedTask._id, e.target.value)}
                      style={{
                        padding: '0.4rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-light)',
                        background: 'var(--bg-main)',
                        color: 'var(--text-dark)',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        width: '100%',
                        marginTop: '0.25rem'
                      }}
                    >
                      {COLUMNS.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>Priority</label>
                    <span>{selectedTask.priority}</span>
                  </div>

                  <div>
                    <label>Due Date</label>
                    <span>{selectedTask.dueDate}</span>
                  </div>

                </div>

              </div>

            </motion.div>

          </motion.div>

        )}

      </AnimatePresence>

      {/* CREATE TASK MODAL */}

      <AnimatePresence>

        {showTaskModal && (

          <motion.div
            className="task-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >

            <motion.div
              className="task-modal"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >

              <div className="modal-header">

                <h2>Create Task</h2>

                <button
                  onClick={() => setShowTaskModal(false)}
                >
                  <X size={18} />
                </button>

              </div>

              <div className="modal-form">

                <input
                  type="text"
                  placeholder="Task title"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      title: e.target.value
                    })
                  }
                />

                <textarea
                  placeholder="Description"
                  value={newTask.desc}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      desc: e.target.value
                    })
                  }
                />

                <select
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      priority: e.target.value
                    })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>

                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      dueDate: e.target.value
                    })
                  }
                />

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button
                    className="cancel-btn"
                    style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border-light)', background: 'transparent', color: 'var(--text-gray)', fontWeight: 'bold', cursor: 'pointer' }}
                    onClick={() => setShowTaskModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="submit-task-btn"
                    style={{ flex: 1 }}
                    onClick={handleCreateTask}
                  >
                    Create Task
                  </button>
                </div>

              </div>

            </motion.div>

          </motion.div>

        )}

      </AnimatePresence>

    </main>
  );
};

export default TeamHub;