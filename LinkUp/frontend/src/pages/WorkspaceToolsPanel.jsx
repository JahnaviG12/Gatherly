import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, MessageSquare, BarChart2, CheckSquare, FileText, DollarSign, Brain, MapPinned, Video, Link as LinkIcon, Plus, Search, Star, Users, Send, Smile, Paperclip, Mic, CheckCircle, Wand2, ArrowRight } from 'lucide-react';
import RichNotesEditor from './RichNotesEditor';
import VideoCall from './VideoCall';
import WorkspaceFusion from './WorkspaceFusion';

const TOOLS = [
  { id: 'chat', name: 'Chat', icon: <MessageSquare size={16} />, color: '#0ea5e9' },
  { id: 'polls', name: 'Polls', icon: <BarChart2 size={16} />, color: '#8b5cf6' },
  { id: 'tasks', name: 'Tasks', icon: <CheckSquare size={16} />, color: '#10b981' },
  { id: 'notes', name: 'Notes', icon: <FileText size={16} />, color: '#ec4899' },
  { id: 'expenses', name: 'Expenses', icon: <DollarSign size={16} />, color: '#f59e0b' },
  { id: 'ai', name: 'AI Planner', icon: <Brain size={16} />, color: '#14b8a6' },
  { id: 'maps', name: 'Maps', icon: <MapPinned size={16} />, color: '#f43f5e' },
  { id: 'videocall', name: 'Video Call', icon: <Video size={16} />, color: '#ef4444' },
  { id: 'fusion', name: 'Fusion', icon: <LinkIcon size={16} />, color: '#8b5cf6' },
];

function WorkspaceToolsPanel({
  workspace, currentUser, activeTool, setActiveTool, onClose, socket, navigate, chatMessage, setChatMessage, activeChannel, setActiveChannel, unreadChannels, setUnreadChannels, getFilteredMessages, handleSendChatMessage, handleFileUpload, handleVoiceNote, isRecording, showEmojis, setShowEmojis, fileInputRef, workspaceTasks, workspaceExpenses, handleVotePoll, handleCreatePoll, aiInput, setAiInput, handleSendAiMessage, extractedAiMessages, handleExtractTasks, updateWorkspaceData, getSpaceId, setSelectedWorkspace, autoJoinCall, setAutoJoinCall,
}) {
  const [mapSearchInput, setMapSearchInput] = useState('');
  const [mapQuery, setMapQuery] = useState('');
  const resolveMemberInfo = (m) => {
    if (!m) return { name: '', isMe: false };
    const name = typeof m === 'object' ? (m.name || m.email || '') : String(m);
    const email = typeof m === 'object' ? (m.email || '') : String(m);
    const isMe = name.toLowerCase() === (currentUser?.username || '').toLowerCase() || email.toLowerCase() === (currentUser?.email || '').toLowerCase();
    return { name, email, isMe };
  };
  const publicChannels = workspace.channels || ['general', 'plans & ideas', 'stay & booking', 'activities', 'food', 'travel-info'];

  return (
    <div className="fs-tools-overlay">
      <motion.div className="fs-tools-container" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}>
        <div className="fs-tools-header">
          <h2>Workspace Tools</h2>
          <button className="fs-close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="fs-tools-nav">
          {TOOLS.map(tool => {
            const unread = tool.id === 'chat' ? Object.values(unreadChannels).reduce((a, b) => a + b, 0) : 0;
            return (
              <button key={tool.id} className={`fs-nav-tab ${activeTool === tool.id ? 'active' : ''}`} onClick={() => { setActiveTool(tool.id); if (tool.id === 'chat') setUnreadChannels({}); }} style={{ '--tab-color': tool.color, position: 'relative' }}>
                <span className="fs-tab-icon" style={{ color: tool.color, backgroundColor: `${tool.color}15` }}>{tool.icon}</span>
                {tool.name}
                {unread > 0 && <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 900, minWidth: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{unread}</span>}
              </button>
            );
          })}
        </div>

        <div className="fs-tools-body">
          {activeTool === 'chat' && (
            <div className="fs-chat-layout">
              <div className="fs-chat-sidebar">
                <div className="fs-chat-header">
                  <div className="fs-chat-icon"><MessageSquare size={20} color="white" /></div>
                  <div><h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>{workspace.name} Chat</h3></div>
                </div>
                <div className="fs-sidebar-section">
                  <h4>Channels <Plus size={14} style={{ float: 'right', cursor: 'pointer' }} onClick={() => { const c = window.prompt('New channel name:'); if (c?.trim()) { const ch = c.trim().toLowerCase().replace(/\s+/g, '-'); const cur = publicChannels; if (!cur.includes(ch)) { updateWorkspaceData('channels', [...cur, ch]); setActiveChannel(ch); } } }} /></h4>
                  <ul className="fs-channel-list">
                    {publicChannels.map(ch => {
                      const cnt = unreadChannels[ch] || 0;
                      return <li key={ch} className={`${activeChannel === ch ? 'active' : ''} ${cnt > 0 ? 'has-unread' : ''}`} onClick={() => { setActiveChannel(ch); setUnreadChannels(p => ({ ...p, [ch]: 0 })); }} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span><span className="hash">#</span> {ch}</span>
                        {cnt > 0 && <span style={{ background: '#ef4444', color: 'white', fontSize: '0.7rem', fontWeight: 800, borderRadius: '10px', padding: '2px 6px' }}>{cnt}</span>}
                      </li>;
                    })}
                  </ul>
                </div>
                <div className="fs-sidebar-section">
                  <h4>Direct Messages <Plus size={14} style={{ float: 'right', cursor: 'pointer' }} onClick={() => { const u = window.prompt('Member name to message:'); if (u?.trim()) setActiveChannel(u.trim()); }} /></h4>
                  <ul className="fs-dm-list">
                    {(workspace.members || []).map((m, i) => {
                      const info = resolveMemberInfo(m); const cnt = unreadChannels[info.name] || 0;
                      return <li key={i} className={`${activeChannel === info.name ? 'active' : ''}`} onClick={() => { setActiveChannel(info.name); setUnreadChannels(p => ({ ...p, [info.name]: 0 })); }} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="dm-avatar"><img src={`https://ui-avatars.com/api/?name=${info.name}&background=random&color=fff`} alt={info.name} /><div className={`status ${info.isMe ? 'online' : 'offline'}`} /></div>
                          <span>{info.name} {info.isMe && <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>(You)</span>}</span>
                        </div>
                        {cnt > 0 && <span style={{ background: '#ef4444', color: 'white', fontSize: '0.7rem', fontWeight: 800, borderRadius: '10px', padding: '2px 6px' }}>{cnt}</span>}
                      </li>;
                    })}
                  </ul>
                </div>
              </div>
              <div className="fs-chat-main">
                <div className="fs-chat-topbar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                    {publicChannels.includes(activeChannel) ? <><span className="hash">#</span>{activeChannel}</> : <><MessageSquare size={16} />{activeChannel}</>}
                  </div>
                  <div className="fs-chat-actions"><Search size={18} /><Star size={18} /><Users size={18} /></div>
                </div>
                <div className="fs-chat-messages">
                  {getFilteredMessages().length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-gray)' }}>
                      <MessageSquare size={32} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                      <p>Start of <strong>{activeChannel}</strong> channel.</p>
                    </div>
                  ) : getFilteredMessages().map((msg, i) => (
                    <div key={msg.id || i} className={`chat-msg-row ${msg.sender === currentUser.username ? 'me' : ''}`}>
                      <img src={msg.avatar} alt={msg.sender} className="msg-avatar" />
                      <div className="msg-content">
                        <div className="msg-meta"><strong>{msg.sender === currentUser.username ? 'You' : msg.sender}</strong> <span>{msg.time}</span></div>
                        <div className={`msg-bubble ${msg.sender === currentUser.username ? 'my-bubble' : ''}`}>
                          {msg.image ? <img src={msg.image} alt="Attachment" style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '200px', objectFit: 'cover' }} /> : msg.audio ? <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mic size={16} />{msg.text}</div> : msg.text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="fs-chat-input-area" style={{ padding: '1rem 1.5rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-light)', position: 'relative' }}>
                  {showEmojis && <div style={{ position: 'absolute', bottom: '100%', left: '1.5rem', background: 'var(--bg-card)', padding: '0.5rem', borderRadius: '8px', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
                    {['😀', '😂', '❤️', '👍', '🙏', '🎉'].map(e => <span key={e} style={{ fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => { setChatMessage(c => c + e); setShowEmojis(false); }}>{e}</span>)}
                  </div>}
                  <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                  <form className="wa-chat-input-form" onSubmit={handleSendChatMessage}>
                    <div className="wa-input-tools-left">
                      <button type="button" onClick={() => setShowEmojis(!showEmojis)}><Smile size={24} /></button>
                      <button type="button" onClick={() => fileInputRef.current?.click()}><Paperclip size={24} /></button>
                    </div>
                    <input type="text" placeholder={isRecording ? 'Recording...' : 'Type a message'} value={chatMessage} onChange={e => setChatMessage(e.target.value)} disabled={isRecording} />
                    <div className="wa-input-tools-right">
                      {chatMessage.trim() ? <button type="submit" className="wa-send-active"><Send size={20} /></button> : <button type="button" onClick={handleVoiceNote} style={{ color: isRecording ? '#ef4444' : '#64748b' }}><Mic size={24} /></button>}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeTool === 'polls' && (
            <div className="fs-tool-generic">
              <div className="generic-header">
                <h3>Live Polls</h3>
                <button className="btn-primary" onClick={handleCreatePoll}><Plus size={16} /> Create Poll</button>
              </div>
              <div className="polls-list">
                {(!workspace.polls || workspace.polls.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-gray)' }}><BarChart2 size={32} style={{ opacity: 0.5, marginBottom: '1rem' }} /><p>No active polls yet.</p></div>
                ) : workspace.polls.map(poll => (
                  <div key={poll.id} className="poll-card-large">
                    <h4>{poll.question}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginBottom: '1rem' }}>By {poll.creator} • {poll.totalVotes} votes</p>
                    {poll.options.map((opt, i) => {
                      const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                      const isMyVote = poll.votedBy && poll.votedBy[currentUser.username] === i;
                      const voters = poll.votedBy ? Object.entries(poll.votedBy).filter(([, v]) => v === i).map(([u]) => u) : [];
                      return (
                        <div key={i} className="poll-option-large" onClick={() => handleVotePoll(poll.id, i)} style={{ cursor: 'pointer', border: isMyVote ? `2px solid ${opt.color}` : '1px solid transparent', padding: '0.75rem', borderRadius: '12px', marginBottom: '0.75rem', background: isMyVote ? `${opt.color}10` : 'transparent' }}>
                          <div className="poll-opt-info">
                            <span style={{ fontWeight: isMyVote ? 700 : 500, color: isMyVote ? opt.color : 'inherit' }}>{opt.text}{isMyVote && <CheckCircle size={14} style={{ display: 'inline', marginLeft: '4px' }} />}</span>
                            <span>{pct}% ({opt.votes})</span>
                          </div>
                          <div className="poll-opt-bar"><div className="poll-opt-fill" style={{ width: `${pct}%`, background: opt.color }} /></div>
                          {voters.length > 0 && <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem' }}>
                            {voters.map(v => <img key={v} src={`https://ui-avatars.com/api/?name=${v}&background=random&color=fff`} alt={v} title={v} style={{ width: '20px', height: '20px', borderRadius: '50%' }} />)}
                          </div>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTool === 'notes' && (
            <div className="fs-tool-generic" style={{ display: 'flex', flexDirection: 'column', padding: 0, height: '100%', minHeight: '540px' }}>
              <RichNotesEditor
                notes={workspace.notes || []}
                currentUser={currentUser}
                onSave={note => { const n = workspace.notes || []; const updated = n.find(x => x.id === note.id) ? n.map(x => x.id === note.id ? note : x) : [note, ...n]; updateWorkspaceData('notes', updated); }}
                onDelete={id => updateWorkspaceData('notes', (workspace.notes || []).filter(n => n.id !== id))} />
            </div>
          )}

          {activeTool === 'tasks' && (
            <div className="fs-tool-generic" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="generic-header"><h3>Active Tasks</h3></div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {workspaceTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-gray)' }}><CheckSquare size={32} style={{ opacity: 0.5, marginBottom: '1rem' }} /><p>No tasks yet. Go to the full Tasks board.</p></div>
                ) : workspaceTasks.map(t => (
                  <div key={t._id} style={{ padding: '1rem', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><h4 style={{ marginBottom: '0.25rem', fontSize: '0.95rem' }}>{t.title}</h4>
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '20px', fontWeight: 'bold', background: t.status === 'done' ? '#d1fae5' : t.status === 'inprogress' ? '#dbeafe' : '#f3f4f6', color: t.status === 'done' ? '#059669' : t.status === 'inprogress' ? '#2563eb' : '#4b5563' }}>{t.status}</span></div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-gray)', fontWeight: 'bold' }}>{t.dueDate || 'No Date'}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                <button className="btn-primary" onClick={() => { onClose(); navigate('/teamhub'); }}>Open Full Kanban <ArrowRight size={16} /></button>
              </div>
            </div>
          )}

          {activeTool === 'expenses' && (
            <div className="fs-tool-generic" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="generic-header"><h3>Recent Expenses</h3></div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {workspaceExpenses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-gray)' }}><DollarSign size={32} style={{ opacity: 0.5, marginBottom: '1rem' }} /><p>No expenses yet.</p></div>
                ) : workspaceExpenses.map(exp => (
                  <div key={exp._id} style={{ padding: '1rem', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><h4 style={{ marginBottom: '0.25rem', fontSize: '0.95rem' }}>{exp.title}</h4><span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>Paid by {exp.paidBy}</span></div>
                    <div style={{ textAlign: 'right' }}><h4 style={{ fontSize: '1rem', color: 'var(--primary-indigo)' }}>₹{exp.amount?.toLocaleString()}</h4><span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>{exp.date}</span></div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                <button className="btn-primary" onClick={() => { onClose(); navigate('/expenses'); }}>Open Expenses Ledger <ArrowRight size={16} /></button>
              </div>
            </div>
          )}

          {activeTool === 'ai' && (
            <div className="fs-tool-generic" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="generic-header"><h3>AI Planner</h3></div>
              <div className="fs-ai-chat-area" style={{ flex: 1, background: 'var(--bg-main)', borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                {(!workspace.aiMessages || workspace.aiMessages.length === 0) ? (
                  <div className="ai-bubble" style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-light)', maxWidth: '80%' }}>
                    <Brain size={24} color="#14b8a6" style={{ marginBottom: '0.5rem' }} />
                    <p style={{ margin: 0, lineHeight: 1.6 }}>Hello! I'm your workspace AI. Ask me to generate an itinerary, suggest budgeting tips, or create tasks.</p>
                  </div>
                ) : workspace.aiMessages.map((msg, i) => (
                  <div key={i} style={{ background: msg.role === 'user' ? '#14b8a6' : 'var(--bg-card)', color: msg.role === 'user' ? 'white' : 'var(--text-dark)', padding: '1.5rem', borderRadius: '16px', border: msg.role === 'user' ? 'none' : '1px solid var(--border-light)', maxWidth: '80%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    {msg.role === 'ai' && <Brain size={24} color="#14b8a6" style={{ marginBottom: '0.5rem' }} />}
                    <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                    {msg.role === 'ai' && msg.text.match(/^[-*] |^\d+\. /m) && (
                      <button onClick={() => !extractedAiMessages[msg.text] && handleExtractTasks(msg.text)} disabled={extractedAiMessages[msg.text]} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: extractedAiMessages[msg.text] ? 'var(--bg-main)' : 'linear-gradient(135deg,#14b8a6,#0d9488)', color: extractedAiMessages[msg.text] ? '#14b8a6' : 'white', border: extractedAiMessages[msg.text] ? '1px solid #14b8a6' : 'none', borderRadius: '20px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {extractedAiMessages[msg.text] ? <><CheckCircle size={14} />Tasks Created</> : <><Wand2 size={14} />Create Tasks from List</>}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendAiMessage} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: '24px', padding: '0.5rem 0.5rem 0.5rem 1.5rem', marginTop: '1rem' }}>
                <input type="text" style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem' }} placeholder="Ask the AI Planner..." value={aiInput} onChange={e => setAiInput(e.target.value)} />
                <button type="submit" style={{ background: 'linear-gradient(135deg,#14b8a6,#0d9488)', marginLeft: '1rem', padding: '0.8rem 1.5rem', borderRadius: '20px', border: 'none', color: 'white', cursor: 'pointer' }}><Send size={18} /></button>
              </form>
            </div>
          )}

          {activeTool === 'videocall' && (
            <div className="fs-tool-generic" style={{ display: 'flex', flexDirection: 'column', padding: 0, height: '100%', minHeight: '540px' }}>
              <VideoCall workspace={workspace} currentUser={currentUser} socket={socket} workspaceId={getSpaceId(workspace)} autoJoin={autoJoinCall} onCallJoined={() => setAutoJoinCall(false)} />
            </div>
          )}

          {activeTool === 'fusion' && (
            <div className="fs-tool-generic" style={{ display: 'flex', flexDirection: 'column', padding: 0, height: '100%', minHeight: '540px' }}>
              <WorkspaceFusion workspace={workspace} currentUser={currentUser} onRefreshWorkspace={async () => { try { const r = await fetch(`http://localhost:5000/api/spaces/${getSpaceId(workspace)}`); if (r.ok) { const f = await r.json(); setSelectedWorkspace(p => ({ ...p, ...f })); } } catch (e) { } }} />
            </div>
          )}

          {activeTool === 'maps' && (
            <div className="fs-tool-generic" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="generic-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Interactive Map</h3>
                <form onSubmit={e => { e.preventDefault(); setMapQuery(mapSearchInput); }} style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.4rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                  <input type="text" placeholder="Search maps..." value={mapSearchInput} onChange={e => setMapSearchInput(e.target.value)} style={{ padding: '0.4rem 0.8rem', border: 'none', background: 'transparent', outline: 'none', width: '250px' }} />
                  <button type="submit" style={{ background: 'var(--primary-blue)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Search</button>
                </form>
              </div>
              <div style={{ flex: 1, background: 'var(--bg-main)', borderRadius: '12px', overflow: 'hidden', marginTop: '1rem', border: '1px solid var(--border-light)' }}>
                <iframe width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery || workspace.location || 'Bangalore, India')}&t=&z=13&ie=UTF8&iwloc=&output=embed`} />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default WorkspaceToolsPanel;
