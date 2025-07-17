const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PendingSurveyor = require('../models/PendingSurveyor');
const SurveyorOrganisation = require('../models/SurveyorOrganisation');
const Quote = require('../models/Quote');
const { recalculateAggregatesForOrg } = require('./surveyorFeedback');

// Middleware to check for admin role (you might want to place this in a separate middleware file)
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ msg: 'Forbidden: Access is restricted to administrators.' });
    }
};

// @route   GET /api/pending-surveyors
// @desc    Get all surveyors with 'pending' status
// @access  Admin
router.get('/', adminOnly, async (req, res) => {
    try {
        const pending = await PendingSurveyor.find({ status: 'pending' }).sort({ createdAt: 'desc' });
        res.json(pending);
    } catch (err) {
        console.error('Error fetching pending surveyors:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/pending-surveyors/approve
// @desc    Approve a pending surveyor, creating a new SurveyorOrganisation
// @access  Admin
router.post('/approve', adminOnly, async (req, res) => {
    const { pendingId } = req.body;

    if (!pendingId || !mongoose.Types.ObjectId.isValid(pendingId)) {
        return res.status(400).json({ msg: 'A valid pending surveyor ID is required.' });
    }

    try {
        const pendingSurveyor = await PendingSurveyor.findById(pendingId);
        if (!pendingSurveyor) {
            return res.status(404).json({ msg: 'Pending surveyor not found.' });
        }
        if (pendingSurveyor.status !== 'pending') {
            return res.status(400).json({ msg: `Cannot approve a surveyor with status '${pendingSurveyor.status}'.` });
        }

        // Check if a surveyor with the same org/discipline was created while this was pending
        const alreadyExists = await SurveyorOrganisation.findOne({
             organisation: new RegExp(`^${pendingSurveyor.organisation}$`, 'i'),
             discipline: new RegExp(`^${pendingSurveyor.discipline}$`, 'i')
        });

        if (alreadyExists) {
            pendingSurveyor.status = 'rejected'; // Or 'merged' if you want to handle it that way
            await pendingSurveyor.save();
            return res.status(409).json({ msg: 'A surveyor with this organisation and discipline already exists.' });
        }

        // Create the new official surveyor organisation
        const newSurveyor = new SurveyorOrganisation({
            organisation: pendingSurveyor.organisation,
            discipline: pendingSurveyor.discipline,
            // Add contact info from the pending record if it exists
            contacts: pendingSurveyor.sourceQuoteData ? [{
                contactName: pendingSurveyor.sourceQuoteData.contactName,
                email: pendingSurveyor.sourceQuoteData.email,
                phoneNumber: pendingSurveyor.sourceQuoteData.phoneNumber
            }] : []
        });

        await newSurveyor.save();

        // Update the pending surveyor's status to 'approved'
        pendingSurveyor.status = 'approved';
        await pendingSurveyor.save();
        
        res.json({ msg: 'Surveyor approved successfully.', newSurveyor });

    } catch (err) {
        console.error('Error approving surveyor:', err.message);
        // Handle potential unique index violation if a race condition occurs
        if (err.code === 11000) {
             return res.status(409).json({ msg: 'A surveyor with this organisation and discipline already exists.' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/pending-surveyors/merge
// @desc    Merge a pending surveyor into an existing SurveyorOrganisation and update data
// @access  Admin
router.post('/merge', adminOnly, async (req, res) => {
    const { pendingId, targetId } = req.body;

    if (!pendingId || !mongoose.Types.ObjectId.isValid(pendingId) || !targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
        return res.status(400).json({ msg: 'Valid pending and target surveyor IDs are required.' });
    }
    
    try {
        const pendingSurveyor = await PendingSurveyor.findById(pendingId);
        if (!pendingSurveyor || pendingSurveyor.status !== 'pending') {
            return res.status(404).json({ msg: 'Pending surveyor not found or has already been processed.' });
        }

        const targetSurveyor = await SurveyorOrganisation.findById(targetId);
        if (!targetSurveyor) {
            return res.status(404).json({ msg: 'Target surveyor organisation not found.' });
        }

        // 1. Update Contact Information
        const newContact = pendingSurveyor.sourceQuoteData;
        if (newContact && newContact.email) {
            const emailExists = targetSurveyor.contacts.some(
                contact => contact.email && contact.email.toLowerCase() === newContact.email.toLowerCase()
            );
            if (!emailExists) {
                targetSurveyor.contacts.push({
                    contactName: newContact.contactName,
                    email: newContact.email,
                    phoneNumber: newContact.phoneNumber
                });
            }
        }
        
        // 2. Re-associate Quotes
        // Find all quotes matching the pending surveyor's details and update them to the target's details.
        // This ensures future reviews for these old quotes link to the correct primary record.
        await Quote.updateMany(
            { organisation: pendingSurveyor.organisation, discipline: pendingSurveyor.discipline },
            { $set: { organisation: targetSurveyor.organisation, discipline: targetSurveyor.discipline } }
        );

        // 3. Save the updated target surveyor BEFORE recalculating
        await targetSurveyor.save();
        
        // 4. Trigger Recalculation of Aggregates
        // This function will now correctly find all quotes (including the ones we just updated)
        // and recalculate the scores from scratch.
        await recalculateAggregatesForOrg(targetSurveyor._id);

        // 5. Update Pending Surveyor Status
        pendingSurveyor.status = 'merged';
        await pendingSurveyor.save();

        // 6. Fetch the final, updated surveyor to send to the frontend
        const finalUpdatedSurveyor = await SurveyorOrganisation.findById(targetSurveyor._id);

        res.json({ msg: 'Surveyor merged successfully.', updatedSurveyor: finalUpdatedSurveyor });

    } catch (err) {
        console.error('Error merging surveyor:', err.message);
        res.status(500).send('Server Error');
    }
});


// @route   DELETE /api/pending-surveyors/:id
// @desc    Reject (delete) a pending surveyor entry
// @access  Admin
router.delete('/:id', adminOnly, async (req, res) => {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: 'A valid pending surveyor ID is required.' });
    }

    try {
        const pendingSurveyor = await PendingSurveyor.findById(id);

        if (!pendingSurveyor) {
            return res.status(404).json({ msg: 'Pending surveyor not found' });
        }

        // Instead of deleting, we can mark as 'rejected' to keep a record.
        // Or, to truly delete, use: await PendingSurveyor.findByIdAndDelete(id);
        pendingSurveyor.status = 'rejected';
        await pendingSurveyor.save();

        res.json({ msg: 'Pending surveyor has been rejected.' });

    } catch (err) {
        console.error('Error rejecting surveyor:', err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router; 