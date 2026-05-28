const mongoose = require('mongoose');

const galleryItemSchema = new mongoose.Schema({
    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Space',
        required: true,
        index: true
    },
    albumId: {
        type: String,
        default: 'default'
    },
    albumName: {
        type: String,
        default: 'General'
    },
    url: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['photo', 'video'],
        default: 'photo'
    },
    uploader: {
        type: String,
        required: true
    },
    uploaderAvatar: {
        type: String,
        default: ''
    },
    caption: {
        type: String,
        default: ''
    },
    likes: {
        type: Number,
        default: 0
    },
    likedBy: {
        type: [String],
        default: []
    },
    comments: {
        type: Array,
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model('GalleryItem', galleryItemSchema);
