import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import socket from '../utils/socket';

export default function CallPage({ me, workspace }) {
  const { callId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [peers, setPeers] = useState([]);
  const [allParticipants, setAllParticipants] = useState([]);
  const [callActive, setCallActive] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [speakingUsers, setSpeakingUsers] = useState(new Set());

  const localVideoRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const peerVideoRefs = useRef(new Map());
  const audioContextRef = useRef(null);
  const analyserRef = useRef(new Map());

  useEffect(() => {
    if (!callActive) return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callActive]);

  useEffect(() => {
    requestNotificationPermission();
    initializeCall();
    return () => {
      endCall();
    };
  }, [callId]);

  // Listen for participants updates from server
  useEffect(() => {
    socket.on('call:participants', ({ callId: receivedCallId, participants }) => {
      if (receivedCallId === callId) {
        setAllParticipants(participants);
        console.log('Participants updated:', participants);
      }
    });

    socket.on('call:ended', ({ callId: receivedCallId }) => {
      if (receivedCallId === callId) {
        alert('Call ended');
        navigate('/');
      }
    });

    return () => {
      socket.off('call:participants');
      socket.off('call:ended');
    };
  }, [callId, navigate]);

  // Monitor audio levels for speaking detection
  useEffect(() => {
    if (!callActive || !localStreamRef.current) return;

    const audioTracks = localStreamRef.current.getAudioTracks();
    if (audioTracks.length === 0) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;
    const source = audioContext.createMediaStreamSource(localStreamRef.current);
    const analyser = audioContext.createAnalyser();
    source.connect(analyser);

    analyserRef.current.set(me.id, analyser);

    const checkSpeaking = () => {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      
      setSpeakingUsers((prev) => {
        const newSet = new Set(prev);
        if (average > 30) {
          newSet.add(me.id);
        } else {
          newSet.delete(me.id);
        }
        return newSet;
      });

      requestAnimationFrame(checkSpeaking);
    };

    checkSpeaking();
  }, [callActive, me.id]);

  function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  async function initializeCall() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      socket.emit('join-call', { callId, user: me });
      setCallActive(true);

      socket.on('peer-joined', handlePeerJoined);
      socket.on('webrtc:offer', handleOffer);
      socket.on('webrtc:answer', handleAnswer);
      socket.on('webrtc:ice', handleICE);
      socket.on('peer-left', handlePeerLeft);
    } catch (error) {
      console.error('Error accessing media:', error);
      alert('Camera/Microphone access denied.');
      navigate('/');
    }
  }

  function handlePeerJoined({ user }) {
    console.log('Peer joined:', user.name);
    createPeerConnection(user, true);
  }

  function handleOffer({ from, offer }) {
    const peerConn = peerConnectionsRef.current.get(from);
    if (peerConn) {
      peerConn.setRemoteDescription(new RTCSessionDescription(offer)).then(() => {
        return peerConn.createAnswer();
      }).then((answer) => {
        return peerConn.setLocalDescription(answer);
      }).then(() => {
        socket.emit('webrtc:answer', { callId, answer: peerConn.localDescription });
      });
    }
  }

  function handleAnswer({ from, answer }) {
    const peerConn = peerConnectionsRef.current.get(from);
    if (peerConn && peerConn.signalingState !== 'stable') {
      peerConn.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  function handleICE({ from, candidate }) {
    const peerConn = peerConnectionsRef.current.get(from);
    if (peerConn && candidate) {
      peerConn.addIceCandidate(new RTCIceCandidate(candidate)).catch((e) => console.error('ICE error:', e));
    }
  }

  function handlePeerLeft({ userId }) {
    const peerConn = peerConnectionsRef.current.get(userId);
    if (peerConn) {
      peerConn.close();
      peerConnectionsRef.current.delete(userId);
      peerVideoRefs.current.delete(userId);
      analyserRef.current.delete(userId);
      setPeers((prev) => prev.filter((p) => p.id !== userId));
      setSpeakingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }

  function createPeerConnection(user, initiator) {
    const peerConn = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    localStreamRef.current?.getTracks().forEach((track) => {
      peerConn.addTrack(track, localStreamRef.current);
    });

    peerConn.ontrack = (event) => {
      console.log('Track received from:', user.name);
      setPeers((prev) => {
        const existing = prev.find((p) => p.id === user.id);
        if (!existing) {
          // Setup audio analyser for speaking detection
          const stream = event.streams[0];
          if (stream.getAudioTracks().length > 0 && audioContextRef.current) {
            try {
              const source = audioContextRef.current.createMediaStreamSource(stream);
              const analyser = audioContextRef.current.createAnalyser();
              source.connect(analyser);
              analyserRef.current.set(user.id, analyser);

              const checkSpeaking = () => {
                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

                setSpeakingUsers((prev) => {
                  const newSet = new Set(prev);
                  if (average > 30) {
                    newSet.add(user.id);
                  } else {
                    newSet.delete(user.id);
                  }
                  return newSet;
                });

                requestAnimationFrame(checkSpeaking);
              };

              checkSpeaking();
            } catch (e) {
              console.error('Audio analyser error:', e);
            }
          }

          return [...prev, { id: user.id, name: user.name, stream: event.streams[0] }];
        }
        return prev;
      });
    };

    peerConn.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc:ice', { callId, candidate: event.candidate });
      }
    };

    peerConnectionsRef.current.set(user.id, peerConn);

    if (initiator) {
      peerConn.createOffer().then((offer) => {
        return peerConn.setLocalDescription(offer);
      }).then(() => {
        socket.emit('webrtc:offer', { callId, offer: peerConn.localDescription });
      }).catch((e) => console.error('Offer error:', e));
    }
  }

  function toggleVideo() {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  }

  function toggleAudio() {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  }

  function endCall() {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerConnectionsRef.current.forEach((pc) => pc.close());
    if (audioContextRef.current) audioContextRef.current.close();
    socket.emit('leave-call', { workspaceId: workspace.id, callId });
    socket.off('peer-joined');
    socket.off('webrtc:offer');
    socket.off('webrtc:answer');
    socket.off('webrtc:ice');
    socket.off('peer-left');
    navigate('/');
  }

  const inCallCount = allParticipants.filter((p) => p.status === 'in-call').length;
  const totalCount = allParticipants.length;

  // Build display grid: local + peers
  const displayParticipants = [
    { id: me.id, name: me.name, isLocal: true },
    ...peers,
  ];

  return (
    <div style={{ background: '#0b1220', color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#1a2332', padding: '16px 24px', borderBottom: '1px solid #2a3f5f', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>📞 Video Call</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#aaa' }}>
            🟢 LIVE • {inCallCount}/{totalCount} participants • ⏱️ {formatDuration(callDuration)}
          </p>
        </div>
        <div style={{ fontSize: '13px', color: '#aaa', textAlign: 'right' }}>
          <div>{workspace.name}</div>
          <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
            {allParticipants.map((p) => p.name).join(', ')}
          </div>
        </div>
      </div>

      {/* Video Grid - responsive layout */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px',
        display: 'grid',
        gridTemplateColumns: 
          displayParticipants.length === 1 ? '1fr' :
          displayParticipants.length === 2 ? 'repeat(2, 1fr)' :
          displayParticipants.length <= 4 ? 'repeat(2, 1fr)' : 
          'repeat(auto-fit, minmax(360px, 1fr))',
        gridAutoRows: 'minmax(300px, 1fr)',
        gap: '12px',
        backgroundColor: '#0b1220',
      }}>
        {/* Local Video */}
        <div style={{
          background: '#1a2332',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: speakingUsers.has(me.id) ? '0 0 20px 2px #2ecc71' : '0 4px 12px rgba(0,0,0,0.3)',
          border: speakingUsers.has(me.id) ? '2px solid #2ecc71' : '2px solid transparent',
          transition: 'all 0.3s ease',
        }}>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            background: 'rgba(0,0,0,0.7)',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span>📹</span>
            <div>
              <div>{me.name}</div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                {speakingUsers.has(me.id) ? '🎙️ Speaking' : 'Listening'}
              </div>
            </div>
          </div>
          {!videoEnabled && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '600',
            }}>
              📹 Camera Off
            </div>
          )}
        </div>

        {/* Remote Videos */}
        {peers.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#888',
            fontSize: '16px',
          }}>
            ⏳ Waiting for others to join...
          </div>
        ) : (
          peers.map((peer) => (
            <div
              key={peer.id}
              style={{
                background: '#1a2332',
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: speakingUsers.has(peer.id) ? '0 0 20px 2px #2ecc71' : '0 4px 12px rgba(0,0,0,0.3)',
                border: speakingUsers.has(peer.id) ? '2px solid #2ecc71' : '2px solid transparent',
                transition: 'all 0.3s ease',
              }}
            >
              <video
                autoPlay
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                ref={(ref) => {
                  if (ref && peer.stream) {
                    ref.srcObject = peer.stream;
                    peerVideoRefs.current.set(peer.id, ref);
                  }
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                background: 'rgba(0,0,0,0.7)',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <span>📹</span>
                <div>
                  <div>{peer.name}</div>
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                    {speakingUsers.has(peer.id) ? '🎙️ Speaking' : 'Listening'}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Control Bar - Fixed at bottom */}
      <div style={{
        background: '#1a2332',
        borderTop: '1px solid #2a3f5f',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        zIndex: 100,
      }}>
        {/* Microphone Button */}
        <button
          onClick={toggleAudio}
          title={audioEnabled ? 'Mute (Ctrl+D)' : 'Unmute'}
          style={{
            padding: '12px 20px',
            background: audioEnabled ? '#3a4a5c' : '#e74c3c',
            color: '#fff',
            border: '1px solid ' + (audioEnabled ? '#4a5a6c' : '#c0392b'),
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            minWidth: '120px',
            justifyContent: 'center',
          }}
          onMouseOver={(e) => {
            e.target.style.background = audioEnabled ? '#4a5a6c' : '#c0392b';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = audioEnabled ? '#3a4a5c' : '#e74c3c';
            e.target.style.transform = 'scale(1)';
          }}
        >
          <span>{audioEnabled ? '🎤' : '🔇'}</span>
          {audioEnabled ? 'Mic On' : 'Muted'}
        </button>

        {/* Camera Button */}
        <button
          onClick={toggleVideo}
          title={videoEnabled ? 'Stop video (Ctrl+E)' : 'Start video'}
          style={{
            padding: '12px 20px',
            background: videoEnabled ? '#3a4a5c' : '#e74c3c',
            color: '#fff',
            border: '1px solid ' + (videoEnabled ? '#4a5a6c' : '#c0392b'),
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            minWidth: '120px',
            justifyContent: 'center',
          }}
          onMouseOver={(e) => {
            e.target.style.background = videoEnabled ? '#4a5a6c' : '#c0392b';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = videoEnabled ? '#3a4a5c' : '#e74c3c';
            e.target.style.transform = 'scale(1)';
          }}
        >
          <span>{videoEnabled ? '📹' : '⛔'}</span>
          {videoEnabled ? 'Camera On' : 'Stopped'}
        </button>

        {/* End Call Button */}
        <button
          onClick={endCall}
          title="End call"
          style={{
            padding: '12px 20px',
            background: '#e74c3c',
            color: '#fff',
            border: '1px solid #c0392b',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            minWidth: '120px',
            justifyContent: 'center',
          }}
          onMouseOver={(e) => {
            e.target.style.background = '#c0392b';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = '#e74c3c';
            e.target.style.transform = 'scale(1)';
          }}
        >
          <span>☎️</span> End Call
        </button>
      </div>
    </div>
  );
}