import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import socket from './utils/socket';
import IncomingCallModal from './components/IncomingCallModal';
import Workspace from './pages/Workspace';
import CallPage from './pages/CallPage';

// Demo data - replace with your auth/context
const mockMe = { id: 'user-' + Math.random().toString(36).substr(2, 9), name: 'User ' + Math.floor(Math.random() * 1000) };
const mockWorkspace = { id: 'workspace-demo', name: 'Engineering Team' };

function AppInner() {
  const [incoming, setIncoming] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Join workspace on mount
    socket.emit('join-workspace', { workspaceId: mockWorkspace.id, userId: mockMe.id, userName: mockMe.name });

    // Listen for incoming calls
    socket.on('incoming-call', (data) => {
      setIncoming(data);
      if (Notification && Notification.permission === 'granted') {
        try {
          new Notification(`${data.caller.name} is calling`, { icon: '📞' });
        } catch (e) {
          console.error('Notification error:', e);
        }
      }
    });

    // Listen for call acceptance
    socket.on('call:accepted', ({ callId }) => {
      navigate(`/call/${callId}`);
    });

    // Cleanup
    return () => {
      socket.off('incoming-call');
      socket.off('call:accepted');
    };
  }, [navigate]);

  function acceptCall() {
    if (!incoming) return;
    socket.emit('call:accept', { workspaceId: mockWorkspace.id, callId: incoming.callId, accepter: mockMe });
    socket.emit('join-call', { callId: incoming.callId, user: mockMe });
    setIncoming(null);
  }

  function rejectCall() {
    if (incoming) {
      socket.emit('call:reject', { workspaceId: mockWorkspace.id, callId: incoming.callId });
    }
    setIncoming(null);
  }

  return (
    <>
      <IncomingCallModal show={!!incoming} caller={incoming?.caller} onAccept={acceptCall} onReject={rejectCall} />
      <Routes>
        <Route path="/" element={<Workspace me={mockMe} workspace={mockWorkspace} />} />
        <Route path="/call/:callId" element={<CallPage me={mockMe} workspace={mockWorkspace} />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppInner />
    </Router>
  );
}