import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import socket from '../utils/socket';

export default function Workspace({ me, workspace }) {
  const navigate = useNavigate();
  const [callInProgress, setCallInProgress] = useState(false);

  function startCall() {
    const callId = uuidv4();
    const caller = { id: me.id, name: me.name };
    socket.emit('call:offer', { workspaceId: workspace.id, callId, caller });
    setCallInProgress(true);
    navigate(`/call/${callId}?host=true`);
  }

  return (
    <div style={{ padding: '40px', textAlign: 'center', minHeight: '100vh', background: '#0b1220', color: '#fff' }}>
      <h1>Workspace: {workspace.name}</h1>
      <p>Welcome, {me.name}!</p>
      <button
        onClick={startCall}
        disabled={callInProgress}
        style={{
          padding: '16px 40px',
          fontSize: '18px',
          background: '#2ecc71',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginTop: '20px',
        }}
      >
        📞 Start Video Call
      </button>
    </div>
  );
}