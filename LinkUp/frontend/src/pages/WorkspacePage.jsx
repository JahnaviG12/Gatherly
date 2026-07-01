import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon, X, Send, Lock, ArrowLeft,
  MessageCircle, Camera, Video, PhoneOff
} from 'lucide-react';
import { useWorkspaceLogic } from '../hooks/useWorkspaceLogic';
import './WorkspacePage.css';
import WorkspaceHub from './WorkspaceHub';
import WorkspaceCockpit from './WorkspaceCockpit';
import WorkspaceToolsPanel from './WorkspaceToolsPanel';

const WorkspacePage = () => {
  const {
    navigate,
    workspaceId,
    currentUser,
    allWorkspaces,
    showCreateModal,
    setShowCreateModal,
    showTemplateModal,
    setShowTemplateModal,
    showJoinModal,
    setShowJoinModal,
    showEditCoverModal,
    setShowEditCoverModal,
    showInviteModal,
    setShowInviteModal,
    showCreatePollModal,
    setShowCreatePollModal,
    newCoverUrl,
    setNewCoverUrl,
    joinCode,
    setJoinCode,
    pollQuestion,
    setPollQuestion,
    pollOptions,
    setPollOptions,
    selectedWorkspace,
    setSelectedWorkspace,
    isLoadingWorkspace,
    currentHeroIndex,
    heroSlideImages,
    invites,
    activeTool,
    setActiveTool,
    showWorkspaceTools,
    setShowWorkspaceTools,
    chatMessage,
    setChatMessage,
    activeChannel,
    setActiveChannel,
    aiInput,
    setAiInput,
    extractedAiMessages,
    unreadChannels,
    setUnreadChannels,
    chatToast,
    setChatToast,
    incomingCall,
    setIncomingCall,
    autoJoinCall,
    setAutoJoinCall,
    workspaceTasks,
    workspaceExpenses,
    workspaceGallery,
    slideIndex,
    socketRef,
    fileInputRef,
    TEMPLATES,
    fallbackImages,
    getSpaceId,
    resolveMemberInfo,
    getFilteredMessages,
    handleFileUpload,
    handleVoiceNote,
    handleSendChatMessage,
    handleSendAiMessage,
    handleExtractTasks,
    handleExtractExpenses,
    handlePinLocation,
    handleVotePoll,
    handleCreatePoll,
    submitCreatePoll,
    handleSaveNote,
    handleDeleteNote,
    handleJoinWorkspace,
    handleLaunchWizard,
    handleAcceptInvite,
    handleDeclineInvite,
    handleEnterWorkspace,
    handleChangeCover,
    handleModuleNavigation,
    updateWorkspaceData,
    isRecording,
    showEmojis,
    setShowEmojis,
  } = useWorkspaceLogic();

  const activeSpaces = allWorkspaces.filter(w => {
    if (!w) return false;
    if (w.status === 'completed') return false;
    if (!w.members || !Array.isArray(w.members) || w.members.length === 0) return true;
    const m0 = w.members[0];
    if (typeof m0 !== 'object' || m0 === null || m0.name === undefined) return true;
    return w.members.some(m =>
      m && (
        (currentUser.email && m.email === currentUser.email) ||
        (currentUser.username && (m.name === currentUser.username || m.name === 'You'))
      )
    );
  });
  const completedSpaces = allWorkspaces.filter(w => w.status === 'completed');
  const totalMembers = allWorkspaces.reduce((acc, ws) => acc + (Array.isArray(ws.members) ? ws.members.length : 0), 0);

  // Hub view (no specific workspace selected)
  if (!workspaceId) {
    return (
      <div className="workspace-page-container">
        <motion.button
          className="modern-exit-fab" onClick={() => navigate('/userdashboard')}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} title="Return to Dashboard"
        >
          <ArrowLeft size={24} />
        </motion.button>
        <WorkspaceHub
          currentUser={currentUser}
          allWorkspaces={allWorkspaces}
          activeSpaces={activeSpaces}
          completedSpaces={completedSpaces}
          totalMembers={totalMembers}
          invites={invites}
          handleAcceptInvite={handleAcceptInvite}
          handleDeclineInvite={handleDeclineInvite}
          handleEnterWorkspace={handleEnterWorkspace}
          handleUseTemplate={(t) => {
            const created = {
              id: Date.now().toString(), name: t.name, description: t.desc, cover: t.cover,
              members: [{ name: currentUser.username, email: currentUser.email }],
              status: 'active', progress: 0, createdAt: new Date().toISOString()
            };
            setShowTemplateModal(false);
          }}
          handleJoinWorkspace={handleJoinWorkspace}
          joinCode={joinCode}
          setJoinCode={setJoinCode}
          showCreateModal={showCreateModal}
          setShowCreateModal={setShowCreateModal}
          showJoinModal={showJoinModal}
          setShowJoinModal={setShowJoinModal}
          showTemplateModal={showTemplateModal}
          setShowTemplateModal={setShowTemplateModal}
          handleLaunchWizard={handleLaunchWizard}
          TEMPLATES={TEMPLATES}
          fallbackImages={fallbackImages}
          slideIndex={slideIndex}
        />
      </div>
    );
  }

  // Loading states
  if (workspaceId && isLoadingWorkspace) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-main)', gap: '1.5rem' }}>
        <div style={{ width: '56px', height: '56px', border: '4px solid var(--border-light)', borderTop: '4px solid var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-gray)', fontWeight: 600, fontSize: '1.1rem' }}>Opening workspace...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!selectedWorkspace) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-main)', gap: '1.5rem' }}>
        <div style={{ width: '56px', height: '56px', border: '4px solid var(--border-light)', borderTop: '4px solid var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-gray)', fontWeight: 600, fontSize: '1.1rem' }}>Loading workspace...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const membersArr = Array.isArray(selectedWorkspace.members) ? selectedWorkspace.members : [];
  const isAuthorizedMember = membersArr.some(m => resolveMemberInfo(m).isMe);

  if (!isAuthorizedMember) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'radial-gradient(circle at center, #1e293b, #0f172a)', color: '#f8fafc', padding: '2rem', textAlign: 'center', gap: '1.5rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '3rem', maxWidth: '500px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Lock size={32} /></div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Access Restricted</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
            You are not a member of <strong>"{selectedWorkspace.name}"</strong>. Only authorized members can access this workspace.
          </p>
          <button onClick={() => { localStorage.removeItem('gatherly_active_workspace'); navigate('/workspace'); }}
            style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', border: 'none', borderRadius: '12px', padding: '0.75rem 1.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Main Cockpit View
  return (
    <>
      <WorkspaceCockpit
        selectedWorkspace={selectedWorkspace}
        currentUser={currentUser}
        membersArr={membersArr}
        resolveMemberInfo={resolveMemberInfo}
        currentHeroIndex={currentHeroIndex}
        heroSlideImages={heroSlideImages}
        setShowInviteModal={setShowInviteModal}
        setShowEditCoverModal={setShowEditCoverModal}
        handleModuleNavigation={handleModuleNavigation}
        workspaceTasks={workspaceTasks}
        workspaceExpenses={workspaceExpenses}
        workspaceGallery={workspaceGallery}
        unreadChannels={unreadChannels}
        setUnreadChannels={setUnreadChannels}
        setActiveTool={setActiveTool}
        setShowWorkspaceTools={setShowWorkspaceTools}
        navigate={navigate}
      />

      <AnimatePresence>
        {/* Edit Cover Modal */}
        {showEditCoverModal && (
          <div className="modal-overlay">
            <motion.div className="modal-content" initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}}>
              <button className="modal-close" onClick={() => setShowEditCoverModal(false)}><X size={20}/></button>
              <h2>Edit Workspace Cover</h2>
              <p style={{color:'var(--text-gray)',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Upload an image from your device to customize the workspace banner.</p>
              {/* Preview */}
              {newCoverUrl && (
                <div style={{width:'100%',height:'140px',borderRadius:'14px',overflow:'hidden',marginBottom:'1.25rem',border:'2px solid var(--accent-primary)'}}>
                  <img src={newCoverUrl} alt="Cover preview" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                </div>
              )}
              {/* Upload drop zone */}
              <label htmlFor="cover-upload-input" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'0.75rem',border:'2px dashed var(--border-light)',borderRadius:'14px',padding:'2rem',cursor:'pointer',background:'var(--bg-main)',transition:'border-color 0.2s',marginBottom:'1.25rem'}}
                onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor='var(--accent-primary)';}}
                onDragLeave={e=>{e.currentTarget.style.borderColor='var(--border-light)';}}
                onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor='var(--border-light)';const f=e.dataTransfer.files[0];if(f&&f.type.startsWith('image/')){const r=new FileReader();r.onloadend=()=>setNewCoverUrl(r.result);r.readAsDataURL(f);}}}>
                <ImageIcon size={36} style={{color:'var(--accent-primary)',opacity:0.7}}/>
                <div style={{textAlign:'center'}}>
                  <p style={{fontWeight:700,color:'var(--text-dark)',margin:0}}>Click to upload or drag & drop</p>
                  <p style={{fontSize:'0.8rem',color:'var(--text-gray)',margin:'0.25rem 0 0'}}>PNG, JPG, WEBP up to 10MB</p>
                </div>
                <input id="cover-upload-input" type="file" accept="image/*" style={{display:'none'}}
                  onChange={e=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onloadend=()=>setNewCoverUrl(r.result);r.readAsDataURL(f);}}}/>
              </label>
              <button className="btn-primary" disabled={!newCoverUrl} onClick={async(e)=>{e.preventDefault();await handleChangeCover({preventDefault:()=>{}}); setShowEditCoverModal(false);setNewCoverUrl('');}}
                style={{opacity:newCoverUrl?1:0.5}}>
                <ImageIcon size={18}/> Apply Cover
              </button>
            </motion.div>
          </div>
        )}

        {/* Workspace Tools Panel */}
        {showWorkspaceTools && (
          <WorkspaceToolsPanel
            workspace={selectedWorkspace} currentUser={currentUser} activeTool={activeTool} setActiveTool={setActiveTool}
            onClose={() => setShowWorkspaceTools(false)} socket={socketRef.current} navigate={navigate}
            chatMessage={chatMessage} setChatMessage={setChatMessage} activeChannel={activeChannel} setActiveChannel={setActiveChannel}
            unreadChannels={unreadChannels} setUnreadChannels={setUnreadChannels} getFilteredMessages={getFilteredMessages}
            handleSendChatMessage={handleSendChatMessage} handleFileUpload={handleFileUpload} handleVoiceNote={handleVoiceNote}
            isRecording={isRecording} showEmojis={showEmojis} setShowEmojis={setShowEmojis} fileInputRef={fileInputRef}
            workspaceTasks={workspaceTasks} workspaceExpenses={workspaceExpenses}
            handleVotePoll={handleVotePoll} handleCreatePoll={handleCreatePoll}
            aiInput={aiInput} setAiInput={setAiInput} handleSendAiMessage={handleSendAiMessage}
            extractedAiMessages={extractedAiMessages} handleExtractTasks={handleExtractTasks}
            handleExtractExpenses={handleExtractExpenses} handlePinLocation={handlePinLocation}
            updateWorkspaceData={updateWorkspaceData} getSpaceId={getSpaceId} setSelectedWorkspace={setSelectedWorkspace}
            autoJoinCall={autoJoinCall} setAutoJoinCall={setAutoJoinCall}
          />
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="modal-overlay">
            <motion.div className="modal-content" initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}} style={{maxWidth:'450px',textAlign:'center'}}>
              <button className="modal-close" onClick={() => setShowInviteModal(false)}><X size={20}/></button>
              <h2 style={{marginBottom:'0.5rem'}}>Invite to {selectedWorkspace.name}</h2>
              <p style={{color:'var(--text-gray)',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Anyone with this link can join the workspace.</p>
              <div style={{display:'flex',gap:'0.5rem',marginBottom:'2rem'}}>
                <input type="text" readOnly value={`${window.location.origin}/invite/${selectedWorkspace.inviteCode || selectedWorkspace.id}`}
                  style={{flex:1,padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border-light)',background:'var(--bg-main)',color:'var(--text-dark)',fontWeight:600,fontSize:'0.85rem'}}/>
                <button className="btn-primary" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/invite/${selectedWorkspace.inviteCode || selectedWorkspace.id}`).then(() => alert('Invite link copied!')).catch(() => alert('Copy failed.'))} style={{width:'auto',padding:'0 1.5rem'}}>Copy</button>
              </div>
              <div style={{borderTop:'1px solid var(--border-light)',paddingTop:'1.5rem'}}>
                <h4 style={{marginBottom:'1rem',fontSize:'0.85rem',color:'var(--text-gray)',textTransform:'uppercase'}}>Or share via</h4>
                <div style={{display:'flex',gap:'1rem',justifyContent:'center'}}>
                  <button className="social-invite-btn whatsapp" onClick={() => alert('Opening WhatsApp...')}><MessageCircle size={22}/></button>
                  <button className="social-invite-btn instagram" onClick={() => alert('Opening Instagram...')}><Camera size={22}/></button>
                  <button className="social-invite-btn x-twitter" onClick={() => alert('Opening X...')}><X size={22}/></button>
                  <button className="social-invite-btn telegram" onClick={() => alert('Opening Telegram...')}><Send size={22}/></button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Create Poll Modal */}
        {showCreatePollModal && (
          <div className="modal-overlay">
            <motion.div className="modal-content" initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}} style={{maxWidth:'500px'}}>
              <button className="modal-close" onClick={() => setShowCreatePollModal(false)}><X size={20}/></button>
              <h2>Create a Poll</h2>
              <p style={{color:'var(--text-gray)',marginBottom:'1.5rem'}}>Gather opinions from your workspace members.</p>
              <form onSubmit={submitCreatePoll}>
                <div className="form-group">
                  <label>Poll Question</label>
                  <input type="text" placeholder="e.g. Where should we go for lunch?" value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} required/>
                </div>
                <div className="form-group">
                  <label>Options</label>
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} style={{display:'flex',gap:'0.5rem',marginBottom:'0.75rem'}}>
                      <input type="text" placeholder={`Option ${idx + 1}`} value={opt}
                        onChange={e => { const o=[...pollOptions]; o[idx]=e.target.value; setPollOptions(o); }} required/>
                      {pollOptions.length > 2 && (
                        <button type="button" className="btn-outline" style={{padding:'0 1rem'}}
                          onClick={() => setPollOptions(pollOptions.filter((_,i) => i!==idx))}><X size={16}/></button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 5 && (
                    <button type="button" className="btn-link" style={{color:'var(--primary-blue)',fontWeight:600,fontSize:'0.9rem'}}
                      onClick={() => setPollOptions([...pollOptions,''])}>+ Add another option</button>
                  )}
                </div>
                <button type="submit" className="btn-primary" style={{marginTop:'1rem'}}>Publish Poll</button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Chat Toast Notification */}
        {chatToast && (
          <motion.div className="chat-toast-notification"
            initial={{x:300,opacity:0}} animate={{x:0,opacity:1}} exit={{x:300,opacity:0}}
            onClick={() => { setActiveTool('chat'); setActiveChannel(chatToast.channel||'general'); setUnreadChannels(p=>({...p,[chatToast.channel||'general']:0})); setShowWorkspaceTools(true); setChatToast(null); }}
            style={{position:'fixed',bottom:'2rem',right:'2rem',background:'rgba(255,255,255,0.85)',backdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,0.4)',borderRadius:'16px',padding:'1rem',boxShadow:'0 20px 40px rgba(0,0,0,0.12)',display:'flex',alignItems:'center',gap:'1rem',cursor:'pointer',zIndex:9999,maxWidth:'320px',width:'100%'}}>
            <div style={{position:'relative'}}>
              <img src={chatToast.avatar||`https://ui-avatars.com/api/?name=${chatToast.sender}&background=0d8f80&color=fff`} alt={chatToast.sender} style={{width:'40px',height:'40px',borderRadius:'50%',objectFit:'cover'}}/>
              <span style={{position:'absolute',bottom:0,right:0,width:'12px',height:'12px',borderRadius:'50%',backgroundColor:'#10b981',border:'2px solid white'}}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.2rem'}}>
                <strong style={{fontSize:'0.9rem',fontWeight:800,color:'var(--text-dark)'}}>{chatToast.sender}</strong>
                <span style={{fontSize:'0.7rem',color:'#0ea5e9',fontWeight:700}}>#{chatToast.channel||'general'}</span>
              </div>
              <p style={{fontSize:'0.8rem',color:'var(--text-gray)',margin:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{chatToast.text||'Sent an attachment'}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Incoming Call Overlay */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div key="incoming-call-overlay"
            initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.9}}
            transition={{type:'spring',damping:22,stiffness:280}}
            style={{position:'fixed',bottom:'2rem',right:'2rem',zIndex:99999,background:'linear-gradient(135deg,#0f172a,#1e293b)',border:'1px solid rgba(14,165,233,0.3)',borderRadius:'20px',padding:'1.5rem',maxWidth:'340px',width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.5)',display:'flex',flexDirection:'column',gap:'1.25rem'}}>
            <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
              <div style={{position:'relative',flexShrink:0}}>
                <img src={incomingCall.callerAvatar} alt={incomingCall.callerName} style={{width:'52px',height:'52px',borderRadius:'50%',objectFit:'cover',border:'3px solid #0ea5e9'}}/>
                <motion.div animate={{scale:[1,1.5,1],opacity:[0.6,0,0.6]}} transition={{duration:1.6,repeat:Infinity}}
                  style={{position:'absolute',inset:'-6px',borderRadius:'50%',border:'2px solid #0ea5e9',pointerEvents:'none'}}/>
              </div>
              <div style={{flex:1}}>
                <p style={{margin:0,fontSize:'0.72rem',color:'#0ea5e9',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em'}}>Incoming Video Call</p>
                <p style={{margin:'0.2rem 0 0',fontSize:'1rem',fontWeight:800,color:'#f8fafc'}}>{incomingCall.callerName}</p>
                <p style={{margin:'0.1rem 0 0',fontSize:'0.8rem',color:'#64748b'}}>{incomingCall.workspaceName}</p>
              </div>
            </div>
            <div style={{display:'flex',gap:'0.75rem'}}>
              <button onClick={() => { setIncomingCall(null); setAutoJoinCall(true); setActiveTool('videocall'); setShowWorkspaceTools(true); }}
                style={{flex:1,background:'linear-gradient(135deg,#10b981,#059669)',color:'white',border:'none',borderRadius:'12px',padding:'0.75rem',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem'}}>
                <Video size={16}/> Accept
              </button>
              <button onClick={() => setIncomingCall(null)}
                style={{flex:1,background:'rgba(239,68,68,0.15)',color:'#ef4444',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'12px',padding:'0.75rem',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem'}}>
                <PhoneOff size={16}/> Decline
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default WorkspacePage;
