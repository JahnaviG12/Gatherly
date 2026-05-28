import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// In-memory call storage with participants list
const calls = new Map();
const workspaceUsers = new Map();

io.on('connection', (socket) => {
  console.log('✓ Socket connected:', socket.id);

  socket.on('join-workspace', ({ workspaceId, userId, userName }) => {
    socket.join(`workspace:${workspaceId}`);
    socket.data = { userId, userName, workspaceId, socketId: socket.id };

    if (!workspaceUsers.has(workspaceId)) {
      workspaceUsers.set(workspaceId, new Map());
    }
    workspaceUsers.get(workspaceId).set(userId, { userId, userName, socketId: socket.id });

    io.in(`workspace:${workspaceId}`).emit('workspace-members', {
      members: Array.from(workspaceUsers.get(workspaceId).values()),
    });
  });

  socket.on('call:offer', ({ workspaceId, callId, caller }) => {
    const callData = {
      callId,
      workspaceId,
      callerId: caller.id,
      callerName: caller.name,
      state: 'ringing',
      participants: [{ id: caller.id, name: caller.name, socketId: socket.id, status: 'calling' }],
      createdAt: Date.now(),
    };
    calls.set(callId, callData);

    console.log(`📞 Call offered: ${callId} from ${caller.name}`);
    
    // Broadcast call to all workspace members
    io.in(`workspace:${workspaceId}`).emit('incoming-call', { callId, caller });
    // Send updated participants list
    io.in(`workspace:${workspaceId}`).emit('call:participants', {
      callId,
      participants: callData.participants,
    });
  });

  socket.on('call:accept', ({ workspaceId, callId, accepter }) => {
    const call = calls.get(callId);
    if (call) {
      // Add accepter to participants
      const existingParticipant = call.participants.find((p) => p.id === accepter.id);
      if (!existingParticipant) {
        call.participants.push({ id: accepter.id, name: accepter.name, socketId: socket.id, status: 'joined' });
      }
      call.state = 'active';
      
      console.log(`✓ Call accepted: ${callId} by ${accepter.name}`);
      
      // Broadcast to all in workspace that call is accepted
      io.in(`workspace:${workspaceId}`).emit('call:accepted', { callId, accepter });
      // Send full participants list to everyone
      io.in(`workspace:${workspaceId}`).emit('call:participants', {
        callId,
        participants: call.participants,
      });
    }
  });

  socket.on('call:reject', ({ workspaceId, callId }) => {
    console.log(`✗ Call rejected: ${callId}`);
    io.in(`workspace:${workspaceId}`).emit('call:rejected', { callId });
    calls.delete(callId);
  });

  socket.on('join-call', ({ callId, user }) => {
    socket.join(`call:${callId}`);
    const call = calls.get(callId);
    if (call) {
      const participant = call.participants.find((p) => p.id === user.id);
      if (participant) participant.status = 'in-call';
      
      console.log(`📹 ${user.name} joined call room: ${callId}`);
      // Notify workspace of updated participants
      io.in(`workspace:${call.workspaceId}`).emit('call:participants', {
        callId,
        participants: call.participants,
      });
    }
    socket.to(`call:${callId}`).emit('peer-joined', { user });
  });

  socket.on('webrtc:offer', ({ callId, offer }) => {
    socket.to(`call:${callId}`).emit('webrtc:offer', { from: socket.data.userId, offer });
  });

  socket.on('webrtc:answer', ({ callId, answer }) => {
    socket.to(`call:${callId}`).emit('webrtc:answer', { from: socket.data.userId, answer });
  });

  socket.on('webrtc:ice', ({ callId, candidate }) => {
    socket.to(`call:${callId}`).emit('webrtc:ice', { from: socket.data.userId, candidate });
  });

  socket.on('leave-call', ({ workspaceId, callId }) => {
    const call = calls.get(callId);
    if (call) {
      const participant = call.participants.find((p) => p.id === socket.data.userId);
      if (participant) {
        call.participants = call.participants.filter((p) => p.id !== socket.data.userId);
      }
      io.in(`workspace:${workspaceId}`).emit('call:participants', {
        callId,
        participants: call.participants,
      });
      if (call.participants.length === 0) {
        calls.delete(callId);
        io.in(`workspace:${workspaceId}`).emit('call:ended', { callId });
        console.log(`🔚 Call ended: ${callId}`);
      }
    }
    socket.leave(`call:${callId}`);
    io.in(`call:${callId}`).emit('peer-left', { userId: socket.data.userId });
  });

  socket.on('disconnect', () => {
    const { workspaceId, userId } = socket.data;
    if (workspaceId && workspaceUsers.has(workspaceId)) {
      workspaceUsers.get(workspaceId).delete(userId);
      io.in(`workspace:${workspaceId}`).emit('workspace-members', {
        members: Array.from(workspaceUsers.get(workspaceId).values()),
      });
    }
    console.log('✗ Socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));