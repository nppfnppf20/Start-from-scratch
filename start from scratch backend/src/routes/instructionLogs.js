const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const InstructionLog = require('../models/InstructionLog');
const Quote = require('../models/Quote'); // To verify quote exists

// @route   GET /api/instruction-logs
// @desc    Get all instruction logs (filtered by projectId or quoteId)
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
        if (req.query.quoteId) {
            if (!mongoose.Types.ObjectId.isValid(req.query.quoteId)) {
                return res.status(400).json({ msg: 'Invalid Quote ID format' });
            }
            filter.quoteId = req.query.quoteId;
        }

        // Fetch logs based on filter
        const logs = await InstructionLog.find(filter).sort({ createdAt: -1 });
        res.json(logs);
    } catch (err) {
        console.error('Error fetching instruction logs:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/instruction-logs/:quoteId
// @desc    Create or Update (Upsert) the instruction log for a specific quote
// @access  Public (adjust as needed)
router.put('/:quoteId', async (req, res) => {
    const { quoteId } = req.params;
    const { projectId, workStatus, siteVisitDate, reportDraftDate, operationalNotes, uploadedWorks, customDates } = req.body;

    if (!mongoose.Types.ObjectId.isValid(quoteId)) {
        return res.status(400).json({ msg: 'Invalid Quote ID format' });
    }
    // ProjectId is needed for creation, might also be sent on update for consistency
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ msg: 'Valid Project ID is required in request body' });
    }

    try {
        // Verify the referenced quote exists (optional but good practice)
        const quoteExists = await Quote.findById(quoteId);
        if (!quoteExists) {
            return res.status(404).json({ msg: 'Associated Quote not found' });
        }
        // Ensure the projectId matches the quote's projectId for consistency
        if (quoteExists.projectId.toString() !== projectId) {
             // Fixed line: Escaped the apostrophe in Quote's
             return res.status(400).json({ msg: 'Project ID in request does not match Quote\\\'s Project ID' });
        }


        const updateData = {};
        // Selectively add fields to updateData if they are present in the request body
        if (workStatus !== undefined) updateData.workStatus = workStatus;
        if (siteVisitDate !== undefined) updateData.siteVisitDate = siteVisitDate;
        if (reportDraftDate !== undefined) updateData.reportDraftDate = reportDraftDate;
        if (operationalNotes !== undefined) updateData.operationalNotes = operationalNotes;
        if (uploadedWorks !== undefined) updateData.uploadedWorks = uploadedWorks; // Allows replacing the whole array
        if (customDates !== undefined) updateData.customDates = customDates; // Allows replacing the whole array

        const updatedLog = await InstructionLog.findOneAndUpdate(
            { quoteId: quoteId }, // Find condition
            {
                $set: updateData, // Fields to update or set on creation
                $setOnInsert: { quoteId: quoteId, projectId: projectId } // Fields to set *only* on creation
            },
            {
                new: true, // Return the modified document
                upsert: true, // Create if document doesn't exist
                runValidators: true, // Run schema validation
                setDefaultsOnInsert: true // Apply schema defaults on creation
            }
        );

        res.json(updatedLog);

    } catch (err) {
        console.error(`Error upserting instruction log for quote ${quoteId}:`, err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server Error');
    }
});


// Optional: Routes for managing subdocuments like uploadedWorks or customDates individually
// Example: Add an uploaded work item
// router.post('/:quoteId/uploads', async (req, res) => { ... find log then log.uploadedWorks.push(...) await log.save() ... });
// Example: Delete a custom date
// router.delete('/:quoteId/custom-dates/:dateId', async (req, res) => { ... find log then log.customDates.pull({ _id: dateId }) await log.save() ... });


module.exports = router; 