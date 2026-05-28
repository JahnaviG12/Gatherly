const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Space = require('../models/Space');
const mongoose = require('mongoose');

// GET all tasks for a specific workspace
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
        
        const tasks = await Task.find({ workspaceId: space._id }).sort({ createdAt: -1 });
        res.status(200).json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST a new task
router.post('/', async (req, res) => {
    try {
        const { workspaceId, title, desc, priority, status, dueDate, creator } = req.body;
        
        let space;
        if (mongoose.Types.ObjectId.isValid(workspaceId)) {
            space = await Space.findById(workspaceId);
        } else {
            space = await Space.findOne({ id: workspaceId });
        }
        
        if (!space) return res.status(404).json({ error: 'Workspace not found' });

        const newTask = new Task({
            workspaceId: space._id,
            title,
            desc,
            priority,
            status,
            dueDate,
            creator: mongoose.Types.ObjectId.isValid(creator) ? creator : null
        });

        const saved = await newTask.save();

        if (req.io) {
            req.io.to(space._id.toString()).emit('task_created', saved);
        }

        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update task status or details
router.put('/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const updates = req.body;
        
        const updated = await Task.findByIdAndUpdate(taskId, updates, { new: true });
        if (!updated) return res.status(404).json({ error: 'Task not found' });
        
        if (req.io) {
            req.io.to(updated.workspaceId.toString()).emit('task_updated', updated);
        }

        res.status(200).json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE task
router.delete('/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const deleted = await Task.findByIdAndDelete(taskId);
        if (!deleted) return res.status(404).json({ error: 'Task not found' });
        
        if (req.io) {
            req.io.to(deleted.workspaceId.toString()).emit('task_deleted', taskId);
        }

        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
