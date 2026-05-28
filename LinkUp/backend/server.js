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

// Pass io to routes
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

// ─── Socket.IO ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join a workspace room — client sends this immediately on entering a workspace
    socket.on('join_workspace', (workspaceId) => {
        socket.join(workspaceId);
        console.log(`[Socket] User ${socket.id} joined workspace room: ${workspaceId}`);
    });

    socket.on('leave_workspace', (workspaceId) => {
        socket.leave(workspaceId);
        console.log(`[Socket] User ${socket.id} left workspace room: ${workspaceId}`);
    });

    // Client-side chat send (real-time only, DB save is done via REST POST)
    socket.on('send_chat_message', (data) => {
        // Broadcast to everyone in the workspace room except sender
        socket.to(data.workspaceId).emit('new_chat_message', data.message);
    });

    // Client-side poll vote broadcast
    socket.on('poll_voted', (data) => {
        socket.to(data.workspaceId).emit('polls_updated', data.polls);
    });

    // Client-side notes update
    socket.on('notes_saved', (data) => {
        socket.to(data.workspaceId).emit('notes_updated', data.notes);
    });

    // Activity broadcast
    socket.on('activity_update', (data) => {
        socket.to(data.workspaceId).emit('activity_logged', data.activity);
    });

    // Typing indicators
    socket.on('typing_start', (data) => {
        socket.to(data.workspaceId).emit('user_typing', { username: data.username, channel: data.channel });
    });

    socket.on('typing_stop', (data) => {
        socket.to(data.workspaceId).emit('user_stopped_typing', { username: data.username });
    });

    // ── Video Call Signalling ──────────────────────────────────────────────────
    // Host starts a call → notify all other members in the workspace room
    socket.on('call_started', (data) => {
        // data: { workspaceId, callerName, callerAvatar, workspaceName, roomName }
        console.log(`[Socket] Call started by ${data.callerName} in workspace ${data.workspaceId}`);
        socket.to(data.workspaceId).emit('incoming_call', data);
    });

    // A member joins the active call → tell all current call participants
    socket.on('call_joined', (data) => {
        // data: { workspaceId, participantName, participantAvatar }
        console.log(`[Socket] ${data.participantName} joined the call in ${data.workspaceId}`);
        socket.to(data.workspaceId).emit('participant_joined', data);
    });

    // A member leaves the call → tell all remaining participants
    socket.on('call_left', (data) => {
        // data: { workspaceId, participantName }
        console.log(`[Socket] ${data.participantName} left the call in ${data.workspaceId}`);
        socket.to(data.workspaceId).emit('participant_left', data);
    });

    // Host ends the call entirely → tell all members to dismiss the call UI
    socket.on('call_ended', (data) => {
        // data: { workspaceId }
        console.log(`[Socket] Call ended in workspace ${data.workspaceId}`);
        socket.to(data.workspaceId).emit('call_ended', data);
    });

    socket.on('disconnect', () => {
        console.log('[Socket] Client disconnected:', socket.id);
    });
});

// ─── Database connection ──────────────────────────────────────────────────────
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