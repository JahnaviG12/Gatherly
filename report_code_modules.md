# LinkUp — Main Application Modules & Code Appendix

This appendix provides a structured architectural breakdown and clean, copy-pasteable source code for the key modules of the **LinkUp** collaborative workspace platform.

---

## 1. Application Architecture Overview
LinkUp is built using a full-stack **MERN (MongoDB, Express, React, Node.js)** architecture, enhanced with **Socket.IO** for real-time collaboration and **Google Generative AI (Gemini)** for AI-driven task and itinerary planning.

```
       +---------------------------------------------------------+
       |                   React + Vite Client                   |
       +----------------------------+----------------------------+
                                    |
                    REST Requests   |   WebSocket Events
                     (Axios)        |    (Socket.IO)
                                    v
       +----------------------------+----------------------------+
       |             Node.js + Express + Socket.IO               |
       +----------------------------+----------------------------+
                                    |
                    Database Queries|   Generative Prompts
                     (Mongoose)     |    (SDK)
                                    v
         +--------------------+     +--------------------+
         |   MongoDB Database |     |  Google Gemini AI  |
         +--------------------+     +--------------------+
```

---

## 2. Module 1: Real-Time Event & Server Orchestrator (`server.js`)
* **Role**: Primary entry point for the backend. Sets up the HTTP server, connects to MongoDB, configures API routes, and manages client connections, room grouping, typing indicators, and video calling signals via **Socket.IO**.
* **Path**: `LinkUp/backend/server.js`

```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
  }
});

// Pass socket.io instance to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

// Routes
const authRoutes = require('./routes/auth');
const spaceRoutes = require('./routes/spaces');
const taskRoutes = require('./routes/tasks');
const expenseRoutes = require('./routes/expenses');
const aiRoutes = require('./routes/ai');
const galleryRoutes = require('./routes/gallery');

app.use('/api/auth', authRoutes);
app.use('/api/spaces', spaceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/gallery', galleryRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'LinkUp Backend is running' });
});

// Socket.IO Communication Handler
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join a workspace room
    socket.on('join_workspace', (workspaceId) => {
        socket.join(workspaceId);
        console.log(`[Socket] User ${socket.id} joined workspace room: ${workspaceId}`);
    });

    socket.on('leave_workspace', (workspaceId) => {
        socket.leave(workspaceId);
        console.log(`[Socket] User ${socket.id} left workspace room: ${workspaceId}`);
    });

    // Chat Message Broadcast
    socket.on('send_chat_message', (data) => {
        socket.to(data.workspaceId).emit('new_chat_message', data.message);
    });

    // Poll Vote Broadcast
    socket.on('poll_voted', (data) => {
        socket.to(data.workspaceId).emit('polls_updated', data.polls);
    });

    // Notes Sync
    socket.on('notes_saved', (data) => {
        socket.to(data.workspaceId).emit('notes_updated', data.notes);
    });

    // Activity timeline updates
    socket.on('activity_update', (data) => {
        socket.to(data.workspaceId).emit('activity_logged', data.activity);
    });

    // Typing Indicators
    socket.on('typing_start', (data) => {
        socket.to(data.workspaceId).emit('user_typing', { username: data.username, channel: data.channel });
    });

    socket.on('typing_stop', (data) => {
        socket.to(data.workspaceId).emit('user_stopped_typing', { username: data.username });
    });

    // Video Call Signalling
    socket.on('call_started', (data) => {
        socket.to(data.workspaceId).emit('incoming_call', data);
    });

    socket.on('call_joined', (data) => {
        socket.to(data.workspaceId).emit('participant_joined', data);
    });

    socket.on('call_left', (data) => {
        socket.to(data.workspaceId).emit('participant_left', data);
    });

    socket.on('call_ended', (data) => {
        socket.to(data.workspaceId).emit('call_ended', data);
    });

    socket.on('disconnect', () => {
        console.log('[Socket] Client disconnected:', socket.id);
    });
});

// Database Connection and Server Startup
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gatherly_db')
    .then(() => {
        console.log('✅ Connected to MongoDB');
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('❌ MongoDB connection error:', error);
    });
```

---

## 3. Module 2: Workspace Data Modeler (`models/Space.js`)
* **Role**: Defines the schema and data validation rules for collaborative workspaces (Spaces) including invite codes, member details, themes, progress metrics, and fusion requests.
* **Path**: `LinkUp/backend/models/Space.js`

```javascript
const mongoose = require('mongoose');

const spaceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    inviteCode: {
        type: String,
        required: true,
        unique: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    members: {
        type: mongoose.Schema.Types.Mixed,
        default: []
    },
    type: {
        type: String,
        default: 'other'
    },
    cover: {
        type: String,
        default: ''
    },
    theme: {
        type: String
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        default: "active"
    },
    progress: {
        type: Number,
        default: 0
    },
    time: {
        type: String
    },
    fusionRequests: {
        type: Array,
        default: []
    }
}, { timestamps: true, strict: false });

module.exports = mongoose.model('Space', spaceSchema);
```

---

## 4. Module 3: Collaborative Expense Ledger & Settlement Engine (`routes/expenses.js`)
* **Role**: Governs HTTP REST API requests related to financial tasks. Handles listing and saving shared bills, splitting expenses dynamically, deleting items, and marking balance settlements.
* **Path**: `LinkUp/backend/routes/expenses.js`

```javascript
const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const Space = require('../models/Space');
const mongoose = require('mongoose');

// GET all expenses for a specific workspace
router.get('/workspace/:workspaceId', async (req, res) => {
    try {
        const { workspaceId } = req.params;
        
        let space;
        if (mongoose.Types.ObjectId.isValid(workspaceId)) {
            space = await Space.findById(workspaceId);
        } else {
            space = await Space.findOne({ id: workspaceId });
        }
        
        if (!space) return res.status(404).json({ error: 'Workspace not found' });
        
        const expenses = await Expense.find({ workspaceId: space._id }).sort({ createdAt: -1 });
        res.status(200).json(expenses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST a new expense
router.post('/', async (req, res) => {
    try {
        const { workspaceId, title, amount, category, paidBy, splitWith, date } = req.body;
        
        let space;
        if (mongoose.Types.ObjectId.isValid(workspaceId)) {
            space = await Space.findById(workspaceId);
        } else {
            space = await Space.findOne({ id: workspaceId });
        }
        
        if (!space) return res.status(404).json({ error: 'Workspace not found' });

        const newExpense = new Expense({
            workspaceId: space._id,
            title,
            amount,
            category,
            paidBy,
            splitWith: splitWith || [],
            date: date || new Date().toISOString().split('T')[0]
        });

        const saved = await newExpense.save();

        if (req.io) {
            req.io.to(space._id.toString()).emit('expense_created', saved);
        }

        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE expense
router.delete('/:expenseId', async (req, res) => {
    try {
        const { expenseId } = req.params;
        const deleted = await Expense.findByIdAndDelete(expenseId);
        if (!deleted) return res.status(404).json({ error: 'Expense not found' });
        
        if (req.io) {
            req.io.to(deleted.workspaceId.toString()).emit('expense_deleted', expenseId);
        }

        res.status(200).json({ message: 'Expense deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET all settlements for a specific workspace
router.get('/workspace/:workspaceId/settlements', async (req, res) => {
    try {
        const { workspaceId } = req.params;
        let space;
        if (mongoose.Types.ObjectId.isValid(workspaceId)) {
            space = await Space.findById(workspaceId);
        } else {
            space = await Space.findOne({ id: workspaceId });
        }
        if (!space) return res.status(404).json({ error: 'Workspace not found' });
        
        const settlements = await Settlement.find({ workspaceId: space._id }).sort({ createdAt: -1 });
        res.status(200).json(settlements);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST a new settlement
router.post('/settlements', async (req, res) => {
    try {
        const { workspaceId, receiptId, name, amount, settledBy, settledAt } = req.body;
        let space;
        if (mongoose.Types.ObjectId.isValid(workspaceId)) {
            space = await Space.findById(workspaceId);
        } else {
            space = await Space.findOne({ id: workspaceId });
        }
        if (!space) return res.status(404).json({ error: 'Workspace not found' });

        const newSettlement = new Settlement({
            workspaceId: space._id,
            receiptId,
            name,
            amount,
            settledBy,
            settledAt
        });

        const saved = await newSettlement.save();
        
        if (req.io) {
            req.io.to(space._id.toString()).emit('settlement_created', saved);
        }

        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
```

---

## 5. Module 4: Client-Side Workspace Access & Dynamic Invite Resolution (`InvitePage.jsx`)
* **Role**: Handles invite links on the client. Resolves invite tokens from routes, requests joining space authorizations via the REST API, updates the client-side active workspace local cache, and triggers UI redirection using **Framer Motion**.
* **Path**: `LinkUp/frontend/src/pages/InvitePage.jsx`

```javascript
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

    const currentUser = (() => {
        try { return JSON.parse(localStorage.getItem('gatherly_user') || 'null'); } catch { return null; }
    })();

    useEffect(() => {
        if (!code) { setStatus('error'); setErrorMsg('No invite code provided.'); return; }

        // Resolve workspace using the code
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

            // Sync with client-side local cache
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

                {status === 'loading' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Loader2 size={48} color="#6366f1" style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>
                            Resolving your invite link...
                        </p>
                    </motion.div>
                )}

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

                {status === 'found' && workspace && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
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
                                    boxShadow: '0 8px 25px rgba(99,102,241,0.4)'
                                }}
                            >
                                <Users size={20} /> Join Workspace <ArrowRight size={18} />
                            </button>
                        )}
                    </motion.div>
                )}

                {status === 'joining' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Loader2 size={48} color="#6366f1" style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
                        <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Joining workspace...</h3>
                        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Setting up your access.</p>
                    </motion.div>
                )}

                {status === 'joined' && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                        <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 1.5rem' }} />
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
```
