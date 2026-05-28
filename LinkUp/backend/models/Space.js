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
