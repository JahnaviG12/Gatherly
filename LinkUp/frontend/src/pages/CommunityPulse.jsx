import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useOutletContext, useLocation, useParams } from 'react-router-dom';
import { Heart, MessageCircle, Star, Activity, TrendingUp, Award, Clock, Share2, CheckCircle, Lock, LogOut, FileText, Link as LinkIcon, Folder } from 'lucide-react';
import './CommunityPulse.css';

const timelineEvents = [
  { id: 'e1', type: 'activity', user: 'Alex Mercer', avatar: 'https://i.pravatar.cc/150?img=11', action: 'uploaded 12 new photos to', space: 'Goa Trip 2026', time: '1 hour ago', content: 'Just dropped the beach sunset shots! Check them out in the gallery.', reactions: 5, comments: 2, reacted: false },
  { id: 'e2', type: 'milestone', title: 'Goa Trip 2026 Tasks Completed! 🚀', desc: 'All 45 tasks have been checked off. Great job team!', stat1: '45 Tasks', stat2: '6 Members', space: 'Goa Trip 2026' },
  { id: 'e3', type: 'activity', user: 'Jessica Day', avatar: 'https://i.pravatar.cc/150?img=9', action: 'completed the task "Finalize Budget" in', space: 'Alumni Meet', time: '4 hours ago', content: 'Budget is approved. We have $500 extra for catering.', reactions: 12, comments: 0, reacted: true },
  { id: 'e4', type: 'bridge', title: 'Goa Trip 2026 is complete!', desc: 'You spent 5 days collaborating. Share your funniest moments and rate the experience.', space: 'Goa Trip 2026' },
  { id: 'e5', type: 'activity', user: 'Mike Ross', avatar: 'https://i.pravatar.cc/150?img=8', action: 'created a new space', space: 'Q3 Marketing', time: 'Yesterday', content: 'Let\'s get the Q3 planning started!', reactions: 2, comments: 0, reacted: false }
];

const memoryReviews = [
  { id: 'r1', user: 'Alex Mercer', avatar: 'https://i.pravatar.cc/150?img=11', space: 'Goa Trip 2026', rating: 5, time: '2 days ago', tags: [{ label: 'Best Moment', value: 'Scuba Diving' }, { label: 'Top Contributor', value: '@Sarah' }], content: 'Honestly one of the best trips we have ever planned. The shared expenses feature saved us so much headache, and the gallery is packed with amazing memories!', images: ['https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=200&q=80', 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=200&q=80'] },
  { id: 'r2', user: 'Mike Ross', avatar: 'https://i.pravatar.cc/150?img=8', space: 'Tech Hackathon', rating: 4, time: '1 week ago', tags: [{ label: 'Funniest Memory', value: 'Server crashed at 3AM' }], content: 'We didn\'t win first place, but the collaboration was seamless. We managed all our tasks perfectly. Next time we need to order more pizza though.', images: [] },
  { id: 'r3', user: 'Jessica Day', avatar: 'https://i.pravatar.cc/150?img=9', space: 'Project Alpha', rating: 5, time: '2 weeks ago', tags: [{ label: 'Most Helpful', value: '@Alex' }], content: 'The design system delivery was flawless. Keeping all our assets and moodboards in Gatherly made it so easy for the devs to find what they needed.', images: ['https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=200&q=80'] }
];

const CommunityPulse = () => {
  const { searchQuery } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { workspaceId } = useParams();
  
  const [activeTab, setActiveTab] = useState((location.state && location.state.activeTab) || 'timeline');
  const [filesSubTab, setFilesSubTab] = useState('docs');
  const [events, setEvents] = useState(timelineEvents);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [liveWorkspaceData, setLiveWorkspaceData] = useState(null);
  const allWorkspaces = JSON.parse(localStorage.getItem('gatherly_workspaces') || '[]');

  useEffect(() => {
    if (workspaceId) {
      try {
        const found = allWorkspaces.find(ws => String(ws._id || ws.id || '').includes(workspaceId));
        if (found) {
          setActiveWorkspace(found);
          localStorage.setItem('gatherly_active_workspace', JSON.stringify(found));
        } else {
          fetch(`http://localhost:5000/api/spaces/${workspaceId}`).then(r => r.ok && r.json()).then(data => data && setActiveWorkspace(data)).catch(() => {});
        }
      } catch (e) {}
    } else {
      try { setActiveWorkspace(JSON.parse(localStorage.getItem('gatherly_active_workspace'))); } catch (e) {}
    }
  }, [workspaceId]);

  useEffect(() => { if (location.state?.activeTab) setActiveTab(location.state.activeTab); }, [location.state]);

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
    if (!activeWorkspace) return;
    const spaceId = activeWorkspace._id || activeWorkspace.id;
    const getEvs = (acts, name) => (acts || []).map((act, i) => ({
      id: act.id || `act_${i}`, type: 'activity', user: act.user || 'Collaborator',
      avatar: `https://ui-avatars.com/api/?name=${act.user || 'User'}&background=random&color=fff`,
      action: act.action || 'updated the workspace', space: name, time: act.time || 'Recently',
      content: '', reactions: 0, comments: 0, reacted: false
    }));
    setEvents(getEvs(activeWorkspace.activities, activeWorkspace.name));
    fetch(`http://localhost:5000/api/spaces/${spaceId}`).then(res => res.json()).then(data => {
      if (data) { setLiveWorkspaceData(data); setEvents(getEvs(data.activities, data.name)); }
    }).catch(() => {});
  }, [activeWorkspace?._id || activeWorkspace?.id]);

  if (!activeWorkspace) {
    return (
      <div className="community-empty-state" style={{flexDirection: 'column', padding: '3rem', height: '100%', minHeight: '80vh', background: 'var(--bg-main)', color: 'var(--text-dark)', width: '100%'}}>
        <motion.button className="modern-exit-fab" onClick={() => navigate(workspaceId ? -1 : '/userdashboard')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} title="Return to Dashboard"><LogOut size={24} /></motion.button>
        <h2 style={{fontSize: '2.5rem', marginBottom: '2rem', fontWeight: 800}}>Your Workspace Pulses</h2>
        {allWorkspaces.length === 0 ? (
          <div style={{margin: '10% auto', textAlign: 'center'}}><Lock size={50} color="var(--accent-primary)"/><h2>No Workspaces Found</h2><p>You haven't joined any workspaces yet.</p><a href="/userdashboard" style={{color: 'var(--accent-primary)', fontWeight: 600}}>Go to Dashboard</a></div>
        ) : (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2.5rem', width: '100%'}}>
            {allWorkspaces.map(ws => (
              <div key={ws.id || ws._id} onClick={() => { setActiveWorkspace(ws); localStorage.setItem('gatherly_active_workspace', JSON.stringify(ws)); window.dispatchEvent(new Event('active_workspace_changed')); }} style={{cursor: 'pointer', background: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-light)', transition: '0.2s'}} onMouseOver={e => {e.currentTarget.style.transform='translateY(-8px)';}} onMouseOut={e => {e.currentTarget.style.transform='none';}}>
                <div style={{height: '180px', background: `url(https://picsum.photos/seed/${ws.id || ws._id}-pulse/800/600) center/cover`}}></div>
                <div style={{padding: '1.5rem'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem'}}><div style={{padding: '0.4rem', background: 'rgba(13, 143, 128, 0.1)', borderRadius: '8px', color: 'var(--accent-primary)'}}><Activity size={16}/></div><h3 style={{margin: 0, fontSize: '1.2rem', fontWeight: 700}}>{ws.name} Pulse</h3></div>
                  <p style={{margin: 0, color: 'var(--text-gray)', fontSize: '0.9rem'}}>View live timeline and memories</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const galleryItems = JSON.parse(localStorage.getItem(`gallery_${activeWorkspace.id || activeWorkspace._id}`) || '[]');
  const uploaderCounts = {};
  galleryItems.forEach(item => { if (item.uploader) uploaderCounts[item.uploader] = (uploaderCounts[item.uploader] || 0) + 1; });
  let topContributor = activeWorkspace.members?.[0]?.name || activeWorkspace.members?.[0]?.email || 'No Contributors Yet';
  let maxContributions = 0;
  Object.entries(uploaderCounts).forEach(([u, c]) => { if (c > maxContributions) { maxContributions = c; topContributor = u; } });
  const scopedReviews = memoryReviews.filter(rev => rev.space?.toLowerCase() === activeWorkspace.name.toLowerCase());
  const avgRating = scopedReviews.length > 0 ? (scopedReviews.reduce((sum, r) => sum + r.rating, 0) / scopedReviews.length).toFixed(1) : 'No Rating';

  const highlights = [
    { title: 'Trending Uploads', value: activeWorkspace.name, sub: `${galleryItems.length} total photos`, icon: <TrendingUp color="#ef4444" size={28} />, color: '#fee2e2' },
    { title: 'Top Contributor', value: topContributor, sub: maxContributions > 0 ? `${maxContributions} uploads` : 'Joined workspace', icon: <Award color="#f59e0b" size={28} />, color: '#fef3c7' },
    { title: 'Workspace Rating', value: activeWorkspace.name, sub: scopedReviews.length > 0 ? `${avgRating}/5 Average` : 'No reviews yet', icon: <Star color="#10b981" size={28} />, color: '#d1fae5' }
  ];

  const handleReaction = (id) => {
    setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, reacted: !ev.reacted, reactions: ev.reacted ? ev.reactions - 1 : ev.reactions + 1 } : ev));
  };

  const filteredEvents = events.filter(ev => ev.space?.toLowerCase() === activeWorkspace.name.toLowerCase() && (!searchQuery || ev.content?.toLowerCase().includes(searchQuery.toLowerCase())));
  const sharedLinks = [];
  ((liveWorkspaceData || activeWorkspace).chatMessages || []).forEach(msg => {
    if (msg.text) {
      const found = msg.text.match(/(https?:\/\/[^\s]+)/g);
      if (found) {
        found.forEach(url => {
          if (!sharedLinks.some(l => l.url === url)) {
            sharedLinks.push({ url, sender: msg.sender || 'Member', time: msg.time || 'Shared recently', avatar: msg.avatar || `https://ui-avatars.com/api/?name=${msg.sender || 'Member'}&background=random&color=fff` });
          }
        });
      }
    }
  });

  return (
    <main className="pulse-main-content">
      <motion.button className="modern-exit-fab" onClick={() => navigate(workspaceId ? -1 : '/userdashboard')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} title="Return to Pulse Selection"><LogOut size={24} /></motion.button>
      {!searchQuery && (
        <div className="pulse-highlights">
          {highlights.map((h, i) => (
            <div className="highlight-card" key={i}>
              <div className="highlight-icon" style={{ backgroundColor: h.color }}>{h.icon}</div>
              <div className="highlight-info"><h4>{h.title}</h4><p>{h.value}</p><span>{h.sub}</span></div>
            </div>
          ))}
        </div>
      )}
      <div className="pulse-header">
        <div className="pulse-title"><h1>Workspace Docs & Pulse</h1><p>Track workspace timeline logs, collaborative notes, files, and shared links.</p></div>
        <div className="pulse-tabs">
          <button className={`pulse-tab-btn ${activeTab==='timeline'?'active':''}`} onClick={() => setActiveTab('timeline')}><Activity size={18} /> Live Timeline</button>
          <button className={`pulse-tab-btn ${activeTab==='files_docs'?'active':''}`} onClick={() => setActiveTab('files_docs')}><Folder size={18} /> Files & Docs</button>
        </div>
      </div>
      {activeTab === 'timeline' ? (
        <motion.div className="timeline-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          {filteredEvents.length > 0 ? (
            filteredEvents.map((ev, idx) => (
              <motion.div className="timeline-item" key={ev.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: idx * 0.1 }}>
                <div className="timeline-dot"></div>
                {ev.type === 'activity' && (
                  <div className="timeline-card">
                    <div className="tl-header">
                      <div className="tl-user"><img src={ev.avatar} alt="" /><p><strong>{ev.user}</strong> {ev.action}</p></div>
                      <div className="tl-time"><Clock size={14} /> {ev.time}</div>
                    </div>
                    {ev.content && <div className="tl-content">{ev.content}</div>}
                    <div className="tl-interactions">
                      <button className={`tl-action ${ev.reacted ? 'reacted' : ''}`} onClick={() => handleReaction(ev.id)}><Heart size={16} fill={ev.reacted ? "#ef4444" : "none"} /> {ev.reactions}</button>
                      <button className="tl-action"><MessageCircle size={16} /> {ev.comments} Comments</button>
                      <button className="tl-action" style={{marginLeft: 'auto'}}><Share2 size={16} /> Share</button>
                    </div>
                  </div>
                )}
                {ev.type === 'milestone' && (
                  <div className="milestone-card">
                    <h2>{ev.title}</h2><p>{ev.desc}</p>
                    <div className="milestone-stats">
                      <span className="m-stat"><CheckCircle size={16} style={{display:'inline', verticalAlign:'middle', marginRight:'4px'}}/> {ev.stat1}</span>
                      <span className="m-stat"><Award size={16} style={{display:'inline', verticalAlign:'middle', marginRight:'4px'}}/> {ev.stat2}</span>
                    </div>
                  </div>
                )}
                {ev.type === 'bridge' && (
                  <div className="bridge-prompt">
                    <h3>{ev.title}</h3><p>{ev.desc}</p>
                    <button className="btn-primary" onClick={() => setActiveTab('files_docs')}><Folder size={16} /> View Workspace Files</button>
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div style={{textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-gray)', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-light)'}}>
              <Activity size={48} style={{margin: '0 auto 1.5rem', opacity: 0.5, color: 'var(--accent-primary)'}} />
              <h3 style={{margin: '0 0 0.5rem', fontSize: '1.25rem', color: 'var(--text-dark)', fontWeight: 800}}>No Activity Logged Yet</h3>
              <p style={{margin: '0 auto', fontSize: '0.9rem', maxWidth: '340px', lineHeight: '1.5'}}>Real activities will appear here in real-time as tasks are completed, expenses are settled, and files are updated in the cockpit!</p>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div className="files-docs-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
          <div style={{display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap'}}>
            <button onClick={() => setFilesSubTab('docs')} style={{padding:'0.6rem 1.5rem', borderRadius:'20px', background: filesSubTab === 'docs' ? 'var(--accent-primary)' : 'var(--bg-card)', color: filesSubTab === 'docs' ? 'white' : 'var(--text-gray)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s ease', border: '1px solid var(--border-light)'}}><FileText size={16} /> Workspace Notes</button>
            <button onClick={() => setFilesSubTab('links')} style={{padding:'0.6rem 1.5rem', borderRadius:'20px', background: filesSubTab === 'links' ? 'var(--accent-primary)' : 'var(--bg-card)', color: filesSubTab === 'links' ? 'white' : 'var(--text-gray)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s ease', border: '1px solid var(--border-light)'}}><LinkIcon size={16} /> Shared Links</button>
          </div>
          <div style={{marginTop: '1rem'}}>
            {filesSubTab === 'docs' ? (
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'1.5rem', width:'100%'}}>
                {liveWorkspaceData?.notes && liveWorkspaceData.notes.length > 0 ? liveWorkspaceData.notes.map((note, i) => (
                  <div key={i} style={{background: 'var(--bg-card)', borderRadius: '20px', padding: '1.5rem', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', overflow: 'hidden'}}>
                    <div style={{display:'flex', gap:'0.75rem', alignItems:'center'}}><div style={{padding:'0.5rem', background:'rgba(16,185,129,0.1)', color:'var(--accent-primary)', borderRadius:'10px'}}><FileText size={18} /></div><h4 style={{margin:0, fontSize:'1.1rem', fontWeight:800}}>{note.title || 'Untitled Doc'}</h4></div>
                    <p style={{margin:0, fontSize:'0.9rem', color:'var(--text-gray)', lineHeight:'1.5', flex:1}}>{note.content ? note.content.replace(/<[^>]*>/g, ' ').substring(0, 120) + '...' : 'No description available.'}</p>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid var(--border-light)', paddingTop:'0.75rem', fontSize:'0.75rem', color:'var(--text-gray)', fontWeight:700}}><span>Author: {note.author || 'Member'}</span><span>{note.date || 'Created recently'}</span></div>
                  </div>
                )) : (
                  <div style={{gridColumn: '1/-1', textAlign:'center', padding:'3rem', color:'var(--text-gray)'}}><FileText size={40} style={{marginBottom:'1rem', opacity:0.5}} /><h4>No Collaborative Docs Found</h4><p style={{fontSize:'0.9rem'}}>Create rich documents and outlines inside the workspace cockpit Notes tool!</p></div>
                )}
              </div>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:'1rem', width:'100%'}}>
                {sharedLinks.length > 0 ? sharedLinks.map((link, idx) => (
                  <div key={idx} style={{background: 'var(--bg-card)', borderRadius: '16px', padding: '1rem 1.25rem', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'1rem', overflow:'hidden', flex:1}}><div style={{padding:'0.6rem', background:'rgba(14,165,233,0.1)', color:'var(--primary-blue)', borderRadius:'12px'}}><LinkIcon size={18} /></div><div style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1}}><a href={link.url} target="_blank" rel="noopener noreferrer" style={{fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-primary)', textDecoration: 'none'}}>{link.url}</a><p style={{margin:0, fontSize:'0.75rem', color:'var(--text-gray)', marginTop:'0.2rem'}}>Shared by <strong>{link.sender}</strong> • {link.time}</p></div></div>
                    <img src={link.avatar} alt="" style={{width:'28px', height:'28px', borderRadius:'50%'}} />
                  </div>
                )) : (
                  <div style={{textAlign:'center', padding:'3rem', color:'var(--text-gray)'}}><LinkIcon size={40} style={{marginBottom:'1rem', opacity:0.5}} /><h4>No Shared Links Found</h4><p style={{fontSize:'0.9rem'}}>Any web links posted in workspace chat messages will automatically appear here!</p></div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </main>
  );
};

export default CommunityPulse;
