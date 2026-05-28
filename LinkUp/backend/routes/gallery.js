const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const GalleryItem = require('../models/GalleryItem');
const Space = require('../models/Space');

// Helper: resolve workspace by ID
const resolveSpace = async (workspaceId) => {
    if (mongoose.Types.ObjectId.isValid(workspaceId)) {
        return await Space.findById(workspaceId);
    }
    return await Space.findOne({ id: workspaceId });
};

// GET all gallery items for a workspace
router.get('/workspace/:workspaceId', async (req, res) => {
    try {
        const space = await resolveSpace(req.params.workspaceId);
        if (!space) return res.status(404).json({ error: 'Workspace not found' });

        const items = await GalleryItem.find({ workspaceId: space._id }).sort({ createdAt: -1 });
        res.status(200).json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST upload a new gallery item
router.post('/', async (req, res) => {
    try {
        const { workspaceId, albumId, albumName, url, type, uploader, uploaderAvatar, caption } = req.body;

        const space = await resolveSpace(workspaceId);
        if (!space) return res.status(404).json({ error: 'Workspace not found' });

        const newItem = new GalleryItem({
            workspaceId: space._id,
            albumId: albumId || 'default',
            albumName: albumName || 'General',
            url,
            type: type || 'photo',
            uploader,
            uploaderAvatar: uploaderAvatar || `https://ui-avatars.com/api/?name=${uploader}&background=random&color=fff`,
            caption: caption || ''
        });

        const saved = await newItem.save();

        // Broadcast to all workspace members via Socket.IO
        if (req.io) {
            req.io.to(space._id.toString()).emit('gallery_item_added', saved);
        }

        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT like/unlike a gallery item
router.put('/:itemId/like', async (req, res) => {
    try {
        const { username } = req.body;
        const item = await GalleryItem.findById(req.params.itemId);
        if (!item) return res.status(404).json({ error: 'Item not found' });

        const alreadyLiked = item.likedBy.includes(username);
        if (alreadyLiked) {
            item.likedBy = item.likedBy.filter(u => u !== username);
            item.likes = Math.max(0, item.likes - 1);
        } else {
            item.likedBy.push(username);
            item.likes += 1;
        }

        const updated = await item.save();

        if (req.io) {
            req.io.to(updated.workspaceId.toString()).emit('gallery_item_updated', updated);
        }

        res.status(200).json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST add a comment to a gallery item
router.post('/:itemId/comment', async (req, res) => {
    try {
        const { username, text } = req.body;
        const item = await GalleryItem.findById(req.params.itemId);
        if (!item) return res.status(404).json({ error: 'Item not found' });

        const comment = {
            id: new mongoose.Types.ObjectId().toString(),
            username,
            text,
            createdAt: new Date().toISOString()
        };

        item.comments.push(comment);
        const updated = await item.save();

        if (req.io) {
            req.io.to(updated.workspaceId.toString()).emit('gallery_item_updated', updated);
        }

        res.status(201).json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE a gallery item
router.delete('/:itemId', async (req, res) => {
    try {
        const deleted = await GalleryItem.findByIdAndDelete(req.params.itemId);
        if (!deleted) return res.status(404).json({ error: 'Item not found' });

        if (req.io) {
            req.io.to(deleted.workspaceId.toString()).emit('gallery_item_deleted', req.params.itemId);
        }

        res.status(200).json({ message: 'Gallery item deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
