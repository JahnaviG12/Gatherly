/**
 * useWorkspaceActions.js
 * Workspace CRUD: create, join, invite accept/decline, cover change,
 * module navigation, workspace seeding.
 */
import { useState } from 'react';
import { getSpaceId, fallbackImages, TEMPLATES } from './useWorkspaceData';

export const useWorkspaceActions = ({
  navigate, workspaceId,
  currentUser,
  allWorkspaces, saveWorkspaces,
  selectedWorkspace, setSelectedWorkspace, setAllWorkspaces,
  setInvites, invites
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showEditCoverModal, setShowEditCoverModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const [wizardData, setWizardData] = useState({
    type: 'Project', name: '', description: '',
    cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    color: '#0ea5e9', privacy: 'Private',
    members: [], newMemberEmail: '', newMemberRole: 'Editor',
    modules: { gallery: true, teamhub: true, expenses: true, calendar: false, pulse: true, timeline: false, files: true },
    aiPrompt: '', aiLoading: false, aiComplete: false
  });

  const updateWorkspaceData = async (key, value) => {
    if (!selectedWorkspace) return;
    const spaceId = getSpaceId(selectedWorkspace);
    try {
      await fetch(`http://localhost:5000/api/spaces/${spaceId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [key]: value }) });
    } catch(e) { console.error('Failed to sync to DB', e); }
    setSelectedWorkspace(prev => {
      if (!prev) return prev;
      const updated = { ...prev, [key]: value };
      setAllWorkspaces(prevAll => {
        const updatedAll = prevAll.map(w => getSpaceId(w) === getSpaceId(updated) ? updated : w);
        try { localStorage.setItem('gatherly_workspaces', JSON.stringify(updatedAll)); } catch(e) {}
        return updatedAll;
      });
      return updated;
    });
  };

  const logActivity = async (actionText) => {
    if (!selectedWorkspace || !currentUser) return;
    const spaceId = getSpaceId(selectedWorkspace);
    const newAct = { id: Date.now().toString(), user: currentUser.username, action: actionText, time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) };
    setSelectedWorkspace(prev => { if (!prev) return prev; const acts = prev.activities || []; return { ...prev, activities: [newAct, ...acts].slice(0, 50) }; });
    try { await fetch(`http://localhost:5000/api/spaces/${spaceId}/activity`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activity: newAct }) }); } catch(e) {}
  };

  const handleModuleNavigation = (path, state = {}) => {
    if (selectedWorkspace) {
      try { localStorage.setItem('gatherly_active_workspace', JSON.stringify(selectedWorkspace)); window.dispatchEvent(new Event('active_workspace_changed')); } catch(e) {}
    }
    const spaceId = getSpaceId(selectedWorkspace) || workspaceId;
    spaceId ? navigate(`/workspace/${spaceId}${path}`, { state }) : navigate(path, { state });
  };

  const handleEnterWorkspace = (ws) => {
    try { localStorage.setItem('gatherly_active_workspace', JSON.stringify(ws)); } catch(e) {}
    window.dispatchEvent(new Event('active_workspace_changed'));
    navigate(`/workspace/${getSpaceId(ws)}`);
  };

  const handleJoinWorkspace = async () => {
    if (!joinCode.trim()) return;
    let code = joinCode.trim();
    if (code.includes('/invite/')) code = code.split('/invite/').pop().split('/')[0];
    try {
      const res = await fetch(`http://localhost:5000/api/spaces/invite/${code}/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: currentUser.username, email: currentUser.email, userId: currentUser._id || currentUser.id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join workspace.');
      const ws = data.space;
      const updatedAll = allWorkspaces.some(w => getSpaceId(w) === getSpaceId(ws)) ? allWorkspaces.map(w => getSpaceId(w) === getSpaceId(ws) ? ws : w) : [ws, ...allWorkspaces];
      saveWorkspaces(updatedAll);
      setSelectedWorkspace(() => { try { localStorage.setItem('gatherly_active_workspace', JSON.stringify(ws)); } catch(e) {} return ws; });
      setJoinCode(''); setShowJoinModal(false);
      navigate(`/workspace/${getSpaceId(ws)}`);
    } catch(err) { alert(err.message || 'Something went wrong while joining.'); }
  };

  const handleAcceptInvite = async (invite) => {
    const ws = allWorkspaces.find(w => (w._id || w.id) === invite.id);
    if (!ws) return;
    const pendingUser = ws.pendingMembers?.find(m => m.email === currentUser.email);
    const newPending = (ws.pendingMembers || []).filter(m => m.email !== currentUser.email);
    const newMembers = [...(ws.members || []), pendingUser || { name: currentUser.username, email: currentUser.email, role: 'Editor' }];
    const updatedWs = { ...ws, pendingMembers: newPending, members: newMembers };
    setAllWorkspaces(allWorkspaces.map(w => (w._id || w.id) === invite.id ? updatedWs : w));
    setInvites(invites.filter(i => i.id !== invite.id));
    try { await fetch(`http://localhost:5000/api/spaces/${invite.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pendingMembers: newPending, members: newMembers }) }); } catch(e) {}
  };

  const handleDeclineInvite = async (invite) => {
    setInvites(invites.filter(i => i.id !== invite.id));
    const ws = allWorkspaces.find(w => (w._id || w.id) === invite.id);
    if (!ws) return;
    const newPending = (ws.pendingMembers || []).filter(m => m.email !== currentUser.email);
    setAllWorkspaces(allWorkspaces.map(w => (w._id || w.id) === invite.id ? { ...ws, pendingMembers: newPending } : w));
    try { await fetch(`http://localhost:5000/api/spaces/${invite.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pendingMembers: newPending }) }); } catch(e) {}
  };

  const handleChangeCover = async (coverDataOrUrl) => {
    const url = typeof coverDataOrUrl === 'string' ? coverDataOrUrl : newCoverUrl;
    if (!url) return;
    await updateWorkspaceData('cover', url);
    const updated = { ...selectedWorkspace, cover: url };
    try { localStorage.setItem('gatherly_active_workspace', JSON.stringify(updated)); } catch(e) {}
    window.dispatchEvent(new Event('active_workspace_changed'));
  };

  const handleUseTemplate = (template) => {
    const created = { id: Date.now().toString(), name: template.name, description: template.desc, cover: template.cover, members: [{ name: currentUser.username, email: currentUser.email }], status: 'active', progress: 0, createdAt: new Date().toISOString() };
    saveWorkspaces([created, ...allWorkspaces]);
    setShowTemplateModal(false);
  };

  const seedWorkspaceData = async (space) => {
    const spaceId = space._id || space.id;
    const creatorName = currentUser?.username || 'You';
    const workspaceName = space.name || 'Workspace';
    const starterTasks = [
      { workspaceId: spaceId, title: "Define Project Scope & Budget", desc: `Outline deliverables for "${workspaceName}".`, priority: "High", status: "Completed", dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], creator: null },
      { workspaceId: spaceId, title: "Book Venue and Accommodations", desc: "Research venues and complete reservation.", priority: "High", status: "In Progress", dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], creator: null },
      { workspaceId: spaceId, title: "Finalize Itinerary & Event Plans", desc: "Flesh out schedule and distribute details.", priority: "Medium", status: "To Do", dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0], creator: null }
    ];
    for (const t of starterTasks) { try { await fetch('http://localhost:5000/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t) }); } catch(e) {} }
    try { await fetch('http://localhost:5000/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspaceId: spaceId, title: "Advance Booking Deposit", amount: 2500, category: "Venue", paidBy: creatorName, splitWith: ["All Members"], date: new Date().toISOString().split('T')[0] }) }); } catch(e) {}
    try {
      localStorage.setItem(`albums_${spaceId}`, JSON.stringify([{ id: 'a1', name: `${workspaceName} Media`, cover: `https://picsum.photos/seed/${spaceId}-1/800/600`, items: 1 }]));
      localStorage.setItem(`gallery_${spaceId}`, JSON.stringify([{ id: Date.now(), albumId: 'a1', url: `https://picsum.photos/seed/${spaceId}-1/800/600`, uploader: creatorName, avatar: `https://ui-avatars.com/api/?name=${creatorName}&background=random&color=fff`, likes: 5, comments: [], type: 'photo', createdAt: 'Just now' }]));
    } catch(e) {}
  };

  const handleLaunchWizard = () => {
    const created = {
      id: Date.now().toString(),
      inviteCode: 'LINK-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      name: wizardData.name || 'Untitled Workspace',
      description: wizardData.description || `A new ${wizardData.type} workspace.`,
      cover: wizardData.cover || fallbackImages[0],
      members: [{ name: currentUser.username, email: currentUser.email, role: 'Admin' }],
      pendingMembers: wizardData.members,
      status: 'active', progress: 0, createdAt: new Date().toISOString(),
      theme: wizardData.color,
      stats: wizardData.aiComplete ? { tasksCompleted: 0, tasksTotal: 8, expenses: 0, expenseCount: 0, media: 0, discussions: 0, plans: 1 } : { tasksCompleted: 0, tasksTotal: 0, expenses: 0, expenseCount: 0, media: 0, discussions: 0, plans: 0 },
      activities: wizardData.aiComplete ? [{ type: 'system', user: 'AI Assistant', action: 'initialized the workspace', time: 'Just now', id: 'act1' }] : [],
      aiSummary: wizardData.aiComplete ? ['Workspace initialized', '8 tasks created', '3 document templates added'] : null,
      milestones: wizardData.aiComplete ? [{ dateMonth: 'DEC', dateDay: '01', title: 'Project Kickoff', desc: 'In 2 days' }] : [],
      chatMessages: [], aiMessages: [], polls: []
    };
    setShowCreateModal(false);
    setWizardData({ type: 'Project', name: '', description: '', cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', color: '#0ea5e9', privacy: 'Private', members: [], newMemberEmail: '', newMemberRole: 'Editor', modules: { gallery: true, teamhub: true, expenses: true, calendar: false, pulse: true, timeline: false, files: true }, aiPrompt: '', aiLoading: false, aiComplete: false });
    saveWorkspaces([created, ...allWorkspaces]);
    handleEnterWorkspace(created);
    fetch('http://localhost:5000/api/spaces', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(created) })
      .then(r => { if (!r.ok) throw new Error('Server error ' + r.status); return r.json(); })
      .then(async savedSpace => {
        try { await seedWorkspaceData(savedSpace); } catch(e) {}
        const updated = [savedSpace, ...allWorkspaces.filter(w => (w._id || w.id) !== created.id)];
        saveWorkspaces(updated);
        try { localStorage.setItem('gatherly_active_workspace', JSON.stringify(savedSpace)); window.dispatchEvent(new Event('active_workspace_changed')); } catch(e) {}
        navigate(`/workspace/${savedSpace._id}`, { replace: true });
      }).catch(err => console.error('Failed to save workspace to DB:', err));
  };

  const resolveMemberInfo = (m) => {
    if (!m) return { name: '', email: '', isMe: false };
    const name = typeof m === 'object' ? (m.name || m.email || '') : String(m);
    const email = typeof m === 'object' ? (m.email || '') : String(m);
    const curUser = currentUser?.username || '';
    const curEmail = currentUser?.email || '';
    const isMe = (name && curUser && name.toLowerCase().trim() === curUser.toLowerCase().trim()) || (email && curEmail && email.toLowerCase().trim() === curEmail.toLowerCase().trim());
    return { name, email, isMe };
  };

  return {
    showCreateModal, setShowCreateModal,
    showTemplateModal, setShowTemplateModal,
    showJoinModal, setShowJoinModal,
    showEditCoverModal, setShowEditCoverModal,
    showInviteModal, setShowInviteModal,
    newCoverUrl, setNewCoverUrl,
    joinCode, setJoinCode,
    wizardData, setWizardData,
    TEMPLATES, fallbackImages,
    updateWorkspaceData, logActivity,
    handleModuleNavigation, handleEnterWorkspace,
    handleJoinWorkspace, handleAcceptInvite, handleDeclineInvite,
    handleChangeCover, handleUseTemplate, handleLaunchWizard,
    resolveMemberInfo
  };
};
