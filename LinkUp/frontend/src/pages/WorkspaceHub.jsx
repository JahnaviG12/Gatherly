import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Link as LinkIcon, LayoutTemplate, X, Sparkles, Layers, Rocket, CheckCircle, Activity, ImageIcon, CheckSquare
} from 'lucide-react';
import WorkspaceWizard from './WorkspaceWizard';

const WorkspaceHub = ({
  currentUser,
  allWorkspaces,
  activeSpaces,
  completedSpaces,
  totalMembers,
  invites,
  handleAcceptInvite,
  handleDeclineInvite,
  handleEnterWorkspace,
  handleUseTemplate,
  handleJoinWorkspace,
  joinCode,
  setJoinCode,
  showCreateModal,
  setShowCreateModal,
  showJoinModal,
  setShowJoinModal,
  showTemplateModal,
  setShowTemplateModal,
  handleLaunchWizard,
  TEMPLATES,
  fallbackImages,
  slideIndex
}) => {
  return (
    <>
      <div className="workspace-main-column">
        <div className="hub-header">
          <h1>Welcome back, {currentUser.username}! 👋</h1>
          <p>Here's what's happening in your workspaces today.</p>
        </div>

        <div className="hub-banner" style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-hover))', borderRadius: '24px', padding: '2.5rem', color: 'white', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 30px rgba(13, 143, 128, 0.2)' }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Your Collaborative Universe</h2>
            <p style={{ fontSize: '1.05rem', maxWidth: '500px', opacity: 0.9 }}>
              Manage projects, plan events, split expenses, and share memories all in one beautiful dashboard.
            </p>
          </div>
          <Sparkles size={120} style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.1, transform: 'rotate(15deg)' }}/>
          <Layers size={80} style={{ position: 'absolute', right: '100px', top: '10px', opacity: 0.1, transform: 'rotate(-15deg)' }}/>
        </div>

        <div className="hub-stats-row">
          <div className="hub-stat-card">
            <div className="hub-stat-icon"><Layers size={24}/></div>
            <div className="hub-stat-info">
              <h3>Total Workspaces</h3>
              <div className="stat-value">{allWorkspaces.length}</div>
              <p>All time</p>
            </div>
          </div>
          <div className="hub-stat-card">
            <div className="hub-stat-icon"><Rocket size={24}/></div>
            <div className="hub-stat-info">
              <h3>Active Workspaces</h3>
              <div className="stat-value">{activeSpaces.length}</div>
              <p>Currently working</p>
            </div>
          </div>
          <div className="hub-stat-card">
            <div className="hub-stat-icon"><CheckCircle size={24}/></div>
            <div className="hub-stat-info">
              <h3>Completed</h3>
              <div className="stat-value">{completedSpaces.length}</div>
              <p>Great job!</p>
            </div>
          </div>
          <div className="hub-stat-card">
            <div className="hub-stat-icon"><Users size={24}/></div>
            <div className="hub-stat-info">
              <h3>Total Members</h3>
              <div className="stat-value">{totalMembers}</div>
              <p>Across all workspaces</p>
            </div>
          </div>
        </div>

        <div className="hub-section">
          <div className="section-header">
            <h2><span className="dot"></span> Active Workspaces</h2>
            {activeSpaces.length > 0 && <button className="view-all-link">View All</button>}
          </div>
          {activeSpaces.length === 0 ? (
            <p style={{ color: 'var(--text-gray)', padding: '1rem 0' }}>No active workspaces. Create one to get started!</p>
          ) : (
            <div className="workspace-grid">
              {activeSpaces.map((ws, i) => {
                const hasValidCover = ws.cover && (ws.cover.includes('http') || ws.cover.startsWith('data:image/'));
                const currentCover = hasValidCover ? ws.cover : fallbackImages[(slideIndex + i) % fallbackImages.length];

                return (
                  <motion.div key={ws._id || ws.id} className="hub-workspace-card immersive-card" onClick={() => handleEnterWorkspace(ws)}>
                    <div className="card-cover" style={{ backgroundImage: `url(${currentCover})` }}>
                      <div className="card-top-content">
                        <div className="card-badge"><Sparkles size={12}/> Pinned</div>
                        <div className="card-avatars">
                          <img src={`https://ui-avatars.com/api/?name=${currentUser.username}&background=0d8f80&color=fff`} alt="User"/>
                          {(Array.isArray(ws.members) ? ws.members : []).length > 1 && (
                            <div className="avatar-more">+{ws.members.length - 1}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="card-body">
                      <h3>{ws.name}</h3>
                      <div className="card-progress">
                        <div className="progress-labels">
                          <span>Progress</span>
                          <span>{ws.progress || 0}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{width: `${ws.progress || 0}%`}}></div>
                        </div>
                      </div>
                      <div className="card-footer">
                        <span><Users size={14}/> {(Array.isArray(ws.members) ? ws.members : []).length} Members</span>
                        <span><Activity size={14}/> Active</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {completedSpaces.length > 0 && (
          <div className="hub-section">
            <div className="section-header">
              <h2 className="completed"><span className="dot"></span> Completed Workspaces</h2>
            </div>
            <div className="workspace-grid">
              {completedSpaces.map((ws, i) => {
                const hasValidCover = ws.cover && (ws.cover.includes('http') || ws.cover.startsWith('data:image/'));
                const currentCover = hasValidCover ? ws.cover : fallbackImages[(slideIndex + i) % fallbackImages.length];

                return (
                  <motion.div key={ws._id || ws.id} className="hub-workspace-card immersive-card" onClick={() => handleEnterWorkspace(ws)}>
                    <div className="card-cover" style={{ backgroundImage: `url(${currentCover})` }}>
                      <div className="card-top-content">
                        <div className="card-badge completed"><CheckCircle size={12}/> Completed</div>
                        <div className="card-avatars"><img src={`https://ui-avatars.com/api/?name=${currentUser.username}&background=0d8f80&color=fff`} alt="User"/></div>
                      </div>
                    </div>
                    <div className="card-body">
                      <h3>{ws.name}</h3>
                      <div className="card-footer">
                        <span><Users size={14}/> {(Array.isArray(ws.members) ? ws.members : []).length} Members</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        <div className="create-banner">
          <div className="create-banner-info">
            <div className="create-banner-icon"><Users size={32}/></div>
            <div className="create-banner-text">
              <h3>Create your first workspace</h3>
              <p>Bring your team together and start collaborating immediately.</p>
            </div>
          </div>
          <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setShowCreateModal(true)}>
            <Plus size={18}/> Create Workspace
          </button>
        </div>
      </div>

      {/* RIGHT SIDEBAR (HUB) */}
      <div className="workspace-right-sidebar">
        <div className="sidebar-card">
          <h3>Quick Actions</h3>
          <div className="quick-actions-list">
            <button className="action-btn" onClick={() => setShowCreateModal(true)}>
              <div className="action-icon"><Plus size={20}/></div>
              <div className="action-text"><strong>Create Workspace</strong><span>Start a new workspace from scratch</span></div>
            </button>
            <button className="action-btn" onClick={() => setShowJoinModal(true)}>
              <div className="action-icon"><LinkIcon size={20}/></div>
              <div className="action-text"><strong>Join via Link</strong><span>Enter an invitation link or code</span></div>
            </button>
            <button className="action-btn" onClick={() => setShowTemplateModal(true)}>
              <div className="action-icon"><LayoutTemplate size={20}/></div>
              <div className="action-text"><strong>Explore Templates</strong><span>Use pre-built workspace structures</span></div>
            </button>
          </div>
        </div>

        {invites.length > 0 && (
          <div className="sidebar-card" style={{ padding:0, border:'none', boxShadow:'none', background:'transparent' }}>
            <h3 style={{ paddingLeft:'0.5rem', marginBottom:'0.75rem' }}>Pending Invitations <span style={{ fontSize:'0.75rem', color:'var(--primary-blue)', cursor:'pointer' }}>View All</span></h3>
            <div className="quick-actions-list">
              {invites.map(inv => (
                <div key={inv.id} className="pending-invite">
                  <div className="invite-header">
                    <div className="invite-avatar">{inv.from.charAt(0)}</div>
                    <div className="invite-text"><p><strong>{inv.from}</strong> invited you to join <strong>{inv.team}</strong></p></div>
                  </div>
                  <div className="invite-actions">
                    <button className="btn-decline" onClick={() => handleDeclineInvite(inv)}>Decline</button>
                    <button className="btn-accept" onClick={() => handleAcceptInvite(inv)}>Accept</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GLOBAL ACTIVITY FEED */}
        <div className="global-activity-card">
          <h3 style={{ marginBottom:0 }}>Recent Network Activity</h3>
          <div className="global-activity-list">
            <div className="global-activity-item">
              <div className="global-activity-icon"><Sparkles size={16}/></div>
              <div className="global-activity-text">
                <p><strong>Sarah Wilson</strong> created <strong>Goa Trip 2026</strong></p>
                <span>2 hours ago</span>
              </div>
            </div>
            <div className="global-activity-item">
              <div className="global-activity-icon"><CheckSquare size={16}/></div>
              <div className="global-activity-text">
                <p><strong>Mike</strong> completed 3 tasks in <strong>Project Alpha</strong></p>
                <span>4 hours ago</span>
              </div>
            </div>
            <div className="global-activity-item">
              <div className="global-activity-icon"><ImageIcon size={16}/></div>
              <div className="global-activity-text">
                <p>12 new photos uploaded to <strong>Alumni Meet</strong></p>
                <span>Yesterday</span>
              </div>
            </div>
          </div>
        </div>

        {/* STORAGE USAGE WIDGET */}
        <div className="sidebar-card" style={{ marginTop: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Storage Usage</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--accent-primary)', lineHeight: 1 }}>45<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>.2 GB</span></span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>of 100 GB</span>
            </div>
            <div className="progress-bar" style={{ height: '10px', background: 'var(--bg-primary)', borderRadius: '5px', overflow: 'hidden' }}>
              <motion.div
                className="progress-fill"
                initial={{width: 0}}
                animate={{width: '45.2%'}}
                transition={{duration: 1, ease: "easeOut"}}
                style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-hover))' }}
              ></motion.div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, marginTop: '0.5rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width:'10px', height:'10px', borderRadius:'3px', background:'var(--accent-primary)' }}></div> Media (28GB)</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width:'10px', height:'10px', borderRadius:'3px', background:'var(--accent-hover)' }}></div> Docs (17.2GB)</span>
            </div>
            <button className="btn-outline" style={{ marginTop: '0.5rem', width: '100%', padding: '0.75rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 }}>Upgrade Storage</button>
          </div>
        </div>
      </div>

      {/* ================= MODALS ================= */}
      <AnimatePresence>
        {showCreateModal && (
          <WorkspaceWizard
            onClose={() => setShowCreateModal(false)}
            onLaunch={handleLaunchWizard}
            currentUser={currentUser}
          />
        )}

        {showTemplateModal && (
          <div className="modal-overlay">
            <motion.div className="modal-content" initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} style={{ maxWidth: '600px' }}>
              <button className="modal-close" onClick={() => setShowTemplateModal(false)}><X size={20}/></button>
              <h2>Explore Templates</h2>
              <p>Start instantly with pre-configured modules.</p>
              <div className="template-grid">
                {TEMPLATES.map((t, idx) => (
                  <div key={idx} className="template-card" onClick={() => handleUseTemplate(t)}>
                    <div className="card-cover" style={{backgroundImage: `url(${t.cover})`, height: '100px', borderRadius: '12px', marginBottom: '0.75rem'}}></div>
                    <h4>{t.name}</h4>
                    <p>{t.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {showJoinModal && (
          <div className="modal-overlay">
            <motion.div className="modal-content" initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}}>
              <button className="modal-close" onClick={() => setShowJoinModal(false)}><X size={20}/></button>
              <h2>Join Workspace</h2>
              <p>Enter the code or paste the invite link.</p>
              <div className="form-group">
                <input type="text" placeholder="e.g. LINK-X9F2A or https://linkup.com/invite/..." value={joinCode} onChange={e => setJoinCode(e.target.value)} />
              </div>
              <button className="btn-primary" onClick={handleJoinWorkspace}>Join Now</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default WorkspaceHub;
