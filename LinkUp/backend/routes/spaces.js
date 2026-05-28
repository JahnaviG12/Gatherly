const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Space = require('../models/Space');
const ChatMessage = require('../models/ChatMessage');

// ─── INVITE BY CODE (must come before /:id) ─────────────────────────────────

// GET: Resolve workspace by invite code (for invite link landing)
router.get('/invite/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const space = await Space.findOne({ inviteCode: code });
        if (!space) {
            return res.status(404).json({ error: 'Invalid invite code. Workspace not found.' });
        }
        res.status(200).json(space);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Join workspace by invite code (adds user as member)
router.post('/invite/:code/join', async (req, res) => {
    try {
        const { code } = req.params;
        const { username, email, userId } = req.body;

        if (!username || !email) {
            return res.status(400).json({ error: 'Username and email are required.' });
        }

        const space = await Space.findOne({ inviteCode: code });
        if (!space) {
            return res.status(404).json({ error: 'Invalid invite code. Workspace not found.' });
        }

        // Check if already a member
        const currentMembers = Array.isArray(space.members) ? space.members : [];
        const alreadyMember = currentMembers.some(m => {
            if (!m) return false;
            if (typeof m === 'string') return m === email || m === username;
            return m.email === email || m.userId === userId;
        });

        if (alreadyMember) {
            return res.status(200).json({ space, alreadyMember: true });
        }

        // Add as member with full info
        const newMember = {
            userId: userId || null,
            name: username,
            email: email,
            role: 'Member',
            joinedAt: new Date().toISOString()
        };

        const updatedMembers = [...currentMembers, newMember];
        space.set('members', updatedMembers);
        space.markModified('members');

        // Log join activity
        const currentActivities = Array.isArray(space.activities) ? space.activities : [];
        const joinActivity = {
            id: `act_${Date.now()}`,
            user: username,
            action: 'joined the workspace via invite link.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'join'
        };
        const updatedActivities = [joinActivity, ...currentActivities].slice(0, 50);
        space.set('activities', updatedActivities);
        space.markModified('activities');

        await space.save();

        // Broadcast member join to all current workspace members via socket
        if (req.io) {
            req.io.to(space._id.toString()).emit('member_joined', {
                member: newMember,
                activity: joinActivity,
                workspaceId: space._id.toString()
            });
        }

        // Broadcast workspace update (so dashboard refreshes)
        if (req.io) {
            req.io.emit('workspace_updated', { workspaceId: space._id.toString() });
        }

        res.status(200).json({ space, alreadyMember: false });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── USER-SPECIFIC WORKSPACES ────────────────────────────────────────────────

// GET: All workspaces for a specific user (by email or username)
router.get('/user/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;

        // Find all spaces where this user is a member
        const allSpaces = await Space.find({});
        const userSpaces = allSpaces.filter(space => {
            const members = Array.isArray(space.members) ? space.members : [];
            return members.some(m => {
                if (!m) return false;
                if (typeof m === 'string') return m === identifier;
                return m.email === identifier || m.name === identifier || m.userId === identifier;
            });
        });

        res.status(200).json(userSpaces);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mock fallback databases to seed MongoDB
const initialSpaces = [
    { name: "Goa Trip 2026", desc: "Annual college trip planning and itinerary.", bannerImage: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80", status: "Active", progress: 65, membersCount: 12, memberNames: ["Sarah Connor", "Alex Mercer", "Mike Ross", "You"], time: "Ends in 3 days", type: "trip" },
    { name: "Project Alpha", desc: "Final year BCA project collaboration space.", bannerImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80", status: "Planning", progress: 30, membersCount: 8, memberNames: ["Jessica Day", "You"], time: "Starts in 1 week", type: "project" },
    { name: "Alumni Meet", desc: "Organizing the 2026 batch alumni gathering event.", bannerImage: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80", status: "Planning", progress: 85, membersCount: 24, memberNames: ["Mike Ross", "You"], time: "Starts in 2 weeks", type: "event" },
    { name: "Tech Hackathon", desc: "48-hour coding marathon planning and tasks.", bannerImage: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80", status: "Completed", progress: 100, membersCount: 15, memberNames: ["Alex Mercer", "You"], time: "Ended 2 weeks ago", type: "hackathon" }
];

const initialMessages = [
    { sender: 'Sarah Connor', avatar: 'https://i.pravatar.cc/150?img=5', text: 'Hey guys! Have we confirmed the dates for the resort booking yet?', self: false, isPrivate: false },
    { sender: 'Alex Mercer', avatar: 'https://i.pravatar.cc/150?img=11', text: 'Yes! Check out the Polls tab, Nov 01-05 is winning by a landslide.', self: false, isPrivate: false },
    { sender: 'You', avatar: 'https://i.pravatar.cc/150?img=1', text: 'Just logged the resort expense splits inside the Wallet. Please review!', self: true, isPrivate: false },
    { sender: 'Mike Ross', avatar: 'https://i.pravatar.cc/150?img=8', text: 'Amazing work! I will clear my pending split right now.', self: false, isPrivate: false }
];

// GET: All workspaces (spaces)
router.get('/', async (req, res) => {
    try {
        let spaces = await Space.find({});
        if (spaces.length === 0) {
            const dummyCreatorId = new mongoose.Types.ObjectId();
            const seeded = initialSpaces.map(sp => ({
                ...sp,
                inviteCode: `ws_${Math.round(Math.random() * 99999)}`,
                creator: dummyCreatorId,
                members: [{ name: 'You', email: 'you@example.com', role: 'Admin' }]
            }));
            await Space.insertMany(seeded);
            spaces = await Space.find({});
        }
        res.status(200).json(spaces);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET: Fetch a single workspace space details by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let space;
        if (mongoose.Types.ObjectId.isValid(id)) {
            space = await Space.findById(id);
        } else {
            space = await Space.findOne({ name: id });
        }
        if (!space && id) {
            space = await Space.findOne({ id: id });
        }
        if (!space) {
            return res.status(404).json({ error: 'Workspace not found' });
        }
        res.status(200).json(space);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Create a new workspace space
router.post('/', async (req, res) => {
    try {
        const payload = req.body;
        if (!payload.inviteCode) {
            payload.inviteCode = `ws_${Math.round(Math.random() * 999999)}`;
        }
        if (!payload.creator) {
            payload.creator = new mongoose.Types.ObjectId();
        }

        const newSpace = new Space(payload);
        const saved = await newSpace.save();

        // Broadcast new workspace to all connected clients
        if (req.io) {
            req.io.emit('workspace_created', saved);
        }

        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT: Update a workspace space details by ID or Name
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const payload = req.body;

        let space;
        if (mongoose.Types.ObjectId.isValid(id)) {
            space = await Space.findById(id);
        } else {
            space = await Space.findOne({ name: id });
        }

        if (!space && id) {
            space = await Space.findOne({ id: id });
        }

        if (!space) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        // Update fields
        for (const key in payload) {
            space.set(key, payload[key]);
            space.markModified(key);
        }

        const updated = await space.save();

        // Broadcast workspace update to all workspace members
        if (req.io) {
            req.io.to(updated._id.toString()).emit('workspace_data_updated', updated);
        }

        res.status(200).json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── CHAT ────────────────────────────────────────────────────────────────────

// GET: Fetch all chat messages for a workspace (by spaceId)
router.get('/:spaceId/messages', async (req, res) => {
    try {
        const { spaceId } = req.params;
        const { limit, before, beforeId } = req.query;
        let query = { spaceId: spaceId };
        
        // Find the space to get its name (for backwards compatibility/legacy chats)
        let space;
        if (mongoose.Types.ObjectId.isValid(spaceId)) {
            space = await Space.findById(spaceId);
        } else {
            space = await Space.findOne({ name: spaceId });
        }
        if (!space) {
            space = await Space.findOne({ id: spaceId });
        }
        
        if (space) {
            // Find by spaceId OR spaceName matching the workspace name
            query = {
                $or: [
                    { spaceId: spaceId },
                    { spaceId: space._id.toString() },
                    { spaceName: space.name }
                ]
            };
        }
        
        let q = ChatMessage.find(query).sort({ createdAt: 1 });

        // Support pagination: fetch only the latest `limit` messages (default 1000)
        const lim = Math.min(parseInt(limit || '1000', 10) || 1000, 5000);

        if (beforeId) {
            // find the message to get its createdAt
            const beforeMsg = await ChatMessage.findById(beforeId);
            if (beforeMsg) {
                q = ChatMessage.find({ ...query, createdAt: { $lt: beforeMsg.createdAt } }).sort({ createdAt: -1 }).limit(lim).sort({ createdAt: 1 });
            }
        } else if (before) {
            const beforeDate = new Date(before);
            if (!isNaN(beforeDate.getTime())) {
                q = ChatMessage.find({ ...query, createdAt: { $lt: beforeDate } }).sort({ createdAt: -1 }).limit(lim).sort({ createdAt: 1 });
            }
        } else {
            // get the latest `lim` messages
            q = ChatMessage.find(query).sort({ createdAt: -1 }).limit(lim).sort({ createdAt: 1 });
        }

        let messages = await q.exec();
        
        // If no messages found and it's a pre-existing initial workspace, seed the initial messages
        if (messages.length === 0 && space) {
            const isPreExisting = initialSpaces.some(s => s.name.toLowerCase() === space.name.toLowerCase());
            if (isPreExisting) {
                const seeded = initialMessages.map(msg => ({
                    ...msg,
                    spaceId: space._id.toString(),
                    spaceName: space.name,
                    channel: 'general'
                }));
                await ChatMessage.insertMany(seeded);
                messages = await ChatMessage.find(query).sort({ createdAt: 1 });
            }
        }
        
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Save a new chat message (with socket broadcast)
router.post('/:spaceId/messages', async (req, res) => {
    try {
        const { spaceId } = req.params;
        const { sender, avatar, text, isPrivate, recipient, channel, image, audio } = req.body;

        // Resolve correct spaceId and spaceName for consistent persistence
        let finalSpaceId = spaceId;
        let finalSpaceName = spaceId;
        
        let space;
        if (mongoose.Types.ObjectId.isValid(spaceId)) {
            space = await Space.findById(spaceId);
        } else {
            space = await Space.findOne({ name: spaceId });
        }
        if (!space) {
            space = await Space.findOne({ id: spaceId });
        }
        
        if (space) {
            finalSpaceId = space._id.toString();
            finalSpaceName = space.name;
        }

        const newMessage = new ChatMessage({
            spaceName: finalSpaceName,
            spaceId: finalSpaceId,
            sender,
            avatar,
            text: text || (image ? '[image]' : audio ? '[voice note]' : ''),
            self: false,
            isPrivate: isPrivate || false,
            recipient: recipient || '',
            channel: channel || 'general',
            image: image || null,
            audio: audio || null
        });

        const saved = await newMessage.save();

        // Broadcast to all clients in this workspace room (both spaceId and finalSpaceId)
        if (req.io) {
            req.io.to(spaceId).emit('new_chat_message', saved);
            if (space && finalSpaceId !== spaceId) {
                req.io.to(finalSpaceId).emit('new_chat_message', saved);
            }
        }

        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Legacy chat routes (keep for backwards compatibility)
router.get('/chat/:spaceName', async (req, res) => {
    try {
        const { spaceName } = req.params;
        let messages = await ChatMessage.find({ spaceName });
        if (messages.length === 0) {
            const isPreExisting = initialSpaces.some(s => s.name.toLowerCase() === spaceName.toLowerCase());
            if (isPreExisting) {
                const seeded = initialMessages.map(msg => ({ ...msg, spaceName }));
                await ChatMessage.insertMany(seeded);
                messages = await ChatMessage.find({ spaceName });
            }
        }
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/chat', async (req, res) => {
    try {
        const { spaceName, sender, avatar, text, self, isPrivate, recipient } = req.body;
        const newMessage = new ChatMessage({ spaceName, sender, avatar, text, self, isPrivate: isPrivate || false, recipient: recipient || '' });
        const saved = await newMessage.save();

        // Also broadcast via socket
        if (req.io) {
            const space = await Space.findOne({ name: spaceName });
            if (space) {
                req.io.to(space._id.toString()).emit('new_chat_message', saved);
            }
        }

        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── WORKSPACE DATA UPDATES (polls, notes, activities) via socket broadcast ──

// POST: Update polls for a workspace (broadcasts to all members)
router.post('/:spaceId/polls', async (req, res) => {
    try {
        const { spaceId } = req.params;
        const { polls } = req.body;

        let space;
        if (mongoose.Types.ObjectId.isValid(spaceId)) {
            space = await Space.findById(spaceId);
        } else {
            space = await Space.findOne({ id: spaceId });
        }
        if (!space) return res.status(404).json({ error: 'Workspace not found' });

        space.set('polls', polls);
        space.markModified('polls');
        const updated = await space.save();

        if (req.io) {
            req.io.to(space._id.toString()).emit('polls_updated', polls);
        }

        res.status(200).json({ polls: updated.polls });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Update notes for a workspace (broadcasts to all members)
router.post('/:spaceId/notes', async (req, res) => {
    try {
        const { spaceId } = req.params;
        const { notes } = req.body;

        let space;
        if (mongoose.Types.ObjectId.isValid(spaceId)) {
            space = await Space.findById(spaceId);
        } else {
            space = await Space.findOne({ id: spaceId });
        }
        if (!space) return res.status(404).json({ error: 'Workspace not found' });

        space.set('notes', notes);
        space.markModified('notes');
        const updated = await space.save();

        if (req.io) {
            req.io.to(space._id.toString()).emit('notes_updated', notes);
        }

        res.status(200).json({ notes: updated.notes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Log an activity and broadcast to workspace (broadcasts to all members)
router.post('/:spaceId/activity', async (req, res) => {
    try {
        const { spaceId } = req.params;
        const { activity } = req.body;

        let space;
        if (mongoose.Types.ObjectId.isValid(spaceId)) {
            space = await Space.findById(spaceId);
        } else {
            space = await Space.findOne({ id: spaceId });
        }
        if (!space) return res.status(404).json({ error: 'Workspace not found' });

        const currentActivities = Array.isArray(space.activities) ? space.activities : [];
        const newActivity = {
            id: `act_${Date.now()}`,
            ...activity,
            time: activity.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const updatedActivities = [newActivity, ...currentActivities].slice(0, 50);

        space.set('activities', updatedActivities);
        space.markModified('activities');
        await space.save();

        if (req.io) {
            req.io.to(space._id.toString()).emit('activity_logged', newActivity);
        }

        res.status(201).json(newActivity);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── WORKSPACE FUSION ENDPOINTS ──────────────────────────────────────────────

// Send collaboration/fusion request
router.post('/fusion/request', async (req, res) => {
    try {
        const { senderId, receiverId } = req.body;

        const senderSpace = await Space.findById(senderId);
        const receiverSpace = await Space.findById(receiverId);

        if (!senderSpace || !receiverSpace) {
            return res.status(404).json({ error: 'One or both workspaces not found.' });
        }

        const currentReqs = Array.isArray(receiverSpace.fusionRequests) ? receiverSpace.fusionRequests : [];

        const alreadyExists = currentReqs.some(r => r.senderId === senderId);
        if (alreadyExists) {
            return res.status(400).json({ error: 'A collaboration request is already pending.' });
        }

        const newRequest = {
            id: `freq_${Date.now()}`,
            senderId: senderSpace._id.toString(),
            senderName: senderSpace.name,
            status: 'pending',
            createdAt: new Date()
        };

        const updatedReqs = [...currentReqs, newRequest];
        receiverSpace.set('fusionRequests', updatedReqs);
        receiverSpace.markModified('fusionRequests');
        await receiverSpace.save();

        // Broadcast fusion request notification
        if (req.io) {
            req.io.to(receiverSpace._id.toString()).emit('fusion_request_received', newRequest);
        }

        res.status(200).json({ success: true, message: 'Collaboration request sent successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Respond to collaboration request (accept/decline)
router.post('/fusion/respond', async (req, res) => {
    try {
        const { spaceId, requestId, action } = req.body;

        const receiverSpace = await Space.findById(spaceId);
        if (!receiverSpace) {
            return res.status(404).json({ error: 'Workspace not found.' });
        }

        const request = receiverSpace.fusionRequests.find(r => r.id === requestId);
        if (!request) {
            return res.status(404).json({ error: 'Collaboration request not found.' });
        }

        const senderSpace = await Space.findById(request.senderId);

        if (action === 'decline') {
            receiverSpace.fusionRequests = receiverSpace.fusionRequests.filter(r => r.id !== requestId);
            receiverSpace.markModified('fusionRequests');
            await receiverSpace.save();
            return res.status(200).json({ success: true, message: 'Request declined.' });
        }

        if (action === 'accept') {
            if (!senderSpace) {
                return res.status(404).json({ error: 'Sender workspace no longer exists.' });
            }

            // 1. Merge Members (unique union)
            const senderMembers = Array.isArray(senderSpace.members) ? senderSpace.members : [];
            const receiverMembers = Array.isArray(receiverSpace.members) ? receiverSpace.members : [];

            const memberIds = new Set();
            const mergedMembers = [];

            [...senderMembers, ...receiverMembers].forEach(member => {
                if (!member) return;
                const idStr = typeof member === 'object' ? (member.email || member._id || member.id || String(member)) : String(member);
                if (!memberIds.has(idStr)) {
                    memberIds.add(idStr);
                    mergedMembers.push(member);
                }
            });

            // 2. Create the brand new Fused Space
            const fusedName = `${senderSpace.name} × ${receiverSpace.name} Collab`;
            const fusedSpace = new Space({
                name: fusedName,
                description: `✨ Fusion workspace. Cross-collaboration between "${senderSpace.name}" and "${receiverSpace.name}".`,
                inviteCode: `fusion_${Math.round(Math.random() * 999999)}`,
                creator: receiverSpace.creator,
                members: mergedMembers,
                type: 'collab',
                cover: 'https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?auto=format&fit=crop&w=800&q=80',
                theme: 'ocean',
                activities: [
                    {
                        id: `act_${Date.now()}`,
                        user: 'System',
                        action: `created this workspace by fusing "${senderSpace.name}" and "${receiverSpace.name}"!`,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                ]
            });

            const savedFusedSpace = await fusedSpace.save();

            // 3. Clone tasks
            const Task = require('../models/Task');
            const senderTasks = await Task.find({ workspaceId: senderSpace._id });
            const receiverTasks = await Task.find({ workspaceId: receiverSpace._id });

            const tasksToInsert = [...senderTasks, ...receiverTasks].map(task => {
                const plainObj = task.toObject();
                delete plainObj._id;
                delete plainObj.id;
                delete plainObj.createdAt;
                delete plainObj.updatedAt;
                return {
                    ...plainObj,
                    workspaceId: savedFusedSpace._id,
                    title: `[${task.workspaceId.toString() === senderSpace._id.toString() ? senderSpace.name : receiverSpace.name}] ${task.title}`
                };
            });

            if (tasksToInsert.length > 0) {
                await Task.insertMany(tasksToInsert);
            }

            // 4. Clone expenses
            const Expense = require('../models/Expense');
            const senderExpenses = await Expense.find({ workspaceId: senderSpace._id });
            const receiverExpenses = await Expense.find({ workspaceId: receiverSpace._id });

            const expensesToInsert = [...senderExpenses, ...receiverExpenses].map(exp => {
                const plainObj = exp.toObject();
                delete plainObj._id;
                delete plainObj.id;
                delete plainObj.createdAt;
                delete plainObj.updatedAt;
                return {
                    ...plainObj,
                    workspaceId: savedFusedSpace._id,
                    title: `[${exp.workspaceId.toString() === senderSpace._id.toString() ? senderSpace.name : receiverSpace.name}] ${exp.title}`
                };
            });

            if (expensesToInsert.length > 0) {
                await Expense.insertMany(expensesToInsert);
            }

            // 5. Clone settlements
            const Settlement = require('../models/Settlement');
            const senderSettlements = await Settlement.find({ workspaceId: senderSpace._id });
            const receiverSettlements = await Settlement.find({ workspaceId: receiverSpace._id });

            const settlementsToInsert = [...senderSettlements, ...receiverSettlements].map(set => {
                const plainObj = set.toObject();
                delete plainObj._id;
                delete plainObj.id;
                delete plainObj.createdAt;
                delete plainObj.updatedAt;
                return {
                    ...plainObj,
                    workspaceId: savedFusedSpace._id,
                    receiptId: `FUSE-${set.receiptId}-${Math.round(Math.random() * 9999)}`
                };
            });

            if (settlementsToInsert.length > 0) {
                await Settlement.insertMany(settlementsToInsert);
            }

            // 6. Create system chat message
            const systemMsg = new ChatMessage({
                spaceName: fusedName,
                spaceId: savedFusedSpace._id.toString(),
                sender: 'LinkUp Bot',
                avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=LinkUp',
                text: `🎉 Welcome to your new Collaborative Fusion workspace! Members from both teams can now work together seamlessly on merged tasks, wallets, and chats.`,
                self: false,
                isPrivate: false
            });
            await systemMsg.save();

            // 7. Clean up request
            receiverSpace.fusionRequests = receiverSpace.fusionRequests.filter(r => r.id !== requestId);
            receiverSpace.markModified('fusionRequests');
            await receiverSpace.save();

            // Broadcast new fused workspace to all connected clients
            if (req.io) {
                req.io.emit('workspace_created', savedFusedSpace);
            }

            return res.status(201).json({
                success: true,
                message: 'Workspace collaboration accepted! A brand new combined workspace has been created.',
                newSpace: savedFusedSpace
            });
        }

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
