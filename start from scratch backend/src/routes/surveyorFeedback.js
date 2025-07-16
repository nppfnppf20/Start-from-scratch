const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const SurveyorFeedback = require('../models/SurveyorFeedback');
const Quote = require('../models/Quote'); // Needed to verify project association

console.log('--- Loading surveyorFeedback.js routes ---');

// GET /api/surveyor-feedback?projectId=... or ?quoteId=...
// Fetches feedback based on query parameters
router.get('/', async (req, res) => {
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
    // Require at least one filter
    return res.status(400).json({ msg: 'Project ID or Quote ID query parameter is required' });
  }

  try {
    const feedbackList = await SurveyorFeedback.find(query);
    res.json(feedbackList); // Returns an array (empty if no match)
  } catch (err) {
    console.error('Error fetching surveyor feedback:', err.message);
    res.status(500).send('Server Error');
  }
});

// PUT /api/surveyor-feedback/:quoteId
// Upserts (creates or updates) feedback for a specific quote
router.put('/:quoteId', async (req, res) => {
  console.log(`--- surveyorFeedback PUT /:quoteId route hit for quoteId: ${req.params.quoteId} ---`);
  const { quoteId } = req.params;
  // Extract feedback fields from request body
  const { quality, responsiveness, deliveredOnTime, overallReview, notes, reviewDate } = req.body;

  // Validate quoteId format
  if (!mongoose.Types.ObjectId.isValid(quoteId)) {
    return res.status(400).json({ msg: 'Invalid Quote ID format' });
  }

  try {
    // 1. Find the associated Quote to get the correct Project ID
    const quote = await Quote.findById(quoteId).select('projectId');
    if (!quote) {
      return res.status(404).json({ msg: 'Quote not found for the given ID' });
    }

    // 2. Prepare the data for upsert, only include fields that are present in the request
    const feedbackDataToSet = {};
    if (quality !== undefined) feedbackDataToSet.quality = quality;
    if (responsiveness !== undefined) feedbackDataToSet.responsiveness = responsiveness;
    if (deliveredOnTime !== undefined) feedbackDataToSet.deliveredOnTime = deliveredOnTime;
    if (overallReview !== undefined) feedbackDataToSet.overallReview = overallReview;
    if (notes !== undefined) feedbackDataToSet.notes = notes;
    if (reviewDate !== undefined) feedbackDataToSet.reviewDate = reviewDate;
    // Ensure projectId and quoteId are set correctly on insert
    const feedbackDataOnInsert = {
        projectId: quote.projectId,
        quoteId: quoteId
    };

    // 3. Perform the upsert operation
    const updatedFeedback = await SurveyorFeedback.findOneAndUpdate(
      { quoteId: quoteId }, // Find document by quoteId
      {
        $set: feedbackDataToSet,      // Apply updates from the request body
        $setOnInsert: feedbackDataOnInsert // Set these fields only when creating
      },
      {
        new: true, // Return the modified document
        upsert: true, // Create if it doesn't exist
        runValidators: true, // Run schema validators (checks min/max for ratings)
        setDefaultsOnInsert: true // Apply schema defaults (like reviewDate)
      }
    );

    res.json(updatedFeedback);

  } catch (err) {
    console.error('Error upserting surveyor feedback:', err);
    // Handle potential validation errors from Mongoose (e.g., ratings out of range)
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(el => el.message);
        return res.status(400).json({ msg: 'Validation Error', errors: errors });
    }
    // Handle potential unique constraint error (though upsert should handle this)
    if (err.code === 11000) {
        return res.status(400).json({ msg: 'Duplicate key error, feedback might already exist for this quote.'});
    }
    res.status(500).send('Server Error');
  }
});

// DELETE /api/surveyor-feedback/:quoteId
// Deletes feedback for a specific quote
router.delete('/:quoteId', async (req, res) => {
  console.log(`--- surveyorFeedback DELETE /:quoteId route hit for quoteId: ${req.params.quoteId} ---`);
  const { quoteId } = req.params;

  // Validate quoteId format
  if (!mongoose.Types.ObjectId.isValid(quoteId)) {
    return res.status(400).json({ msg: 'Invalid Quote ID format' });
  }

  try {
    const feedback = await SurveyorFeedback.findOneAndDelete({ quoteId: quoteId });

    if (!feedback) {
      return res.status(404).json({ msg: 'Surveyor feedback not found for the given Quote ID' });
    }

    res.json({ msg: 'Surveyor feedback deleted successfully', deletedFeedback: feedback });

  } catch (err) {
    console.error('Error deleting surveyor feedback:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;