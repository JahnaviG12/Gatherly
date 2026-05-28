const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Space',
        required: true
    },
    receiptId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String, // person who was settled with
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    settledBy: {
        type: String, // the person making the payment
        required: true
    },
    settledAt: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Settlement', settlementSchema);
