import React from 'react';

export default function IncomingCallModal({ show, caller, onAccept, onReject }) {
  if (!show || !caller) return null;

  return (
    <div
      style={{
        position: 'fixed',
        right: 20,
        top: 20,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        padding: '24px',
        borderRadius: '12px',
        zIndex: 9999,
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        minWidth: '320px',
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      <div style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>
        📞 Incoming Call
      </div>
      <div style={{ marginBottom: '20px', fontSize: '16px' }}>
        {caller.name} is calling...
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onAccept}
          style={{
            flex: 1,
            background: '#2ecc71',
            color: '#fff',
            padding: '12px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => (e.target.style.background = '#27ae60')}
          onMouseOut={(e) => (e.target.style.background = '#2ecc71')}
        >
          ✓ Accept
        </button>
        <button
          onClick={onReject}
          style={{
            flex: 1,
            background: '#e74c3c',
            color: '#fff',
            padding: '12px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => (e.target.style.background = '#c0392b')}
          onMouseOut={(e) => (e.target.style.background = '#e74c3c')}
        >
          ✗ Reject
        </button>
      </div>
    </div>
  );
}