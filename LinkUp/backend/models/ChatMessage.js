const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    // spaceId (ObjectId) — preferred going forward
    spaceId: {
        type: String,
        index: true
    },
    // spaceName — legacy field kept for backwards compatibility
    spaceName: {
        type: String
    },
    sender: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        default: 'https://i.pravatar.cc/150?img=1'
    },
    text: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: null
    },
    audio: {
        type: Boolean,
        default: null
    },
    channel: {
        type: String,
        default: 'general'
    },
    self: {
        type: Boolean,
        default: false
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    recipient: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
