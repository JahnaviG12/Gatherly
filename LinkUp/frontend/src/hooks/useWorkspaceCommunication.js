/**
 * useWorkspaceCommunication.js
 * Handles chat, notes, polls, AI planner, and file upload logic.
 */
import { useState, useRef, useMemo, useEffect } from 'react';
import { getSpaceId } from './useWorkspaceData';

export const useWorkspaceCommunication = ({
  currentUser, selectedWorkspace, setSelectedWorkspace,
  activeToolRef, activeChannelRef, socketRef, logActivity
}) => {
  const [activeTool, setActiveTool] = useState('chat');
  const [showWorkspaceTools, setShowWorkspaceTools] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [activeChannel, setActiveChannel] = useState('general');
  const [noteContent, setNoteContent] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [aiInput, setAiInput] = useState('');
  const [extractedAiMessages, setExtractedAiMessages] = useState({});
  const [showCreatePollModal, setShowCreatePollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [showEmojis, setShowEmojis] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef(null);

  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const heroSlideImages = useMemo(() => {
    const base = selectedWorkspace?.cover || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c';
    return [base, 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80'];
  }, [selectedWorkspace?.cover]);

  useEffect(() => {
    if (!selectedWorkspace) return;
    const timer = setInterval(() => setCurrentHeroIndex(p => (p + 1) % heroSlideImages.length), 5000);
    return () => clearInterval(timer);
  }, [selectedWorkspace, heroSlideImages.length]);

  useEffect(() => { if (activeToolRef) activeToolRef.current = activeTool; }, [activeTool]);
  useEffect(() => { if (activeChannelRef) activeChannelRef.current = activeChannel; }, [activeChannel]);

  const getFilteredMessages = () => {
    if (!selectedWorkspace?.chatMessages) return [];
    const pubChans = selectedWorkspace.channels || ['general', 'plans & ideas', 'stay & booking', 'activities', 'food', 'travel-info'];
    const isPublic = pubChans.includes(activeChannel);
    if (isPublic) return selectedWorkspace.chatMessages.filter(m => (m.channel || 'general').toLowerCase().trim() === activeChannel.toLowerCase().trim());
    const curName = (currentUser?.username || '').toLowerCase().trim();
    const curEmail = (currentUser?.email || '').toLowerCase().trim();
    const target = activeChannel.toLowerCase().trim();
    return selectedWorkspace.chatMessages.filter(m => {
      const mc = m.channel || 'general';
      if (pubChans.includes(mc)) return false;
      const ms = (m.sender || '').toLowerCase().trim();
      const mch = mc.toLowerCase().trim();
      return ((ms === curName || ms === curEmail) && mch === target) || (ms === target && (mch === curName || mch === curEmail));
    });
  };

  const sendCustomMessage = async (content) => {
    if (!selectedWorkspace) return;
    const spaceId = getSpaceId(selectedWorkspace);
    const newMsg = { id: Date.now().toString(), sender: currentUser.username, avatar: `https://ui-avatars.com/api/?name=${currentUser.username}&background=0d8f80&color=fff`, text: content.text || '', image: content.image || null, audio: content.audio || null, channel: activeChannel, time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) };
    setSelectedWorkspace(prev => { if (!prev) return prev; const updated = { ...prev, chatMessages: [...(prev.chatMessages || []), newMsg] }; try { localStorage.setItem('gatherly_active_workspace', JSON.stringify(updated)); } catch(e) {} return updated; });
    if (socketRef.current) socketRef.current.emit('send_chat_message', { workspaceId: spaceId, message: newMsg });
    try { await fetch(`http://localhost:5000/api/spaces/${spaceId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sender: newMsg.sender, avatar: newMsg.avatar, text: newMsg.text, image: newMsg.image, audio: newMsg.audio, channel: newMsg.channel, isPrivate: activeChannel === 'private' }) }); } catch(e) {}
    logActivity(activeChannel === 'private' ? 'sent a private message.' : 'posted a message in chat.');
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedWorkspace) return;
    sendCustomMessage({ text: chatMessage });
    setChatMessage('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => sendCustomMessage({ image: ev.target.result });
    reader.readAsDataURL(file);
  };

  const handleVoiceNote = () => {
    setIsRecording(true);
    setTimeout(() => { setIsRecording(false); sendCustomMessage({ audio: true, text: '🎤 Voice Message (0:02)' }); }, 2000);
  };

  const handleSendAiMessage = async (e) => {
    e.preventDefault();
    if (!aiInput.trim() || !selectedWorkspace) return;
    const defaultMsg = { role: 'ai', text: "Hello! I'm your workspace AI. How can I help?" };
    const currentMsgs = selectedWorkspace.aiMessages || [defaultMsg];
    const newMsgs = [...currentMsgs, { role: 'user', text: aiInput }];
    const userInput = aiInput; setAiInput('');
    setSelectedWorkspace(prev => prev ? { ...prev, aiMessages: newMsgs } : prev);
    try {
      const res = await fetch('http://localhost:5000/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userInput, history: currentMsgs }) });
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      setSelectedWorkspace(prev => prev ? { ...prev, aiMessages: [...newMsgs, { role: 'ai', text: data.text }] } : prev);
    } catch(err) {
      setSelectedWorkspace(prev => prev ? { ...prev, aiMessages: [...newMsgs, { role: 'ai', text: `Error: ${err.message}` }] } : prev);
    }
  };

  const handleExtractTasks = async (text) => {
    if (!selectedWorkspace) return;
    const tasksToCreate = text.split('\n').map(l => l.trim()).filter(l => l.match(/^[-*]\s+(.*)$/) || l.match(/^\d+\.\s+(.*)$/)).map(l => (l.match(/^[-*]\s+(.*)$/) || l.match(/^\d+\.\s+(.*)$/))?.[1]?.replace(/\*\*/g, '').trim()).filter(Boolean);
    if (tasksToCreate.length === 0) { alert("No list items found."); return; }
    const wId = selectedWorkspace._id || selectedWorkspace.id;
    for (const title of tasksToCreate) {
      try { await fetch('http://localhost:5000/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspaceId: wId, title, desc: 'Generated by AI Planner', priority: 'medium', status: 'todo', dueDate: new Date().toISOString().split('T')[0], creator: null }) }); } catch(e) {}
    }
    setExtractedAiMessages(p => ({ ...p, [text]: true }));
    logActivity(`used AI Planner to generate ${tasksToCreate.length} tasks.`);
    alert(`Successfully added ${tasksToCreate.length} tasks to your Kanban board!`);
  };

  const handleExtractExpenses = async (text) => {
    if (!selectedWorkspace) return;
    const expenseLines = text.split('\n').filter(l => {
      const lower = l.toLowerCase();
      return lower.includes('₹') || lower.includes('$') || lower.includes('rs') || lower.includes('inr') || lower.includes('cost') || lower.includes('price');
    });

    const matches = [];
    for (const line of expenseLines) {
      let cleanLine = line.replace(/^[-*\d.\s]+/, '').replace(/\*\*/g, '').trim();
      const amountMatch = cleanLine.match(/(?:₹|\$|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)/i) || 
                          cleanLine.match(/([\d,]+(?:\.\d+)?)\s*(?:rs\.?|inr|usd)/i) || 
                          cleanLine.match(/(\d+)/);
      if (amountMatch) {
        const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
        let title = cleanLine.replace(/(?:₹|\$|rs\.?|inr)\s*[\d,]+(?:\.\d+)?/i, '').replace(/[\d,]+(?:\.\d+)?\s*(?:rs\.?|inr|usd)/i, '').trim();
        title = title.replace(/^[:\-\s]+|[:\-\s]+$/g, '').trim();
        if (!title) title = "AI Generated Expense";
        matches.push({ title, amount });
      }
    }

    if (matches.length === 0) {
      alert("No expense items found in this AI suggestion.");
      return;
    }

    const wId = selectedWorkspace._id || selectedWorkspace.id;
    const creatorName = currentUser?.username || 'You';
    
    const membersList = Array.isArray(selectedWorkspace.members) ? selectedWorkspace.members : [];
    const membersNames = membersList.map(m => typeof m === 'object' ? m.username || m.name : String(m));
    if (membersNames.length === 0) membersNames.push(creatorName);
    
    for (const m of matches) {
      const splitAmount = Math.round((m.amount / membersNames.length) * 100) / 100;
      const splits = membersNames.map(name => ({
        user: name,
        amount: splitAmount
      }));

      try {
        await fetch('http://localhost:5000/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId: wId,
            title: m.title,
            amount: m.amount,
            category: 'Planning',
            paidBy: creatorName,
            splitWith: membersNames,
            splits: splits,
            date: new Date().toISOString().split('T')[0]
          })
        });
      } catch(e) {
        console.error('Failed to create extracted expense:', e);
      }
    }

    setExtractedAiMessages(p => ({ ...p, [`expense_${text}`]: true }));
    logActivity(`used AI Planner to extract and split ${matches.length} expenses.`);
    alert(`Successfully added and split ${matches.length} expenses amongst all members!`);
  };

  const handlePinLocation = async (loc) => {
    if (!selectedWorkspace) return;
    const spaceId = getSpaceId(selectedWorkspace);
    try {
      await fetch(`http://localhost:5000/api/spaces/${spaceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: loc })
      });
      setSelectedWorkspace(prev => prev ? { ...prev, location: loc } : prev);
      logActivity(`pinned workspace location to "${loc}".`);
      alert(`Pinned "${loc}" to Workspace Maps! Switching to Interactive Maps tool...`);
      setActiveTool('maps');
    } catch(e) {
      console.error('Failed to update workspace location:', e);
    }
  };

  const handleVotePoll = async (pollId, optionIndex) => {
    if (!selectedWorkspace || !currentUser) return;
    const spaceId = getSpaceId(selectedWorkspace);
    const updatedPolls = (selectedWorkspace.polls || []).map(p => {
      if (p.id !== pollId) return p;
      const votedBy = p.votedBy || {};
      if (votedBy[currentUser.username] === optionIndex) return p;
      const newOptions = [...p.options];
      if (votedBy[currentUser.username] !== undefined) newOptions[votedBy[currentUser.username]].votes = Math.max(0, newOptions[votedBy[currentUser.username]].votes - 1);
      else p.totalVotes = (p.totalVotes || 0) + 1;
      newOptions[optionIndex].votes += 1; votedBy[currentUser.username] = optionIndex;
      return { ...p, options: newOptions, votedBy };
    });
    setSelectedWorkspace(prev => prev ? { ...prev, polls: updatedPolls } : prev);
    try { await fetch(`http://localhost:5000/api/spaces/${spaceId}/polls`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ polls: updatedPolls }) }); } catch(e) {}
  };

  const handleCreatePoll = () => { setPollQuestion(''); setPollOptions(['', '']); setShowCreatePollModal(true); };

  const submitCreatePoll = async (e) => {
    e.preventDefault();
    if (!selectedWorkspace || !pollQuestion.trim() || pollOptions.length < 2) return;
    const spaceId = getSpaceId(selectedWorkspace);
    const filtered = pollOptions.filter(o => o.trim());
    if (filtered.length < 2) { alert("Please provide at least 2 options."); return; }
    const colors = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
    const poll = { id: Date.now().toString(), question: pollQuestion, creator: currentUser.username, totalVotes: 0, votedBy: {}, options: filtered.map((text, i) => ({ text, votes: 0, color: colors[i % colors.length] })) };
    const updated = [poll, ...(selectedWorkspace.polls || [])];
    setSelectedWorkspace(prev => prev ? { ...prev, polls: updated } : prev);
    setShowCreatePollModal(false);
    try { await fetch(`http://localhost:5000/api/spaces/${spaceId}/polls`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ polls: updated }) }); logActivity('created a new poll.'); } catch(e) {}
  };

  const handleCreateNote = () => { setActiveNoteId('new'); setNoteTitle(''); setNoteContent(''); };

  const handleSaveNote = async () => {
    if (!selectedWorkspace || !noteTitle.trim()) { alert("Note title is required."); return; }
    const spaceId = getSpaceId(selectedWorkspace);
    const current = selectedWorkspace.notes || [];
    const updated = activeNoteId === 'new'
      ? [{ id: Date.now().toString(), title: noteTitle, content: noteContent, author: currentUser.username, date: new Date().toLocaleDateString() }, ...current]
      : current.map(n => n.id === activeNoteId ? { ...n, title: noteTitle, content: noteContent, date: new Date().toLocaleDateString() } : n);
    setSelectedWorkspace(prev => prev ? { ...prev, notes: updated } : prev);
    setActiveNoteId(null);
    try { await fetch(`http://localhost:5000/api/spaces/${spaceId}/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes: updated }) }); logActivity(activeNoteId === 'new' ? 'created a new note.' : 'updated a note.'); } catch(e) {}
  };

  const handleDeleteNote = async (noteId) => {
    if (!selectedWorkspace) return;
    const spaceId = getSpaceId(selectedWorkspace);
    const updated = (selectedWorkspace.notes || []).filter(n => n.id !== noteId);
    setSelectedWorkspace(prev => prev ? { ...prev, notes: updated } : prev);
    try { await fetch(`http://localhost:5000/api/spaces/${spaceId}/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes: updated }) }); logActivity('deleted a note.'); } catch(e) {}
  };

  return {
    activeTool, setActiveTool,
    showWorkspaceTools, setShowWorkspaceTools,
    chatMessage, setChatMessage,
    activeChannel, setActiveChannel,
    noteContent, setNoteContent,
    noteTitle, setNoteTitle,
    activeNoteId,
    aiInput, setAiInput,
    extractedAiMessages,
    showCreatePollModal, setShowCreatePollModal,
    pollQuestion, setPollQuestion,
    pollOptions, setPollOptions,
    showEmojis, setShowEmojis,
    isRecording, fileInputRef,
    currentHeroIndex, heroSlideImages,
    getFilteredMessages,
    handleSendChatMessage, handleFileUpload, handleVoiceNote,
    handleSendAiMessage, handleExtractTasks, handleExtractExpenses, handlePinLocation,
    handleVotePoll, handleCreatePoll, submitCreatePoll,
    handleCreateNote, handleSaveNote, handleDeleteNote
  };
};
