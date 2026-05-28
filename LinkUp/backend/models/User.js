const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    profilePicture: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    website: {
        type: String,
        default: ''
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Custom', 'Prefer not to say', ''],
        default: ''
    },
    language: {
        type: String,
        default: 'English'
    },
    country: {
        type: String,
        default: 'India'
    },
    profileVisibility: {
        type: String,
        enum: ['Public', 'Team Only', 'Private'],
        default: 'Public'
    },
    statusMessage: {
        type: String,
        default: ''
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    loginAlerts: {
        type: Boolean,
        default: true
    },
    emailNotifications: {
        type: Boolean,
        default: true
    },
    pushNotifications: {
        type: Boolean,
        default: true
    },
    workspaceUpdates: {
        type: Boolean,
        default: true
    },
    mentionAlerts: {
        type: Boolean,
        default: true
    },
    theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isBlocked: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
