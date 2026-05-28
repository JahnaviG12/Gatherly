import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Users, Copy, Check,
  Loader, Sparkles, Monitor, Activity, X, Smile, Phone
} from 'lucide-react';
import './VideoCall.css';

const VideoCall = ({ workspace, currentUser, socket, workspaceId, autoJoin, onCallJoined }) => {
  const [callState, setCallState] = useState('lobby'); // 'lobby' | 'joining' | 'incall'
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [copied, setCopied] = useState(false);
  const [blurBg, setBlurBg] = useState(false);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [latency, setLatency] = useState(24);
  const [isHost, setIsHost] = useState(false);

  // Webcam stream reference
  const localVideoRef = useRef(null);
  const [stream, setStream] = useState(null);

  // Only participants who have ACTUALLY joined the call
  const [participants, setParticipants] = useState([]);

  // Auto-join when triggered by accepting an incoming call
  useEffect(() => {
    if (autoJoin && callState === 'lobby') {
      joinCall(false); // join as non-host (someone called us)
    }
  }, [autoJoin]);

  // Build the stable room name from workspace id
  const roomName = `linkup-${(workspace?._id || workspace?.id || 'demo').replace(/[^a-zA-Z0-9]/g, '')}`;
  const meetLink = `https://meet.jit.si/${roomName}`;

  // ── Socket: listen for others joining/leaving/ending ────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleParticipantJoined = (data) => {
      setParticipants(prev => {
        // Avoid duplicates
        if (prev.find(p => p.name === data.participantName)) return prev;
        return [...prev, {
          id: `member-${Date.now()}`,
          name: data.participantName,
          role: data.participantRole || 'Member',
          avatar: data.participantAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.participantName)}&background=random&color=fff&bold=true`,
          speaking: false,
          muted: false,
          camera: true
        }];
      });
    };

    const handleParticipantLeft = (data) => {
      setParticipants(prev => prev.filter(p => p.name !== data.participantName));
    };

    const handleCallEnded = () => {
      // Host ended the call – force everyone back to lobby
      leaveCall(true); // silent = don't re-emit call_left
    };

    socket.on('participant_joined', handleParticipantJoined);
    socket.on('participant_left', handleParticipantLeft);
    socket.on('call_ended', handleCallEnded);

    return () => {
      socket.off('participant_joined', handleParticipantJoined);
      socket.off('participant_left', handleParticipantLeft);
      socket.off('call_ended', handleCallEnded);
    };
  }, [socket, callState]);

  // ── Camera stream ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (callState === 'incall' && camOn) {
      navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360 }, audio: micOn })
        .then(str => {
          setStream(str);
          if (localVideoRef.current) localVideoRef.current.srcObject = str;
        })
        .catch(err => {
          console.log('Webcam unavailable, using avatar fallback.', err);
        });
    } else {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        setStream(null);
      }
    }
  }, [callState, camOn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [stream]);

  // ── Speaker simulation for active participants ───────────────────────────────
  useEffect(() => {
    if (callState !== 'incall') return;
    const interval = setInterval(() => {
      setLatency(prev => Math.max(12, Math.min(68, prev + Math.floor(Math.random() * 5) - 2)));
      setParticipants(prev => {
        if (prev.length === 0) return prev;
        const speakingIdx = Math.floor(Math.random() * (prev.length + 1));
        return prev.map((p, idx) => {
          if (p.id === 'you') return { ...p, speaking: speakingIdx === idx && micOn };
          if (p.muted) return { ...p, speaking: false };
          return { ...p, speaking: speakingIdx === idx };
        });
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [callState, micOn]);

  // ── Join Call ────────────────────────────────────────────────────────────────
  const joinCall = (asHost = true) => {
    setIsHost(asHost);
    setCallState('joining');

    // Add self to participants immediately
    const meParticipant = {
      id: 'you',
      name: currentUser?.username || 'You',
      role: 'You',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.username || 'You')}&background=0ea5e9&color=fff&bold=true`,
      speaking: false,
      muted: false,
      camera: true
    };

    setTimeout(() => {
      setCallState('incall');
      setParticipants([meParticipant]);

      if (socket && workspaceId) {
        if (asHost) {
          // Broadcast to all OTHER members: "there's an incoming call"
          socket.emit('call_started', {
            workspaceId,
            callerName: currentUser?.username || 'Someone',
            callerAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.username || 'You')}&background=0ea5e9&color=fff&bold=true`,
            workspaceName: workspace?.name || 'Workspace',
            roomName
          });
        } else {
          // Non-host joining: notify existing participants
          socket.emit('call_joined', {
            workspaceId,
            participantName: currentUser?.username || 'Someone',
            participantAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.username || 'You')}&background=0ea5e9&color=fff&bold=true`,
            participantRole: 'Member'
          });
        }
      }

      if (onCallJoined) onCallJoined();
    }, 1500);
  };

  // ── Leave Call ───────────────────────────────────────────────────────────────
  const leaveCall = (silent = false) => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }

    if (!silent && socket && workspaceId) {
      if (isHost) {
        // Host leaving = end call for everyone
        socket.emit('call_ended', { workspaceId });
      } else {
        socket.emit('call_left', {
          workspaceId,
          participantName: currentUser?.username || 'Someone'
        });
      }
    }

    setCallState('lobby');
    setParticipants([]);
    setIsHost(false);
    setSharingScreen(false);
  };

  // ── Invite copy link ─────────────────────────────────────────────────────────
  const copyLink = () => {
    navigator.clipboard.writeText(meetLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // ── Floating emoji reactions ─────────────────────────────────────────────────
  const triggerReaction = (emoji) => {
    const id = Date.now() + Math.random();
    setFloatingEmojis(prev => [...prev, {
      id, emoji,
      left: Math.random() * 70 + 15,
      swerv: Math.random() * 60 - 30,
      swervEnd: Math.random() * 100 - 50
    }]);
    setTimeout(() => setFloatingEmojis(prev => prev.filter(e => e.id !== id)), 2500);
  };

  return (
    <div className="videocall-wrapper">

      {/* ── LOBBY ── */}
      {callState === 'lobby' && (
        <div className="vc-lobby">
          <div className="vc-lobby-card">
            <div className="vc-lobby-icon">
              <Video size={36} color="white" />
            </div>
            <h2 className="vc-lobby-title">Interactive Virtual Hub</h2>
            <p className="vc-lobby-sub">
              Start a live video call for <strong>{workspace?.name || 'your workspace'}</strong>.
              All workspace members will receive an <strong>incoming call notification</strong> and can choose to join.
            </p>

            <div className="vc-device-toggles">
              <button className={`vc-toggle-btn ${camOn ? 'on' : 'off'}`} onClick={() => setCamOn(v => !v)}>
                {camOn ? <Video size={20} /> : <VideoOff size={20} />}
                <span>{camOn ? 'Camera On' : 'Camera Off'}</span>
              </button>
              <button className={`vc-toggle-btn ${micOn ? 'on' : 'off'}`} onClick={() => setMicOn(v => !v)}>
                {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                <span>{micOn ? 'Mic On' : 'Mic Muted'}</span>
              </button>
            </div>

            <div className="vc-invite-box">
              <Users size={14} />
              <span className="vc-link-text">{meetLink}</span>
              <button className="vc-copy-btn" onClick={copyLink}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="vc-invite-hint">
              Clicking "Start Call" will ring all workspace members with an incoming call notification.
            </p>

            <button className="vc-join-btn" onClick={() => joinCall(true)}>
              <Phone size={18} /> Start Call &amp; Notify Members
            </button>
          </div>
        </div>
      )}

      {/* ── CONNECTING ── */}
      {callState === 'joining' && (
        <div className="vc-joining">
          <div className="vc-joining-inner">
            <Loader size={40} className="vc-spinner" />
            <h3>Connecting to LinkUp Virtual Hub…</h3>
            <p>Notifying workspace members of incoming call.</p>
          </div>
        </div>
      )}

      {/* ── ACTIVE CALL ── */}
      {callState === 'incall' && (
        <div className="vc-incall-container">

          {/* Floating emoji overlay */}
          <div className="vc-reaction-overlay">
            <AnimatePresence>
              {floatingEmojis.map(emoji => (
                <span
                  key={emoji.id}
                  className="vc-floating-emoji"
                  style={{
                    left: `${emoji.left}%`,
                    '--swerv-x': `${emoji.swerv}px`,
                    '--swerv-x-end': `${emoji.swervEnd}px`
                  }}
                >
                  {emoji.emoji}
                </span>
              ))}
            </AnimatePresence>
          </div>

          {/* Top bar */}
          <div className="vc-top-bar">
            <div className="vc-info">
              <span className="vc-room-title">{workspace?.name || 'Workspace'} Virtual Call</span>
              <span className="vc-badge active">Live</span>
              {isHost && (
                <span style={{
                  background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
                  fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px',
                  borderRadius: '20px', border: '1px solid rgba(245,158,11,0.3)'
                }}>Host</span>
              )}
            </div>
            <div className="vc-stats">
              <div className="vc-stat-item">
                <Users size={16} />
                <span>{participants.length} In Call</span>
              </div>
              <div className="vc-stat-item">
                <Activity size={16} color={latency < 45 ? '#10b981' : '#f59e0b'} />
                <span>{latency} ms</span>
              </div>
            </div>
          </div>

          {/* Participants grid + screen share */}
          <div className={`vc-video-grid-canvas ${sharingScreen ? 'screenshare-active' : ''}`}>
            {sharingScreen && (
              <div className="vc-screen-presentation">
                <div className="vc-slide-card">
                  <div className="vc-slide-header">
                    <Sparkles size={20} color="#0ea5e9" />
                    <span>Screen Share — {workspace?.name}</span>
                  </div>
                  <div className="vc-slide-body">
                    <h2>Workspace Collaboration View</h2>
                    <div className="vc-slide-mock-chart">
                      <div className="bar" style={{ height: '30%' }}><span>Jan</span></div>
                      <div className="bar" style={{ height: '45%' }}><span>Feb</span></div>
                      <div className="bar highlight" style={{ height: '75%' }}><span>Mar</span></div>
                      <div className="bar highlight" style={{ height: '95%' }}><span>Apr</span></div>
                    </div>
                  </div>
                  <div className="vc-slide-footer">
                    <span>Presented by {currentUser?.username || 'You'} • Live</span>
                  </div>
                </div>
              </div>
            )}

            <div className={`vc-participants-container ${sharingScreen ? 'strip-view' : 'grid-view'}`}>
              {participants.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', flex: 1, gap: '1rem',
                  color: 'rgba(255,255,255,0.4)'
                }}>
                  <Users size={48} style={{ opacity: 0.3 }} />
                  <p style={{ fontSize: '1rem', fontWeight: 600 }}>Waiting for members to join…</p>
                  <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                    Members have received your call notification. They can accept it to join.
                  </p>
                </div>
              ) : participants.map(p => {
                const isLocalUser = p.id === 'you';
                const isCamActive = isLocalUser ? camOn : p.camera;
                const isMicActive = isLocalUser ? micOn : !p.muted;
                const isSpeaking = p.speaking;

                return (
                  <div key={p.id} className={`vc-member-card ${isSpeaking ? 'speaking-active' : ''}`}>
                    <div className="vc-member-viewport">
                      {isCamActive ? (
                        isLocalUser && stream ? (
                          <video
                            ref={localVideoRef}
                            autoPlay playsInline muted
                            className={`vc-video-stream ${blurBg ? 'blur-active' : ''}`}
                          />
                        ) : (
                          <div
                            className="vc-video-stream mock-stream"
                            style={{
                              background: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.2)), url(https://picsum.photos/seed/${p.id}/600/400) center/cover`
                            }}
                          />
                        )
                      ) : (
                        <div className="vc-avatar-viewport">
                          <div className="vc-avatar-circle-ring">
                            <img src={p.avatar} alt={p.name} className="vc-member-avatar" />
                            {isSpeaking && <div className="speaking-wave-glow"></div>}
                          </div>
                        </div>
                      )}

                      {!isMicActive && (
                        <div className="vc-mic-status-overlay">
                          <MicOff size={14} color="white" />
                        </div>
                      )}

                      <div className="vc-member-tag">
                        <span className="name">{p.name}{isLocalUser ? ' (You)' : ''}</span>
                        {isSpeaking && <span className="speaking-lbl">Speaking…</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Control bar */}
          <div className="vc-controls-wrapper">
            <div className="vc-control-bar">
              <button className={`vc-control-action ${micOn ? 'active' : 'disabled'}`} onClick={() => setMicOn(v => !v)} title={micOn ? 'Mute' : 'Unmute'}>
                {micOn ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              <button className={`vc-control-action ${camOn ? 'active' : 'disabled'}`} onClick={() => setCamOn(v => !v)} title={camOn ? 'Camera Off' : 'Camera On'}>
                {camOn ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
              <button className={`vc-control-action ${blurBg ? 'active' : ''}`} onClick={() => setBlurBg(v => !v)} disabled={!camOn} title="Background Blur">
                <Sparkles size={20} />
              </button>
              <button className={`vc-control-action ${sharingScreen ? 'active' : ''}`} onClick={() => setSharingScreen(v => !v)} title="Screen Share">
                <Monitor size={20} />
              </button>

              <div className="vc-reaction-picker-wrapper">
                <button className={`vc-control-action ${showEmojiPicker ? 'active' : ''}`} onClick={() => setShowEmojiPicker(v => !v)} title="Reactions">
                  <Smile size={20} />
                </button>
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div className="vc-emoji-picker-bubble"
                      initial={{ scale: 0.85, y: 15, opacity: 0 }}
                      animate={{ scale: 1, y: 0, opacity: 1 }}
                      exit={{ scale: 0.85, y: 15, opacity: 0 }}
                    >
                      {['💖', '👍', '🎉', '🚀', '🔥', '😮'].map(em => (
                        <button key={em} className="vc-pickable-emoji" onClick={() => { triggerReaction(em); setShowEmojiPicker(false); }}>
                          {em}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button className="vc-control-action leave" onClick={() => leaveCall(false)} title={isHost ? 'End Call for Everyone' : 'Leave Call'}>
                <PhoneOff size={20} />
              </button>
            </div>
            {isHost && (
              <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.5rem' }}>
                You are the host — leaving will end the call for all participants.
              </p>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default VideoCall;
