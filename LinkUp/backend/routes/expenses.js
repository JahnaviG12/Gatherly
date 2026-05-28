const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const Space = require('../models/Space');
const mongoose = require('mongoose');

// GET all expenses for a specific workspace
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
        
        const expenses = await Expense.find({ workspaceId: space._id }).sort({ createdAt: -1 });
        res.status(200).json(expenses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST a new expense
router.post('/', async (req, res) => {
    try {
        const { workspaceId, title, amount, category, paidBy, splitWith, date } = req.body;
        
        let space;
        if (mongoose.Types.ObjectId.isValid(workspaceId)) {
            space = await Space.findById(workspaceId);
        } else {
            space = await Space.findOne({ id: workspaceId });
        }
        
        if (!space) return res.status(404).json({ error: 'Workspace not found' });

        const newExpense = new Expense({
            workspaceId: space._id,
            title,
            amount,
            category,
            paidBy,
            splitWith: splitWith || [],
            date: date || new Date().toISOString().split('T')[0]
        });

        const saved = await newExpense.save();

        if (req.io) {
            req.io.to(space._id.toString()).emit('expense_created', saved);
        }

        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE expense
router.delete('/:expenseId', async (req, res) => {
    try {
        const { expenseId } = req.params;
        const deleted = await Expense.findByIdAndDelete(expenseId);
        if (!deleted) return res.status(404).json({ error: 'Expense not found' });
        
        if (req.io) {
            req.io.to(deleted.workspaceId.toString()).emit('expense_deleted', expenseId);
        }

        res.status(200).json({ message: 'Expense deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET all settlements for a specific workspace
router.get('/workspace/:workspaceId/settlements', async (req, res) => {
    try {
        const { workspaceId } = req.params;
        let space;
        if (mongoose.Types.ObjectId.isValid(workspaceId)) {
            space = await Space.findById(workspaceId);
        } else {
            space = await Space.findOne({ id: workspaceId });
        }
        if (!space) return res.status(404).json({ error: 'Workspace not found' });
        
        const settlements = await Settlement.find({ workspaceId: space._id }).sort({ createdAt: -1 });
        res.status(200).json(settlements);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST a new settlement
router.post('/settlements', async (req, res) => {
    try {
        const { workspaceId, receiptId, name, amount, settledBy, settledAt } = req.body;
        let space;
        if (mongoose.Types.ObjectId.isValid(workspaceId)) {
            space = await Space.findById(workspaceId);
        } else {
            space = await Space.findOne({ id: workspaceId });
        }
        if (!space) return res.status(404).json({ error: 'Workspace not found' });

        const newSettlement = new Settlement({
            workspaceId: space._id,
            receiptId,
            name,
            amount,
            settledBy,
            settledAt
        });

        const saved = await newSettlement.save();
        
        if (req.io) {
            req.io.to(space._id.toString()).emit('settlement_created', saved);
        }

        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
