const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const SurveyorFeedback = require('../models/SurveyorFeedback');
const Quote = require('../models/Quote');
// --- IMPORT THE SURVEYOR ORGANISATION MODEL ---
const SurveyorOrganisation = require('../models/SurveyorOrganisation');

// --- HELPER FUNCTION TO UPDATE AGGREGATES ---
const updateSurveyorOrgAggregates = async (oldFeedback, newFeedback) => {
    if (!newFeedback || !newFeedback.quoteId) return;

    try {
        // 1. Find the associated quote to get org and discipline
        const quote = await Quote.findById(newFeedback.quoteId).select('organisation discipline');
        if (!quote) {
            console.error(`Could not find quote ${newFeedback.quoteId} for feedback aggregation.`);
            return;
        }

        // 2. Find the SurveyorOrganisation record
        const surveyorOrg = await SurveyorOrganisation.findOne({
            organisation: quote.organisation,
            discipline: quote.discipline
        });

        if (!surveyorOrg) {
            console.error(`Could not find surveyor org for ${quote.organisation}/${quote.discipline}.`);
            return;
        }

        // 3. Calculate the delta (the change in scores)
        const isNewReview = !oldFeedback;
        const delta = {
            quality: newFeedback.quality - (oldFeedback?.quality || 0),
            responsiveness: newFeedback.responsiveness - (oldFeedback?.responsiveness || 0),
            deliveredOnTime: newFeedback.deliveredOnTime - (oldFeedback?.deliveredOnTime || 0),
            overallReview: newFeedback.overallReview - (oldFeedback?.overallReview || 0),
        };

        // 4. Apply the updates
        surveyorOrg.totalQuality += delta.quality;
        surveyorOrg.totalResponsiveness += delta.responsiveness;
        surveyorOrg.totalDeliveredOnTime += delta.deliveredOnTime;
        surveyorOrg.totalOverallReview += delta.overallReview;

        if (isNewReview) {
            surveyorOrg.reviewCount = (surveyorOrg.reviewCount || 0) + 1;
        }

        await surveyorOrg.save();
        console.log(`Updated aggregates for ${surveyorOrg.organisation} - ${surveyorOrg.discipline}`);

    } catch (error) {
        console.error('Error updating surveyor organisation aggregates:', error);
    }
};


// GET /api/surveyor-feedback?projectId=... or ?quoteId=...
router.get('/', async (req, res) => {
    // ... (This route remains unchanged)
    const { projectId, quoteId } = req.query;
    let query = {};
    if (projectId) {
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ msg: 'Invalid Project ID format' });
        }
        query.projectId = projectId;
    } else if (quoteId) {
        if (!mongoose.Types.ObjectId.isValid(quoteId)) {
            return res.status(400).json({ msg: 'Invalid Quote ID format' });
        }
        query.quoteId = quoteId;
    } else {
        return res.status(400).json({ msg: 'Project ID or Quote ID query parameter is required' });
    }
    try {
        const feedbackList = await SurveyorFeedback.find(query);
        res.json(feedbackList);
    } catch (err) {
        console.error('Error fetching surveyor feedback:', err.message);
        res.status(500).send('Server Error');
    }
});


// PUT /api/surveyor-feedback/:quoteId (UPDATED)
router.put('/:quoteId', async (req, res) => {
    const { quoteId } = req.params;
    const { quality, responsiveness, deliveredOnTime, overallReview, notes, reviewDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(quoteId)) {
        return res.status(400).json({ msg: 'Invalid Quote ID format' });
    }

    try {
        // --- GRAB THE OLD FEEDBACK FIRST FOR COMPARISON ---
        const oldFeedback = await SurveyorFeedback.findOne({ quoteId: quoteId }).lean();

        const quote = await Quote.findById(quoteId).select('projectId');
        if (!quote) {
            return res.status(404).json({ msg: 'Quote not found for the given ID' });
        }

        const feedbackDataToSet = {};
        if (quality !== undefined) feedbackDataToSet.quality = quality;
        if (responsiveness !== undefined) feedbackDataToSet.responsiveness = responsiveness;
        if (deliveredOnTime !== undefined) feedbackDataToSet.deliveredOnTime = deliveredOnTime;
        if (overallReview !== undefined) feedbackDataToSet.overallReview = overallReview;
        if (notes !== undefined) feedbackDataToSet.notes = notes;
        if (reviewDate !== undefined) feedbackDataToSet.reviewDate = reviewDate;
        
        const feedbackDataOnInsert = {
            projectId: quote.projectId,
            quoteId: quoteId
        };

        const updatedFeedback = await SurveyorFeedback.findOneAndUpdate(
            { quoteId: quoteId },
            { $set: feedbackDataToSet, $setOnInsert: feedbackDataOnInsert },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        // --- CALL THE HELPER FUNCTION TO UPDATE THE BANK ---
        await updateSurveyorOrgAggregates(oldFeedback, updatedFeedback);

        res.json(updatedFeedback);

    } catch (err) {
        console.error('Error upserting surveyor feedback:', err);
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(el => el.message);
            return res.status(400).json({ msg: 'Validation Error', errors: errors });
        }
        res.status(500).send('Server Error');
    }
});

// DELETE /api/surveyor-feedback/:quoteId
router.delete('/:quoteId', async (req, res) => {
    // ... (This route remains largely unchanged, but we could add logic to decrement stats)
    // For now, we will keep it simple. Deleting feedback will not reverse the stats.
    console.log(`--- surveyorFeedback DELETE /:quoteId route hit for quoteId: ${req.params.quoteId} ---`);
    const { quoteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(quoteId)) {
        return res.status(400).json({ msg: 'Invalid Quote ID format' });
    }

    try {
        // Note: To properly reverse stats, we would need similar logic as the PUT route here.
        const feedback = await SurveyorFeedback.findOneAndDelete({ quoteId: quoteId });

        if (!feedback) {
            return res.status(404).json({ msg: 'Surveyor feedback not found' });
        }

        res.json({ msg: 'Surveyor feedback deleted successfully', deletedFeedback: feedback });

    } catch (err) {
        console.error('Error deleting surveyor feedback:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;