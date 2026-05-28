import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useOutletContext, useLocation, useParams } from 'react-router-dom';
import { 
  Heart, MessageCircle, Star, Image as ImageIcon,
  Activity, TrendingUp, Award, Clock, Share2, Plus, 
  MapPin, CheckCircle, PenTool, Lock, LogOut,
  FileText, Link as LinkIcon, Folder
} from 'lucide-react';
import './CommunityPulse.css';

// We will dynamically compute highlights inside the component

// Mock Timeline Data
const timelineEvents = [
  { id: 'e1', type: 'activity', user: 'Alex Mercer', avatar: 'https://i.pravatar.cc/150?img=11', action: 'uploaded 12 new photos to', space: 'Goa Trip 2026', time: '1 hour ago', content: 'Just dropped the beach sunset shots! Check them out in the gallery.', reactions: 5, comments: 2, reacted: false },
  { id: 'e2', type: 'milestone', title: 'Goa Trip 2026 Tasks Completed! 🚀', desc: 'All 45 tasks have been checked off. Great job team!', stat1: '45 Tasks', stat2: '6 Members', space: 'Goa Trip 2026' },
  { id: 'e3', type: 'activity', user: 'Jessica Day', avatar: 'https://i.pravatar.cc/150?img=9', action: 'completed the task "Finalize Budget" in', space: 'Alumni Meet', time: '4 hours ago', content: 'Budget is approved. We have $500 extra for catering.', reactions: 12, comments: 0, reacted: true },
  { id: 'e4', type: 'bridge', title: 'Goa Trip 2026 is complete!', desc: 'You spent 5 days collaborating. Share your funniest moments and rate the experience.', space: 'Goa Trip 2026' },
  { id: 'e5', type: 'activity', user: 'Mike Ross', avatar: 'https://i.pravatar.cc/150?img=8', action: 'created a new space', space: 'Q3 Marketing', time: 'Yesterday', content: 'Let\'s get the Q3 planning started!', reactions: 2, comments: 0, reacted: false },
];

// Mock Memory Wall (Reviews) Data
const memoryReviews = [
  { id: 'r1', user: 'Alex Mercer', avatar: 'https://i.pravatar.cc/150?img=11', space: 'Goa Trip 2026', rating: 5, time: '2 days ago', 
    tags: [{ label: 'Best Moment', value: 'Scuba Diving' }, { label: 'Top Contributor', value: '@Sarah' }],
    content: 'Honestly one of the best trips we have ever planned. The shared expenses feature saved us so much headache, and the gallery is packed with amazing memories!',
    images: ['https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=200&q=80', 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=200&q=80']
  },
  { id: 'r2', user: 'Mike Ross', avatar: 'https://i.pravatar.cc/150?img=8', space: 'Tech Hackathon', rating: 4, time: '1 week ago', 
    tags: [{ label: 'Funniest Memory', value: 'Server crashed at 3AM' }],
    content: 'We didn\'t win first place, but the collaboration was seamless. We managed all our tasks perfectly. Next time we need to order more pizza though.',
    images: []
  },
  { id: 'r3', user: 'Jessica Day', avatar: 'https://i.pravatar.cc/150?img=9', space: 'Project Alpha', rating: 5, time: '2 weeks ago', 
    tags: [{ label: 'Most Helpful', value: '@Alex' }],
    content: 'The design system delivery was flawless. Keeping all our assets and moodboards in Gatherly made it so easy for the devs to find what they needed.',
    images: ['https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=200&q=80']
  }
];

const CommunityPulse = () => {
  const { searchQuery } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { workspaceId } = useParams();
  
  const [activeTab, setActiveTab] = useState(
    (location.state && location.state.activeTab) || 'timeline'
  );
  const [filesSubTab, setFilesSubTab] = useState('docs'); // 'docs', 'links'
  const [events, setEvents] = useState(timelineEvents);
  
  const allWorkspaces = JSON.parse(localStorage.getItem('gatherly_workspaces') || '[]');
  
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  
  // Determine workspace context from URL params or localStorage
  useEffect(() => {
    if (workspaceId) {
      // Extract workspace from localStorage by ID
      try {
        const workspacesList = JSON.parse(localStorage.getItem('gatherly_workspaces') || '[]');
        const foundWorkspace = workspacesList.find(ws => {
          const wsId = ws._id || ws.id;
          const wsIdStr = typeof wsId === 'object' ? (wsId.$oid || String(wsId)) : String(wsId || '');
          return wsIdStr === workspaceId;
        });
        if (foundWorkspace) {
          setActiveWorkspace(foundWorkspace);
          localStorage.setItem('gatherly_active_workspace', JSON.stringify(foundWorkspace));
        } else {
          // Fallback: fetch from API if not found in localStorage
          fetch(`http://localhost:5000/api/spaces/${workspaceId}`)
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data) setActiveWorkspace(data); })
            .catch(() => {});
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
  useEffect(() => {
    if (location.state && location.state.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const workspaceActivities = React.useMemo(() => {
    const activeWS = activeWorkspace;
    if (activeWS) {
      const localActs = activeWS.activities || [];
      return localActs.map((act, i) => ({
        id: act.id || `local_${i}`,
        type: 'activity',
        user: act.user || 'Collaborator',
        avatar: `https://ui-avatars.com/api/?name=${act.user || 'User'}&background=random&color=fff`,
        action: act.action || 'updated the workspace',
        space: activeWS.name,
        time: act.time || 'Recently',
        content: '', 
        reactions: 0,
        comments: 0,
        reacted: false
      }));
    }
    return [];
  }, [activeWorkspace]);
  const [liveWorkspaceData, setLiveWorkspaceData] = useState(null);

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

  useEffect(() => {
    if (activeWorkspace) {
      const spaceId = activeWorkspace._id || activeWorkspace.id;
      
      // Calculate local fallbacks immediately so timeline is populated with real data instantly
      const localActs = activeWorkspace.activities || [];
      const localEvents = localActs.map((act, i) => ({
        id: act.id || `local_${i}`,
        type: 'activity',
        user: act.user || 'Collaborator',
        avatar: `https://ui-avatars.com/api/?name=${act.user || 'User'}&background=random&color=fff`,
        action: act.action || 'updated the workspace',
        space: activeWorkspace.name,
        time: act.time || 'Recently',
        content: '', 
        reactions: 0,
        comments: 0,
        reacted: false
      }));
      
      // Load local state instantly
      setEvents(localEvents);

      fetch(`http://localhost:5000/api/spaces/${spaceId}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setLiveWorkspaceData(data);
            const rawActs = data.activities || [];
            const liveEvents = rawActs.map((act, i) => ({
              id: act.id || `live_${i}`,
              type: 'activity',
              user: act.user,
              avatar: `https://ui-avatars.com/api/?name=${act.user}&background=random&color=fff`,
              action: act.action,
              space: data.name,
              time: act.time,
              content: '', 
              reactions: 0,
              comments: 0,
              reacted: false
            }));
            
            setEvents(liveEvents);
          }
        })
        .catch(err => {
          console.warn("Backend fetch failed, using local storage state:", err);
        });
    }
  }, [activeWorkspace?._id || activeWorkspace?.id]);

  if (!activeWorkspace) {
    const userWorkspaces = allWorkspaces.length > 0 ? allWorkspaces : [];

    return (
      <div className="community-empty-state" style={{flexDirection: 'column', padding: '3rem', alignItems: 'flex-start', justifyContent: 'flex-start', height: '100%', minHeight: '80vh', background: 'var(--bg-main)', color: 'var(--text-dark)', width: '100%'}}>
        
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
          <h2 style={{fontSize: '2.5rem', margin: 0, fontWeight: 800, color: 'var(--text-dark)'}}>Your Workspace Pulses</h2>
        </div>
        
        {userWorkspaces.length === 0 ? (
          <div style={{margin: '0 auto', marginTop: '10%', textAlign: 'center'}}>
            <Lock size={50} color="var(--accent-primary)"/>
            <h2>No Workspaces Found</h2>
            <p>You haven't joined any workspaces yet.</p>
            <a href="/userdashboard" style={{color: 'var(--accent-primary)', fontWeight: 600}}>Go to Dashboard</a>
          </div>
        ) : (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2.5rem', width: '100%'}}>
            {userWorkspaces.map(ws => (
              <div key={ws.id || ws._id} onClick={() => { setActiveWorkspace(ws); localStorage.setItem('gatherly_active_workspace', JSON.stringify(ws)); window.dispatchEvent(new Event('active_workspace_changed')); }} style={{cursor: 'pointer', background: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', transition: 'transform 0.2s, box-shadow 0.2s', border: '1px solid var(--border-light)'}} onMouseOver={e => {e.currentTarget.style.transform='translateY(-8px)'; e.currentTarget.style.boxShadow='0 20px 40px rgba(0,0,0,0.1)';}} onMouseOut={e => {e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 10px 25px rgba(0,0,0,0.05)';}}>
                <div style={{display: 'flex', gap: '2px', height: '180px', overflow: 'hidden'}}>
                  <div style={{flex: 1, background: `url(https://picsum.photos/seed/${ws.id || ws._id}-pulse/800/600) center/cover`}}></div>
                </div>
                <div style={{padding: '1.5rem'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem'}}>
                    <div style={{padding: '0.4rem', background: 'rgba(13, 143, 128, 0.1)', borderRadius: '8px', color: 'var(--accent-primary)'}}><Activity size={16}/></div>
                    <h3 style={{margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-dark)'}}>{ws.name} Pulse</h3>
                  </div>
                  <p style={{margin: 0, color: 'var(--text-gray)', fontSize: '0.9rem'}}>View live timeline and memories</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Dynamically compute highlights for the active workspace
  const galleryItems = JSON.parse(localStorage.getItem(`gallery_${activeWorkspace.id || activeWorkspace._id}`) || '[]');
  
  // 1. Trending Uploads (Based on Gallery Size)
  const totalPhotos = galleryItems.length;
  
  // 2. Top Contributor (Based on most uploads)
  const uploaderCounts = {};
  galleryItems.forEach(item => {
    if (item.uploader) {
      uploaderCounts[item.uploader] = (uploaderCounts[item.uploader] || 0) + 1;
    }
  });
  
  let topContributor = 'No Contributors Yet';
  let maxContributions = 0;
  for (const [uploader, count] of Object.entries(uploaderCounts)) {
    if (count > maxContributions) {
      maxContributions = count;
      topContributor = uploader;
    }
  }
  
  if (maxContributions === 0 && activeWorkspace.members && activeWorkspace.members.length > 0) {
    topContributor = activeWorkspace.members[0].name || activeWorkspace.members[0].email;
    maxContributions = 0;
  }

  // 3. Workspace Rating (Based on scoped memory reviews)
  const scopedReviews = memoryReviews.filter(rev => rev.space && rev.space.toLowerCase() === activeWorkspace.name.toLowerCase());
  const avgRating = scopedReviews.length > 0 
    ? (scopedReviews.reduce((sum, rev) => sum + rev.rating, 0) / scopedReviews.length).toFixed(1) 
    : 'No Rating';
  const ratingSub = scopedReviews.length > 0 ? `${avgRating}/5 Average` : 'No reviews yet';

  const dynamicHighlights = [
    { title: 'Trending Uploads', value: activeWorkspace.name, sub: `${totalPhotos} total photos`, icon: <TrendingUp color="#ef4444" size={28} />, color: '#fee2e2' },
    { title: 'Top Contributor', value: topContributor, sub: maxContributions > 0 ? `${maxContributions} uploads` : 'Joined workspace', icon: <Award color="#f59e0b" size={28} />, color: '#fef3c7' },
    { title: 'Workspace Rating', value: activeWorkspace.name, sub: ratingSub, icon: <Star color="#10b981" size={28} />, color: '#d1fae5' },
  ];

  const handleReaction = (id) => {
    setEvents(prev => prev.map(ev => {
      if (ev.id === id) {
        return {
          ...ev,
          reacted: !ev.reacted,
          reactions: ev.reacted ? ev.reactions - 1 : ev.reactions + 1
        };
      }
      return ev;
    }));
  };

  // Scope live events to active space
  const scopedEvents = events.filter(ev => ev.space && ev.space.toLowerCase() === activeWorkspace.name.toLowerCase());

  const filteredEvents = scopedEvents.filter(ev => 
    !searchQuery || 
    (ev.content && ev.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredReviews = scopedReviews.filter(rev => 
    !searchQuery || 
    rev.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="pulse-main-content">
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
        title="Return to Pulse Selection"
      >
        <LogOut size={24} />
      </motion.button>
      
      {/* HIGHLIGHTS DASHBOARD */}
      {!searchQuery && (
        <div className="pulse-highlights">
          {dynamicHighlights.map((h, i) => (
            <div className="highlight-card" key={i}>
              <div className="highlight-icon" style={{ backgroundColor: h.color }}>
                {h.icon}
              </div>
              <div className="highlight-info">
                <h4>{h.title}</h4>
                <p>{h.value}</p>
                <span>{h.sub}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* HEADER & TAB SWITCHER */}
      <div className="pulse-header">
        <div className="pulse-title">
          <h1>Workspace Docs & Pulse</h1>
          <p>Track workspace timeline logs, collaborative notes, files, and shared links.</p>
        </div>
        
        <div className="pulse-tabs">
          <button 
            className={`pulse-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            <Activity size={18} /> Live Timeline
          </button>
          <button 
            className={`pulse-tab-btn ${activeTab === 'files_docs' ? 'active' : ''}`}
            onClick={() => setActiveTab('files_docs')}
          >
            <Folder size={18} /> Files & Docs
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      {activeTab === 'timeline' ? (
        <motion.div 
          className="timeline-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {filteredEvents.length > 0 ? (
            filteredEvents.map((ev, index) => (
              <motion.div 
                className="timeline-item" 
                key={ev.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="timeline-dot"></div>
                
                {ev.type === 'activity' && (
                  <div className="timeline-card">
                    <div className="tl-header">
                      <div className="tl-user">
                        <img src={ev.avatar} alt={ev.user} />
                        <p><strong>{ev.user}</strong> {ev.action}</p>
                      </div>
                      <div className="tl-time">
                        <Clock size={14} /> {ev.time}
                      </div>
                    </div>
                    {ev.content && (
                      <div className="tl-content">
                        {ev.content}
                      </div>
                    )}
                    <div className="tl-interactions">
                      <button 
                        className={`tl-action ${ev.reacted ? 'reacted' : ''}`}
                        onClick={() => handleReaction(ev.id)}
                      >
                        <Heart size={16} fill={ev.reacted ? "#ef4444" : "none"} /> {ev.reactions}
                      </button>
                      <button className="tl-action">
                        <MessageCircle size={16} /> {ev.comments} Comments
                      </button>
                      <button className="tl-action" style={{marginLeft: 'auto'}}>
                        <Share2 size={16} /> Share
                      </button>
                    </div>
                  </div>
                )}

                {ev.type === 'milestone' && (
                  <div className="milestone-card">
                    <h2>{ev.title}</h2>
                    <p>{ev.desc}</p>
                    <div className="milestone-stats">
                      <span className="m-stat"><CheckCircle size={16} style={{display:'inline', verticalAlign:'middle', marginRight:'4px'}}/> {ev.stat1}</span>
                      <span className="m-stat"><Award size={16} style={{display:'inline', verticalAlign:'middle', marginRight:'4px'}}/> {ev.stat2}</span>
                    </div>
                  </div>
                )}

                {ev.type === 'bridge' && (
                  <div className="bridge-prompt">
                    <h3>{ev.title}</h3>
                    <p>{ev.desc}</p>
                    <button className="btn-primary" onClick={() => setActiveTab('files_docs')}>
                      <Folder size={16} /> View Workspace Files
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div style={{textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-gray)', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)'}}>
              <Activity size={48} style={{margin: '0 auto 1.5rem', opacity: 0.5, color: 'var(--accent-primary)'}} />
              <h3 style={{margin: '0 0 0.5rem', fontSize: '1.25rem', color: 'var(--text-dark)', fontWeight: 800}}>No Activity Logged Yet</h3>
              <p style={{margin: '0 auto', fontSize: '0.9rem', maxWidth: '340px', lineHeight: '1.5'}}>
                Real activities will appear here in real-time as tasks are completed, expenses are settled, and files are updated in the cockpit!
              </p>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div 
          className="files-docs-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}
        >
          {/* FILES & DOCS SUB-TABS */}
          <div style={{display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap'}}>
            <button 
              onClick={() => setFilesSubTab('docs')}
              style={{
                padding:'0.6rem 1.5rem', 
                borderRadius:'20px', 
                background: filesSubTab === 'docs' ? 'var(--accent-primary)' : 'var(--bg-card)', 
                color: filesSubTab === 'docs' ? 'white' : 'var(--text-gray)',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.2s ease',
                border: '1px solid var(--border-light)'
              }}
            >
              <FileText size={16} /> Workspace Notes
            </button>
            
            <button 
              onClick={() => setFilesSubTab('links')}
              style={{
                padding:'0.6rem 1.5rem', 
                borderRadius:'20px', 
                background: filesSubTab === 'links' ? 'var(--accent-primary)' : 'var(--bg-card)', 
                color: filesSubTab === 'links' ? 'white' : 'var(--text-gray)',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.2s ease',
                border: '1px solid var(--border-light)'
              }}
            >
              <LinkIcon size={16} /> Shared Links
            </button>
          </div>

          {/* FILES & DOCS CONTENT DISPLAY */}
          <div style={{marginTop: '1rem'}}>

            {filesSubTab === 'docs' && (
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'1.5rem', width:'100%'}}>
                {liveWorkspaceData && liveWorkspaceData.notes && liveWorkspaceData.notes.length > 0 ? liveWorkspaceData.notes.map((note, i) => {
                  const cleanDesc = note.content ? note.content.replace(/<[^>]*>/g, ' ').substring(0, 120) + '...' : 'No description available.';
                  return (
                    <div 
                      key={i} 
                      style={{
                        background: 'var(--bg-card)', 
                        borderRadius: '20px', 
                        padding: '1.5rem', 
                        border: '1px solid var(--border-light)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{display:'flex', gap:'0.75rem', alignItems:'center'}}>
                        <div style={{padding:'0.5rem', background:'rgba(16,185,129,0.1)', color:'var(--accent-primary)', borderRadius:'10px'}}>
                          <FileText size={18} />
                        </div>
                        <h4 style={{margin:0, fontSize:'1.1rem', fontWeight:800, color:'var(--text-dark)'}}>{note.title || 'Untitled Doc'}</h4>
                      </div>
                      <p style={{margin:0, fontSize:'0.9rem', color:'var(--text-gray)', lineHeight:'1.5', flex:1}}>{cleanDesc}</p>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid var(--border-light)', paddingTop:'0.75rem', fontSize:'0.75rem', color:'var(--text-gray)', fontWeight:700}}>
                        <span>Author: {note.author || 'Member'}</span>
                        <span>{note.date || 'Created recently'}</span>
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{gridColumn: '1/-1', textAlign:'center', padding:'3rem', color:'var(--text-gray)'}}>
                    <FileText size={40} style={{marginBottom:'1rem', opacity:0.5}} />
                    <h4>No Collaborative Docs Found</h4>
                    <p style={{fontSize:'0.9rem'}}>Create rich documents and outlines inside the workspace cockpit Notes tool!</p>
                  </div>
                )}
              </div>
            )}

            {filesSubTab === 'links' && (
              <div style={{display:'flex', flexDirection:'column', gap:'1rem', width:'100%'}}>
                {(() => {
                  const chatMessages = (liveWorkspaceData && liveWorkspaceData.chatMessages) || [];
                  const sharedLinks = [];
                  const urlRegex = /(https?:\/\/[^\s]+)/g;
                  chatMessages.forEach(msg => {
                    if (msg.text) {
                      const found = msg.text.match(urlRegex);
                      if (found) {
                        found.forEach(url => {
                          if (!sharedLinks.some(l => l.url === url)) {
                            sharedLinks.push({
                              url,
                              sender: msg.sender || 'Member',
                              time: msg.time || 'Shared recently',
                              avatar: msg.avatar || `https://ui-avatars.com/api/?name=${msg.sender || 'Member'}&background=random&color=fff`
                            });
                          }
                        });
                      }
                    }
                  });

                  if (sharedLinks.length > 0) {
                    return sharedLinks.map((link, idx) => (
                      <div 
                        key={idx} 
                        style={{
                          background: 'var(--bg-card)', 
                          borderRadius: '16px', 
                          padding: '1rem 1.25rem', 
                          border: '1px solid var(--border-light)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem'
                        }}
                      >
                        <div style={{display:'flex', alignItems:'center', gap:'1rem', overflow:'hidden', flex:1}}>
                          <div style={{padding:'0.6rem', background:'rgba(14,165,233,0.1)', color:'var(--primary-blue)', borderRadius:'12px'}}>
                            <LinkIcon size={18} />
                          </div>
                          <div style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1}}>
                            <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{
                                fontSize: '0.95rem', 
                                fontWeight: 700, 
                                color: 'var(--accent-primary)',
                                textDecoration: 'none'
                              }}
                            >
                              {link.url}
                            </a>
                            <p style={{margin:0, fontSize:'0.75rem', color:'var(--text-gray)', marginTop:'0.2rem'}}>
                              Shared by <strong>{link.sender}</strong> • {link.time}
                            </p>
                          </div>
                        </div>
                        
                        <div style={{display:'flex', alignItems:'center', gap:'0.75rem'}}>
                          <img 
                            src={link.avatar} 
                            alt={link.sender} 
                            style={{width:'28px', height:'28px', borderRadius:'50%'}} 
                          />
                        </div>
                      </div>
                    ));
                  }

                  return (
                    <div style={{textAlign:'center', padding:'3rem', color:'var(--text-gray)'}}>
                      <LinkIcon size={40} style={{marginBottom:'1rem', opacity:0.5}} />
                      <h4>No Shared Links Found</h4>
                      <p style={{fontSize:'0.9rem'}}>Any web links posted in workspace chat messages will automatically appear here!</p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </main>
  );
};

export default CommunityPulse;
