import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Users, Lock, Calendar, Clock, Plus, Edit3, CheckSquare, DollarSign, UploadCloud, Share2, ImageIcon, MessageSquare, Activity, ChevronRight, Sparkles, Sparkle, X, BarChart2, FileText, Map as MapIcon, Brain, Video, Link as LinkIcon, List, Folder
} from 'lucide-react';

const WorkspaceCockpit = ({
  selectedWorkspace,
  currentUser,
  membersArr,
  resolveMemberInfo,
  currentHeroIndex,
  heroSlideImages,
  setShowInviteModal,
  setShowEditCoverModal,
  handleModuleNavigation,
  workspaceTasks,
  workspaceExpenses,
  workspaceGallery,
  unreadChannels,
  setUnreadChannels,
  setActiveTool,
  setShowWorkspaceTools,
  navigate
}) => {
  const themeColor = selectedWorkspace?.theme || 'var(--accent-primary)';
  const customThemeStyles = {
    '--accent-primary': themeColor,
    '--accent-hover': themeColor.startsWith('#') ? `${themeColor}dd` : 'var(--accent-hover)'
  };

  // Dynamic progress & task stats calculation to avoid hardcoded statistics discrepancies
  const totalTasks = Array.isArray(workspaceTasks) ? workspaceTasks.length : 0;
  const completedTasks = Array.isArray(workspaceTasks) ? workspaceTasks.filter(t => t.status === 'done' || t.status === 'completed').length : 0;
  const calculatedProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const getTimeString = () => {
    if (selectedWorkspace?.time) return selectedWorkspace.time;
    if (selectedWorkspace?.createdAt) {
      const diff = new Date() - new Date(selectedWorkspace.createdAt);
      const diffMins = Math.floor(diff / 60000);
      if (diffMins < 60) return `${diffMins || 1}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `Created ${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
    return "Active";
  };

  return (
    <div className="workspace-page-container" style={customThemeStyles}>

      {/* MODERN FLOATING EXIT BUTTON TO WORKSPACE HUB */}
      <motion.button
        className="modern-exit-fab" onClick={() => {
          localStorage.removeItem('gatherly_active_workspace');
          window.dispatchEvent(new Event('active_workspace_changed'));
          if (selectedWorkspace?.status === 'completed' || selectedWorkspace?.isArchived || selectedWorkspace?.progress >= 100) {
            navigate('/history');
          } else {
            navigate('/workspace');
          }
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Return to Workspaces"
      >
        <LogOut size={24} />
      </motion.button>

      <div className="workspace-main-column">

        <div className="cockpit-main">

          <div className="cockpit-content">
            <div className="cockpit-hero" style={{ overflow: 'hidden', position: 'relative' }}>
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={currentHeroIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5 }}
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: `url(${heroSlideImages[currentHeroIndex]})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    zIndex: 0
                  }}
                />
              </AnimatePresence>
              <div className="cockpit-hero-left" style={{ zIndex: 2 }}>
                <h1>{selectedWorkspace.name}</h1>
                <p>{selectedWorkspace.description || "Welcome to your digital hub."}</p>
                <div className="cockpit-meta">
                  <span><Users size={14}/> {Math.max(1, membersArr.length)} Member{Math.max(1, membersArr.length) !== 1 ? 's' : ''}</span>
                  <span><Lock size={14}/> Private</span>
                  <span><Calendar size={14}/> Created by {currentUser.username}</span>
                </div>
                <div className="cockpit-progress-row">
                  <span>{calculatedProgress}% Planned</span>
                  <div className="progress-bar-container"><div className="progress-fill" style={{width: `${calculatedProgress}%`}}></div></div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={14}/> {getTimeString()}</span>
                </div>
                <div className="cockpit-avatars-row">
                  <div className="cockpit-avatars">
                    <img src={`https://ui-avatars.com/api/?name=${currentUser.username}&background=0d8f80&color=fff`} alt={currentUser.username}/>
                    {membersArr.filter(m => {
                      const info = resolveMemberInfo(m);
                      return !info.isMe;
                    }).slice(0, 4).map((m, i) => {
                      const info = resolveMemberInfo(m);
                      return <img key={i} src={`https://ui-avatars.com/api/?name=${info.name}&background=random&color=fff`} alt={info.name}/>;
                    })}
                    {membersArr.length > 5 && <div className="avatar-more">+{membersArr.length - 5}</div>}
                  </div>
                  <button className="btn-invite" onClick={() => setShowInviteModal(true)}><Plus size={16}/> Invite</button>
                </div>
              </div>

              <div className="cockpit-hero-right">
                <button className="btn-edit-cover" onClick={() => setShowEditCoverModal(true)}><Edit3 size={14}/> Edit Cover</button>
                <div className="hero-actions-stack">
                  <button className="btn-stack-action" onClick={() => handleModuleNavigation('/teamhub')}><CheckSquare size={16}/> Add Task</button>
                  <button className="btn-stack-action" onClick={() => handleModuleNavigation('/expenses')}><DollarSign size={16}/> Add Expense</button>
                  <button className="btn-stack-action" onClick={() => handleModuleNavigation('/gallery')}><UploadCloud size={16}/> Upload Media</button>
                  <button className="btn-stack-action share" onClick={() => {
                    navigator.clipboard.writeText(`Join my workspace on LinkUp! Invite Code: ${selectedWorkspace.id}`);
                    alert('Workspace Invite Code copied to clipboard!');
                  }}><Share2 size={16}/> Share Workspace</button>
                </div>
              </div>
            </div>

            <div className="cockpit-stats-row">
              <div className="cockpit-stat-card">
                <div className="cockpit-stat-header"><div className="cockpit-stat-icon"><CheckSquare size={16}/></div> Tasks Completed</div>
                <div className="cockpit-stat-value">{workspaceTasks.filter(t => t.status === 'done' || t.status === 'completed').length} / <span style={{ fontSize:'1rem', color:'var(--text-gray)' }}>{workspaceTasks.length}</span></div>
                <div className="cockpit-stat-sub">{workspaceTasks.length > 0 ? Math.round((workspaceTasks.filter(t => t.status === 'done' || t.status === 'completed').length / workspaceTasks.length) * 100) : 0}% Done</div>
              </div>
              <div className="cockpit-stat-card">
                <div className="cockpit-stat-header"><div className="cockpit-stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><DollarSign size={16}/></div> Total Expenses</div>
                <div className="cockpit-stat-value">₹{workspaceExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0).toLocaleString()}</div>
                <div className="cockpit-stat-sub">{workspaceExpenses.length} Expenses</div>
              </div>
              <div className="cockpit-stat-card">
                <div className="cockpit-stat-header"><div className="cockpit-stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}><ImageIcon size={16}/></div> Media Uploaded</div>
                <div className="cockpit-stat-value">{workspaceGallery.length}</div>
                <div className="cockpit-stat-sub">Photos & Videos</div>
              </div>
              <div className="cockpit-stat-card">
                <div className="cockpit-stat-header"><div className="cockpit-stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><MessageSquare size={16}/></div> Active Discussions</div>
                <div className="cockpit-stat-value">{(selectedWorkspace.chatMessages || []).length}</div>
                <div className="cockpit-stat-sub">Total Messages</div>
              </div>
              <div className="cockpit-stat-card">
                <div className="cockpit-stat-header"><div className="cockpit-stat-icon" style={{ background: 'rgba(236,72,153,0.1)', color: '#ec4899' }}><Calendar size={16}/></div> Upcoming Plans</div>
                <div className="cockpit-stat-value">{(selectedWorkspace.polls || []).length + (selectedWorkspace.notes || []).length}</div>
                <div className="cockpit-stat-sub">Polls & Notes</div>
              </div>
            </div>

            <div className="section-header" style={{ marginTop: '1rem' }}><h2>Workspace Modules</h2></div>
            <div className="cockpit-modules-grid">
              {[
                { title: 'Gallery', desc: 'Browse photos, videos & memories', icon: <ImageIcon size={20}/>, path: '/gallery' },
                { title: 'Team Hub', desc: 'Tasks, Kanban & announcements', icon: <Users size={20}/>, path: '/teamhub' },
                { title: 'Docs & Pulse', desc: 'Track live activities, notes & files', icon: <Activity size={20}/>, path: '/pulse' },
                { title: 'Expenses', desc: 'Track, split & settle expenses', icon: <DollarSign size={20}/>, path: '/expenses' },
                { title: 'Timeline', desc: 'Workspace activity timeline', icon: <List size={20}/>, path: '/pulse' },
                { title: 'Files & Docs', desc: 'Shared files, docs & links', icon: <Folder size={20}/>, path: '/pulse' }
              ].map((mod, idx) => (
                <div key={idx} className="cockpit-module-card" onClick={() => {
                  if (mod.title === 'Files & Docs') {
                    handleModuleNavigation('/pulse', { activeTab: 'files_docs' });
                  } else if (mod.title === 'Docs & Pulse' || mod.title === 'Timeline') {
                    handleModuleNavigation('/pulse', { activeTab: 'timeline' });
                  } else {
                    handleModuleNavigation(mod.path);
                  }
                }}>
                  <div className="module-icon-box">{mod.icon}</div>
                  <div className="module-info"><h4>{mod.title}</h4><p>{mod.desc}</p></div>
                  <div className="module-arrow"><ChevronRight size={18}/></div>
                </div>
              ))}
            </div>

            <div className="section-header" style={{ marginTop: '1rem' }}><h2>Recent Activity</h2></div>
            <div className="cockpit-activity-card">
              {selectedWorkspace.activities && selectedWorkspace.activities.length > 0 ? (
                <div className="cockpit-activity-list">
                  {selectedWorkspace.activities.map(act => (
                    <div className="activity-row" key={act.id}>
                      <img src={`https://ui-avatars.com/api/?name=${act.user}&background=random&color=fff`} alt={act.user} className="user-av"/>
                      <div className="activity-text">
                        <p><strong>{act.user}</strong> {act.action}</p>
                        <span>{act.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-gray)' }}>
                  <Activity size={32} style={{ margin:'0 auto 1rem auto', opacity:0.5 }} />
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-dark)' }}>No recent activity yet.</p>
                  <p style={{ fontSize:'0.85rem', marginTop: '0.25rem' }}>When your team interacts with the workspace, activities will appear here.</p>
                </div>
              )}
            </div>
          </div>

          <div className="cockpit-sidebar">
            <div className="sidebar-card" style={{ padding: '1.25rem' }}>
              <h3>Members Online ({Math.max(1, membersArr.length)})</h3>
              <div className="sidebar-members">
                <div className="online-indicator"><img src={`https://ui-avatars.com/api/?name=${currentUser.username}&background=0d8f80&color=fff`} alt={currentUser.username}/></div>
                {membersArr.filter(m => {
                  const info = resolveMemberInfo(m);
                  return !info.isMe;
                }).map((m, i) => {
                  const info = resolveMemberInfo(m);
                  return (
                    <div className="online-indicator" key={i}><img src={`https://ui-avatars.com/api/?name=${info.name}&background=random&color=fff`} alt={info.name}/></div>
                  );
                })}
              </div>
            </div>

            <div className="ai-summary-card">
              <h3>AI Workspace Summary <span className="ai-badge">Beta</span></h3>
              <h4>This week in {selectedWorkspace.name}</h4>
              <ul className="ai-summary-list">
                <li>{`Workspace has ${membersArr.length} active member${membersArr.length !== 1 ? 's' : ''}.`}</li>
                <li>{`Overall progress is at ${calculatedProgress}% with ${completedTasks}/${totalTasks} tasks completed.`}</li>
                <li>{`${(selectedWorkspace.chatMessages || []).length > 0 ? `${(selectedWorkspace.chatMessages || []).length} messages exchanged.` : 'Be the first to start a discussion!'}`}</li>
              </ul>
              <div className="ai-sparkle"><Sparkle size={20}/></div>
            </div>

            <div className="sidebar-card" style={{ padding: '1.25rem' }}>
              <h3>Planning Tools</h3>
              <div className="planning-tools-grid">
                {[
                  { id: 'chat', name: 'Chat', icon: <MessageSquare size={16}/>, color: '#0ea5e9' },
                  { id: 'polls', name: 'Polls', icon: <BarChart2 size={16}/>, color: '#8b5cf6' },
                  { id: 'tasks', name: 'Tasks', icon: <CheckSquare size={16}/>, color: '#10b981' },
                  { id: 'expenses', name: 'Expenses', icon: <DollarSign size={16}/>, color: '#f59e0b' },
                  { id: 'notes', name: 'Notes', icon: <FileText size={16}/>, color: '#ec4899' },
                  { id: 'maps', name: 'Maps', icon: <MapIcon size={16}/>, color: '#6366f1' },
                  { id: 'ai', name: 'AI Planner', icon: <Brain size={16}/>, color: '#14b8a6' },
                  { id: 'videocall', name: 'Video Call', icon: <Video size={16}/>, color: '#ef4444' },
                  { id: 'fusion', name: 'Fusion', icon: <LinkIcon size={16}/>, color: '#8b5cf6' },
                ].map(tool => {
                  const totalUnread = tool.id === 'chat' ? Object.values(unreadChannels).reduce((a, b) => a + b, 0) : 0;
                  return (
                    <div key={tool.id} className="tool-mini-card" style={{ position: 'relative' }} onClick={() => { setActiveTool(tool.id); if (tool.id === 'chat') setUnreadChannels({}); setShowWorkspaceTools(true); }}>
                      <div className="tool-mini-icon" style={{color: tool.color, backgroundColor: `${tool.color}15`}}>{tool.icon}</div>
                      <span>{tool.name}</span>
                      {totalUnread > 0 && (
                        <span className="tool-badge-dot" style={{ position: 'absolute', top: '5px', right: '5px', background: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 900, minWidth: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', boxShadow: '0 0 5px rgba(239, 68, 68, 0.5)' }}>
                          {totalUnread}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="sidebar-card" style={{ padding: '1.25rem' }}>
              <h3>Upcoming Milestones</h3>
              {workspaceTasks && workspaceTasks.filter(t => t.status !== 'done' && t.status !== 'completed').length > 0 ? (
                workspaceTasks.filter(t => t.status !== 'done' && t.status !== 'completed').slice(0, 3).map((ms, i) => {
                  let d = ms.dueDate ? new Date(ms.dueDate) : new Date();
                  return (
                    <div className="milestone-box" key={i}>
                      <div className="milestone-date"><span>{d.toLocaleString('default', { month: 'short' }).toUpperCase()}</span><span>{d.getDate()}</span></div>
                      <div className="milestone-text"><h5>{ms.title}</h5><p style={{ fontSize:'0.75rem', opacity:0.8 }}>{ms.desc || 'Pending task requirement'}</p></div>
                      <div className="milestone-icon"><CheckSquare size={18}/></div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                   <Calendar size={24} style={{ opacity: 0.5, marginBottom: '0.5rem', color: 'var(--text-gray)' }} />
                   <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>No upcoming milestones.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceCockpit;
