/**
 * useWorkspaceData.js
 * Manages workspace list loading, socket real-time sync, gallery,
 * tasks and expenses fetching.
 */
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

export const fallbackImages = [
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0',
  'https://images.unsplash.com/photo-1515169067868-5387ec356754'
];

export const TEMPLATES = [
  { name: 'College Fest 2026', desc: 'Pre-configured tasks & budget', cover: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87' },
  { name: 'Hackathon Squad', desc: 'Timeline & planning docs', cover: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d' },
  { name: 'Goa Trip 2026', desc: 'Gallery, expenses & map', cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e' },
  { name: 'Design Sprint', desc: 'Feedback loops & assets', cover: 'https://images.unsplash.com/photo-1522542550221-31fd19575a2d' }
];

export const getSpaceId = (ws) => {
  if (!ws) return '';
  const rawId = ws._id || ws.id;
  if (typeof rawId === 'object' && rawId !== null) return rawId.$oid || rawId.toString();
  return String(rawId || '');
};

export const useWorkspaceData = () => {
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  const [currentUser, setCurrentUser] = useState(() => {
    try { const s = localStorage.getItem('gatherly_user'); if (s) return JSON.parse(s); } catch(e) {}
    return { username: 'You', email: '' };
  });
  const [allWorkspaces, setAllWorkspaces] = useState(() => {
    try { const s = localStorage.getItem('gatherly_workspaces'); return s ? JSON.parse(s) : []; } catch(e) { return []; }
  });
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);
  const [workspaceTasks, setWorkspaceTasks] = useState([]);
  const [workspaceExpenses, setWorkspaceExpenses] = useState([]);
  const [workspaceGallery, setWorkspaceGallery] = useState([]);
  const [invites, setInvites] = useState([]);
  const [unreadChannels, setUnreadChannels] = useState({});
  const [chatToast, setChatToast] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [autoJoinCall, setAutoJoinCall] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  const activeToolRef = useRef('chat');
  const activeChannelRef = useRef('general');
  const socketRef = useRef(null);

  const saveWorkspaces = (newSpaces) => {
    setAllWorkspaces(newSpaces);
    try { localStorage.setItem('gatherly_workspaces', JSON.stringify(newSpaces)); } catch(e) {
      console.warn('LocalStorage quota exceeded!', e);
    }
  };

  const triggerMessageToast = (msg) => {
    setChatToast(msg);
    try { const a = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav'); a.volume = 0.4; a.play(); } catch(e) {}
    setTimeout(() => setChatToast(prev => (prev && prev._id === msg._id) ? null : prev), 4500);
  };

  const fetchFreshestWorkspace = (wsId) => {
    Promise.all([
      fetch(`http://localhost:5000/api/spaces/${wsId}?t=${Date.now()}`).then(r => r.ok ? r.json() : null),
      fetch(`http://localhost:5000/api/spaces/${wsId}/messages?limit=2000&t=${Date.now()}`).then(r => r.ok ? r.json() : [])
    ]).then(([freshSpace, messages]) => {
      if (!freshSpace) return;
      const incoming = Array.isArray(messages) ? messages : [];
      setSelectedWorkspace(prev => {
        const local = (prev && Array.isArray(prev.chatMessages)) ? prev.chatMessages : [];
        const byId = new Map(); incoming.forEach(m => m?._id && byId.set(String(m._id), m));
        const merged = [...incoming]; local.forEach(m => { if (!m) return; if (!m._id) merged.push(m); else if (!byId.has(String(m._id))) merged.push(m); });
        return { ...freshSpace, chatMessages: merged };
      });
      setAllWorkspaces(prev => {
        const idx = prev.findIndex(w => getSpaceId(w) === wsId);
        if (idx === -1) return prev;
        const updated = [...prev]; updated[idx] = { ...updated[idx], chatMessages: incoming.length > 0 ? incoming : updated[idx].chatMessages || [] };
        try { localStorage.setItem('gatherly_workspaces', JSON.stringify(updated)); } catch(e) {}
        return updated;
      });
      try {
        const cached = JSON.parse(localStorage.getItem('gatherly_active_workspace') || '{}') || {};
        localStorage.setItem('gatherly_active_workspace', JSON.stringify({ ...cached, ...freshSpace, chatMessages: incoming.length > 0 ? incoming : cached.chatMessages || [], aiMessages: freshSpace.aiMessages || cached.aiMessages || [], polls: freshSpace.polls || cached.polls || [], notes: freshSpace.notes || cached.notes || [], activities: freshSpace.activities || cached.activities || [] }));
        window.dispatchEvent(new Event('active_workspace_changed'));
      } catch(e) {}
    }).catch(() => {});
  };

  // Slideshow effect
  useEffect(() => {
    const timer = setInterval(() => setSlideIndex(p => (p + 1) % fallbackImages.length), 4000);
    return () => clearInterval(timer);
  }, []);

  // Load workspaces & user
  useEffect(() => {
    const loadData = async () => {
      try {
        const user = localStorage.getItem('gatherly_user');
        if (user) setCurrentUser(JSON.parse(user));
        let localSpaces = [];
        const saved = localStorage.getItem('gatherly_workspaces');
        if (saved) { localSpaces = JSON.parse(saved); setAllWorkspaces(localSpaces); }
        const parsedUser = user ? JSON.parse(user) : null;
        const uid = parsedUser?.email || parsedUser?.username;
        if (!uid) return;
        const res = await fetch(`http://localhost:5000/api/spaces/user/${encodeURIComponent(uid)}?t=${Date.now()}`);
        if (!res.ok) return;
        const fetchedSpaces = await res.json();
        const merged = [...fetchedSpaces];
        localSpaces.forEach(local => {
          if (!local) return;
          if (!fetchedSpaces.some(f => f && (getSpaceId(f) === getSpaceId(local) || (f.name && local.name && f.name.toLowerCase().trim() === local.name.toLowerCase().trim())))) merged.push(local);
        });
        setAllWorkspaces(merged);
        try { localStorage.setItem('gatherly_workspaces', JSON.stringify(merged)); } catch(e) {}
        if (user) {
          const pu = JSON.parse(user);
          setInvites(merged.filter(ws => ws?.pendingMembers?.some(m => m?.email === pu.email)).map(ws => ({ id: ws._id || ws.id, from: ws.members?.[0]?.name || 'Someone', team: ws.name, cover: ws.cover || fallbackImages[0] })));
        }
        setSelectedWorkspace(prev => {
          if (!prev) return prev;
          const prevId = getSpaceId(prev);
          const fb = fetchedSpaces.find(w => getSpaceId(w) === prevId) || merged.find(w => getSpaceId(w) === prevId);
          return fb ? { ...fb, chatMessages: prev.chatMessages || [], aiMessages: fb.aiMessages || prev.aiMessages || [], polls: fb.polls || prev.polls || [], notes: fb.notes || prev.notes || [], activities: fb.activities || prev.activities || [] } : prev;
        });
      } catch(e) {
        console.error('Failed to fetch workspaces', e);
        const saved = localStorage.getItem('gatherly_workspaces');
        if (saved) setAllWorkspaces(JSON.parse(saved));
      }
    };
    loadData();
    const onStorage = (e) => { if (e.key === 'gatherly_workspaces' || e.key === 'gatherly_user') loadData(); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Polling refresh when a workspaceId is in the URL
  useEffect(() => {
    if (!workspaceId) return;
    const fetchLatest = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/spaces/${workspaceId}?t=${Date.now()}`);
        if (!res.ok) return;
        const fresh = await res.json();
        setSelectedWorkspace(prev => prev ? { ...prev, members: fresh.members || prev.members, channels: fresh.channels || prev.channels, name: fresh.name || prev.name, activities: fresh.activities || prev.activities } : fresh);
        try { const c = JSON.parse(localStorage.getItem('gatherly_active_workspace') || '{}') || {}; localStorage.setItem('gatherly_active_workspace', JSON.stringify({ ...c, ...fresh, chatMessages: c.chatMessages || [], aiMessages: fresh.aiMessages || c.aiMessages || [], polls: fresh.polls || c.polls || [], notes: fresh.notes || c.notes || [], activities: fresh.activities || c.activities || [] })); } catch(e) {}
      } catch(e) { console.error('Failed to fetch latest workspace:', e); } finally { setIsLoadingWorkspace(false); }
    };
    setIsLoadingWorkspace(true); fetchLatest();
    const d = setTimeout(fetchLatest, 1000);
    const iv = setInterval(fetchLatest, 15000);
    return () => { clearTimeout(d); clearInterval(iv); };
  }, [workspaceId]);

  // Tasks & expenses & gallery when workspace is selected
  useEffect(() => {
    if (!selectedWorkspace) return;
    const wId = getSpaceId(selectedWorkspace);
    fetch(`http://localhost:5000/api/tasks/workspace/${wId}?t=${Date.now()}`).then(r => r.json()).then(d => { if (!d.error) setWorkspaceTasks(d); }).catch(console.error);
    fetch(`http://localhost:5000/api/expenses/workspace/${wId}?t=${Date.now()}`).then(r => r.json()).then(d => { if (!d.error) setWorkspaceExpenses(d); }).catch(console.error);
    fetch(`http://localhost:5000/api/gallery/workspace/${wId}?t=${Date.now()}`).then(r => r.ok ? r.json() : []).then(d => setWorkspaceGallery(Array.isArray(d) ? d : [])).catch(() => {
      try { setWorkspaceGallery(JSON.parse(localStorage.getItem(`gallery_${wId}`) || '[]')); } catch(e) { setWorkspaceGallery([]); }
    });
  }, [selectedWorkspace?._id]);

  // Resolve workspaceId from URL
  useEffect(() => {
    if (!workspaceId) return;
    let currentAll = allWorkspaces;
    try { const s = localStorage.getItem('gatherly_workspaces'); if (s) { currentAll = JSON.parse(s); setAllWorkspaces(currentAll); } } catch(e) {}

    let resolvedName = '';
    try { const c = localStorage.getItem('gatherly_active_workspace'); if (c) { const p = JSON.parse(c); if (getSpaceId(p) === String(workspaceId)) resolvedName = p.name; } } catch(e) {}

    const targetName = resolvedName || String(workspaceId);
    const dbMatch = currentAll.find(w => w?._id && w.name && (w.name.toLowerCase().trim() === targetName.toLowerCase().trim() || w.inviteCode === targetName));
    if (dbMatch && getSpaceId(dbMatch) !== String(workspaceId)) { navigate(`/workspace/${getSpaceId(dbMatch)}`, { replace: true }); return; }

    const mergeMessages = (base, extra) => {
      const byId = new Map(); base.forEach(m => m?._id && byId.set(String(m._id), m));
      const merged = [...base]; extra.forEach(m => { if (!m) return; if (!m._id) merged.push(m); else if (!byId.has(String(m._id))) merged.push(m); });
      return merged;
    };

    const found = currentAll.find(w => getSpaceId(w) === String(workspaceId));
    if (found) {
      setSelectedWorkspace(prev => {
        const local = (prev && Array.isArray(prev.chatMessages)) ? prev.chatMessages : (JSON.parse(localStorage.getItem('gatherly_active_workspace') || 'null')?.chatMessages || []);
        const merged = mergeMessages(Array.isArray(found.chatMessages) ? found.chatMessages : [], local);
        try { localStorage.setItem('gatherly_active_workspace', JSON.stringify({ ...found, chatMessages: merged })); } catch(e) {}
        window.dispatchEvent(new Event('active_workspace_changed'));
        setIsLoadingWorkspace(false);
        return { ...found, chatMessages: merged };
      });
      fetchFreshestWorkspace(String(workspaceId)); return;
    }

    try {
      const cached = localStorage.getItem('gatherly_active_workspace');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (getSpaceId(parsed) === String(workspaceId)) {
          setSelectedWorkspace(prev => {
            const local = (prev && Array.isArray(prev.chatMessages)) ? prev.chatMessages : (parsed.chatMessages || []);
            const merged = mergeMessages(Array.isArray(parsed.chatMessages) ? parsed.chatMessages : [], local);
            try { localStorage.setItem('gatherly_active_workspace', JSON.stringify({ ...parsed, chatMessages: merged })); } catch(e) {}
            window.dispatchEvent(new Event('active_workspace_changed')); setIsLoadingWorkspace(false);
            return { ...parsed, chatMessages: merged };
          });
          fetchFreshestWorkspace(String(workspaceId)); return;
        }
      }
    } catch(e) {}

    setIsLoadingWorkspace(true);
    Promise.all([
      fetch(`http://localhost:5000/api/spaces/${workspaceId}?t=${Date.now()}`).then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); }),
      fetch(`http://localhost:5000/api/spaces/${workspaceId}/messages?limit=2000&t=${Date.now()}`).then(r => r.ok ? r.json() : [])
    ]).then(([space, messages]) => {
      const dbId = getSpaceId(space);
      if (dbId && dbId !== String(workspaceId)) { navigate(`/workspace/${dbId}`, { replace: true }); return; }
      const incoming = Array.isArray(messages) ? messages : [];
      setSelectedWorkspace(prev => {
        const local = (prev && Array.isArray(prev.chatMessages)) ? prev.chatMessages : [];
        const byId = new Map(); incoming.forEach(m => m?._id && byId.set(String(m._id), m));
        const merged = [...incoming]; local.forEach(m => { if (!m) return; if (!m._id) merged.push(m); else if (!byId.has(String(m._id))) merged.push(m); });
        return { ...space, chatMessages: merged };
      });
      setIsLoadingWorkspace(false);
      setAllWorkspaces(prev => {
        if (prev.some(w => getSpaceId(w) === getSpaceId(space))) return prev;
        const updated = [{ ...space, chatMessages: incoming.length > 0 ? incoming : [] }, ...prev];
        try { localStorage.setItem('gatherly_workspaces', JSON.stringify(updated)); } catch(e) {}
        return updated;
      });
      try {
        const withChats = { ...space, chatMessages: incoming };
        localStorage.setItem('gatherly_active_workspace', JSON.stringify(withChats));
        window.dispatchEvent(new Event('active_workspace_changed'));
      } catch(e) {}
    }).catch(err => { console.error('Could not resolve workspace:', err); setIsLoadingWorkspace(false); });
  }, [workspaceId, allWorkspaces.length]);

  // Socket.io real-time sync
  useEffect(() => {
    if (!selectedWorkspace) return;
    const wId = getSpaceId(selectedWorkspace);
    const socket = io('http://localhost:5000');
    socketRef.current = socket;
    socket.emit('join_workspace', wId);

    socket.on('task_created', t => setWorkspaceTasks(p => p.find(x => x._id === t._id) ? p : [t, ...p]));
    socket.on('task_updated', t => setWorkspaceTasks(p => p.map(x => x._id === t._id ? t : x)));
    socket.on('task_deleted', id => setWorkspaceTasks(p => p.filter(x => x._id !== id)));
    socket.on('expense_created', e => setWorkspaceExpenses(p => p.find(x => x._id === e._id) ? p : [e, ...p]));
    socket.on('expense_deleted', id => setWorkspaceExpenses(p => p.filter(x => x._id !== id)));
    socket.on('gallery_item_added', item => setWorkspaceGallery(p => [item, ...p]));
    socket.on('gallery_item_updated', item => setWorkspaceGallery(p => p.map(g => g._id === item._id ? item : g)));
    socket.on('gallery_item_deleted', id => setWorkspaceGallery(p => p.filter(g => g._id !== id)));
    socket.on('polls_updated', polls => setSelectedWorkspace(p => p ? { ...p, polls } : p));
    socket.on('notes_updated', notes => setSelectedWorkspace(p => p ? { ...p, notes } : p));
    socket.on('activity_logged', act => setSelectedWorkspace(p => {
      if (!p) return p;
      const acts = p.activities || []; if (acts.find(a => a.id === act.id)) return p;
      return { ...p, activities: [act, ...acts].slice(0, 50) };
    }));
    socket.on('member_joined', data => setSelectedWorkspace(p => {
      if (!p || getSpaceId(p) !== data.workspaceId) return p;
      const existing = p.members || [];
      if (existing.some(m => (typeof m === 'object' ? m.email : m) === data.member?.email)) return p;
      return { ...p, members: [...existing, data.member] };
    }));
    socket.on('workspace_data_updated', upd => setSelectedWorkspace(p => (!p || getSpaceId(p) !== getSpaceId(upd)) ? p : { ...p, ...upd }));
    socket.on('new_chat_message', msg => {
      setSelectedWorkspace(prev => {
        if (!prev) return prev;
        const messages = prev.chatMessages || [];
        if (messages.some(m => m._id === msg._id)) return prev;
        const optIdx = messages.findIndex(m => !m._id && m.sender === msg.sender && m.text === msg.text && (m.channel || 'general') === (msg.channel || 'general'));
        let updatedMsgs;
        if (optIdx !== -1) { updatedMsgs = [...messages]; updatedMsgs[optIdx] = msg; }
        else {
          updatedMsgs = [...messages, msg];
          const pubChans = prev.channels || ['general', 'plans & ideas', 'stay & booking', 'activities', 'food', 'travel-info'];
          const isPublic = pubChans.includes(msg.channel || 'general');
          const ch = isPublic ? (msg.channel || 'general') : msg.sender;
          const isViewing = activeToolRef.current === 'chat' && (isPublic ? activeChannelRef.current?.toLowerCase() === (msg.channel || 'general').toLowerCase() : activeChannelRef.current?.toLowerCase() === (msg.sender || '').toLowerCase());
          if (!isViewing) { setUnreadChannels(p => ({ ...p, [ch]: (p[ch] || 0) + 1 })); triggerMessageToast(msg); }
        }
        const updated = { ...prev, chatMessages: updatedMsgs };
        try { localStorage.setItem('gatherly_active_workspace', JSON.stringify(updated)); } catch(e) {}
        return updated;
      });
    });
    socket.on('incoming_call', data => {
      setIncomingCall(data);
      try { const a = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav'); a.volume = 0.6; a.play().catch(() => {}); } catch(e) {}
    });
    socket.on('call_ended', () => { setIncomingCall(null); setAutoJoinCall(false); });

    return () => { socket.emit('leave_workspace', wId); socket.disconnect(); socketRef.current = null; };
  }, [getSpaceId(selectedWorkspace)]);

  // Hash nav (#create, #join)
  useEffect(() => {
    if (window.location.hash === '#create') { window.history.replaceState(null, '', window.location.pathname); }
    else if (window.location.hash === '#join') { window.history.replaceState(null, '', window.location.pathname); }
  }, []);

  return {
    navigate, workspaceId, currentUser, setCurrentUser,
    allWorkspaces, setAllWorkspaces, saveWorkspaces,
    selectedWorkspace, setSelectedWorkspace, isLoadingWorkspace,
    workspaceTasks, setWorkspaceTasks,
    workspaceExpenses, setWorkspaceExpenses,
    workspaceGallery, setWorkspaceGallery,
    invites, setInvites, slideIndex,
    unreadChannels, setUnreadChannels,
    chatToast, setChatToast,
    incomingCall, setIncomingCall,
    autoJoinCall, setAutoJoinCall,
    socketRef, activeToolRef, activeChannelRef,
    fetchFreshestWorkspace
  };
};
