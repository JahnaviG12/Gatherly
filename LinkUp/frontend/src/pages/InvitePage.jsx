import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, CheckCircle, XCircle, Loader2, LogIn, ArrowRight } from 'lucide-react';

const InvitePage = () => {
    const { code } = useParams();
    const navigate = useNavigate();

    const [workspace, setWorkspace] = useState(null);
    const [status, setStatus] = useState('loading'); // loading | found | error | joining | joined
    const [errorMsg, setErrorMsg] = useState('');

    // Get logged in user
    const currentUser = (() => {
        try { return JSON.parse(localStorage.getItem('gatherly_user') || 'null'); } catch { return null; }
    })();

    useEffect(() => {
        if (!code) { setStatus('error'); setErrorMsg('No invite code provided.'); return; }

        // Resolve the workspace from invite code
        fetch(`http://localhost:5000/api/spaces/invite/${code}`)
            .then(res => {
                if (!res.ok) throw new Error('Invalid or expired invite link.');
                return res.json();
            })
            .then(space => {
                setWorkspace(space);
                setStatus('found');
            })
            .catch(err => {
                setStatus('error');
                setErrorMsg(err.message || 'Invite link is invalid or has expired.');
            });
    }, [code]);

    const handleJoin = async () => {
        if (!currentUser) {
            // Save the invite URL so we can redirect back after login
            sessionStorage.setItem('invite_redirect', window.location.pathname);
            navigate('/login');
            return;
        }

        setStatus('joining');

        try {
            const res = await fetch(`http://localhost:5000/api/spaces/invite/${code}/join`, {
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

            const joinedSpace = data.space;
            const spaceId = joinedSpace._id || joinedSpace.id;

            // Update local cache
            try {
                const cached = JSON.parse(localStorage.getItem('gatherly_workspaces') || '[]');
                const exists = cached.some(w => String(w._id || w.id) === String(spaceId));
                if (!exists) {
                    localStorage.setItem('gatherly_workspaces', JSON.stringify([joinedSpace, ...cached]));
                } else {
                    const updated = cached.map(w => String(w._id || w.id) === String(spaceId) ? joinedSpace : w);
                    localStorage.setItem('gatherly_workspaces', JSON.stringify(updated));
                }
                localStorage.setItem('gatherly_active_workspace', JSON.stringify(joinedSpace));
                window.dispatchEvent(new Event('active_workspace_changed'));
            } catch (e) { console.warn('Cache update failed', e); }

            setStatus('joined');

            // Redirect into workspace after a short success animation
            setTimeout(() => {
                navigate(`/workspace/${spaceId}`);
            }, 1500);

        } catch (err) {
            setStatus('error');
            setErrorMsg(err.message);
        }
    };

    const getWorkspaceMembers = () => {
        if (!workspace) return [];
        const members = workspace.members || [];
        return members.slice(0, 5);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            fontFamily: "'Inter', sans-serif"
        }}>

            {/* Background orbs */}
            <div style={{
                position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0
            }}>
                <div style={{
                    position: 'absolute', top: '20%', left: '10%', width: '400px', height: '400px',
                    borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                    filter: 'blur(40px)'
                }} />
                <div style={{
                    position: 'absolute', bottom: '20%', right: '10%', width: '350px', height: '350px',
                    borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
                    filter: 'blur(40px)'
                }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{
                    position: 'relative', zIndex: 1,
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '24px',
                    padding: '3rem',
                    maxWidth: '480px',
                    width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
                }}
            >
                {/* Logo */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '10px', marginBottom: '2rem'
                }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: 'linear-gradient(135deg, #6366f1, #10b981)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Users size={22} color="white" />
                    </div>
                    <span style={{
                        fontSize: '1.5rem', fontWeight: 800, color: 'white', letterSpacing: '-0.03em'
                    }}>LinkUp</span>
                </div>

                {/* LOADING */}
                {status === 'loading' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Loader2 size={48} color="#6366f1" style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>
                            Resolving your invite link...
                        </p>
                        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
                    </motion.div>
                )}

                {/* ERROR */}
                {status === 'error' && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <XCircle size={56} color="#ef4444" style={{ margin: '0 auto 1.5rem' }} />
                        <h2 style={{ color: 'white', fontSize: '1.4rem', marginBottom: '0.75rem' }}>
                            Invite Not Found
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem', lineHeight: 1.6 }}>
                            {errorMsg}
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            style={{
                                padding: '0.875rem 2rem',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                border: 'none', borderRadius: '12px', color: 'white',
                                fontWeight: 700, fontSize: '1rem', cursor: 'pointer'
                            }}
                        >
                            Go to Login
                        </button>
                    </motion.div>
                )}

                {/* FOUND — show workspace preview */}
                {status === 'found' && workspace && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        {/* Workspace cover */}
                        {workspace.cover && (
                            <div style={{
                                width: '100%', height: '160px', borderRadius: '16px', overflow: 'hidden',
                                marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <img src={workspace.cover} alt={workspace.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80'; }}
                                />
                            </div>
                        )}

                        <div style={{
                            display: 'inline-block', padding: '0.3rem 1rem',
                            background: 'rgba(99,102,241,0.2)', borderRadius: '100px',
                            border: '1px solid rgba(99,102,241,0.4)',
                            color: '#a5b4fc', fontSize: '0.8rem', fontWeight: 600,
                            marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em'
                        }}>
                            You're invited
                        </div>

                        <h2 style={{ color: 'white', fontSize: '1.7rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                            {workspace.name}
                        </h2>

                        {workspace.description && (
                            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                                {workspace.description}
                            </p>
                        )}

                        {/* Member count */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '0.5rem', marginBottom: '2rem'
                        }}>
                            {getWorkspaceMembers().map((m, i) => (
                                <img key={i}
                                    src={`https://ui-avatars.com/api/?name=${typeof m === 'object' ? (m.name || m.username || 'M') : 'M'}&background=random&color=fff&size=32`}
                                    alt="member"
                                    style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', marginLeft: i > 0 ? '-8px' : 0 }}
                                />
                            ))}
                            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginLeft: '0.5rem' }}>
                                {(workspace.members || []).length} members
                            </span>
                        </div>

                        {!currentUser ? (
                            <div>
                                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                    You need to be logged in to join this workspace.
                                </p>
                                <button
                                    onClick={handleJoin}
                                    style={{
                                        width: '100%', padding: '1rem',
                                        background: 'linear-gradient(135deg, #6366f1, #10b981)',
                                        border: 'none', borderRadius: '14px', color: 'white',
                                        fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                    }}
                                >
                                    <LogIn size={20} /> Login to Join
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleJoin}
                                style={{
                                    width: '100%', padding: '1rem',
                                    background: 'linear-gradient(135deg, #6366f1, #10b981)',
                                    border: 'none', borderRadius: '14px', color: 'white',
                                    fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    boxShadow: '0 8px 25px rgba(99,102,241,0.4)'
                                }}
                                onMouseEnter={e => { e.target.style.transform = 'scale(1.02)'; e.target.style.boxShadow = '0 12px 35px rgba(99,102,241,0.5)'; }}
                                onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 8px 25px rgba(99,102,241,0.4)'; }}
                            >
                                <Users size={20} /> Join Workspace <ArrowRight size={18} />
                            </button>
                        )}

                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginTop: '1rem' }}>
                            Logged in as <strong style={{ color: 'rgba(255,255,255,0.5)' }}>{currentUser?.username || 'Guest'}</strong>
                        </p>
                    </motion.div>
                )}

                {/* JOINING */}
                {status === 'joining' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Loader2 size={48} color="#6366f1" style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
                        <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Joining workspace...</h3>
                        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Setting up your access.</p>
                        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
                    </motion.div>
                )}

                {/* JOINED */}
                {status === 'joined' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                        >
                            <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 1.5rem' }} />
                        </motion.div>
                        <h2 style={{ color: 'white', fontSize: '1.6rem', marginBottom: '0.5rem' }}>
                            You're in! 🎉
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.6)' }}>
                            Redirecting you to <strong>{workspace?.name}</strong>...
                        </p>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default InvitePage;
