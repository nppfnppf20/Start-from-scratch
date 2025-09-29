const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const FeeQuoteLog = require('../models/FeeQuoteLog');
const Project = require('../models/Project');

// @route   GET /api/fee-quote-logs
// @desc    Get fee quote logs (filtered by projectId)
router.get('/', async (req, res) => {
    try {
        const filter = {};
        
        // Require projectId for this endpoint since logs are project-specific
        if (!req.query.projectId) {
            return res.status(400).json({ msg: 'Project ID is required' });
        }

        if (!mongoose.Types.ObjectId.isValid(req.query.projectId)) {
            return res.status(400).json({ msg: 'Invalid Project ID format' });
        }

        filter.projectId = req.query.projectId;

        // Find logs and sort by most recent first
        const logs = await FeeQuoteLog.find(filter)
            .sort({ sentDate: -1 })
            .populate('projectId', 'name'); // Optional: populate project name

        res.json(logs);
    } catch (err) {
        console.error('Error fetching fee quote logs:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/fee-quote-logs
// @desc    Create a new fee quote log entry
router.post('/', async (req, res) => {
    const { projectId, emails, sentDate } = req.body;

    // Basic validation
    if (!projectId) {
        return res.status(400).json({ msg: 'Project ID is required' });
    }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({ msg: 'At least one email address is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ msg: 'Invalid Project ID format' });
    }

    try {
        // Verify project exists
        const projectExists = await Project.findById(projectId);
        if (!projectExists) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        // Create new log entry
        const logData = {
            projectId,
            emails: emails.map(email => email.trim().toLowerCase()), // Normalize emails
        };

        // Only set sentDate if provided, otherwise let model default to now
        if (sentDate) {
            logData.sentDate = new Date(sentDate);
        }

        const newLog = new FeeQuoteLog(logData);
        const savedLog = await newLog.save();

        res.status(201).json(savedLog);

    } catch (err) {
        console.error('Error creating fee quote log:', err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/fee-quote-logs/:id
// @desc    Get a single fee quote log by ID
router.get('/:id', async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: 'Invalid Log ID format' });
    }

    try {
        const log = await FeeQuoteLog.findById(req.params.id)
            .populate('projectId', 'name');
            
        if (!log) {
            return res.status(404).json({ msg: 'Fee quote log not found' });
        }

        res.json(log);
    } catch (err) {
        console.error('Error fetching fee quote log by ID:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/fee-quote-logs/:id
// @desc    Delete a fee quote log by ID (admin only)
router.delete('/:id', async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: 'Invalid Log ID format' });
    }

    try {
        const log = await FeeQuoteLog.findById(req.params.id);
        if (!log) {
            return res.status(404).json({ msg: 'Fee quote log not found' });
        }

        await FeeQuoteLog.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Fee quote log removed' });

    } catch (err) {
        console.error('Error deleting fee quote log:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;