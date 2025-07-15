const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Quote = require('../models/Quote');
const Project = require('../models/Project');
const SurveyorOrganisation = require('../models/SurveyorOrganisation');
const PendingSurveyor = require('../models/PendingSurveyor');


// @route   GET /api/quotes
// @desc    Get all quotes (optionally filtered by projectId)
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.projectId) {
            if (!mongoose.Types.ObjectId.isValid(req.query.projectId)) {
                return res.status(400).json({ msg: 'Invalid Project ID format' });
            }
            filter.projectId = req.query.projectId;
        }

        if (req.user.role === 'surveyor') {
            filter.surveyor = req.user.id;
        }

        const quotes = await Quote.find(filter);
        res.json(quotes);
    } catch (err) {
        console.error('Error fetching quotes:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/quotes
// @desc    Create a new quote or update an existing placeholder
router.post('/', async (req, res) => {
    const { projectId, organisation, lineItems } = req.body;

    // --- 1. Basic Validation ---
    if (!projectId || !organisation) {
        return res.status(400).json({ msg: 'Project ID and Organisation are required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ msg: 'Invalid Project ID format' });
    }

    try {
        const projectExists = await Project.findById(projectId);
        if (!projectExists) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        // Case 1: Full quote submission (contains line items)
        if (lineItems && Array.isArray(lineItems) && lineItems.length > 0) {
            // Try to find an existing placeholder quote to update
            const placeholderQuote = await Quote.findOne({
                projectId,
                organisation,
                instructionStatus: 'Fee quote request sent'
            });

            const total = lineItems.reduce((acc, item) => acc + (item.cost || 0), 0);
            const quoteDataWithTotal = { ...req.body, total, instructionStatus: 'Decision pending' };


            if (placeholderQuote) {
                // Update the existing placeholder
                const updatedQuote = await Quote.findByIdAndUpdate(
                    placeholderQuote._id,
                    { $set: quoteDataWithTotal },
                    { new: true, runValidators: true }
                );
                return res.status(200).json(updatedQuote);
            } else {
                // No placeholder found, create a brand new quote
                const newQuote = new Quote(quoteDataWithTotal);
                const savedQuote = await newQuote.save();
                return res.status(201).json(savedQuote);
            }
        } else {
            // Case 2: Fee quote request (no line items) - create a placeholder
            const { discipline, contactName } = req.body;
             if (!discipline || !contactName) {
                return res.status(400).json({ msg: 'Discipline and Contact Name are required for a fee request.' });
            }

            const newQuote = new Quote({
                ...req.body,
                instructionStatus: 'Fee quote request sent',
            });

            const savedQuote = await newQuote.save();
            return res.status(201).json(savedQuote);
        }

    } catch (err) {
        console.error('Error in POST /api/quotes:', err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/quotes/:id
// @desc    Get a single quote by its ID
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

        res.json({ msg: 'Quote removed' });

    } catch (err) {
        console.error('Error deleting quote:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;