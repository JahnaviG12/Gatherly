const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Space',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    desc: {
        type: String,
        trim: true,
        default: ''
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['todo', 'inprogress', 'review', 'done'],
        default: 'todo'
    },
    dueDate: {
        type: String, // Storing as YYYY-MM-DD for simplicity
        default: ''
    },
    assignees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
