const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
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
    amount: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        default: 'Shopping'
    },
    paidBy: {
        type: String,
        required: true
    },
    splitWith: [{
        type: String
    }],
    date: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
