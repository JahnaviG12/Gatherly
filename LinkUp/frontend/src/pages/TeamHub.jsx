import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { CheckCircle, Calendar, CalendarDays, Plus, MoreHorizontal, List as ListIcon, LayoutGrid, X, ShieldCheck, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import './TeamHub.css';

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: '#64748b' },
  { id: 'inprogress', title: 'In Progress', color: '#0ea5e9' },
  { id: 'review', title: 'Review', color: '#f59e0b' },
  { id: 'done', title: 'Done', color: '#10b981' }
];

const STATUS_COLORS = { todo: '#64748b', inprogress: '#0ea5e9', review: '#f59e0b', done: '#10b981' };

const CalendarView = ({ tasks }) => {
  const today = new Date();
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const { year, month } = current;
  const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long' });
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDayOfWeek).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
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
  const prev = () => setCurrent(c => { const d = new Date(c.year, c.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; });
  const next = () => setCurrent(c => { const d = new Date(c.year, c.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; });

  return (
    <div className="cal-wrapper">
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={prev}><ChevronLeft size={18}/></button>
        <h3 className="cal-month-title">{monthName} {year}</h3>
        <button className="cal-nav-btn" onClick={next}><ChevronRight size={18}/></button>
      </div>
      <div className="cal-grid">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="cal-day-header">{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="cal-cell empty" />;
          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
          const dayTasks = tasksByDate[dateStr] || [];
          return (
            <div key={dateStr} className={`cal-cell ${dateStr === todayStr ? 'today' : ''} ${dayTasks.length > 0 ? 'has-tasks' : ''}`}>
              <span className="cal-day-num">{day}</span>
              <div className="cal-task-chips">
                {dayTasks.slice(0, 3).map(t => (
                  <div key={t.id || t._id} className="cal-chip" style={{ background: STATUS_COLORS[t.status] || '#64748b' }} title={`${t.title} · ${t.status}`}>
                    {t.title.length > 14 ? t.title.slice(0, 13) + '…' : t.title}
                  </div>
                ))}
                {dayTasks.length > 3 && <div className="cal-chip more">+{dayTasks.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="cal-legend">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <span key={status} className="cal-legend-item"><span className="cal-legend-dot" style={{ background: color }} />{status}</span>
        ))}
      </div>
    </div>
  );
};

const TeamHub = () => {
  const { searchQuery } = useOutletContext();
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [allWorkspaces, setAllWorkspaces] = useState(JSON.parse(localStorage.getItem('gatherly_workspaces') || '[]'));
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewMode, setViewMode] = useState('kanban');
  const [draggedTask, setDraggedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', desc: '', priority: 'medium', status: 'todo', dueDate: '' });
  const currentUser = JSON.parse(localStorage.getItem('gatherly_user') || 'null');

  useEffect(() => {
    if (workspaceId) {
      try {
        const found = allWorkspaces.find(ws => String(ws._id || ws.id || '').includes(workspaceId));
        if (found) { setActiveWorkspace(found); localStorage.setItem('gatherly_active_workspace', JSON.stringify(found)); }
      } catch (e) {}
    } else {
      try { setActiveWorkspace(JSON.parse(localStorage.getItem('gatherly_active_workspace'))); } catch (e) {}
    }
  }, [workspaceId]);

  useEffect(() => {
    const sync = () => {
      try { setActiveWorkspace(JSON.parse(localStorage.getItem('gatherly_active_workspace'))); } catch (e) { setActiveWorkspace(null); }
    };
    window.addEventListener('active_workspace_changed', sync);
    window.addEventListener('storage', (e) => e.key === 'gatherly_active_workspace' && sync());
    return () => {
      window.removeEventListener('active_workspace_changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.email || currentUser.username;
    if (!uid) return;
    fetch(`http://localhost:5000/api/spaces/user/${encodeURIComponent(uid)}`)
      .then(r => r.json())
      .then(data => Array.isArray(data) && setAllWorkspaces(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeWorkspace) return;
    fetch(`http://localhost:5000/api/tasks/workspace/${activeWorkspace._id || activeWorkspace.id}`)
      .then(res => res.ok && res.json()).then(data => data && setTasks(data.map(t => ({...t, id: t._id})))).catch(() => {});
  }, [activeWorkspace]);

  const logTeamActivity = async (actionText) => {
    if (!activeWorkspace || !currentUser) return;
    try {
      const spaceRes = await fetch(`http://localhost:5000/api/spaces/${activeWorkspace._id || activeWorkspace.id}`);
      if (!spaceRes.ok) return;
      const spaceData = await spaceRes.json();
      const updatedActs = [{ id: Date.now().toString(), user: currentUser.username, action: actionText, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }, ...(spaceData.activities || [])].slice(0, 15);
      await fetch(`http://localhost:5000/api/spaces/${activeWorkspace._id || activeWorkspace.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activities: updatedActs })
      });
    } catch(e) {}
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;
    try {
      const res = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: activeWorkspace._id || activeWorkspace.id, ...newTask, creator: currentUser?.id || currentUser?._id })
      });
      if (res.ok) {
        const data = await res.json();
        setTasks([...tasks, { ...data, id: data._id }]);
        setShowTaskModal(false);
        setNewTask({ title: '', desc: '', priority: 'medium', status: 'todo', dueDate: '' });
        logTeamActivity(`created a new task: "${data.title}"`);
      }
    } catch(e) {}
  };

  const handleDragStart = (task) => setDraggedTask(task);
  const handleDrop = async (status) => {
    if (!draggedTask) return;
    const taskId = draggedTask.id;
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status } : t));
    setDraggedTask(null);
    try {
      await fetch(`http://localhost:5000/api/tasks/${taskId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      if (draggedTask.status !== status) logTeamActivity(`moved task "${draggedTask.title}" to ${status}`);
    } catch (e) {}
  };

  const handleStatusChange = async (taskId, newStatus) => {
    setTasks(tasks.map(t => (t.id === taskId || t._id === taskId) ? { ...t, status: newStatus } : t));
    if (selectedTask && (selectedTask.id === taskId || selectedTask._id === taskId)) setSelectedTask({ ...selectedTask, status: newStatus });
    try {
      await fetch(`http://localhost:5000/api/tasks/${taskId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
      const t = tasks.find(x => x.id === taskId || x._id === taskId);
      if (t && t.status !== newStatus) logTeamActivity(`moved task "${t.title}" to ${newStatus}`);
    } catch(e) {}
  };

  const filteredTasks = tasks.filter(t => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()));

  if (!activeWorkspace) {
    return (
      <div className="teamhub-empty-state" style={{flexDirection: 'column', padding: '3rem', height: '100%', minHeight: '80vh', background: 'var(--bg-main)', color: 'var(--text-dark)', width: '100%'}}>
        <motion.button className="modern-exit-fab" onClick={() => navigate(workspaceId ? -1 : '/userdashboard')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} title="Return to Dashboard"><LogOut size={24} /></motion.button>
        <h2 style={{fontSize: '2.5rem', marginBottom: '2rem', fontWeight: 800}}>Your Team Hubs</h2>
        {allWorkspaces.length === 0 ? (
          <div className="teamhub-empty" style={{margin: '10% auto'}}><ShieldCheck size={50} color="var(--accent-primary)"/><h2>No Workspaces Found</h2><p>You haven't joined any workspaces yet.</p><a href="/userdashboard" className="teamhub-open-btn">Go to Dashboard</a></div>
        ) : (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2.5rem', width: '100%'}}>
            {allWorkspaces.map(ws => (
              <div key={ws.id || ws._id} onClick={() => {
                fetch(`http://localhost:5000/api/spaces/${ws._id || ws.id}`).then(r => r.json()).then(fresh => {
                  const m = { ...ws, ...fresh }; setActiveWorkspace(m); localStorage.setItem('gatherly_active_workspace', JSON.stringify(m)); window.dispatchEvent(new Event('active_workspace_changed'));
                }).catch(() => { setActiveWorkspace(ws); localStorage.setItem('gatherly_active_workspace', JSON.stringify(ws)); window.dispatchEvent(new Event('active_workspace_changed')); });
              }} style={{cursor: 'pointer', background: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-light)', transition: '0.2s'}} onMouseOver={e => {e.currentTarget.style.transform='translateY(-8px)';}} onMouseOut={e => {e.currentTarget.style.transform='none';}}>
                <div style={{height: '180px', backgroundImage: `url(${ws.cover || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'})`, backgroundSize: 'cover', backgroundPosition: 'center'}} />
                <div style={{padding: '1.5rem'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem'}}><div style={{padding: '0.4rem', background: 'rgba(13, 143, 128, 0.1)', borderRadius: '8px', color: 'var(--accent-primary)'}}><CheckCircle size={16}/></div><h3 style={{margin: 0, fontSize: '1.2rem'}}>{ws.name}</h3></div>
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
      <motion.button className="modern-exit-fab" onClick={() => navigate(workspaceId ? -1 : '/userdashboard')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} title="Return to Hub Selection"><LogOut size={24} /></motion.button>
      <div className="teamhub-header">
        <div><h1>{activeWorkspace.name} Team Hub</h1><p>Workspace collaborative task management</p></div>
        <button className="create-task-btn" onClick={() => setShowTaskModal(true)}><Plus size={18} />Create Task</button>
      </div>
      <div className="view-switch">
        <button className={viewMode === 'kanban' ? 'active' : ''} onClick={() => setViewMode('kanban')}><LayoutGrid size={16} />Kanban</button>
        <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}><ListIcon size={16} />List</button>
        <button className={viewMode === 'calendar' ? 'active' : ''} onClick={() => setViewMode('calendar')}><CalendarDays size={16} />Calendar</button>
      </div>
      {viewMode === 'kanban' ? (
        <div className="kanban-board">
          {COLUMNS.map(column => (
            <div key={column.id} className="kanban-column" onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(column.id)}>
              <div className="kanban-header"><div className="kanban-title"><span className="dot" style={{ background: column.color }}></span>{column.title}</div></div>
              <div className="kanban-tasks">
                {filteredTasks.filter(t => t.status === column.id).map(task => (
                  <motion.div layout key={task.id} draggable onDragStart={() => handleDragStart(task)} className="task-card" onClick={() => setSelectedTask(task)}>
                    <div className="task-top"><span className={`priority ${task.priority}`}>{task.priority}</span><MoreHorizontal size={16} /></div>
                    <h3>{task.title}</h3><p>{task.desc}</p>
                    <div className="task-footer"><div className="task-date"><Calendar size={14} />{task.dueDate || 'No Date'}</div></div>
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
          {filteredTasks.map(task => (
            <div className="list-task-card" key={task.id} onClick={() => setSelectedTask(task)}>
              <div className="list-task-left"><CheckCircle size={18} /><div><h3>{task.title}</h3><p>{task.desc}</p></div></div>
              <div className="list-task-right"><span className={`priority ${task.priority}`}>{task.priority}</span><span>{task.dueDate}</span></div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedTask && (
          <motion.div className="task-drawer-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTask(null)}>
            <motion.div className="task-drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} onClick={e => e.stopPropagation()}>
              <div className="drawer-header"><h2>{selectedTask.title}</h2><button onClick={() => setSelectedTask(null)}><X size={18} /></button></div>
              <div className="drawer-body">
                <div className="drawer-section"><label>Description</label><p>{selectedTask.desc}</p></div>
                <div className="drawer-grid">
                  <div><label>Status</label>
                    <select value={selectedTask.status} onChange={e => handleStatusChange(selectedTask.id || selectedTask._id, e.target.value)} style={{ padding: '0.4rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-main)', color: 'var(--text-dark)', fontSize: '0.9rem', cursor: 'pointer', width: '100%', marginTop: '0.25rem' }}>
                      {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div><label>Priority</label><span>{selectedTask.priority}</span></div>
                  <div><label>Due Date</label><span>{selectedTask.dueDate}</span></div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTaskModal && (
          <motion.div className="task-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="task-modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <div className="modal-header"><h2>Create Task</h2><button onClick={() => setShowTaskModal(false)}><X size={18} /></button></div>
              <div className="modal-form">
                <input type="text" placeholder="Task title" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
                <textarea placeholder="Description" value={newTask.desc} onChange={e => setNewTask({ ...newTask, desc: e.target.value })} />
                <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
                <input type="date" value={newTask.dueDate} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} />
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button className="cancel-btn" style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border-light)', background: 'transparent', color: 'var(--text-gray)', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setShowTaskModal(false)}>Cancel</button>
                  <button className="submit-task-btn" style={{ flex: 1 }} onClick={handleCreateTask}>Create Task</button>
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