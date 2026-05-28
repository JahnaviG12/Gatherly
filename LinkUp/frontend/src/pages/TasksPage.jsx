import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { 
  CheckCircle, Clock, Calendar, AlertCircle, Plus, 
  MoreHorizontal, Flag, Paperclip, MessageSquare, 
  List as ListIcon, LayoutGrid, X, ArrowRight, User
} from 'lucide-react';
import './TasksPage.css';

// Mock Data
const initialTasks = [
  { id: 't1', title: 'Book return flights to Goa', space: 'Goa Trip', priority: 'high', status: 'todo', dueDate: '2026-05-20', assignees: ['https://i.pravatar.cc/150?img=11', 'https://i.pravatar.cc/150?img=5'], subtasks: 3, completedSubtasks: 1, comments: 2, attachments: 1, desc: 'Make sure to check prices on multiple airlines before booking. We need a morning flight.' },
  { id: 't2', title: 'Finalize UI Mockups', space: 'Project Alpha', priority: 'medium', status: 'inprogress', dueDate: '2026-05-22', assignees: ['https://i.pravatar.cc/150?img=8'], subtasks: 5, completedSubtasks: 3, comments: 4, attachments: 2, desc: 'Complete all main screens including dashboard, spaces, and gallery.' },
  { id: 't3', title: 'Send invitations to speakers', space: 'Tech Hackathon', priority: 'low', status: 'review', dueDate: '2026-05-18', assignees: ['https://i.pravatar.cc/150?img=9'], subtasks: 1, completedSubtasks: 1, comments: 0, attachments: 0, overdue: true, desc: 'Email the final list of speakers with the agenda attached.' },
  { id: 't4', title: 'Pay resort advance', space: 'Goa Trip', priority: 'high', status: 'done', dueDate: '2026-05-15', assignees: ['https://i.pravatar.cc/150?img=11'], subtasks: 2, completedSubtasks: 2, comments: 1, attachments: 1, desc: 'Transfer 50% advance to secure the booking.' },
  { id: 't5', title: 'Order catering for 50 people', space: 'Alumni Meet', priority: 'medium', status: 'todo', dueDate: '2026-06-01', assignees: ['https://i.pravatar.cc/150?img=5'], subtasks: 4, completedSubtasks: 0, comments: 0, attachments: 0, desc: 'Contact 3 vendors and get quotes for the buffet.' },
  { id: 't6', title: 'Prepare Presentation Slides', space: 'Project Alpha', priority: 'high', status: 'todo', dueDate: '2026-05-25', assignees: ['https://i.pravatar.cc/150?img=8', 'https://i.pravatar.cc/150?img=11'], subtasks: 0, completedSubtasks: 0, comments: 0, attachments: 0, desc: 'Create the 15-slide deck for the final evaluation.' },
];

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: '#64748b' },
  { id: 'inprogress', title: 'In Progress', color: '#0ea5e9' },
  { id: 'review', title: 'In Review', color: '#f59e0b' },
  { id: 'done', title: 'Completed', color: '#10b981' }
];

const mockActivity = [
  { id: 1, user: 'Alex Mercer', avatar: 'https://i.pravatar.cc/150?img=11', text: 'changed status to In Progress', time: '2 hours ago' },
  { id: 2, user: 'Sarah Connor', avatar: 'https://i.pravatar.cc/150?img=5', text: 'attached a new file', time: 'Yesterday' },
];

const getPriorityColor = (priority) => {
  switch(priority) {
    case 'high': return '#ef4444';
    case 'medium': return '#f59e0b';
    case 'low': return '#3b82f6';
    default: return '#94a3b8';
  }
};

const TasksPage = () => {
  const { searchQuery } = useOutletContext();
  const [tasks, setTasks] = useState(initialTasks);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Drag state
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // Active space context safely loaded
  const getActiveSpaceSafely = () => {
    const raw = localStorage.getItem('gatherly_active_workspace');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error("Failed to parse active workspace in TasksPage", e);
      return null;
    }
  };

  const activeSpace = getActiveSpaceSafely();

  if (!activeSpace) {
    return (
      <main className="tasks-main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3.5rem 2.5rem',
          textAlign: 'center',
          background: 'var(--bg-card)',
          borderRadius: '24px',
          border: '1px solid var(--border-light)',
          maxWidth: '480px',
          margin: '2rem auto',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.02)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'rgba(14, 165, 233, 0.08)',
            color: 'var(--primary-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '0.5rem' }}>Workspace Tasks Locked</h2>
          <p style={{ color: 'var(--text-gray)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            Please enter an active Workspace Room first to view, track, or manage tasks. Collaborators can only access data belonging to their entered workspace.
          </p>
          <a href="/workspace" style={{ 
            padding: '0.75rem 2rem', 
            borderRadius: '12px', 
            fontSize: '0.9rem', 
            fontWeight: 700, 
            textDecoration: 'none', 
            background: 'var(--primary-blue)', 
            color: 'white',
            display: 'inline-block',
            transition: '0.2s'
          }}>
            Go to Workspace Cockpit →
          </a>
        </div>
      </main>
    );
  }

  // Filter tasks belonging ONLY to this workspace
  const scopedTasks = tasks.filter(t => t.space.toLowerCase() === activeSpace.name.toLowerCase());

  // Derived metrics from scoped list
  const completedCount = scopedTasks.filter(t => t.status === 'done').length;
  const pendingCount = scopedTasks.filter(t => t.status !== 'done').length;
  const progressPercent = Math.round((completedCount / scopedTasks.length) * 100) || 0;

  // Handlers for Drag and Drop
  const handleDragStart = (e, id) => {
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    setDragOverCol(colId);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e, colId) => {
    e.preventDefault();
    setDragOverCol(null);
    if (draggedTaskId) {
      setTasks(prev => prev.map(t => t.id === draggedTaskId ? { ...t, status: colId } : t));
    }
    setDraggedTaskId(null);
  };

  // Filter Scoped Tasks
  const getFilteredTasks = () => {
    return scopedTasks.filter(t => {
      const matchesSearch = !searchQuery || 
        t.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = activeFilter === 'All' ||
        (activeFilter === 'Assigned to Me' && t.assignees.includes('https://i.pravatar.cc/150?img=11')) ||
        (activeFilter === 'High Priority' && t.priority === 'high') ||
        (activeFilter === 'Overdue' && t.overdue);

      return matchesSearch && matchesFilter;
    });
  };

  const filteredTasks = getFilteredTasks();

  return (
    <main className="tasks-main-content">
      {/* HEADER */}
      <div className="tasks-header">
        <div className="tasks-title">
          <h1>Tasks & Workflows</h1>
          <p>Organize, track, and conquer your collaborative goals.</p>
        </div>
        <div className="view-toggles">
          <button className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => setViewMode('kanban')}>
            <LayoutGrid size={20} />
          </button>
          <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
            <ListIcon size={20} />
          </button>
        </div>
      </div>

      {/* TODAY'S FOCUS DASHBOARD */}
      {!searchQuery && (
        <div className="focus-dashboard">
          <div className="metric-card">
            <div className="metric-header">
              <CheckCircle size={18} color="#10b981" />
              <span>Completed Tasks</span>
            </div>
            <div className="metric-value">{completedCount}</div>
          </div>
          <div className="metric-card">
            <div className="metric-header">
              <Clock size={18} color="#f59e0b" />
              <span>Pending Tasks</span>
            </div>
            <div className="metric-value">{pendingCount}</div>
          </div>
          <div className="metric-card">
            <div className="metric-header">
              <Calendar size={18} color="#0ea5e9" />
              <span>Weekly Progress ({progressPercent}%)</span>
            </div>
            <div className="progress-track" style={{ marginTop: 'auto' }}>
              <motion.div 
                className="progress-fill" 
                initial={{ width: 0 }} 
                animate={{ width: `${progressPercent}%` }} 
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* SMART FILTERS */}
      <div className="smart-filters">
        {['All', 'Assigned to Me', 'High Priority', 'Overdue'].map(f => (
          <button 
            key={f} 
            className={`smart-filter-btn ${activeFilter === f ? 'active' : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f === 'High Priority' && <Flag size={14} />}
            {f === 'Overdue' && <AlertCircle size={14} />}
            {f === 'Assigned to Me' && <User size={14} />}
            {f}
          </button>
        ))}
      </div>

      {/* VIEWS */}
      {filteredTasks.length === 0 ? (
        <div className="empty-state">
          <CheckCircle size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} color="#64748b" />
          <h3>All caught up!</h3>
          <p>No tasks match your current filters.</p>
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="kanban-board">
          {COLUMNS.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);
            return (
              <div 
                key={col.id} 
                className={`kanban-column ${dragOverCol === col.id ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className="column-header">
                  <h3>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: col.color }}></span>
                    {col.title}
                    <span className="task-count">{colTasks.length}</span>
                  </h3>
                  <button className="add-task-btn"><Plus size={18} /></button>
                </div>
                
                <div className="column-tasks">
                  <AnimatePresence>
                    {colTasks.map(task => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={task.id}
                        className={`task-card ${draggedTaskId === task.id ? 'dragging' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => setSelectedTask(task)}
                      >
                        <div className="task-labels">
                          <span className="space-tag">{task.space}</span>
                          <span className="priority-flag">
                            <Flag fill={getPriorityColor(task.priority)} color={getPriorityColor(task.priority)} size={14} />
                          </span>
                        </div>
                        <h4>{task.title}</h4>
                        
                        {(task.subtasks > 0 || task.attachments > 0 || task.comments > 0) && (
                          <div className="task-indicators">
                            {task.subtasks > 0 && <span><CheckCircle size={12} /> {task.completedSubtasks}/{task.subtasks}</span>}
                            {task.comments > 0 && <span><MessageSquare size={12} /> {task.comments}</span>}
                            {task.attachments > 0 && <span><Paperclip size={12} /> {task.attachments}</span>}
                          </div>
                        )}

                        <div className="task-meta">
                          <div className={`task-due ${task.overdue ? 'overdue' : ''}`}>
                            <Clock size={12} />
                            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="task-assignees">
                            {task.assignees.map((a, i) => <img key={i} src={a} alt="Assignee" />)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="list-view">
          {filteredTasks.map(task => (
            <div className="list-task" key={task.id} onClick={() => setSelectedTask(task)}>
              <CheckCircle size={20} color={task.status === 'done' ? '#10b981' : '#cbd5e1'} />
              <div className="list-task-title">{task.title} <span className="space-tag" style={{ marginLeft: '1rem' }}>{task.space}</span></div>
              <div className={`task-due ${task.overdue ? 'overdue' : ''}`}>{task.dueDate}</div>
              <Flag fill={getPriorityColor(task.priority)} color={getPriorityColor(task.priority)} size={16} />
              <div className="task-assignees">
                {task.assignees.map((a, i) => <img key={i} src={a} alt="Assignee" />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SLIDE-OVER TASK DRAWER */}
      <AnimatePresence>
        {selectedTask && (
          <div className="drawer-overlay" onClick={() => setSelectedTask(null)}>
            <motion.div 
              className="task-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="drawer-header">
                <div>
                  <span className="space-tag">{selectedTask.space}</span>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-gray)' }}>
                    In list <strong style={{ color: 'var(--text-dark)' }}>{COLUMNS.find(c => c.id === selectedTask.status)?.title}</strong>
                  </div>
                </div>
                <div className="drawer-actions">
                  <button className="icon-btn"><MoreHorizontal size={20} /></button>
                  <button className="icon-btn" onClick={() => setSelectedTask(null)}><X size={20} /></button>
                </div>
              </div>
              
              <div className="drawer-content">
                <h2 className="drawer-title">{selectedTask.title}</h2>
                
                <div className="drawer-section">
                  <h5>Description</h5>
                  <p style={{ color: 'var(--text-dark)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    {selectedTask.desc}
                  </p>
                </div>

                {selectedTask.subtasks > 0 && (
                  <div className="drawer-section">
                    <h5>Checklist ({selectedTask.completedSubtasks}/{selectedTask.subtasks})</h5>
                    <div className="subtask-item checked">
                      <input type="checkbox" readOnly checked />
                      <span>Review initial proposals</span>
                    </div>
                    <div className="subtask-item">
                      <input type="checkbox" readOnly />
                      <span>Approve final budget</span>
                    </div>
                  </div>
                )}

                <div className="drawer-section">
                  <h5>Activity</h5>
                  <div className="activity-feed">
                    {mockActivity.map(act => (
                      <div className="activity-item" key={act.id}>
                        <img src={act.avatar} alt={act.user} />
                        <div>
                          <p><strong>{act.user}</strong> {act.text}</p>
                          <span>{act.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
};

export default TasksPage;
