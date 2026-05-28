import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, MessageSquare, Image as ImageIcon, DollarSign,
  CheckSquare, Bell, Calendar, MapPinned, ClipboardList,
  Send, Search, Plus, ArrowLeft, ShieldCheck, Activity,
  Sparkles, Layers, Rocket, CheckCircle, Link as LinkIcon,
  LayoutTemplate, X, Edit3, Share2, UploadCloud, ChevronRight,
  List, Folder, Sparkle, Clock, Lock, ArrowRight, Wand2, Star,
  BarChart2, FileText, Map as MapIcon, Brain, MessageCircle, Camera, Smile, Paperclip, Mic, LogOut, Video, PhoneOff
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import './WorkspacePage.css';
import VideoCall from './VideoCall';
import RichNotesEditor from './RichNotesEditor';
import WorkspaceFusion from './WorkspaceFusion';

const TEMPLATES = [
  { name: 'College Fest 2026', desc: 'Pre-configured tasks & budget', cover: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87' },
  { name: 'Hackathon Squad', desc: 'Timeline & planning docs', cover: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d' },
  { name: 'Goa Trip 2026', desc: 'Gallery, expenses & map', cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e' },
  { name: 'Design Sprint', desc: 'Feedback loops & assets', cover: 'https://images.unsplash.com/photo-1522542550221-31fd19575a2d' }
];

const WorkspacePage = () => {
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('gatherly_user');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return { username: 'You', email: '' };
  });
  const [allWorkspaces, setAllWorkspaces] = useState(() => {
    try {
      const saved = localStorage.getItem('gatherly_workspaces');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showEditCoverModal, setShowEditCoverModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreatePollModal, setShowCreatePollModal] = useState(false);
  
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [joinCode, setJoinCode] = useState('');
  
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  const [selectedWorkspace, setSelectedWorkspace] = useState(null);

  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);

  const getSpaceId = (ws) => {
    if (!ws) return '';
    const rawId = ws._id || ws.id;
    if (typeof rawId === 'object' && rawId !== null) {
      return rawId.$oid || rawId.toString();
    }
    return String(rawId || '');
  };
  const resolveMemberInfo = (m) => {
    if (!m) return { name: '', email: '', isMe: false };
    
    let name = '';
    let email = '';
    
    if (typeof m === 'object') {
      name = m.name || m.email || '';
      email = m.email || '';
    } else {
      name = String(m);
      email = String(m);
    }
    
    const curUser = currentUser?.username || '';
    const curEmail = currentUser?.email || '';
    
    const isMe = (name && curUser && name.toLowerCase().trim() === curUser.toLowerCase().trim()) ||
                 (email && curEmail && email.toLowerCase().trim() === curEmail.toLowerCase().trim());
                 
    return { name, email, isMe };
  };


  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const heroSlideImages = React.useMemo(() => {
    const base = selectedWorkspace?.cover || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c';
    return [
      base,
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80'
    ];
  }, [selectedWorkspace?.cover]);

  useEffect(() => {
    if (!selectedWorkspace) return;
    const timer = setInterval(() => {
      setCurrentHeroIndex(prev => (prev + 1) % heroSlideImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [selectedWorkspace, heroSlideImages.length]);

  const [invites, setInvites] = useState([
    { id: 'inv1', from: 'Sarah Wilson', team: 'Marketing Team', cover: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c' }
  ]);

  // Planning Tools State
  const [activeTool, setActiveTool] = useState('chat');
  const [showWorkspaceTools, setShowWorkspaceTools] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [activeChannel, setActiveChannel] = useState('general');
  const [noteContent, setNoteContent] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [aiInput, setAiInput] = useState('');
  // Tracks which AI-extracted messages have already been converted to tasks
  const [extractedAiMessages, setExtractedAiMessages] = useState({});
  const [unreadChannels, setUnreadChannels] = useState({});
  const [chatToast, setChatToast] = useState(null);
  // ── Video Call real-time state ──────────────────────────────────────────────
  const [incomingCall, setIncomingCall] = useState(null); // { callerName, callerAvatar, workspaceName }
  const [autoJoinCall, setAutoJoinCall] = useState(false); // triggers VideoCall to auto-join on mount
  
  const activeToolRef = useRef(activeTool);
  const activeChannelRef = useRef(activeChannel);
  const socketRef = useRef(null);
  const currentUserRef = useRef(currentUser);

  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  useEffect(() => {
    activeChannelRef.current = activeChannel;
  }, [activeChannel]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const getFilteredMessages = () => {
    if (!selectedWorkspace || !selectedWorkspace.chatMessages) return [];
    
    const publicChannels = selectedWorkspace.channels || ['general', 'plans & ideas', 'stay & booking', 'activities', 'food', 'travel-info'];
    const isPublic = publicChannels.includes(activeChannel);
    
    if (isPublic) {
      return selectedWorkspace.chatMessages.filter(m => {
        const msgChan = m.channel || 'general';
        return msgChan.toLowerCase().trim() === activeChannel.toLowerCase().trim();
      });
    }
    
    // For DMs: activeChannel is the username/email of the other user.
    const curName = (currentUser?.username || '').toLowerCase().trim();
    const curEmail = (currentUser?.email || '').toLowerCase().trim();
    const target = activeChannel.toLowerCase().trim();
    
    return selectedWorkspace.chatMessages.filter(m => {
      const msgChan = m.channel || 'general';
      if (publicChannels.includes(msgChan)) return false;
      
      const mSender = (m.sender || '').toLowerCase().trim();
      const mChan = msgChan.toLowerCase().trim();
      
      // Match if (sender is me and channel is target) OR (sender is target and channel is me)
      const matchMeToTarget = (mSender === curName || mSender === curEmail) && (mChan === target);
      const matchTargetToMe = (mSender === target) && (mChan === curName || mChan === curEmail);
      
      return matchMeToTarget || matchTargetToMe;
    });
  };

  const triggerMessageToast = (msg) => {
    setChatToast(msg);
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
    audio.volume = 0.4;
    try {
      audio.play();
    } catch(e) {}
    setTimeout(() => {
      setChatToast(prev => (prev && prev._id === msg._id) ? null : prev);
    }, 4500);
  };

  const [workspaceTasks, setWorkspaceTasks] = useState([]);
  const [workspaceExpenses, setWorkspaceExpenses] = useState([]);
  const [workspaceGallery, setWorkspaceGallery] = useState([]);
  const [mapQuery, setMapQuery] = useState('');
  const [mapSearchInput, setMapSearchInput] = useState('');
  
  useEffect(() => {
    if (selectedWorkspace) {
      const wId = selectedWorkspace._id || selectedWorkspace.id;
      
      // Fetch Gallery from LocalStorage
      const savedGallery = JSON.parse(localStorage.getItem(`gallery_${wId}`)) || [];
      setWorkspaceGallery(savedGallery);

      // Fetch Tasks
      fetch(`http://localhost:5000/api/tasks/workspace/${selectedWorkspace._id || selectedWorkspace.id}?t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) setWorkspaceTasks(data);
        })
        .catch(console.error);
        
      // Fetch Expenses
      fetch(`http://localhost:5000/api/expenses/workspace/${selectedWorkspace._id || selectedWorkspace.id}?t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) setWorkspaceExpenses(data);
        })
        .catch(console.error);

      // ── FRESH MEMBERS FETCH on every chat modal open ───────────────────────
      // This guarantees all users always see the latest member list
      if (wId && (String(wId).length === 24 || String(wId).includes('-') === false)) {
        fetch(`http://localhost:5000/api/spaces/${wId}?t=${Date.now()}`)
          .then(res => res.ok ? res.json() : null)
          .then(freshWs => {
            if (freshWs && Array.isArray(freshWs.members)) {
              setSelectedWorkspace(prev => prev ? { ...prev, members: freshWs.members } : prev);
            }
          })
          .catch(() => {});
      }
    }
  }, [selectedWorkspace?._id, showWorkspaceTools, activeTool]);

  // Fetch gallery from DB (shared across all members)
  useEffect(() => {
    if (!selectedWorkspace) return;
    const wId = getSpaceId(selectedWorkspace);
    fetch(`http://localhost:5000/api/gallery/workspace/${wId}?t=${Date.now()}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setWorkspaceGallery(Array.isArray(data) ? data : []))
      .catch(() => {
        // Fallback to localStorage on network error
        try {
          const saved = JSON.parse(localStorage.getItem(`gallery_${wId}`) || '[]');
          setWorkspaceGallery(saved);
        } catch (e) { setWorkspaceGallery([]); }
      });
  }, [selectedWorkspace?._id]);


  useEffect(() => {
    if (!selectedWorkspace) return;

    const wId = getSpaceId(selectedWorkspace);
    const socket = io('http://localhost:5000');
    socketRef.current = socket;

    socket.emit('join_workspace', wId);

    // ── Tasks ──────────────────────────────────────────────────────────
    socket.on('task_created', (newTask) => {
      setWorkspaceTasks(prev => prev.find(t => t._id === newTask._id) ? prev : [newTask, ...prev]);
    });
    socket.on('task_updated', (updatedTask) => {
      setWorkspaceTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
    });
    socket.on('task_deleted', (taskId) => {
      setWorkspaceTasks(prev => prev.filter(t => t._id !== taskId));
    });

    // ── Expenses ───────────────────────────────────────────────────────
    socket.on('expense_created', (newExpense) => {
      setWorkspaceExpenses(prev => prev.find(e => e._id === newExpense._id) ? prev : [newExpense, ...prev]);
    });
    socket.on('expense_deleted', (expenseId) => {
      setWorkspaceExpenses(prev => prev.filter(e => e._id !== expenseId));
    });

    // ── Chat Messages ────────────────────────────────────────────────
    socket.on('new_chat_message', (msg) => {
      setSelectedWorkspace(prev => {
        if (!prev) return prev;
        const messages = prev.chatMessages || [];
        
        // 1. Check if the message is already present by database _id
        const alreadyIn = messages.some(m => m._id === msg._id);
        if (alreadyIn) return prev;
        
        // 2. Check if this is a broadcast of our own optimistic message (same text and sender)
        const optMsgIndex = messages.findIndex(m => 
          !m._id && 
          m.sender === msg.sender && 
          m.text === msg.text && 
          (m.channel || 'general') === (msg.channel || 'general')
        );
        
        let updatedMessages;
        if (optMsgIndex !== -1) {
          // Replace the optimistic message with the real persisted one from the DB
          updatedMessages = [...messages];
          updatedMessages[optMsgIndex] = msg;
        } else {
          // Add as a new message
          updatedMessages = [...messages, msg];
          
          // Trigger a beautiful live notification toast / dot if the user is NOT currently on the Chat tool!
          const publicChannels = prev.channels || ['general', 'plans & ideas', 'stay & booking', 'activities', 'food', 'travel-info'];
          const isPublic = publicChannels.includes(msg.channel || 'general');
          
          // If public, unread is for the channel name. If DM, unread is for the sender name.
          const ch = isPublic ? (msg.channel || 'general') : msg.sender;
          
          const msgChanLower = (msg.channel || 'general').toLowerCase().trim();
          const msgSenderLower = (msg.sender || '').toLowerCase().trim();
          
          const isViewingThis = activeToolRef.current === 'chat' && (
            isPublic 
              ? activeChannelRef.current?.toLowerCase() === msgChanLower
              : (activeChannelRef.current?.toLowerCase() === msgSenderLower)
          );
          
          if (!isViewingThis) {
             setUnreadChannels(p => ({ ...p, [ch]: (p[ch] || 0) + 1 }));
             triggerMessageToast(msg);
          }
        }
        
        const updatedWorkspace = { ...prev, chatMessages: updatedMessages };
        try { localStorage.setItem('gatherly_active_workspace', JSON.stringify(updatedWorkspace)); } catch(e) {}
        return updatedWorkspace;
      });
    });

    // ── Polls ────────────────────────────────────────────────────────────
    socket.on('polls_updated', (polls) => {
      setSelectedWorkspace(prev => prev ? { ...prev, polls } : prev);
    });

    // ── Notes ────────────────────────────────────────────────────────────
    socket.on('notes_updated', (notes) => {
      setSelectedWorkspace(prev => prev ? { ...prev, notes } : prev);
    });

    // ── Gallery ──────────────────────────────────────────────────────────
    socket.on('gallery_item_added', (item) => {
      setWorkspaceGallery(prev => [item, ...prev]);
    });
    socket.on('gallery_item_updated', (item) => {
      setWorkspaceGallery(prev => prev.map(g => g._id === item._id ? item : g));
    });
    socket.on('gallery_item_deleted', (itemId) => {
      setWorkspaceGallery(prev => prev.filter(g => g._id !== itemId));
    });

    // ── Activity feed ──────────────────────────────────────────────────
    socket.on('activity_logged', (activity) => {
      setSelectedWorkspace(prev => {
        if (!prev) return prev;
        const currentActs = prev.activities || [];
        const exists = currentActs.find(a => a.id === activity.id);
        if (exists) return prev;
        return { ...prev, activities: [activity, ...currentActs].slice(0, 50) };
      });
    });

    // ── Member join ────────────────────────────────────────────────────
    socket.on('member_joined', (data) => {
      setSelectedWorkspace(prev => {
        if (!prev || getSpaceId(prev) !== data.workspaceId) return prev;
        const existingMembers = prev.members || [];
        const alreadyIn = existingMembers.some(m =>
          (typeof m === 'object' ? m.email : m) === data.member?.email
        );
        if (alreadyIn) return prev;
        return { ...prev, members: [...existingMembers, data.member] };
      });
    });

    // ── Full workspace update broadcast ─────────────────────────────────
    socket.on('workspace_data_updated', (updatedSpace) => {
      setSelectedWorkspace(prev => {
        if (!prev || getSpaceId(prev) !== getSpaceId(updatedSpace)) return prev;
        return { ...prev, ...updatedSpace };
      });
    });

    // ── Incoming Video Call notification ─────────────────────────────────
    socket.on('incoming_call', (data) => {
      // Only show notification if we are not already in the call
      setIncomingCall(data);
      // Play a ringtone sound
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
        audio.volume = 0.6;
        audio.play().catch(() => {});
      } catch(e) {}
    });

    // ── Call ended by host — dismiss notification if still pending ────────
    socket.on('call_ended', () => {
      setIncomingCall(null);
      setAutoJoinCall(false);
    });

    return () => {
      socket.emit('leave_workspace', wId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [getSpaceId(selectedWorkspace)]);
  
  const fileInputRef = React.useRef(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Slideshow logic for broken covers
  const [slideIndex, setSlideIndex] = useState(0);
  const fallbackImages = [
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0',
    'https://images.unsplash.com/photo-1515169067868-5387ec356754'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % fallbackImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [fallbackImages.length]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = localStorage.getItem('gatherly_user');
        if (user) setCurrentUser(JSON.parse(user));
        
        let localSpaces = [];
        const saved = localStorage.getItem('gatherly_workspaces');
        if (saved) {
          localSpaces = JSON.parse(saved);
          setAllWorkspaces(localSpaces);
        }

        // Fetch only THIS user's workspaces from backend
        const parsedUser = user ? JSON.parse(user) : null;
        const userIdentifier = parsedUser?.email || parsedUser?.username;
        if (!userIdentifier) return;
        const res = await fetch(`http://localhost:5000/api/spaces/user/${encodeURIComponent(userIdentifier)}?t=${Date.now()}`);

        if (res.ok) {
          const fetchedSpaces = await res.json();
          
          // Merge local-only workspaces (unsynced) to prevent them from being wiped out
          const mergedSpaces = [...fetchedSpaces];
          localSpaces.forEach(local => {
            if (!local) return;
            const exists = fetchedSpaces.some(fetched => 
              fetched && (
                getSpaceId(fetched) === getSpaceId(local) ||
                (fetched.name && local.name && fetched.name.toLowerCase().trim() === local.name.toLowerCase().trim())
              )
            );
            if (!exists) {
              mergedSpaces.push(local);
            }
          });
          
          setAllWorkspaces(mergedSpaces);
          try {
            localStorage.setItem('gatherly_workspaces', JSON.stringify(mergedSpaces));
          } catch (e) {
            console.warn('Quota exceeded on saving workspaces cache', e);
          }
          
          if (user) {
            const parsedUser = JSON.parse(user);
            const userInvites = mergedSpaces
              .filter(ws => ws && ws.pendingMembers && Array.isArray(ws.pendingMembers) && ws.pendingMembers.some(m => m && m.email === parsedUser.email))
              .map(ws => ({
                id: ws._id || ws.id,
                from: (ws.members && Array.isArray(ws.members) && ws.members[0]?.name) ? ws.members[0].name : 'Someone',
                team: ws.name,
                cover: ws.cover || fallbackImages[0]
              }));
            setInvites(userInvites);
          }
          
          setSelectedWorkspace(prev => {
            if (!prev) return prev;
            // CRITICAL: Always prefer the BACKEND-fetched version (fetchedSpaces)
            // over the localStorage merged version, to avoid stale member lists.
            const prevId = getSpaceId(prev);
            const fromBackend = fetchedSpaces.find(w => getSpaceId(w) === prevId);
            if (fromBackend) {
              return {
                ...fromBackend,
                chatMessages: prev.chatMessages || [],
                aiMessages: fromBackend.aiMessages || prev.aiMessages || [],
                polls: fromBackend.polls || prev.polls || [],
                notes: fromBackend.notes || prev.notes || [],
                activities: fromBackend.activities || prev.activities || []
              };
            }
            const fromMerged = mergedSpaces.find(w => getSpaceId(w) === prevId);
            if (fromMerged) {
              return {
                ...fromMerged,
                chatMessages: prev.chatMessages || [],
                aiMessages: fromMerged.aiMessages || prev.aiMessages || [],
                polls: fromMerged.polls || prev.polls || [],
                notes: fromMerged.notes || prev.notes || [],
                activities: fromMerged.activities || prev.activities || []
              };
            }
            return prev;
          });
        }
      } catch (e) {
        console.error('Failed to fetch workspaces from DB', e);
        const saved = localStorage.getItem('gatherly_workspaces');
        if (saved) setAllWorkspaces(JSON.parse(saved));
      }
    };

    loadData();

    // Listen for cross-tab local storage changes for real-time multiplayer feel!
    const handleStorageChange = (e) => {
      if (e.key === 'gatherly_workspaces' || e.key === 'gatherly_user') {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // ── CRITICAL FIX: Always fetch the LATEST workspace data by ID ──────────────
  // This ensures ALL members see the up-to-date member list, regardless of
  // their localStorage cache (which may be stale from before others joined).
  useEffect(() => {
    if (!workspaceId) return;

    const fetchLatestWorkspace = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/spaces/${workspaceId}?t=${Date.now()}`);
        if (res.ok) {
          const freshWorkspace = await res.json();
          // ONLY update the members array (and a few key fields)
          // to avoid race conditions with loadData overwriting chat state
          setSelectedWorkspace(prev => {
            if (!prev) return freshWorkspace;
            return {
              ...prev,
              members: freshWorkspace.members || prev.members,
              channels: freshWorkspace.channels || prev.channels,
              name: freshWorkspace.name || prev.name,
              activities: freshWorkspace.activities || prev.activities,
            };
          });
          // Also update the cache with the fresh data (preserving chat messages and other locally populated properties)
          try {
            const cached = JSON.parse(localStorage.getItem('gatherly_active_workspace') || '{}') || {};
            localStorage.setItem('gatherly_active_workspace', JSON.stringify({
              ...cached,
              ...freshWorkspace,
              chatMessages: cached.chatMessages || [],
              aiMessages: freshWorkspace.aiMessages || cached.aiMessages || [],
              polls: freshWorkspace.polls || cached.polls || [],
              notes: freshWorkspace.notes || cached.notes || [],
              activities: freshWorkspace.activities || cached.activities || []
            }));
          } catch (e) {}
        }
      } catch (e) {
        console.error('[WorkspacePage] Failed to fetch latest workspace:', e);
      } finally {
        setIsLoadingWorkspace(false);
      }
    };

    // Show spinner on first load
    setIsLoadingWorkspace(true);
    // Fetch immediately on load
    fetchLatestWorkspace();
    // Also fetch after 1 second to guarantee it runs AFTER loadData completes
    const delayedFetch = setTimeout(fetchLatestWorkspace, 1000);
    // Then refresh every 15 seconds so member list stays live for all users
    const interval = setInterval(fetchLatestWorkspace, 15000);
    return () => {
      clearTimeout(delayedFetch);
      clearInterval(interval);
    };
  }, [workspaceId]);

  const saveWorkspaces = (newSpaces) => {
    setAllWorkspaces(newSpaces);
    try {
      localStorage.setItem('gatherly_workspaces', JSON.stringify(newSpaces));
    } catch (e) {
      console.warn('LocalStorage quota exceeded! Workspace cached in memory state only.', e);
    }
  };

  const updateWorkspaceData = async (key, value) => {
    if (!selectedWorkspace) return;
    
    // Save to backend immediately using closure's ID
    const spaceId = getSpaceId(selectedWorkspace);
    try {
      await fetch(`http://localhost:5000/api/spaces/${spaceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      });
    } catch (e) {
      console.error('Failed to sync to DB', e);
    }

    // Functionally update local state to avoid race conditions
    setSelectedWorkspace(prev => {
      if (!prev) return prev;
      const updated = { ...prev, [key]: value };
      
      // Update allWorkspaces array
      setAllWorkspaces(prevAll => {
        const updatedAll = prevAll.map(w => getSpaceId(w) === getSpaceId(updated) ? updated : w);
        try {
          localStorage.setItem('gatherly_workspaces', JSON.stringify(updatedAll));
        } catch (e) {
          console.warn('Quota exceeded on saving updated workspaces list', e);
        }
        return updatedAll;
      });
      
      return updated;
    });
  };

  const logActivity = async (actionText) => {
    if (!selectedWorkspace || !currentUser) return;
    const spaceId = getSpaceId(selectedWorkspace);
    const newAct = {
      id: Date.now().toString(),
      user: currentUser.username,
      action: actionText,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };

    // Optimistic local update
    setSelectedWorkspace(prev => {
      if (!prev) return prev;
      const currentActs = prev.activities || [];
      return { ...prev, activities: [newAct, ...currentActs].slice(0, 50) };
    });

    // Persist + broadcast via server
    try {
      await fetch(`http://localhost:5000/api/spaces/${spaceId}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity: newAct })
      });
    } catch (e) {
      console.error('Failed to log activity', e);
    }
  };

  const handleModuleNavigation = (path, state = {}) => {
    if (selectedWorkspace) {
      try {
        localStorage.setItem('gatherly_active_workspace', JSON.stringify(selectedWorkspace));
        window.dispatchEvent(new Event('active_workspace_changed'));
      } catch (e) {
        console.warn('Quota exceeded on active workspace navigation caching', e);
      }
    }
    const spaceId = getSpaceId(selectedWorkspace) || workspaceId;
    if (spaceId) {
      navigate(`/workspace/${spaceId}${path}`, { state });
    } else {
      navigate(path, { state });
    }
  };

  const sendCustomMessage = async (content) => {
    if (!selectedWorkspace) return;
    const spaceId = getSpaceId(selectedWorkspace);
    const newMsg = {
      id: Date.now().toString(),
      sender: currentUser.username,
      avatar: `https://ui-avatars.com/api/?name=${currentUser.username}&background=0d8f80&color=fff`,
      text: content.text || '',
      image: content.image || null,
      audio: content.audio || null,
      channel: activeChannel,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };

    // Optimistic update: add to local state immediately
    setSelectedWorkspace(prev => {
      if (!prev) return prev;
      const updated = { ...prev, chatMessages: [...(prev.chatMessages || []), newMsg] };
      try { localStorage.setItem('gatherly_active_workspace', JSON.stringify(updated)); } catch(e) {}
      return updated;
    });

    // Broadcast instantly via WebSocket to all other room members
    if (socketRef.current) {
      socketRef.current.emit('send_chat_message', {
        workspaceId: spaceId,
        message: newMsg
      });
    }

    // Persist to DB
    try {
      await fetch(`http://localhost:5000/api/spaces/${spaceId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: newMsg.sender,
          avatar: newMsg.avatar,
          text: newMsg.text,
          image: newMsg.image,
          audio: newMsg.audio,
          channel: newMsg.channel,
          isPrivate: activeChannel === 'private'
        })
      });
    } catch (e) {
      console.error('Failed to persist chat message', e);
    }

    logActivity(activeChannel === 'private' ? 'sent a private message.' : 'posted a message in chat.');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      sendCustomMessage({ image: event.target.result });
    };
    reader.readAsDataURL(file);
  };

  const handleVoiceNote = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      sendCustomMessage({ audio: true, text: '🎤 Voice Message (0:02)' });
    }, 2000);
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedWorkspace) return;
    sendCustomMessage({ text: chatMessage });
    setChatMessage('');
  };

  const handleSendAiMessage = async (e) => {
    e.preventDefault();
    if (!aiInput.trim() || !selectedWorkspace) return;
    const defaultAiMsg = { role: 'ai', text: "Hello! I'm your workspace AI. I can generate an itinerary, suggest budgeting tips, assign starter tasks to members, or analyze your expenses. What do you need help with?" };
    const currentMsgs = selectedWorkspace.aiMessages || [defaultAiMsg];
    
    const newMsgs = [...currentMsgs, { role: 'user', text: aiInput }];
    updateWorkspaceData('aiMessages', newMsgs);
    const userInput = aiInput;
    setAiInput('');
    
    updateWorkspaceData('aiMessages', newMsgs);

    try {
      const response = await fetch('http://localhost:5000/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userInput,
            history: currentMsgs
          })
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        
        const aiReply = { role: 'ai', text: data.text };
        updateWorkspaceData('aiMessages', [...newMsgs, aiReply]);
      } catch (error) {
        console.error('Failed to fetch AI response:', error);
        const aiReply = { role: 'ai', text: `Error connecting to backend: ${error.message}. Please ensure the backend is running.` };
        updateWorkspaceData('aiMessages', [...newMsgs, aiReply]);
      }
  };

  const handleExtractTasks = async (text) => {
    if (!selectedWorkspace) return;
    
    // Parse markdown bullet points or numbered lists
    const lines = text.split('\n');
    const tasksToCreate = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      const match = trimmed.match(/^[-*]\s+(.*)$/) || trimmed.match(/^\d+\.\s+(.*)$/);
      if (match) {
        let cleanTitle = match[1].replace(/\*\*/g, '').trim();
        if (cleanTitle) {
          tasksToCreate.push(cleanTitle);
        }
      }
    }
    
    if (tasksToCreate.length === 0) {
      alert("No list items could be found to convert into tasks.");
      return;
    }

    const wId = selectedWorkspace._id || selectedWorkspace.id;

    for (const title of tasksToCreate) {
      try {
        await fetch('http://localhost:5000/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId: wId,
            title: title,
            desc: 'Generated by AI Planner',
            priority: 'medium',
            status: 'todo',
            dueDate: new Date().toISOString().split('T')[0],
            creator: null
          })
        });
      } catch (err) {
        console.error("Failed to create task", title, err);
      }
    }
    
    setExtractedAiMessages(prev => ({...prev, [text]: true}));
    logActivity(`used AI Planner to generate ${tasksToCreate.length} tasks.`);
    alert(`Successfully generated and added ${tasksToCreate.length} tasks to your Kanban board!`);
  };

  const handleVotePoll = async (pollId, optionIndex) => {
    if (!selectedWorkspace || !currentUser) return;
    const spaceId = getSpaceId(selectedWorkspace);
    const currentPolls = selectedWorkspace.polls || [];
    const updatedPolls = currentPolls.map(p => {
      if (p.id === pollId) {
        const votedBy = p.votedBy || {};
        if (votedBy[currentUser.username] === optionIndex) return p;
        const newOptions = [...p.options];
        if (votedBy[currentUser.username] !== undefined) {
          const oldIndex = votedBy[currentUser.username];
          newOptions[oldIndex].votes = Math.max(0, newOptions[oldIndex].votes - 1);
        } else {
          p.totalVotes = (p.totalVotes || 0) + 1;
        }
        newOptions[optionIndex].votes += 1;
        votedBy[currentUser.username] = optionIndex;
        return { ...p, options: newOptions, votedBy };
      }
      return p;
    });

    // Optimistic update
    setSelectedWorkspace(prev => prev ? { ...prev, polls: updatedPolls } : prev);

    // Persist + broadcast to all members
    try {
      await fetch(`http://localhost:5000/api/spaces/${spaceId}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ polls: updatedPolls })
      });
    } catch (e) {
      console.error('Failed to sync poll vote', e);
    }
  };
  
  const handleCreatePoll = () => {
    setPollQuestion('');
    setPollOptions(['', '']);
    setShowCreatePollModal(true);
  };

  const submitCreatePoll = async (e) => {
    e.preventDefault();
    if (!selectedWorkspace || !pollQuestion.trim() || pollOptions.length < 2) return;
    const spaceId = getSpaceId(selectedWorkspace);
    const filteredOptions = pollOptions.filter(opt => opt.trim() !== '');
    if (filteredOptions.length < 2) { alert("Please provide at least 2 options."); return; }
    const colors = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
    const defaultPoll = {
      id: Date.now().toString(),
      question: pollQuestion,
      creator: currentUser.username,
      totalVotes: 0,
      votedBy: {},
      options: filteredOptions.map((text, idx) => ({ text, votes: 0, color: colors[idx % colors.length] }))
    };
    const updatedPolls = [defaultPoll, ...(selectedWorkspace.polls || [])];

    // Optimistic update
    setSelectedWorkspace(prev => prev ? { ...prev, polls: updatedPolls } : prev);
    setShowCreatePollModal(false);

    // Persist + broadcast
    try {
      await fetch(`http://localhost:5000/api/spaces/${spaceId}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ polls: updatedPolls })
      });
      logActivity('created a new poll.');
    } catch (e) { console.error('Failed to sync poll', e); }
  };

  const handleCreateNote = () => {
    setActiveNoteId('new');
    setNoteTitle('');
    setNoteContent('');
  };

  const handleSaveNote = async () => {
    if (!selectedWorkspace || !noteTitle.trim()) { alert("Note title is required."); return; }
    const spaceId = getSpaceId(selectedWorkspace);
    const currentNotes = selectedWorkspace.notes || [];
    let updatedNotes;
    if (activeNoteId === 'new') {
      updatedNotes = [{ id: Date.now().toString(), title: noteTitle, content: noteContent, author: currentUser.username, date: new Date().toLocaleDateString() }, ...currentNotes];
    } else {
      updatedNotes = currentNotes.map(n => n.id === activeNoteId ? { ...n, title: noteTitle, content: noteContent, date: new Date().toLocaleDateString() } : n);
    }
    // Optimistic update
    setSelectedWorkspace(prev => prev ? { ...prev, notes: updatedNotes } : prev);
    setActiveNoteId(null);
    // Persist + broadcast
    try {
      await fetch(`http://localhost:5000/api/spaces/${spaceId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: updatedNotes })
      });
      logActivity(activeNoteId === 'new' ? 'created a new note.' : 'updated a note.');
    } catch (e) { console.error('Failed to sync notes', e); }
  };

  const handleDeleteNote = async (noteId) => {
    if (!selectedWorkspace) return;
    const spaceId = getSpaceId(selectedWorkspace);
    const updatedNotes = (selectedWorkspace.notes || []).filter(n => n.id !== noteId);
    setSelectedWorkspace(prev => prev ? { ...prev, notes: updatedNotes } : prev);
    try {
      await fetch(`http://localhost:5000/api/spaces/${spaceId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: updatedNotes })
      });
      logActivity('deleted a note.');
    } catch (e) { console.error('Failed to sync notes delete', e); }
  };

  const handleJoinWorkspace = async () => {
    if (!joinCode.trim()) return;
    let extractedCode = joinCode.trim();

    // Support full invite URL or bare code
    if (extractedCode.includes('/invite/')) {
      extractedCode = extractedCode.split('/invite/').pop().split('/')[0];
    }

    try {
      // Use the dedicated join endpoint (adds member + broadcasts)
      const res = await fetch(`http://localhost:5000/api/spaces/invite/${extractedCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser.username,
          email: currentUser.email,
          userId: currentUser._id || currentUser.id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join workspace.');

      const workspaceToOpen = data.space;
      const updatedAll = allWorkspaces.some(w => getSpaceId(w) === getSpaceId(workspaceToOpen))
        ? allWorkspaces.map(w => getSpaceId(w) === getSpaceId(workspaceToOpen) ? workspaceToOpen : w)
        : [workspaceToOpen, ...allWorkspaces];

      saveWorkspaces(updatedAll);
      // Preserve any local optimistic chat messages when opening the newly joined workspace
      setSelectedWorkspace(prev => {
        const local = (prev && Array.isArray(prev.chatMessages)) ? prev.chatMessages : (JSON.parse(localStorage.getItem('gatherly_active_workspace') || 'null')?.chatMessages || []);
        const incoming = Array.isArray(workspaceToOpen.chatMessages) ? workspaceToOpen.chatMessages : [];
        const byId = new Map();
        incoming.forEach(m => { if (m && m._id) byId.set(String(m._id), m); });
        const merged = [...incoming];
        local.forEach(m => { if (!m) return; if (!m._id) merged.push(m); else if (!byId.has(String(m._id))) merged.push(m); });
        try { localStorage.setItem('gatherly_active_workspace', JSON.stringify({ ...workspaceToOpen, chatMessages: merged })); } catch(e) {}
        return { ...workspaceToOpen, chatMessages: merged };
      });
      setJoinCode('');
      setShowJoinModal(false);
      navigate(`/workspace/${getSpaceId(workspaceToOpen)}`);
    } catch (err) {
      console.error('Error joining workspace:', err);
      alert(err.message || 'Something went wrong while trying to join the workspace.');
    }
  };

  // ==========================================
  // WIZARD STATE
  // ==========================================
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    type: 'Project', name: '', description: '', cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', color: '#0ea5e9', privacy: 'Private',
    members: [], newMemberEmail: '', newMemberRole: 'Editor',
    modules: { gallery: true, teamhub: true, expenses: true, calendar: false, pulse: true, timeline: false, files: true },
    aiPrompt: '', aiLoading: false, aiComplete: false
  });

  const nextWizardStep = () => setWizardStep(s => Math.min(s + 1, 5));
  const prevWizardStep = () => setWizardStep(s => Math.max(s - 1, 1));
  
  const handleSimulateAI = () => {
    setWizardData({...wizardData, aiLoading: true});
    setTimeout(() => {
      setWizardData({...wizardData, aiLoading: false, aiComplete: true});
    }, 2000);
  };

  const seedWorkspaceData = async (space) => {
    const spaceId = space._id || space.id;
    const creatorName = currentUser?.username || 'You';
    const workspaceName = space.name || 'Workspace';

    const starterTasks = [
      {
        workspaceId: spaceId,
        title: "Define Project Scope & Budget",
        desc: `Outline the key deliverables, target milestones, and secure initial budget allocations for "${workspaceName}".`,
        priority: "High",
        status: "Completed",
        dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        creator: null
      },
      {
        workspaceId: spaceId,
        title: "Book Venue and Accommodations",
        desc: "Research suitable venues, compare pricing options, and complete initial reservation deposit.",
        priority: "High",
        status: "In Progress",
        dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        creator: null
      },
      {
        workspaceId: spaceId,
        title: "Finalize Itinerary & Event Plans",
        desc: "Flesh out schedule, arrange event timelines, and distribute details to all team members.",
        priority: "Medium",
        status: "To Do",
        dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
        creator: null
      }
    ];

    for (const taskPayload of starterTasks) {
      try {
        await fetch('http://localhost:5000/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskPayload)
        });
      } catch (err) {
        console.error('Failed to seed task', err);
      }
    }

    const starterExpenses = [
      {
        workspaceId: spaceId,
        title: "Advance Booking Deposit",
        amount: 2500,
        category: "Venue",
        paidBy: creatorName,
        splitWith: ["All Members"],
        date: new Date().toISOString().split('T')[0]
      }
    ];

    for (const expPayload of starterExpenses) {
      try {
        await fetch('http://localhost:5000/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(expPayload)
        });
      } catch (err) {
        console.error('Failed to seed expense', err);
      }
    }
    
    try {
      const defaultAlbums = [
        { id: 'a1', name: `${workspaceName} Media`, cover: `https://picsum.photos/seed/${spaceId}-1/800/600`, items: 1 }
      ];
      localStorage.setItem(`albums_${spaceId}`, JSON.stringify(defaultAlbums));
      
      const defaultGallery = [
        {
          id: Date.now(),
          albumId: 'a1',
          url: `https://picsum.photos/seed/${spaceId}-1/800/600`,
          uploader: creatorName,
          avatar: `https://ui-avatars.com/api/?name=${creatorName}&background=random&color=fff`,
          likes: 5,
          comments: [],
          type: 'photo',
          createdAt: 'Just now'
        }
      ];
      localStorage.setItem(`gallery_${spaceId}`, JSON.stringify(defaultGallery));
    } catch (e) {
      console.warn('LocalStorage limit exceeded when seeding gallery data', e);
    }
  };

  const handleLaunchWizard = () => {
    let stats = { tasksCompleted: 0, tasksTotal: 0, expenses: 0, expenseCount: 0, media: 0, discussions: 0, plans: 0 };
    let activities = [];
    let aiSummary = null;
    let milestones = [];

    if (wizardData.aiComplete) {
      stats = { tasksCompleted: 0, tasksTotal: 8, expenses: 0, expenseCount: 0, media: 0, discussions: 0, plans: 1 };
      activities = [
        { type: 'system', user: 'AI Assistant', action: 'initialized the workspace with 8 starter tasks and 3 document templates', time: 'Just now', id: 'act1' }
      ];
      aiSummary = ['Workspace initialized successfully', '8 tasks created', '3 document templates added'];
      milestones = [
        { dateMonth: 'DEC', dateDay: '01', title: 'Project Kickoff', desc: 'In 2 days' }
      ];
    }

    const created = {
      id: Date.now().toString(),
      inviteCode: 'LINK-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      name: wizardData.name || 'Untitled Workspace',
      description: wizardData.description || `A new ${wizardData.type} workspace.`,
      cover: wizardData.cover || fallbackImages[0],
      members: [{ name: currentUser.username, email: currentUser.email, role: 'Admin' }],
      pendingMembers: wizardData.members,
      status: 'active',
      progress: 0,
      createdAt: new Date().toISOString(),
      theme: wizardData.color,
      stats, activities, aiSummary, milestones,
      chatMessages: [],
      aiMessages: [],
      polls: []
    };
    
    setShowCreateModal(false);
    setWizardStep(1);
    setWizardData({
      type: 'Project', name: '', description: '', cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', color: '#0ea5e9', privacy: 'Private',
      members: [], newMemberEmail: '', newMemberRole: 'Editor',
      modules: { gallery: true, teamhub: true, expenses: true, calendar: false, pulse: true, timeline: false, files: true },
      aiPrompt: '', aiLoading: false, aiComplete: false
    });

    // 1. Navigate IMMEDIATELY with the local workspace object (instant UX)
    const localList = [created, ...allWorkspaces];
    saveWorkspaces(localList);
    handleEnterWorkspace(created);

    // 2. Save to DB in the background, then update with real MongoDB _id
    fetch('http://localhost:5000/api/spaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(created)
    }).then(res => {
      if (!res.ok) throw new Error('Server returned error ' + res.status);
      return res.json();
    }).then(async (savedSpace) => {
      try { await seedWorkspaceData(savedSpace); } catch(e) { console.error('seed failed', e); }
      // Replace local entry with real DB record
      const updated = [savedSpace, ...allWorkspaces.filter(w => (w._id || w.id) !== created.id)];
      saveWorkspaces(updated);
      try {
        localStorage.setItem('gatherly_active_workspace', JSON.stringify(savedSpace));
        window.dispatchEvent(new Event('active_workspace_changed'));
      } catch(e) {}
      // Update route URL to real MongoDB _id
      navigate(`/workspace/${savedSpace._id}`, { replace: true });
    }).catch(err => {
      console.error('Failed to save workspace to DB:', err);
      // Workspace is already open using local copy — user can continue working
    });
  };

  const handleAddMember = () => {
    if(!wizardData.newMemberEmail) return;
    setWizardData({
      ...wizardData, 
      members: [...wizardData.members, { email: wizardData.newMemberEmail, role: wizardData.newMemberRole }],
      newMemberEmail: ''
    });
    alert(`Invitation successfully sent to ${wizardData.newMemberEmail}! They will be notified.`);
  };

  // ==========================================

  const handleUseTemplate = (template) => {
    const created = {
      id: Date.now().toString(), name: template.name, description: template.desc, cover: template.cover,
      members: [{ name: currentUser.username, email: currentUser.email }], status: 'active', progress: 0, createdAt: new Date().toISOString()
    };
    saveWorkspaces([created, ...allWorkspaces]);
    setShowTemplateModal(false);
  };

  const handleAcceptInvite = async (invite) => {
    const ws = allWorkspaces.find(w => (w._id || w.id) === invite.id);
    if (!ws) return;
    
    const pendingUser = ws.pendingMembers?.find(m => m.email === currentUser.email);
    const newPending = (ws.pendingMembers || []).filter(m => m.email !== currentUser.email);
    const newMembers = [...(ws.members || []), pendingUser || { name: currentUser.username, email: currentUser.email, role: 'Editor' }];
    
    const updatedWs = { ...ws, pendingMembers: newPending, members: newMembers };
    const updatedAll = allWorkspaces.map(w => (w._id || w.id) === invite.id ? updatedWs : w);
    setAllWorkspaces(updatedAll);
    setInvites(invites.filter(i => i.id !== invite.id));
    
    try {
      await fetch(`http://localhost:5000/api/spaces/${invite.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingMembers: newPending, members: newMembers })
      });
    } catch(e) {
      console.error(e);
    }
  };

  const handleDeclineInvite = async (invite) => {
    setInvites(invites.filter(i => i.id !== invite.id));
    const ws = allWorkspaces.find(w => (w._id || w.id) === invite.id);
    if (!ws) return;
    
    const newPending = (ws.pendingMembers || []).filter(m => m.email !== currentUser.email);
    const updatedWs = { ...ws, pendingMembers: newPending };
    const updatedAll = allWorkspaces.map(w => (w._id || w.id) === invite.id ? updatedWs : w);
    setAllWorkspaces(updatedAll);
    
    try {
      await fetch(`http://localhost:5000/api/spaces/${invite.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingMembers: newPending })
      });
    } catch(e) {}
  };

  const handleEnterWorkspace = (ws) => {
    try {
      localStorage.setItem('gatherly_active_workspace', JSON.stringify(ws));
    } catch (e) {
      console.warn('Quota exceeded on workspace entry caching', e);
    }
    window.dispatchEvent(new Event('active_workspace_changed'));
    navigate(`/workspace/${getSpaceId(ws)}`);
  };

  const handleChangeCover = async (e) => {
    e.preventDefault();
    if (!newCoverUrl) return;
    await updateWorkspaceData('cover', newCoverUrl);
    const updated = { ...selectedWorkspace, cover: newCoverUrl };
    try {
      localStorage.setItem('gatherly_active_workspace', JSON.stringify(updated));
    } catch (err) {
      console.warn('Quota exceeded on active workspace cover update', err);
    }
    window.dispatchEvent(new Event('active_workspace_changed'));
    setShowEditCoverModal(false);
    setNewCoverUrl('');
  };

  const fetchFreshestWorkspace = (wsId) => {
    Promise.all([
      fetch(`http://localhost:5000/api/spaces/${wsId}?t=${Date.now()}`).then(res => res.ok ? res.json() : null),
      // Request a large history; backend supports pagination via ?limit, ?before, ?beforeId
      fetch(`http://localhost:5000/api/spaces/${wsId}/messages?limit=2000&t=${Date.now()}`).then(res => res.ok ? res.json() : [])
    ])
      .then(([freshSpace, messages]) => {
        if (freshSpace) {
          const incoming = Array.isArray(messages) ? messages : [];

          // Merge incoming messages with any local optimistic messages to avoid wiping chat history
          setSelectedWorkspace(prev => {
            const local = (prev && Array.isArray(prev.chatMessages)) ? prev.chatMessages : [];
            const byId = new Map();
            // prefer incoming (server) messages as authoritative
            incoming.forEach(m => { if (m && m._id) byId.set(String(m._id), m); });
            // collect merged list starting with incoming in order
            const merged = [...incoming];
            // append any local messages not present on server (optimistic messages without _id)
            local.forEach(m => {
              if (!m) return;
              if (!m._id) merged.push(m);
              else if (!byId.has(String(m._id))) merged.push(m);
            });

            const workspaceWithChats = { ...freshSpace, chatMessages: merged };
            // Update in-memory workspace list and active cache below
            return workspaceWithChats;
          });
          // Update in-memory workspace list
          setAllWorkspaces(prev => {
            const index = prev.findIndex(w => getSpaceId(w) === wsId);
            if (index !== -1) {
              const updated = [...prev];
              updated[index] = { ...updated[index], chatMessages: (incoming.length > 0 ? incoming : updated[index].chatMessages || []) };
              try {
                localStorage.setItem('gatherly_workspaces', JSON.stringify(updated));
              } catch(e) {}
              return updated;
            }
            return prev;
          });
          // Update active workspace
          try {
            const activeCached = JSON.parse(localStorage.getItem('gatherly_active_workspace') || '{}') || {};
            const activeToSave = {
              ...activeCached,
              ...freshSpace,
              chatMessages: (incoming && incoming.length > 0) ? incoming : (activeCached.chatMessages || []),
              aiMessages: freshSpace.aiMessages || activeCached.aiMessages || [],
              polls: freshSpace.polls || activeCached.polls || [],
              notes: freshSpace.notes || activeCached.notes || [],
              activities: freshSpace.activities || activeCached.activities || []
            };
            localStorage.setItem('gatherly_active_workspace', JSON.stringify(activeToSave));
            window.dispatchEvent(new Event('active_workspace_changed'));
          } catch(e) {}
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!workspaceId) return;

    // Load freshest workspaces list from localStorage to avoid any stale router cache
    let currentAllWorkspaces = allWorkspaces;
    try {
      const savedList = localStorage.getItem('gatherly_workspaces');
      if (savedList) {
        const parsed = JSON.parse(savedList);
        currentAllWorkspaces = parsed;
        setAllWorkspaces(parsed);
      }
    } catch(e) {}

    // 0. Self-healing Route Redirect:
    // Resolve workspace by name or inviteCode from local cache to find strict DB ObjectID
    let resolvedName = '';
    try {
      const activeCached = localStorage.getItem('gatherly_active_workspace');
      if (activeCached) {
        const parsed = JSON.parse(activeCached);
        if (getSpaceId(parsed) === String(workspaceId)) {
          resolvedName = parsed.name;
        }
      }
    } catch(e) {}

    const targetName = resolvedName || String(workspaceId);
    const dbMatch = currentAllWorkspaces.find(w => 
      w && w._id && w.name && (
        w.name.toLowerCase().trim() === targetName.toLowerCase().trim() ||
        w.inviteCode === targetName
      )
    );

    if (dbMatch && getSpaceId(dbMatch) !== String(workspaceId)) {
      navigate(`/workspace/${getSpaceId(dbMatch)}`, { replace: true });
      return;
    }

    // 1. Check in-memory list first (instant)
    const found = currentAllWorkspaces.find(w => getSpaceId(w) === String(workspaceId));
    if (found) {
      // Preserve any local optimistic chat messages when instantly loading from in-memory list
      setSelectedWorkspace(prev => {
        const local = (prev && Array.isArray(prev.chatMessages)) ? prev.chatMessages : (JSON.parse(localStorage.getItem('gatherly_active_workspace') || 'null')?.chatMessages || []);
        const incoming = Array.isArray(found.chatMessages) ? found.chatMessages : [];
        const byId = new Map();
        incoming.forEach(m => { if (m && m._id) byId.set(String(m._id), m); });
        const merged = [...incoming];
        local.forEach(m => { if (!m) return; if (!m._id) merged.push(m); else if (!byId.has(String(m._id))) merged.push(m); });
        try { localStorage.setItem('gatherly_active_workspace', JSON.stringify({ ...found, chatMessages: merged })); } catch(e) {}
        window.dispatchEvent(new Event('active_workspace_changed'));
        setIsLoadingWorkspace(false);
        return { ...found, chatMessages: merged };
      });
      // Perform background revalidation to fetch freshest database copy
      fetchFreshestWorkspace(String(workspaceId));
      return;
    }

    // 2. Check localStorage cache
    try {
      const cached = localStorage.getItem('gatherly_active_workspace');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (getSpaceId(parsed) === String(workspaceId)) {
          setSelectedWorkspace(prev => {
            const local = (prev && Array.isArray(prev.chatMessages)) ? prev.chatMessages : (parsed.chatMessages || []);
            const incoming = Array.isArray(parsed.chatMessages) ? parsed.chatMessages : [];
            const byId = new Map();
            incoming.forEach(m => { if (m && m._id) byId.set(String(m._id), m); });
            const merged = [...incoming];
            local.forEach(m => { if (!m) return; if (!m._id) merged.push(m); else if (!byId.has(String(m._id))) merged.push(m); });
            try { localStorage.setItem('gatherly_active_workspace', JSON.stringify({ ...parsed, chatMessages: merged })); } catch(e) {}
            window.dispatchEvent(new Event('active_workspace_changed'));
            setIsLoadingWorkspace(false);
            return { ...parsed, chatMessages: merged };
          });
          // Perform background revalidation to fetch freshest database copy
          fetchFreshestWorkspace(String(workspaceId));
          return;
        }
      }
    } catch (e) {}

    // 3. Not found locally — fetch directly from database (handles just-joined / new workspaces)
    setIsLoadingWorkspace(true);
    Promise.all([
      fetch(`http://localhost:5000/api/spaces/${workspaceId}?t=${Date.now()}`).then(res => {
        if (!res.ok) throw new Error('Workspace not found in DB');
        return res.json();
      }),
      // request larger message history for initial load
      fetch(`http://localhost:5000/api/spaces/${workspaceId}/messages?limit=2000&t=${Date.now()}`).then(res => res.ok ? res.json() : [])
    ])
      .then(([space, messages]) => {
        const dbId = getSpaceId(space);
        if (dbId && dbId !== String(workspaceId)) {
          navigate(`/workspace/${dbId}`, { replace: true });
          return;
        }

        const incoming = Array.isArray(messages) ? messages : [];
        setSelectedWorkspace(prev => {
          const local = (prev && Array.isArray(prev.chatMessages)) ? prev.chatMessages : [];
          const byId = new Map();
          incoming.forEach(m => { if (m && m._id) byId.set(String(m._id), m); });
          const merged = [...incoming];
          local.forEach(m => { if (!m) return; if (!m._id) merged.push(m); else if (!byId.has(String(m._id))) merged.push(m); });
          return { ...space, chatMessages: merged };
        });
        setIsLoadingWorkspace(false);
        // Add it to the all-workspaces list so future navigation works
        setAllWorkspaces(prev => {
          const alreadyIn = prev.some(w => getSpaceId(w) === getSpaceId(space));
          if (alreadyIn) return prev;
          const updated = [{ ...space, chatMessages: (incoming.length > 0 ? incoming : (prev[0]?.chatMessages || [])) }, ...prev];
          try {
            localStorage.setItem('gatherly_workspaces', JSON.stringify(updated));
          } catch(e) {}
          return updated;
        });
        try {
          localStorage.setItem('gatherly_active_workspace', JSON.stringify(workspaceWithChats));
          window.dispatchEvent(new Event('active_workspace_changed'));
        } catch(e) {}
      })
      .catch(err => {
        console.error('Could not resolve workspace from DB:', err);
        setIsLoadingWorkspace(false);
      });
  }, [workspaceId, allWorkspaces.length]); // use .length to avoid infinite re-runs

  useEffect(() => {
    // Handle action hashes from other pages like Dashboard
    if (window.location.hash === '#create') {
      setShowCreateModal(true);
      // clean up hash
      window.history.replaceState(null, '', window.location.pathname);
    } else if (window.location.hash === '#join') {
      setShowJoinModal(true);
      // clean up hash
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const activeSpaces = allWorkspaces.filter(w => {
    if (!w) return false;
    if (w.status === 'completed') return false;
    // If workspace has no members array or it's empty — show it (legacy/new workspaces)
    if (!w.members || !Array.isArray(w.members) || w.members.length === 0) return true;
    const m0 = w.members[0];
    // Legacy format: members is array of ObjectId strings or non-objects
    if (typeof m0 !== 'object' || m0 === null || m0.name === undefined) return true;
    // Proper format: check if current user is a member
    return w.members.some(m =>
      m && (
        (currentUser.email && m.email === currentUser.email) ||
        (currentUser.username && (m.name === currentUser.username || m.name === 'You'))
      )
    );
  });
  const completedSpaces = allWorkspaces.filter(w => w.status === 'completed');
  const totalMembers = allWorkspaces.reduce((acc, ws) => acc + (Array.isArray(ws.members) ? ws.members.length : 0), 0);

  // ----------------------------------------------------
  // RENDER: HUB (LIST ALL)
  // ----------------------------------------------------
  if (!workspaceId) {
    return (
      <div className="workspace-page-container">
        
        {/* MODERN FLOATING EXIT BUTTON TO DASHBOARD */}
        <motion.button 
          className="modern-exit-fab"
          onClick={() => navigate('/userdashboard')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Return to Dashboard"
        >
          <LogOut size={24} />
        </motion.button>
        
        {/* LEFT MAIN COLUMN */}
        <div className="workspace-main-column">
          <div className="hub-header">
            <h1>Welcome back, {currentUser.username}! 👋</h1>
            <p>Here's what's happening in your workspaces today.</p>
          </div>

          <div className="hub-banner" style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-hover))',
            borderRadius: '24px', padding: '2.5rem', color: 'white',
            display: 'flex', flexDirection: 'column', gap: '1rem',
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(13, 143, 128, 0.2)'
          }}>
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
              <p style={{color: 'var(--text-gray)'}}>No active workspaces. Create one to get started!</p>
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
                        <div className="card-avatars">
                          <img src={`https://ui-avatars.com/api/?name=${currentUser.username}&background=0d8f80&color=fff`} alt="User"/>
                        </div>
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
            <button className="btn-primary" style={{width: 'auto'}} onClick={() => setShowCreateModal(true)}>
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
            <div className="sidebar-card" style={{padding:0, border:'none', boxShadow:'none', background:'transparent'}}>
              <h3 style={{paddingLeft:'0.5rem', marginBottom:'0.75rem'}}>Pending Invitations <span style={{fontSize:'0.75rem', color:'var(--primary-blue)', cursor:'pointer'}}>View All</span></h3>
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
            <h3 style={{marginBottom:0}}>Recent Network Activity</h3>
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
          <div className="sidebar-card" style={{marginTop: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)'}}>
            <h3 style={{marginBottom: '1rem', color: 'var(--text-primary)'}}>Storage Usage</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.8rem'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
                <span style={{fontSize: '2.2rem', fontWeight: 900, color: 'var(--accent-primary)', lineHeight: 1}}>45<span style={{fontSize: '1rem', color: 'var(--text-secondary)'}}>.2 GB</span></span>
                <span style={{fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)'}}>of 100 GB</span>
              </div>
              <div className="progress-bar" style={{height: '10px', background: 'var(--bg-primary)', borderRadius: '5px', overflow: 'hidden'}}>
                <motion.div 
                  className="progress-fill" 
                  initial={{width: 0}}
                  animate={{width: '45.2%'}}
                  transition={{duration: 1, ease: "easeOut"}}
                  style={{height: '100%', background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-hover))'}}
                ></motion.div>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, marginTop: '0.5rem'}}>
                <span style={{display: 'flex', alignItems: 'center', gap: '0.4rem'}}><div style={{width:'10px', height:'10px', borderRadius:'3px', background:'var(--accent-primary)'}}></div> Media (28GB)</span>
                <span style={{display: 'flex', alignItems: 'center', gap: '0.4rem'}}><div style={{width:'10px', height:'10px', borderRadius:'3px', background:'var(--accent-hover)'}}></div> Docs (17.2GB)</span>
              </div>
              <button className="btn-outline" style={{marginTop: '0.5rem', width: '100%', padding: '0.75rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700}}>Upgrade Storage</button>
            </div>
          </div>
        </div>
        
        {/* ================= MODALS ================= */}
        <AnimatePresence>
          
          {/* WIZARD MODAL */}
          {showCreateModal && (
            <div className="modal-overlay">
              <motion.div className="modal-content wizard-modal-content" initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}}>
                <button className="modal-close" onClick={() => setShowCreateModal(false)} style={{zIndex:10, top:'1.5rem', right:'1.5rem'}}><X size={20}/></button>
                
                <div className="wizard-header">
                  <h2>Create Workspace</h2>
                  <div className="wizard-progress">
                    {[1,2,3,4,5].map(step => (
                      <div key={step} className={`wizard-step-dot ${wizardStep === step ? 'active' : ''} ${wizardStep > step ? 'completed' : ''}`} />
                    ))}
                  </div>
                </div>

                <div className="wizard-body">
                  {wizardStep === 1 && (
                    <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}}>
                      <h3 style={{marginBottom:'0.5rem', fontSize:'1.2rem', fontWeight:800}}>What kind of workspace are you building?</h3>
                      <p style={{color:'var(--text-gray)', marginBottom:'1.5rem', fontSize:'0.9rem'}}>Select a preset to auto-configure modules and layouts.</p>
                      <div className="type-grid">
                        {['Trip', 'Project', 'Startup', 'Event', 'Study Group', 'Custom'].map(t => (
                          <div key={t} className={`type-card ${wizardData.type === t ? 'selected' : ''}`} onClick={() => setWizardData({...wizardData, type: t})}>
                            <div className="type-icon"><Sparkles size={24}/></div>
                            <h4>{t}</h4>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {wizardStep === 2 && (
                    <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}}>
                      <h3 style={{marginBottom:'0.5rem', fontSize:'1.2rem', fontWeight:800}}>Workspace Details</h3>
                      <p style={{color:'var(--text-gray)', marginBottom:'1.5rem', fontSize:'0.9rem'}}>Give it a name and an identity.</p>
                      <div className="form-group">
                        <label>Workspace Name</label>
                        <input type="text" value={wizardData.name} onChange={e => setWizardData({...wizardData, name: e.target.value})} placeholder="e.g. Goa Trip 2026"/>
                      </div>
                      <div className="form-group">
                        <label>Short Description</label>
                        <input type="text" value={wizardData.description} onChange={e => setWizardData({...wizardData, description: e.target.value})} placeholder="What is the goal?"/>
                      </div>
                      <div className="wizard-two-col">
                        <div className="form-group">
                          <label>Privacy</label>
                          <select value={wizardData.privacy} onChange={e => setWizardData({...wizardData, privacy: e.target.value})}>
                            <option>Private (Invite Only)</option>
                            <option>Team (Discoverable)</option>
                            <option>Public</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Theme Color</label>
                          <div className="color-picker">
                            {['#0ea5e9', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b'].map(c => (
                              <div key={c} onClick={() => setWizardData({...wizardData, color: c})} className={`color-circle ${wizardData.color === c ? 'selected' : ''}`} style={{background: c}}></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {wizardStep === 3 && (
                    <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}}>
                      <h3 style={{marginBottom:'0.5rem', fontSize:'1.2rem', fontWeight:800}}>Select Workspace Cover</h3>
                      <p style={{color:'var(--text-gray)', marginBottom:'1.5rem', fontSize:'0.9rem'}}>Pick a high-definition background that matches the vibe of your workspace.</p>
                      
                      <div className="cover-picker-grid" style={{display:'grid', gridTemplateColumns:'repeat(3, 2fr)', gap:'0.75rem', marginBottom:'1.5rem'}}>
                        {[
                          { name: 'Travel & Nature', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80' },
                          { name: 'Work & Code', url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=800&q=80' },
                          { name: 'Creative Design', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80' },
                          { name: 'Events & Meets', url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80' },
                          { name: 'Abstract Art', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&q=80' },
                          { name: 'Cozy & Minimalist', url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80' }
                        ].map(cov => (
                          <div 
                            key={cov.name} 
                            onClick={() => setWizardData({...wizardData, cover: cov.url})} 
                            style={{
                              position:'relative', 
                              height:'80px', 
                              borderRadius:'12px', 
                              overflow:'hidden', 
                              cursor:'pointer', 
                              border: wizardData.cover === cov.url ? '3px solid var(--accent-primary)' : '1px solid var(--border-light)',
                              boxShadow: wizardData.cover === cov.url ? '0 0 12px rgba(13,143,128,0.3)' : 'none',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <img src={cov.url} alt={cov.name} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                            <div style={{
                              position:'absolute', 
                              bottom:0, left:0, right:0, 
                              background:'rgba(10,29,28,0.75)', 
                              color:'white', 
                              fontSize:'0.65rem', 
                              fontWeight:800, 
                              textAlign:'center', 
                              padding:'0.25rem 0'
                            }}>{cov.name}</div>
                          </div>
                        ))}
                      </div>

                      <div className="form-group" style={{marginTop:'1rem', display:'flex', flexDirection:'column', gap:'0.8rem'}}>
                        <div style={{display:'flex', flexDirection:'column', gap:'0.4rem'}}>
                          <label style={{fontWeight:800}}>Or Upload Local Cover Image</label>
                          <div style={{display:'flex', gap:'1rem', alignItems:'center', marginTop:'0.2rem'}}>
                            <button 
                              type="button" 
                              className="btn-outline" 
                              onClick={() => document.getElementById('cover-file-input').click()}
                              style={{
                                padding:'0.75rem 1.25rem', 
                                borderRadius:'12px', 
                                fontSize:'0.85rem', 
                                fontWeight:700, 
                                display:'flex', 
                                alignItems:'center', 
                                gap:'0.5rem',
                                cursor:'pointer',
                                background:'transparent',
                                border:'1px solid var(--border-light)',
                                color:'var(--text-dark)',
                                transition: '0.2s'
                              }}
                            >
                              <UploadCloud size={16} /> Choose Image
                            </button>
                            <input 
                              id="cover-file-input" 
                              type="file" 
                              accept="image/*" 
                              style={{display:'none'}} 
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setWizardData({...wizardData, cover: reader.result});
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            {wizardData.cover && wizardData.cover.startsWith('data:') && (
                              <span style={{fontSize:'0.8rem', color:'var(--accent-primary)', fontWeight:800}}>
                                ✓ Local photo loaded!
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{display:'flex', flexDirection:'column', gap:'0.4rem', marginTop:'0.4rem'}}>
                          <label style={{fontWeight:800}}>Or Paste Custom Image URL</label>
                          <input 
                            type="text" 
                            placeholder="https://images.unsplash.com/..." 
                            value={wizardData.cover.startsWith('data:') ? '' : wizardData.cover} 
                            onChange={e => setWizardData({...wizardData, cover: e.target.value})}
                            style={{width:'100%', padding:'0.8rem', borderRadius:'12px', border:'1px solid var(--border-light)', fontSize:'0.9rem'}}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {wizardStep === 4 && (
                    <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}}>
                      <h3 style={{marginBottom:'0.5rem', fontSize:'1.2rem', fontWeight:800}}>Configure Modules</h3>
                      <p style={{color:'var(--text-gray)', marginBottom:'1.5rem', fontSize:'0.9rem'}}>Turn on the tools you need. You can change these later.</p>
                      
                      <div className="module-toggle-grid">
                        {[
                          { id: 'gallery', name: 'Memory Gallery', icon: <ImageIcon size={18}/> },
                          { id: 'teamhub', name: 'Team Hub & Tasks', icon: <CheckSquare size={18}/> },
                          { id: 'expenses', name: 'Expenses & Split', icon: <DollarSign size={18}/> },
                          { id: 'calendar', name: 'Calendar Events', icon: <Calendar size={18}/> },
                          { id: 'pulse', name: 'Docs & Pulse', icon: <Activity size={18}/> },
                          { id: 'files', name: 'Files & Docs', icon: <Folder size={18}/> },
                        ].map(m => {
                          const isEnabled = wizardData.modules[m.id];
                          return (
                            <div key={m.id} className={`module-toggle-card ${isEnabled ? 'enabled' : ''}`} onClick={() => setWizardData({...wizardData, modules: {...wizardData.modules, [m.id]: !isEnabled}})}>
                              <div className="module-toggle-info">
                                <div className="module-toggle-icon">{m.icon}</div>
                                <div className="module-toggle-text">
                                  <h4>{m.name}</h4>
                                </div>
                              </div>
                              <div className={`toggle-switch ${isEnabled ? 'on' : ''}`}><div className="toggle-handle"></div></div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {wizardStep === 5 && (
                    <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}}>
                      <h3 style={{marginBottom:'0.5rem', fontSize:'1.2rem', fontWeight:800}}>AI Workspace Setup</h3>
                      <p style={{color:'var(--text-gray)', marginBottom:'1.5rem', fontSize:'0.9rem'}}>Let our AI auto-generate starter folders, tasks, and structures for you.</p>
                      
                      {!wizardData.aiComplete ? (
                        <div className="ai-setup-box">
                          {wizardData.aiLoading ? (
                            <div className="ai-loading-spinner"><Sparkles size={40}/></div>
                          ) : (
                            <>
                              <Wand2 size={24} color="#0ea5e9" style={{marginBottom:'1rem'}}/>
                              <textarea placeholder="e.g. We are planning a 5-day trip to Goa for 12 people. We need to book flights, track expenses, and plan an itinerary." 
                                value={wizardData.aiPrompt} onChange={e => setWizardData({...wizardData, aiPrompt: e.target.value})}></textarea>
                              <button className="btn-primary" onClick={handleSimulateAI}><Sparkles size={16}/> Generate with AI</button>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="ai-setup-box" style={{background: 'rgba(13, 143, 128, 0.08)', borderColor: 'var(--accent-primary)'}}>
                          <CheckCircle size={40} color="var(--accent-primary)" style={{margin:'0 auto 1rem auto'}}/>
                          <h4 style={{fontSize:'1.1rem', fontWeight:800, color:'var(--text-dark)', marginBottom:'0.5rem'}}>Workspace Initialized!</h4>
                          <p style={{fontSize:'0.85rem', color:'var(--text-gray)'}}>AI has prepared 8 starter tasks, 3 document templates, and 2 gallery folders based on your prompt.</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                <div className="wizard-footer">
                  {wizardStep > 1 ? (
                    <button className="btn-outline" style={{padding:'0.8rem 1.5rem', borderRadius:'12px', background:'transparent', border:'1px solid var(--border-light)', cursor:'pointer', fontWeight:700}} onClick={prevWizardStep}>Back</button>
                  ) : <div></div>}

                  {wizardStep < 5 ? (
                    <button className="btn-primary" style={{width:'auto', padding:'0.8rem 2rem'}} onClick={nextWizardStep}>Next Step <ArrowRight size={16}/></button>
                  ) : (
                    <button className="btn-primary" style={{width:'auto', padding:'0.8rem 2rem', background:'#10b981'}} onClick={handleLaunchWizard}>Launch Workspace <Rocket size={16}/></button>
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {/* OTHER MODALS */}
          {showTemplateModal && (
            <div className="modal-overlay">
              <motion.div className="modal-content" initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} style={{maxWidth: '600px'}}>
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
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: COCKPIT (SINGLE WORKSPACE)
  // ----------------------------------------------------
  if (workspaceId && isLoadingWorkspace) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh',
        background: 'var(--bg-main)', gap: '1.5rem'
      }}>
        <div style={{
          width: '56px', height: '56px', border: '4px solid var(--border-light)',
          borderTop: '4px solid var(--accent-primary)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: 'var(--text-gray)', fontWeight: 600, fontSize: '1.1rem' }}>
          Opening workspace...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!selectedWorkspace) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh',
        background: 'var(--bg-main)', gap: '1.5rem'
      }}>
        <div style={{
          width: '56px', height: '56px', border: '4px solid var(--border-light)',
          borderTop: '4px solid var(--accent-primary)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: 'var(--text-gray)', fontWeight: 600, fontSize: '1.1rem' }}>
          Loading workspace...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const membersArr = Array.isArray(selectedWorkspace.members) ? selectedWorkspace.members : [];

  // SECURITY CHECK: Verify that the current user is an authorized member of this workspace
  const isAuthorizedMember = membersArr.some(m => {
    const info = resolveMemberInfo(m);
    return info.isMe;
  });

  if (!isAuthorizedMember) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'radial-gradient(circle at center, #1e293b, #0f172a)',
        color: '#f8fafc', padding: '2rem', textAlign: 'center', gap: '1.5rem', fontFamily: 'Outfit, sans-serif'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px',
          padding: '3rem', maxWidth: '500px', width: '100%',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem'
        }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444',
            width: '64px', height: '64px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '0.5rem', boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)'
          }}>
            <Lock size={32} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>Access Restricted</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
            You are not a member of the workspace <strong>"{selectedWorkspace.name}"</strong>. Only authorized workspace members are allowed to access its tasks, chats, wallets, and documents.
          </p>
          <button 
            onClick={() => {
              localStorage.removeItem('gatherly_active_workspace');
              window.dispatchEvent(new Event('active_workspace_changed'));
              navigate('/workspace');
            }}
            style={{
              marginTop: '1.5rem', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white', border: 'none', borderRadius: '12px',
              padding: '0.75rem 1.75rem', fontSize: '0.95rem', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', transition: 'all 0.2s'
            }}
          >
            <ArrowLeft size={16} /> Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const themeColor = selectedWorkspace?.theme || 'var(--accent-primary)';
  const customThemeStyles = {
    '--accent-primary': themeColor,
    '--accent-hover': themeColor.startsWith('#') ? `${themeColor}dd` : 'var(--accent-hover)'
  };

  return (
    <div className="workspace-page-container" style={customThemeStyles}>
    
      {/* MODERN FLOATING EXIT BUTTON TO WORKSPACE HUB */}
      <motion.button 
        className="modern-exit-fab"
        onClick={() => {
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
                  <span>{selectedWorkspace.progress || 65}% Planned</span>
                  <div className="progress-bar-container"><div className="progress-fill" style={{width: `${selectedWorkspace.progress || 65}%`}}></div></div>
                  <span style={{display: 'flex', alignItems: 'center', gap: '0.4rem'}}><Clock size={14}/> 3 Days Left</span>
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
                <div className="cockpit-stat-value">{workspaceTasks.filter(t => t.status === 'done' || t.status === 'completed').length} / <span style={{fontSize:'1rem', color:'var(--text-gray)'}}>{workspaceTasks.length}</span></div>
                <div className="cockpit-stat-sub">{workspaceTasks.length > 0 ? Math.round((workspaceTasks.filter(t => t.status === 'done' || t.status === 'completed').length / workspaceTasks.length) * 100) : 0}% Done</div>
              </div>
              <div className="cockpit-stat-card">
                <div className="cockpit-stat-header"><div className="cockpit-stat-icon" style={{background: 'rgba(16,185,129,0.1)', color: '#10b981'}}><DollarSign size={16}/></div> Total Expenses</div>
                <div className="cockpit-stat-value">₹{workspaceExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0).toLocaleString()}</div>
                <div className="cockpit-stat-sub">{workspaceExpenses.length} Expenses</div>
              </div>
              <div className="cockpit-stat-card">
                <div className="cockpit-stat-header"><div className="cockpit-stat-icon" style={{background: 'rgba(139,92,246,0.1)', color: '#8b5cf6'}}><ImageIcon size={16}/></div> Media Uploaded</div>
                <div className="cockpit-stat-value">{workspaceGallery.length}</div>
                <div className="cockpit-stat-sub">Photos & Videos</div>
              </div>
              <div className="cockpit-stat-card">
                <div className="cockpit-stat-header"><div className="cockpit-stat-icon" style={{background: 'rgba(245,158,11,0.1)', color: '#f59e0b'}}><MessageSquare size={16}/></div> Active Discussions</div>
                <div className="cockpit-stat-value">{(selectedWorkspace.chatMessages || []).length}</div>
                <div className="cockpit-stat-sub">Total Messages</div>
              </div>
              <div className="cockpit-stat-card">
                <div className="cockpit-stat-header"><div className="cockpit-stat-icon" style={{background: 'rgba(236,72,153,0.1)', color: '#ec4899'}}><Calendar size={16}/></div> Upcoming Plans</div>
                <div className="cockpit-stat-value">{(selectedWorkspace.polls || []).length + (selectedWorkspace.notes || []).length}</div>
                <div className="cockpit-stat-sub">Polls & Notes</div>
              </div>
            </div>

            <div className="section-header" style={{marginTop: '1rem'}}><h2>Workspace Modules</h2></div>
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

            <div className="section-header" style={{marginTop: '1rem'}}><h2>Recent Activity</h2></div>
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
                <div style={{padding: '2.5rem', textAlign: 'center', color: 'var(--text-gray)'}}>
                  <Activity size={32} style={{margin:'0 auto 1rem auto', opacity:0.5}} />
                  <p style={{fontSize: '1rem', fontWeight: 600, color: 'var(--text-dark)'}}>No recent activity yet.</p>
                  <p style={{fontSize:'0.85rem', marginTop: '0.25rem'}}>When your team interacts with the workspace, activities will appear here.</p>
                </div>
              )}
            </div>
          </div>

          <div className="cockpit-sidebar">
            <div className="sidebar-card" style={{padding: '1.25rem'}}>
              <h3>Members Online ({Math.max(1, membersArr.length)})</h3>
              <div className="sidebar-members">
                <div className="online-indicator"><img src={`https://ui-avatars.com/api/?name=${currentUser.username}&background=0d8f80&color=fff`} alt={currentUser.username}/></div>
                {membersArr.filter(m => {
                  const info = resolveMemberInfo(m);
                  return !info.isMe;
                }).map((m, i) => {
                  const info = resolveMemberInfo(m);
                  return (
                    <div className="online-indicator" key={i}>
                      <img src={`https://ui-avatars.com/api/?name=${info.name}&background=random&color=fff`} alt={info.name}/>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="ai-summary-card">
              <h3>AI Workspace Summary <span className="ai-badge">Beta</span><X size={16} color="#94a3b8" style={{position:'absolute', right:'1.5rem', cursor:'pointer'}}/></h3>
              {true ? (
                <>
                  <h4>This week in {selectedWorkspace.name}</h4>
                  <ul className="ai-summary-list">
                    <li>{`Workspace has ${membersArr.length} active member${membersArr.length !== 1 ? 's' : ''}.`}</li>
                    <li>{`Overall progress is at ${selectedWorkspace.progress || 0}% with ${selectedWorkspace.stats?.tasksCompleted || 0}/${selectedWorkspace.stats?.tasksTotal || 0} tasks completed.`}</li>
                    <li>{`${(selectedWorkspace.chatMessages || []).length > 0 ? `${(selectedWorkspace.chatMessages || []).length} messages exchanged.` : 'Be the first to start a discussion!'}`}</li>
                  </ul>
                  <div className="ai-sparkle"><Sparkle size={20}/></div>
                </>
              ) : null}
            </div>

            <div className="sidebar-card" style={{padding: '1.25rem'}}>
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

            <div className="sidebar-card" style={{padding: '1.25rem'}}>
              <h3>Upcoming Milestones</h3>
              {workspaceTasks && workspaceTasks.filter(t => t.status !== 'done' && t.status !== 'completed').length > 0 ? (
                workspaceTasks.filter(t => t.status !== 'done' && t.status !== 'completed').slice(0, 3).map((ms, i) => {
                  let d = ms.dueDate ? new Date(ms.dueDate) : new Date();
                  return (
                    <div className="milestone-box" key={i}>
                      <div className="milestone-date"><span>{d.toLocaleString('default', { month: 'short' }).toUpperCase()}</span><span>{d.getDate()}</span></div>
                      <div className="milestone-text"><h5>{ms.title}</h5><p style={{fontSize:'0.75rem', opacity:0.8}}>{ms.desc || 'Pending task requirement'}</p></div>
                      <div className="milestone-icon"><CheckSquare size={18}/></div>
                    </div>
                  );
                })
              ) : (
                <div style={{textAlign: 'center', padding: '1.5rem 0'}}>
                   <Calendar size={24} style={{opacity: 0.5, marginBottom: '0.5rem', color: 'var(--text-gray)'}} />
                   <p style={{fontSize: '0.85rem', color: 'var(--text-gray)'}}>No upcoming milestones.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showEditCoverModal && (
          <div className="modal-overlay">
            <motion.div className="modal-content" initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}}>
              <button className="modal-close" onClick={() => setShowEditCoverModal(false)}><X size={20}/></button>
              <h2>Edit Workspace Cover</h2>
              <p>Paste a new image URL to customize your workspace hero banner.</p>
              <form onSubmit={handleChangeCover}>
                <div className="form-group">
                  <label>Image URL</label>
                  <input type="url" required value={newCoverUrl} onChange={e => setNewCoverUrl(e.target.value)} placeholder="https://images.unsplash.com/..."/>
                </div>
                <button type="submit" className="btn-primary"><ImageIcon size={18}/> Update Cover</button>
              </form>
            </motion.div>
          </div>
        )}

        {showWorkspaceTools && (
          <div className="fs-tools-overlay">
            <motion.div className="fs-tools-container" initial={{y: 50, opacity: 0}} animate={{y: 0, opacity: 1}} exit={{y: 50, opacity: 0}} transition={{type: 'spring', damping: 25, stiffness: 200}}>
              <div className="fs-tools-header">
                <h2>Workspace Tools</h2>
                <button className="fs-close-btn" onClick={() => setShowWorkspaceTools(false)}><X size={24}/></button>
              </div>
              
              <div className="fs-tools-nav">
                {[
                  { id: 'chat', name: 'Chat', icon: <MessageSquare size={16}/>, color: '#0ea5e9' },
                  { id: 'polls', name: 'Polls', icon: <BarChart2 size={16}/>, color: '#8b5cf6' },
                  { id: 'tasks', name: 'Tasks', icon: <CheckSquare size={16}/>, color: '#10b981' },
                  { id: 'notes', name: 'Notes', icon: <FileText size={16}/>, color: '#ec4899' },
                  { id: 'expenses', name: 'Expenses', icon: <DollarSign size={16}/>, color: '#f59e0b' },
                  { id: 'ai', name: 'AI Planner', icon: <Brain size={16}/>, color: '#14b8a6' },
                  { id: 'maps', name: 'Maps', icon: <MapPinned size={16}/>, color: '#f43f5e' },
                  { id: 'videocall', name: 'Video Call', icon: <Video size={16}/>, color: '#ef4444' },
                  { id: 'fusion', name: 'Fusion', icon: <LinkIcon size={16}/>, color: '#8b5cf6' },
                ].map(tool => {
                  const totalUnread = tool.id === 'chat' ? Object.values(unreadChannels).reduce((a, b) => a + b, 0) : 0;
                  return (
                    <button key={tool.id} className={`fs-nav-tab ${activeTool === tool.id ? 'active' : ''}`} onClick={() => { setActiveTool(tool.id); if (tool.id === 'chat') setUnreadChannels({}); }}
                      style={{'--tab-color': tool.color, position: 'relative'}}>
                      <span className="fs-tab-icon" style={{color: tool.color, backgroundColor: `${tool.color}15`}}>{tool.icon}</span>
                      {tool.name}
                      {totalUnread > 0 && (
                        <span className="tab-badge-dot" style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 900, minWidth: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', boxShadow: '0 0 5px rgba(239, 68, 68, 0.5)', zIndex: 10 }}>
                          {totalUnread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="fs-tools-body">
                {activeTool === 'chat' && (
                  <div className="fs-chat-layout">
                    <div className="fs-chat-sidebar">
                      <div className="fs-chat-header">
                        <div className="fs-chat-icon"><MessageSquare size={20} color="white"/></div>
                        <div>
                          <h3 style={{fontSize:'1rem', fontWeight:800, margin:0}}>{selectedWorkspace.name} Chat</h3>
                          <span style={{fontSize:'0.75rem', color:'var(--text-gray)'}}>{Math.max(1, membersArr.length)} Member{Math.max(1, membersArr.length) !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      
                      <div className="fs-sidebar-section">
                        <h4>Channels <Plus size={14} style={{float:'right', cursor:'pointer'}} onClick={() => {
                          const newCh = window.prompt("Enter new channel name (lowercase, no spaces):");
                          if (newCh && newCh.trim()) {
                            const formatted = newCh.trim().toLowerCase().replace(/\s+/g, '-');
                            const currentChannels = selectedWorkspace.channels || ['general', 'plans & ideas', 'stay & booking', 'activities', 'food', 'travel-info'];
                            if (!currentChannels.includes(formatted)) {
                              updateWorkspaceData('channels', [...currentChannels, formatted]);
                              setActiveChannel(formatted);
                            }
                          }
                        }}/></h4>
                        <ul className="fs-channel-list">
                          {(selectedWorkspace.channels || ['general', 'plans & ideas', 'stay & booking', 'activities', 'food', 'travel-info']).map(ch => {
                            const unreadCount = unreadChannels[ch] || 0;
                            return (
                              <li key={ch} className={`${activeChannel === ch ? 'active' : ''} ${unreadCount > 0 ? 'has-unread' : ''}`} onClick={() => { setActiveChannel(ch); setUnreadChannels(p => ({ ...p, [ch]: 0 })); }} style={{cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
                                <span><span className="hash">#</span> {ch}</span>
                                {unreadCount > 0 && (
                                  <span className="unread-dot-badge" style={{
                                    background: '#ef4444',
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    borderRadius: '10px',
                                    padding: '2px 6px',
                                    minWidth: '18px',
                                    height: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                                  }}>
                                    {unreadCount}
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      <div className="fs-sidebar-section">
                        <h4>Direct Messages <Plus size={14} style={{float:'right', cursor:'pointer'}} onClick={() => {
                          const userToMsg = window.prompt("Enter the exact name of the member you want to message:");
                          if (userToMsg && userToMsg.trim()) {
                            setActiveChannel(userToMsg.trim());
                          }
                        }}/></h4>
                        <ul className="fs-dm-list">
                          {selectedWorkspace.members && selectedWorkspace.members.map((m, i) => {
                            const info = resolveMemberInfo(m);
                            const unreadCount = unreadChannels[info.name] || 0;
                            return (
                              <li key={i} className={`${activeChannel === info.name ? 'active' : ''} ${unreadCount > 0 ? 'has-unread' : ''}`} onClick={() => { setActiveChannel(info.name); setUnreadChannels(p => ({ ...p, [info.name]: 0 })); }} style={{cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: activeChannel === info.name ? 'var(--bg-main)' : 'transparent', paddingRight: '0.5rem'}}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                  <div className="dm-avatar">
                                    <img src={`https://ui-avatars.com/api/?name=${info.name}&background=random&color=fff`} alt={info.name}/>
                                    <div className={`status ${info.isMe ? 'online' : 'offline'}`}></div>
                                  </div>
                                  <span>{info.name} {info.isMe && <span style={{fontSize: '0.75rem', color: 'var(--text-gray)', fontWeight: 500}}>(You)</span>}</span>
                                </div>
                                {unreadCount > 0 && (
                                  <span className="unread-dot-badge" style={{
                                    background: '#ef4444',
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    borderRadius: '10px',
                                    padding: '2px 6px',
                                    minWidth: '18px',
                                    height: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                                  }}>
                                    {unreadCount}
                                  </span>
                                )}
                              </li>
                            );
                          })}
                          
                          {/* If the active channel is a custom DM not in members list, show it anyway */}
                          {activeChannel !== 'general' && !(selectedWorkspace.channels || ['general', 'plans & ideas', 'stay & booking', 'activities', 'food', 'travel-info']).includes(activeChannel) && (!selectedWorkspace.members || !selectedWorkspace.members.find(m => (m.name || m.email) === activeChannel)) && (
                            <li className="active" style={{cursor: 'pointer', background: 'var(--bg-main)'}}>
                              <div className="dm-avatar">
                                <img src={`https://ui-avatars.com/api/?name=${activeChannel}&background=random&color=fff`} alt={activeChannel}/>
                                <div className="status online"></div>
                              </div>
                              <span>{activeChannel}</span>
                            </li>
                          )}
                        </ul>

                      </div>
                    </div>

                    <div className="fs-chat-main">
                      <div className="fs-chat-topbar">
                        <div style={{display:'flex', alignItems:'center', gap:'0.5rem', fontWeight:700}}>
                          {(selectedWorkspace.channels || ['general', 'plans & ideas', 'stay & booking', 'activities', 'food', 'travel-info']).includes(activeChannel) ? (
                            <><span className="hash">#</span> {activeChannel}</>
                          ) : (
                            <><MessageSquare size={16}/> {activeChannel}</>
                          )}
                        </div>
                        <div className="fs-chat-actions">
                          <Search size={18}/>
                          <Star size={18}/>
                          <MessageSquare size={18}/>
                          <Users size={18}/>
                        </div>
                      </div>

                      <div className="fs-chat-messages">
                        {(getFilteredMessages().length === 0) ? (
                          <div style={{textAlign: 'center', padding: '3rem', color: 'var(--text-gray)'}}>
                            <MessageSquare size={32} style={{opacity: 0.5, marginBottom: '1rem'}} />
                            <p>This is the start of the <strong>{activeChannel}</strong> channel.</p>
                          </div>
                        ) : (
                          getFilteredMessages().map((msg, i) => (
                            <div key={msg.id} className={`chat-msg-row ${msg.sender === currentUser.username ? 'me' : ''}`}>
                              <img src={msg.avatar} alt={msg.sender} className="msg-avatar"/>
                              <div className="msg-content">
                                <div className="msg-meta"><strong>{msg.sender === currentUser.username ? 'You' : msg.sender}</strong> <span>{msg.time}</span></div>
                                <div className={`msg-bubble ${msg.sender === currentUser.username ? 'my-bubble' : ''}`}>
                                  {msg.image ? (
                                    <img src={msg.image} alt="Attachment" style={{maxWidth:'100%', borderRadius:'8px', maxHeight:'200px', objectFit:'cover'}} />
                                  ) : msg.audio ? (
                                    <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><Mic size={16}/> {msg.text}</div>
                                  ) : (
                                    msg.text
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="fs-chat-input-area" style={{padding: '1rem 1.5rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-light)', position: 'relative'}}>
                        {showEmojis && (
                          <div style={{position:'absolute', bottom:'100%', left:'1.5rem', background:'var(--bg-card)', padding:'0.5rem', borderRadius:'8px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', display:'flex', gap:'0.5rem', zIndex:10}}>
                            {['😀','😂','❤️','👍','🙏','🎉'].map(emoji => (
                              <span key={emoji} style={{fontSize:'1.5rem', cursor:'pointer'}} onClick={() => { setChatMessage(c => c + emoji); setShowEmojis(false); }}>{emoji}</span>
                            ))}
                          </div>
                        )}
                        <input type="file" accept="image/*" ref={fileInputRef} style={{display:'none'}} onChange={handleFileUpload} />
                        <form className="wa-chat-input-form" onSubmit={handleSendChatMessage}>
                          <div className="wa-input-tools-left">
                            <button type="button" title="Emojis" onClick={() => setShowEmojis(!showEmojis)}><Smile size={24}/></button>
                            <button type="button" title="Attach" onClick={() => fileInputRef.current.click()}><Paperclip size={24}/></button>
                          </div>
                          
                          <input type="text" placeholder={isRecording ? "Recording audio... (2s)" : "Type a message"} value={chatMessage} onChange={e => setChatMessage(e.target.value)} disabled={isRecording} />
                          
                          <div className="wa-input-tools-right">
                            {chatMessage.trim() ? (
                              <button type="submit" className="wa-send-active"><Send size={20}/></button>
                            ) : (
                              <button type="button" title="Voice Message" onClick={handleVoiceNote} style={{color: isRecording ? '#ef4444' : '#64748b'}}><Mic size={24}/></button>
                            )}
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
                      <button className="btn-primary" onClick={handleCreatePoll}><Plus size={16}/> Create Poll</button>
                    </div>
                    <div className="polls-list">
                      {(!selectedWorkspace.polls || selectedWorkspace.polls.length === 0) ? (
                         <div style={{textAlign: 'center', padding: '3rem', color: 'var(--text-gray)'}}>
                           <BarChart2 size={32} style={{opacity: 0.5, marginBottom: '1rem'}} />
                           <p>No active polls. Create one to get the team's opinion!</p>
                         </div>
                      ) : (
                        selectedWorkspace.polls.map(poll => (
                          <div key={poll.id} className="poll-card-large">
                            <h4>{poll.question}</h4>
                            <p style={{fontSize:'0.85rem', color:'var(--text-gray)', marginBottom:'1rem'}}>Created by {poll.creator} • {poll.totalVotes} votes</p>
                            {poll.options.map((opt, i) => {
                              const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                              const isMyVote = poll.votedBy && poll.votedBy[currentUser.username] === i;
                              
                              // Find all users who voted for this specific option
                              const votersForThisOption = poll.votedBy ? Object.entries(poll.votedBy).filter(([uname, optIdx]) => optIdx === i).map(([uname]) => uname) : [];

                              return (
                                <div key={i} className="poll-option-large" style={{cursor: 'pointer', border: isMyVote ? `2px solid ${opt.color}` : '1px solid transparent', padding: '0.75rem', borderRadius: '12px', marginBottom: '0.75rem', transition: '0.2s', background: isMyVote ? `${opt.color}10` : 'transparent'}} onClick={() => handleVotePoll(poll.id, i)}>
                                  <div className="poll-opt-info">
                                    <span style={{fontWeight: isMyVote ? 700 : 500, color: isMyVote ? opt.color : 'inherit'}}>
                                      {opt.text} {isMyVote && <CheckCircle size={14} style={{display: 'inline', marginLeft: '4px', verticalAlign: 'text-bottom'}} />}
                                    </span> 
                                    <span>{pct}% ({opt.votes} votes)</span>
                                  </div>
                                  <div className="poll-opt-bar"><div className="poll-opt-fill" style={{width: `${pct}%`, background: opt.color}}></div></div>
                                  
                                  {/* RENDER AVATARS OF WHO VOTED */}
                                  {votersForThisOption.length > 0 && (
                                    <div style={{display: 'flex', gap: '0.25rem', marginTop: '0.5rem', flexWrap: 'wrap'}}>
                                      {votersForThisOption.map(voter => (
                                        <img 
                                          key={voter}
                                          src={`https://ui-avatars.com/api/?name=${voter}&background=random&color=fff`} 
                                          alt={voter} 
                                          title={voter}
                                          style={{width: '20px', height: '20px', borderRadius: '50%', border: '1px solid white'}}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTool === 'notes' && (
                  <div className="fs-tool-generic" style={{display: 'flex', flexDirection: 'column', padding: 0, height: '100%', minHeight: '540px'}}>
                    <RichNotesEditor
                      notes={selectedWorkspace.notes || []}
                      currentUser={currentUser}
                      onSave={(note) => {
                        const existingNotes = selectedWorkspace.notes || [];
                        const alreadyExists = existingNotes.find(n => n.id === note.id);
                        const updatedNotes = alreadyExists
                          ? existingNotes.map(n => n.id === note.id ? note : n)
                          : [note, ...existingNotes];
                        updateWorkspaceData('notes', updatedNotes);
                      }}
                      onDelete={(noteId) => {
                        const updatedNotes = (selectedWorkspace.notes || []).filter(n => n.id !== noteId);
                        updateWorkspaceData('notes', updatedNotes);
                      }}
                    />
                  </div>
                )}

                {activeTool === 'tasks' && (
                  <div className="fs-tool-generic" style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
                    <div className="generic-header">
                      <h3>Active Tasks</h3>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {workspaceTasks.length === 0 ? (
                        <div style={{textAlign: 'center', padding: '3rem', color: 'var(--text-gray)'}}>
                           <CheckSquare size={32} style={{opacity: 0.5, marginBottom: '1rem'}} />
                           <p>No active tasks yet. Go to the full Tasks board to create some!</p>
                        </div>
                      ) : (
                        workspaceTasks.map(task => (
                          <div key={task._id} style={{
                            padding: '1rem', background: 'var(--bg-main)', border: '1px solid var(--border-light)',
                            borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                          }}>
                            <div>
                              <h4 style={{marginBottom:'0.25rem', fontSize:'0.95rem'}}>{task.title}</h4>
                              <span style={{
                                fontSize:'0.75rem', padding:'0.2rem 0.6rem', borderRadius:'20px', fontWeight: 'bold',
                                background: task.status==='done'?'#d1fae5': task.status==='inprogress'?'#dbeafe':'#f3f4f6',
                                color: task.status==='done'?'#059669': task.status==='inprogress'?'#2563eb':'#4b5563',
                                textTransform:'capitalize'
                              }}>{task.status}</span>
                            </div>
                            <span style={{fontSize:'0.85rem', color:'var(--text-gray)', fontWeight: 'bold'}}>{task.dueDate || 'No Date'}</span>
                          </div>
                        ))
                      )}
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                      <button className="btn-primary" onClick={() => { setShowWorkspaceTools(false); navigate('/teamhub'); }}>
                        Open Full Tasks Kanban <ArrowRight size={16}/>
                      </button>
                    </div>
                  </div>
                )}

                {activeTool === 'expenses' && (
                  <div className="fs-tool-generic" style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
                    <div className="generic-header">
                      <h3>Recent Expenses</h3>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {workspaceExpenses.length === 0 ? (
                        <div style={{textAlign: 'center', padding: '3rem', color: 'var(--text-gray)'}}>
                           <DollarSign size={32} style={{opacity: 0.5, marginBottom: '1rem'}} />
                           <p>No active expenses. Securely log your first bill to start tracking!</p>
                        </div>
                      ) : (
                        workspaceExpenses.map(exp => (
                          <div key={exp._id} style={{
                            padding: '1rem', background: 'var(--bg-main)', border: '1px solid var(--border-light)',
                            borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                          }}>
                            <div>
                              <h4 style={{marginBottom:'0.25rem', fontSize:'0.95rem'}}>{exp.title}</h4>
                              <span style={{ fontSize:'0.75rem', color: 'var(--text-gray)' }}>Paid by {exp.paidBy}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <h4 style={{marginBottom:'0.25rem', fontSize:'1rem', color: 'var(--primary-indigo)'}}>₹{exp.amount.toLocaleString()}</h4>
                              <span style={{ fontSize:'0.75rem', color: 'var(--text-gray)' }}>{exp.date}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                      <button className="btn-primary" onClick={() => { setShowWorkspaceTools(false); navigate('/expenses'); }}>
                        Open Full Expenses Ledger <ArrowRight size={16}/>
                      </button>
                    </div>
                  </div>
                )}

                {activeTool === 'ai' && (
                  <div className="fs-tool-generic" style={{display:'flex', flexDirection:'column'}}>
                    <div className="generic-header">
                      <h3>AI Planner</h3>
                    </div>
                    <div className="fs-ai-chat-area" style={{flex:1, background:'var(--bg-main)', borderRadius:'12px', padding:'2rem', display:'flex', flexDirection:'column', gap:'1rem', overflowY:'auto'}}>
                      {(!selectedWorkspace.aiMessages || selectedWorkspace.aiMessages.length === 0) ? (
                        <div className="ai-bubble" style={{background:'var(--bg-card)', padding:'1.5rem', borderRadius:'16px', border:'1px solid var(--border-light)', maxWidth:'80%'}}>
                          <Brain size={24} color="#14b8a6" style={{marginBottom:'0.5rem'}}/>
                          <p style={{margin:0, lineHeight:1.6, color: 'var(--text-dark)'}}>Hello! I'm your workspace AI. I can generate an itinerary, suggest budgeting tips, assign starter tasks to members, or analyze your expenses. What do you need help with?</p>
                        </div>
                      ) : (
                        selectedWorkspace.aiMessages.map((msg, i) => (
                          <div key={i} className={`ai-bubble ${msg.role === 'user' ? 'me' : ''}`} style={{
                            background: msg.role === 'user' ? '#14b8a6' : 'var(--bg-card)',
                            color: msg.role === 'user' ? 'white' : 'var(--text-dark)',
                            padding:'1.5rem', borderRadius:'16px', border: msg.role === 'user' ? 'none' : '1px solid var(--border-light)',
                            maxWidth:'80%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start'
                          }}>
                            {msg.role === 'ai' && <Brain size={24} color="#14b8a6" style={{marginBottom:'0.5rem'}}/>}
                            <p style={{margin:0, lineHeight:1.6, whiteSpace: 'pre-wrap'}}>{msg.text}</p>
                            {msg.role === 'ai' && msg.text.match(/^[-*] |^\d+\. /m) && (
                              <button 
                                onClick={() => !extractedAiMessages[msg.text] && handleExtractTasks(msg.text)}
                                disabled={extractedAiMessages[msg.text]}
                                style={{
                                  marginTop: '1rem',
                                  padding: '0.5rem 1rem',
                                  background: extractedAiMessages[msg.text] ? 'var(--bg-main)' : 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                                  color: extractedAiMessages[msg.text] ? '#14b8a6' : 'white',
                                  border: extractedAiMessages[msg.text] ? '1px solid #14b8a6' : 'none',
                                  borderRadius: '20px',
                                  fontSize: '0.85rem',
                                  cursor: extractedAiMessages[msg.text] ? 'default' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  boxShadow: extractedAiMessages[msg.text] ? 'none' : '0 4px 12px rgba(20, 184, 166, 0.2)',
                                  transition: 'all 0.2s ease',
                                  opacity: extractedAiMessages[msg.text] ? 0.8 : 1
                                }}
                                onMouseEnter={(e) => { if(!extractedAiMessages[msg.text]) e.currentTarget.style.transform = 'scale(1.02)' }}
                                onMouseLeave={(e) => { if(!extractedAiMessages[msg.text]) e.currentTarget.style.transform = 'scale(1)' }}
                              >
                                {extractedAiMessages[msg.text] ? (
                                  <><CheckCircle size={14} /> Tasks Created</>
                                ) : (
                                  <><Wand2 size={14} /> Create Tasks from List</>
                                )}
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="fs-chat-input-area" style={{marginTop:'1rem', padding: 0}}>
                      <form 
                        className="fs-chat-input-box" 
                        onSubmit={handleSendAiMessage} 
                        style={{
                          display: 'flex',
                          flexDirection: 'row', 
                          alignItems: 'center', 
                          background: 'rgba(255, 255, 255, 0.8)',
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(20, 184, 166, 0.2)', 
                          borderRadius: '24px', 
                          padding: '0.5rem 0.5rem 0.5rem 1.5rem',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 12px 40px rgba(20, 184, 166, 0.15)'}
                        onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.05)'}
                      >
                        <input 
                          type="text" 
                          style={{
                            flex: 1, 
                            border: 'none', 
                            background: 'transparent', 
                            outline: 'none', 
                            fontSize: '1rem', 
                            color: 'var(--text-dark)',
                            fontWeight: '500',
                            letterSpacing: '0.3px',
                            padding: '0.5rem 0'
                          }} 
                          placeholder="Ask the AI Planner..." 
                          value={aiInput} 
                          onChange={e => setAiInput(e.target.value)} 
                        />
                        <button 
                          type="submit" 
                          className="fs-send-btn" 
                          style={{
                            background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', 
                            marginLeft: '1rem', 
                            padding: '0.8rem 1.5rem', 
                            borderRadius: '20px', 
                            border: 'none', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            color: 'white', 
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(20, 184, 166, 0.3)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(20, 184, 166, 0.4)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.3)'; }}
                        >
                          <Send size={18} />
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {activeTool === 'videocall' && (
                  <div className="fs-tool-generic" style={{display:'flex', flexDirection:'column', padding: 0, height: '100%', minHeight: '540px'}}>
                    <VideoCall
                      workspace={selectedWorkspace}
                      currentUser={currentUser}
                      socket={socketRef.current}
                      workspaceId={getSpaceId(selectedWorkspace)}
                      autoJoin={autoJoinCall}
                      onCallJoined={() => setAutoJoinCall(false)}
                    />
                  </div>
                )}

                {activeTool === 'fusion' && (
                  <div className="fs-tool-generic" style={{display: 'flex', flexDirection: 'column', padding: 0, height: '100%', minHeight: '540px'}}>
                    <WorkspaceFusion 
                      workspace={selectedWorkspace} 
                      currentUser={currentUser} 
                      onRefreshWorkspace={async () => {
                        const wsId = selectedWorkspace._id || selectedWorkspace.id;
                        try {
                          const res = await fetch(`http://localhost:5000/api/spaces/${wsId}`);
                          if (res.ok) {
                            const fresh = await res.json();
                            setSelectedWorkspace(prev => ({ ...prev, ...fresh }));
                          }
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                    />
                  </div>
                )}

                {activeTool === 'maps' && (
                  <div className="fs-tool-generic" style={{display:'flex', flexDirection:'column', height: '100%'}}>
                    <div className="generic-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <h3>Interactive Map</h3>
                      <form 
                        onSubmit={(e) => { e.preventDefault(); setMapQuery(mapSearchInput); }}
                        style={{display: 'flex', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.4rem', borderRadius: '12px', border: '1px solid var(--border-light)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'}}
                      >
                        <input 
                          type="text" 
                          placeholder="Search Google Maps..." 
                          value={mapSearchInput} 
                          onChange={(e) => setMapSearchInput(e.target.value)}
                          style={{padding: '0.4rem 0.8rem', border: 'none', background: 'transparent', outline: 'none', width: '300px', color: 'var(--text-dark)'}}
                        />
                        <button type="submit" style={{background: 'var(--primary-blue)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'}}>
                          Search
                        </button>
                      </form>
                    </div>
                    <div style={{flex: 1, background: 'var(--bg-main)', borderRadius: '12px', overflow: 'hidden', marginTop: '1rem', border: '1px solid var(--border-light)'}}>
                      <iframe 
                        width="100%" 
                        height="100%" 
                        style={{border: 0}}
                        loading="lazy" 
                        allowFullScreen 
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery || selectedWorkspace.location || 'Bangalore, India')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                      ></iframe>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {showInviteModal && (
          <div className="modal-overlay">
            <motion.div className="modal-content" initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} style={{maxWidth: '450px', textAlign: 'center'}}>
              <button className="modal-close" onClick={() => setShowInviteModal(false)}><X size={20}/></button>
              <h2 style={{marginBottom: '0.5rem'}}>Invite to {selectedWorkspace.name}</h2>
              <p style={{color: 'var(--text-gray)', marginBottom: '1.5rem', fontSize: '0.9rem'}}>Anyone with this link can join the workspace.</p>
              
              <div style={{display: 'flex', gap: '0.5rem', marginBottom: '2rem'}}>
                <input type="text" readOnly value={`${window.location.origin}/invite/${selectedWorkspace.inviteCode || selectedWorkspace.id}`} style={{flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-main)', color: 'var(--text-dark)', fontWeight: 600, fontSize: '0.85rem'}} />
                <button className="btn-primary" onClick={() => {
                  const link = `${window.location.origin}/invite/${selectedWorkspace.inviteCode || selectedWorkspace.id}`;
                  navigator.clipboard.writeText(link)
                    .then(() => alert('Secure invite link copied to clipboard!'))
                    .catch(() => alert('Failed to copy. Please copy manually.'));
                }} style={{width: 'auto', padding: '0 1.5rem'}}>Copy</button>
              </div>

              <div style={{borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem'}}>
                <h4 style={{marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Or share via</h4>
                <div style={{display: 'flex', gap: '1rem', justifyContent: 'center'}}>
                  <button className="social-invite-btn whatsapp" onClick={() => alert('Opening WhatsApp...')}><MessageCircle size={22}/></button>
                  <button className="social-invite-btn instagram" onClick={() => alert('Opening Instagram...')}><Camera size={22}/></button>
                  <button className="social-invite-btn x-twitter" onClick={() => alert('Opening X (Twitter)...')}><X size={22}/></button>
                  <button className="social-invite-btn telegram" onClick={() => alert('Opening Telegram...')}><Send size={22}/></button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showCreatePollModal && (
          <div className="modal-overlay">
            <motion.div className="modal-content" initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} style={{maxWidth: '500px'}}>
              <button className="modal-close" onClick={() => setShowCreatePollModal(false)}><X size={20}/></button>
              <h2>Create a Poll</h2>
              <p style={{color: 'var(--text-gray)', marginBottom: '1.5rem'}}>Gather opinions from your workspace members.</p>
              
              <form onSubmit={submitCreatePoll}>
                <div className="form-group">
                  <label>Poll Question</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Where should we go for lunch?" 
                    value={pollQuestion} 
                    onChange={e => setPollQuestion(e.target.value)} 
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label>Options</label>
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} style={{display: 'flex', gap: '0.5rem', marginBottom: '0.75rem'}}>
                      <input 
                        type="text" 
                        placeholder={`Option ${idx + 1}`} 
                        value={opt} 
                        onChange={e => {
                          const newOpts = [...pollOptions];
                          newOpts[idx] = e.target.value;
                          setPollOptions(newOpts);
                        }} 
                        required 
                      />
                      {pollOptions.length > 2 && (
                        <button 
                          type="button" 
                          className="btn-outline" 
                          style={{padding: '0 1rem'}}
                          onClick={() => {
                            const newOpts = pollOptions.filter((_, i) => i !== idx);
                            setPollOptions(newOpts);
                          }}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {pollOptions.length < 5 && (
                    <button 
                      type="button" 
                      className="btn-link" 
                      style={{color: 'var(--primary-blue)', fontWeight: 600, fontSize: '0.9rem', marginTop: '0.5rem'}}
                      onClick={() => setPollOptions([...pollOptions, ''])}
                    >
                      + Add another option
                    </button>
                  )}
                </div>
                
                <button type="submit" className="btn-primary" style={{marginTop: '1rem'}}>Publish Poll</button>
              </form>
            </motion.div>
          </div>
        )}
        {chatToast && (
          <motion.div 
            className="chat-toast-notification"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            onClick={() => {
              setActiveTool('chat');
              setActiveChannel(chatToast.channel || 'general');
              setUnreadChannels(prev => ({ ...prev, [chatToast.channel || 'general']: 0 }));
              setShowWorkspaceTools(true);
              setChatToast(null);
            }}
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '16px',
              padding: '1rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              cursor: 'pointer',
              zIndex: 9999,
              maxWidth: '320px',
              width: '100%'
            }}
          >
            <div style={{ position: 'relative' }}>
              <img 
                src={chatToast.avatar || `https://ui-avatars.com/api/?name=${chatToast.sender}&background=0d8f80&color=fff`} 
                alt={chatToast.sender}
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <span style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981', border: '2px solid white' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                <strong style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>{chatToast.sender}</strong>
                <span style={{ fontSize: '0.7rem', color: '#0ea5e9', fontWeight: 700 }}>#{chatToast.channel || 'general'}</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-gray)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {chatToast.text || 'Sent an attachment'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ── INCOMING VIDEO CALL NOTIFICATION OVERLAY ─────────────────── */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div
            key="incoming-call-overlay"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              zIndex: 99999,
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              border: '1px solid rgba(14,165,233,0.3)',
              borderRadius: '20px',
              padding: '1.5rem',
              maxWidth: '340px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(14,165,233,0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              fontFamily: 'Outfit, sans-serif'
            }}
          >
            {/* Animated ring indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img
                  src={incomingCall.callerAvatar}
                  alt={incomingCall.callerName}
                  style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #0ea5e9' }}
                />
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  style={{
                    position: 'absolute', inset: '-6px',
                    borderRadius: '50%',
                    border: '2px solid #0ea5e9',
                    pointerEvents: 'none'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#0ea5e9', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Incoming Video Call</p>
                <p style={{ margin: '0.2rem 0 0', fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>{incomingCall.callerName}</p>
                <p style={{ margin: '0.1rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>{incomingCall.workspaceName}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setIncomingCall(null);
                  setAutoJoinCall(true);
                  setActiveTool('videocall');
                  setShowWorkspaceTools(true);
                }}
                style={{
                  flex: 1, background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white', border: 'none', borderRadius: '12px',
                  padding: '0.75rem', fontSize: '0.9rem', fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '0.5rem',
                  boxShadow: '0 4px 16px rgba(16,185,129,0.4)'
                }}
              >
                <Video size={16} /> Accept
              </button>
              <button
                onClick={() => setIncomingCall(null)}
                style={{
                  flex: 1, background: 'rgba(239,68,68,0.15)',
                  color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '12px', padding: '0.75rem',
                  fontSize: '0.9rem', fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '0.5rem'
                }}
              >
                <PhoneOff size={16} /> Decline
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkspacePage;