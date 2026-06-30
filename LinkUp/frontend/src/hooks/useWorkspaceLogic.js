/**
 * useWorkspaceLogic.js
 * Central combinator hook — wires together data, actions, and communication.
 * Keeps WorkspacePage.jsx lean by providing a single import point.
 */
import { useRef } from 'react';
import { useWorkspaceData } from './useWorkspaceData';
import { useWorkspaceActions } from './useWorkspaceActions';
import { useWorkspaceCommunication } from './useWorkspaceCommunication';

export const useWorkspaceLogic = () => {
  // Shared refs passed between hooks
  const activeToolRef = useRef('chat');
  const activeChannelRef = useRef('general');

  // 1. Data: workspace list, socket, real-time sync
  const data = useWorkspaceData();

  // 2. Actions: create, join, invite, cover, navigation
  const actions = useWorkspaceActions({
    navigate: data.navigate,
    workspaceId: data.workspaceId,
    currentUser: data.currentUser,
    allWorkspaces: data.allWorkspaces,
    saveWorkspaces: data.saveWorkspaces,
    selectedWorkspace: data.selectedWorkspace,
    setSelectedWorkspace: data.setSelectedWorkspace,
    setAllWorkspaces: data.setAllWorkspaces,
    setInvites: data.setInvites,
    invites: data.invites
  });

  // 3. Communication: chat, notes, polls, AI
  const comms = useWorkspaceCommunication({
    currentUser: data.currentUser,
    selectedWorkspace: data.selectedWorkspace,
    setSelectedWorkspace: data.setSelectedWorkspace,
    activeToolRef,
    activeChannelRef,
    socketRef: data.socketRef,
    logActivity: actions.logActivity
  });

  // Keep refs in sync with communication state
  activeToolRef.current = comms.activeTool;
  activeChannelRef.current = comms.activeChannel;

  return {
    // From data hook
    ...data,
    // From actions hook
    ...actions,
    // From communications hook
    ...comms
  };
};
