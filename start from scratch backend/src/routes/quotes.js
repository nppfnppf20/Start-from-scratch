const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Quote = require('../models/Quote');
const Project = require('../models/Project');
const SurveyorOrganisation = require('../models/surveyororganisations');

// --- Helper function to keep surveyor bank up-to-date ---
const upsertSurveyorOrganisation = async (quoteData) => {
  if (!quoteData.organisation || !quoteData.discipline || !quoteData.email) {
    console.log('Upsert skipped: Organisation name, discipline, or contact email is missing.');
    return;
  }

  try {
    const query = {
      organisation: { $regex: new RegExp(`^${quoteData.organisation}$`, 'i') },
      discipline: { $regex: new RegExp(`^${quoteData.discipline}$`, 'i') }
    };

    const org = await SurveyorOrganisation.findOne(query);

    if (org) {
      const contactExists = org.contacts.some(c => c.email.toLowerCase() === quoteData.email.toLowerCase());
      if (!contactExists) {
        org.contacts.push({ 
            contactName: quoteData.contactName, 
            email: quoteData.email,
            phoneNumber: quoteData.phoneNumber
        });
      }
      org.projectCount = (org.projectCount || 0) + 1;
      await org.save();
      console.log(`Updated organisation/discipline: '${org.organisation}' / '${org.discipline}'.`);
    } else {
      const newOrg = new SurveyorOrganisation({
        organisation: quoteData.organisation,
        discipline: quoteData.discipline,
        contacts: [{
            contactName: quoteData.contactName,
            email: quoteData.email,
            phoneNumber: quoteData.phoneNumber
        }],
        projectCount: 1,
        reviewCount: 0,
      });
      await newOrg.save();
      console.log(`New organisation/discipline created: '${newOrg.organisation}' / '${newOrg.discipline}'.`);
    }
  } catch (error) {
    console.error('Error in upsertSurveyorOrganisation:', error.message);
  }
};


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
// @desc    Create a new quote
router.post('/', async (req, res) => {
    const { projectId, discipline, organisation, contactName, lineItems, instructionStatus, ...rest } = req.body;

    if (!projectId || !discipline || !organisation || !contactName || !lineItems || lineItems.length === 0 || !instructionStatus) {
        return res.status(400).json({ msg: 'Missing required fields for quote' });
    }
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ msg: 'Invalid Project ID format' });
    }

    try {
        const projectExists = await Project.findById(projectId);
        if (!projectExists) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        const newQuote = new Quote({ ...req.body, surveyor: req.user.id });
        const quote = await newQuote.save();

        // --- Call the upsert function after a successful save ---
        await upsertSurveyorOrganisation(quote);

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