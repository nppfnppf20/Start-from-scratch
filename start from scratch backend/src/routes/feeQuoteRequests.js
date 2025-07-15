const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const FeeQuoteRequest = require('../models/FeeQuoteRequest');
const { protect } = require('../middleware/authMiddleware');

// Use auth middleware for all routes in this file
router.use(protect);

// @route   GET /api/fee-quote-requests
// @desc    Get all fee quote requests for a specific project
// @access  Private
router.get('/', async (req, res) => {
    try {
        const { projectId } = req.query;
        if (!projectId) {
            return res.status(400).json({ msg: 'Project ID is required' });
        }

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ msg: 'Invalid Project ID format' });
        }

        const requests = await FeeQuoteRequest.find({ projectId }).sort({ requestSentDate: -1 });
        res.json(requests);

    } catch (err) {
        console.error('Error fetching fee quote requests:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/fee-quote-requests
// @desc    Create a new fee quote request record
// @access  Private
router.post('/', async (req, res) => {
    try {
        const { projectId, discipline, organisation, contactName, email, phoneNumber } = req.body;

        // Basic validation
        if (!projectId || !discipline || !organisation || !contactName || !email) {
            return res.status(400).json({ msg: 'Please provide all required fields.' });
        }

        const newRequest = new FeeQuoteRequest({
            projectId,
            discipline,
            organisation,
            contactName,
            email,
            phoneNumber
        });

        const savedRequest = await newRequest.save();
        res.status(201).json(savedRequest);

    } catch (err) {
        console.error('Error creating fee quote request:', err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router; 