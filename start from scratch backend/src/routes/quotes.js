const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // Needed for ObjectId validation
const Quote = require('../models/Quote');
const Project = require('../models/Project'); // Optional: To verify project exists before adding quote

// @route   GET /api/quotes
// @desc    Get all quotes (optionally filtered by projectId)
// @access  Public (adjust as needed)
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.projectId) {
            if (!mongoose.Types.ObjectId.isValid(req.query.projectId)) {
                return res.status(400).json({ msg: 'Invalid Project ID format' });
            }
            filter.projectId = req.query.projectId;
        }

        // --- Role-based filtering ---
        // If the user is a surveyor, only show them their own quotes.
        // Admins can see all quotes.
        if (req.user.role === 'surveyor') {
            filter.surveyor = req.user.id;
        }

        // Consider adding sorting, e.g., .sort({ date: -1 })
        const quotes = await Quote.find(filter);
        res.json(quotes);
    } catch (err) {
        console.error('Error fetching quotes:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/quotes
// @desc    Create a new quote
// @access  Public (adjust as needed)
router.post('/', async (req, res) => {
    const { projectId, discipline, organisation, contactName, lineItems, instructionStatus, /* other fields */ ...rest } = req.body;

    // Basic validation
    if (!projectId || !discipline || !organisation || !contactName || !lineItems || lineItems.length === 0 || !instructionStatus) {
        return res.status(400).json({ msg: 'Missing required fields for quote (projectId, discipline, organisation, contactName, lineItems, instructionStatus)' });
    }
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ msg: 'Invalid Project ID format' });
    }

    try {
        // Optional: Check if project actually exists
        const projectExists = await Project.findById(projectId);
        if (!projectExists) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        const newQuote = new Quote({
            ...req.body,
            surveyor: req.user.id // Stamp the quote with the logged-in user's ID
        });

        // Total is calculated by pre-validate hook
        const quote = await newQuote.save();
        res.status(201).json(quote);

    } catch (err) {
        console.error('Error creating quote:', err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/quotes/:id
// @desc    Get a single quote by its ID
// @access  Public (adjust as needed)
router.get('/:id', async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: 'Invalid Quote ID format' });
    }
    try {
        const quote = await Quote.findById(req.params.id);
        if (!quote) {
            return res.status(404).json({ msg: 'Quote not found' });
        }
        res.json(quote);
    } catch (err) {
        console.error('Error fetching quote by ID:', err.message);
        res.status(500).send('Server Error');
    }
});


// @route   PUT /api/quotes/:id
// @desc    Update a quote by its ID
// @access  Public (adjust as needed)
router.put('/:id', async (req, res) => {
    const quoteId = req.params.id; 

    if (!mongoose.Types.ObjectId.isValid(quoteId)) {
        return res.status(400).json({ msg: 'Invalid Quote ID format' });
    }

    const { projectId, ...updateData } = req.body;

    try {
        const updatedQuote = await Quote.findByIdAndUpdate(
            quoteId,
            { $set: updateData },
            { new: true, runValidators: true, context: 'query' } 
        );

        if (!updatedQuote) {
            return res.status(404).json({ msg: 'Quote not found or update failed silently' });
        }

        res.json(updatedQuote); 

    } catch (err) {
        console.error('Error updating quote:', err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/quotes/:id
// @desc    Delete a quote by its ID
// @access  Public (adjust as needed)
router.delete('/:id', async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: 'Invalid Quote ID format' });
    }

    try {
        const quote = await Quote.findById(req.params.id);
        if (!quote) {
            return res.status(404).json({ msg: 'Quote not found' });
        }

        await Quote.findByIdAndDelete(req.params.id);

        // TODO: Consider deleting associated Reviews as well?
        // await Review.deleteMany({ quoteId: req.params.id });

        res.json({ msg: 'Quote removed' });

    } catch (err) {
        console.error('Error deleting quote:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router; 