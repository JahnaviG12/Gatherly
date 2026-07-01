import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Share2, Layers, CheckCircle2, XCircle, Info, RefreshCw, Link as LinkIcon, Compass, Zap, Wallet, Database, Check } from 'lucide-react';
import './WorkspaceFusion.css';

const WorkspaceFusion = ({ workspace, currentUser, onRefreshWorkspace }) => {
  const [otherWorkspaces, setOtherWorkspaces] = useState([]);
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // States for premium fusion animation overlay
  const [fusionState, setFusionState] = useState(null); // 'initiating' | 'teams' | 'tasks' | 'gallery' | 'ledger' | 'complete' | null
  const [fusionProgress, setFusionProgress] = useState(0);
  const [fusedSpaceData, setFusedSpaceData] = useState(null);

  // Fetch all workspaces to filter out ones we can request fusion with
  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.email || currentUser.username;
    if (!uid) return;
    fetch(`http://localhost:5000/api/spaces/user/${encodeURIComponent(uid)}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Filter out the current workspace AND any existing fused workspaces
          const currentId = workspace._id || workspace.id;
          const filtered = data.filter(ws => {
            const wsId = ws._id || ws.id;
            return wsId !== currentId && ws.type !== 'collab';
          });
          setOtherWorkspaces(filtered);
          if (filtered.length > 0) {
            setSelectedTargetId(filtered[0]._id || filtered[0].id);
          }
        }
      })
      .catch(err => console.error('Error fetching workspaces for fusion', err));
  }, [workspace, currentUser]);

  // Merge gallery albums and items stored in LocalStorage for sender and receiver workspaces
  const mergeGalleryData = (senderId, receiverId, newSpaceId, newSpaceName, newSpace) => {
    try {
      const senderAlbums = JSON.parse(localStorage.getItem(`albums_${senderId}`)) || [];
      const receiverAlbums = JSON.parse(localStorage.getItem(`albums_${receiverId}`)) || [];
      
      const combinedAlbums = [
        { 
          id: 'a1', 
          name: `${newSpaceName} Media`, 
          cover: 'https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?auto=format&fit=crop&w=800&q=80', 
          items: 0 
        }
      ];
      
      const addedNames = new Set([`${newSpaceName} Media`]);
      [...senderAlbums, ...receiverAlbums].forEach(album => {
        if (album && album.name && !addedNames.has(album.name)) {
          addedNames.add(album.name);
          combinedAlbums.push({
            ...album,
            id: `album_${Math.random().toString(36).substring(2, 7)}`
          });
        }
      });
      
      const senderGallery = JSON.parse(localStorage.getItem(`gallery_${senderId}`)) || [];
      const receiverGallery = JSON.parse(localStorage.getItem(`gallery_${receiverId}`)) || [];
      
      const combinedGallery = [...senderGallery, ...receiverGallery].map((item, idx) => ({
        ...item,
        id: Date.now() + idx,
        albumId: 'a1'
      }));
      
      combinedAlbums[0].items = combinedGallery.length;
      
      localStorage.setItem(`albums_${newSpaceId}`, JSON.stringify(combinedAlbums));
      localStorage.setItem(`gallery_${newSpaceId}`, JSON.stringify(combinedGallery));
      
      // Update localStorage workspaces array so dashboard has immediate access to it
      const allWorkspaces = JSON.parse(localStorage.getItem('gatherly_workspaces') || '[]');
      const wsExists = allWorkspaces.some(w => (w._id || w.id) === newSpace._id || (w._id || w.id) === newSpace.id);
      if (!wsExists) {
        allWorkspaces.push(newSpace);
        localStorage.setItem('gatherly_workspaces', JSON.stringify(allWorkspaces));
      }
    } catch (e) {
      console.error('Failed to merge localstorage gallery albums', e);
    }
  };

  // Run the multi-phase fusion animation
  const runFusionSequence = async (senderId, senderName, newSpace) => {
    setFusedSpaceData(newSpace);
    
    // Phase 1: Initiating
    setFusionState('initiating');
    setFusionProgress(15);
    await new Promise(r => setTimeout(r, 800));
    
    // Phase 2: Members
    setFusionState('teams');
    setFusionProgress(35);
    await new Promise(r => setTimeout(r, 800));
    
    // Phase 3: Tasks
    setFusionState('tasks');
    setFusionProgress(60);
    await new Promise(r => setTimeout(r, 800));
    
    // Phase 4: Gallery
    setFusionState('gallery');
    setFusionProgress(80);
    mergeGalleryData(senderId, workspace._id || workspace.id, newSpace._id || newSpace.id, newSpace.name, newSpace);
    await new Promise(r => setTimeout(r, 800));
    
    // Phase 5: Ledgers/Expenses
    setFusionState('ledger');
    setFusionProgress(95);
    await new Promise(r => setTimeout(r, 800));
    
    // Phase 6: Completed!
    setFusionState('complete');
    setFusionProgress(100);
  };

  // Redirect to new fused workspace cockpit
  const handleEnterFusedSpace = () => {
    if (fusedSpaceData) {
      localStorage.setItem('gatherly_active_workspace', JSON.stringify(fusedSpaceData));
      window.location.href = `/workspace/${fusedSpaceData._id || fusedSpaceData.id}`;
    }
  };

  // Send collaboration/fusion request
  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!selectedTargetId) return;

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('http://localhost:5000/api/spaces/fusion/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: workspace._id || workspace.id,
          receiverId: selectedTargetId
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Collaboration request sent to "${otherWorkspaces.find(w => (w._id || w.id) === selectedTargetId)?.name}" successfully!`);
      } else {
        setErrorMsg(data.error || 'Failed to send request.');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  // Accept or decline incoming fusion request
  const handleRespondRequest = async (req, action) => {
    setActionLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('http://localhost:5000/api/spaces/fusion/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spaceId: workspace._id || workspace.id,
          requestId: req.id,
          action
        })
      });

      const data = await res.json();
      if (res.ok) {
        if (action === 'accept') {
          // Trigger the beautiful fusion sequence!
          await runFusionSequence(req.senderId, req.senderName, data.newSpace);
        } else {
          setSuccessMsg('Collaboration request declined.');
        }
        // Refresh the parent workspace state so the pending requests are cleared
        if (onRefreshWorkspace) {
          onRefreshWorkspace();
        }
      } else {
        setErrorMsg(data.error || 'Failed to respond to request.');
      }
    } catch (err) {
      setErrorMsg('Failed to process response.');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingRequests = workspace.fusionRequests || [];

  return (
    <div className="wf-wrapper">
      {/* ── HEADER ── */}
      <div className="wf-header-card">
        <div className="wf-glowing-icon">
          <Sparkles size={28} color="white" />
        </div>
        <div className="wf-header-text">
          <h2>Workspace Fusion</h2>
          <p>Link up with other project teams. Fusing workspaces merges members and tasks into a new combined space, keeping your original workspaces completely intact.</p>
        </div>
      </div>

      {/* ── SUCCESS / ERROR ALERTS ── */}
      {successMsg && (
        <div className="wf-alert success">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="wf-alert error">
          <XCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── PENDING INCOMING REQUESTS ── */}
      {pendingRequests.length > 0 && (
        <div className="wf-section incoming-requests">
          <h3 className="wf-section-title">⚡ Collaboration Invites ({pendingRequests.length})</h3>
          <div className="wf-requests-list">
            {pendingRequests.map(req => (
              <div key={req.id} className="wf-request-card">
                <div className="wf-request-avatar">
                  <Layers size={20} color="#8b5cf6" />
                </div>
                <div className="wf-request-details">
                  <h4>{req.senderName}</h4>
                  <p>wants to merge & collaborate with your workspace</p>
                </div>
                <div className="wf-request-actions">
                  <button 
                    className="wf-btn decline" 
                    onClick={() => handleRespondRequest(req, 'decline')}
                    disabled={actionLoading}
                  >
                    Decline
                  </button>
                  <button 
                    className="wf-btn accept" 
                    onClick={() => handleRespondRequest(req, 'accept')}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <RefreshCw className="spinner" size={14} /> : 'Accept & Merge'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── INITIATE FUSION (SEND REQUEST) ── */}
      <div className="wf-section send-fusion">
        <h3 className="wf-section-title">🔗 Propose Workspace Fusion</h3>
        <div className="wf-card">
          {otherWorkspaces.length === 0 ? (
            <div className="wf-empty-state">
              <Compass size={32} />
              <p>No other active workspaces found to collaborate with.</p>
            </div>
          ) : (
            <form onSubmit={handleSendRequest} className="wf-form">
              <div className="wf-form-group">
                <label>Select Target Workspace</label>
                <div className="wf-select-wrapper">
                  <select 
                    value={selectedTargetId} 
                    onChange={e => setSelectedTargetId(e.target.value)}
                    className="wf-select"
                  >
                    {otherWorkspaces.map(ws => (
                      <option key={ws._id || ws.id} value={ws._id || ws.id}>
                        {ws.name} ({ws.type || 'other'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="wf-fusion-preview">
                <div className="wf-preview-node current">
                  <span>{workspace.name}</span>
                </div>
                <div className="wf-preview-connector">
                  <ArrowRight size={20} className="wf-arrow-pulse" />
                  <span className="wf-connector-text">FUSE</span>
                </div>
                <div className="wf-preview-node target">
                  <span>{otherWorkspaces.find(w => (w._id || w.id) === selectedTargetId)?.name || 'Target Workspace'}</span>
                </div>
              </div>

              <div className="wf-notice">
                <Info size={14} />
                <span>Sends an invite. Once accepted, a new workspace containing both lists of members and tasks will be automatically generated for both teams!</span>
              </div>

              <button type="submit" className="wf-submit-btn" disabled={loading || !selectedTargetId}>
                {loading ? <RefreshCw className="spinner" size={16} /> : <Share2 size={16} />}
                {loading ? 'Sending Proposal…' : 'Send Fusion Proposal'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── FUSION ANIMATION OVERLAY ── */}
      <AnimatePresence>
        {fusionState && (
          <motion.div 
            className="wf-fusion-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="wf-fusion-modal">
              {/* Spinning / Glowing Energy Ring */}
              <div className="wf-fusion-energy-ring">
                <div className="wf-energy-circle"></div>
                <div className="wf-energy-circle-inner"></div>
                <div className="wf-energy-icon-center">
                  {fusionState === 'complete' ? (
                    <Check size={28} color="white" strokeWidth={3} />
                  ) : (
                    <Zap size={28} color="white" className="wf-arrow-pulse" />
                  )}
                </div>
              </div>

              {/* Status Header */}
              <h2 className="wf-fusion-status-title">
                {fusionState === 'initiating' && 'Initiating Fusion...'}
                {fusionState === 'teams' && 'Unifying Team Networks...'}
                {fusionState === 'tasks' && 'Flattening Task Matrices...'}
                {fusionState === 'gallery' && 'Synthesizing Gallery Albums...'}
                {fusionState === 'ledger' && 'Consolidating Wallets & Ledgers...'}
                {fusionState === 'complete' && 'Workspace Fusion Complete!'}
              </h2>

              <p className="wf-fusion-status-subtitle">
                {fusionState === 'complete' 
                  ? `"${fusedSpaceData?.name}" is fully synchronized and active.` 
                  : 'Establishing real-time collaboration pipeline...'}
              </p>

              {/* Progress Bar */}
              <div className="wf-progress-container">
                <div 
                  className="wf-progress-bar-fill"
                  style={{ width: `${fusionProgress}%` }}
                ></div>
              </div>

              {/* Interactive Status Checklists */}
              <div className="wf-fusion-phases-list">
                <div className={`wf-phase-item ${fusionState === 'teams' ? 'active' : ''} ${['tasks', 'gallery', 'ledger', 'complete'].includes(fusionState) ? 'done' : ''}`}>
                  <div className="wf-phase-dot"></div>
                  <span>Unify Team Networks</span>
                </div>
                <div className={`wf-phase-item ${fusionState === 'tasks' ? 'active' : ''} ${['gallery', 'ledger', 'complete'].includes(fusionState) ? 'done' : ''}`}>
                  <div className="wf-phase-dot"></div>
                  <span>Clone & Flatten Tasks</span>
                </div>
                <div className={`wf-phase-item ${fusionState === 'gallery' ? 'active' : ''} ${['ledger', 'complete'].includes(fusionState) ? 'done' : ''}`}>
                  <div className="wf-phase-dot"></div>
                  <span>Synthesize Shared Gallery Albums</span>
                </div>
                <div className={`wf-phase-item ${fusionState === 'ledger' ? 'active' : ''} ${['complete'].includes(fusionState) ? 'done' : ''}`}>
                  <div className="wf-phase-dot"></div>
                  <span>Consolidate Wallets & Ledgers</span>
                </div>
              </div>

              {/* Complete Action Button */}
              {fusionState === 'complete' && (
                <motion.button 
                  className="wf-fusion-action-btn"
                  onClick={handleEnterFusedSpace}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Enter Fused Cockpit <Sparkles size={16} />
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkspaceFusion;
