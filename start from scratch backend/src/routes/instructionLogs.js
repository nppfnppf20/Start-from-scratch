const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const InstructionLog = require('../models/InstructionLog');
const Quote = require('../models/Quote'); // Need Quote model to verify projectId

// GET /api/instruction-logs?projectId=... or ?quoteId=...
// Fetches instruction logs based on query parameters
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
    // Maybe return all? Or require at least one filter? For now, let's require one.
    return res.status(400).json({ msg: 'Project ID or Quote ID query parameter is required' });
  }

  try {
    const logs = await InstructionLog.find(query);
    if (!logs) {
      // find returns [] if no match, not null/undefined usually, but check anyway
      return res.json([]); // Return empty array if no logs found
    }
    res.json(logs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// PUT /api/instruction-logs/:quoteId
// Upserts (creates or updates) an instruction log for a specific quote
router.put('/:quoteId', async (req, res) => {
  const { quoteId } = req.params;
  const logData = req.body; // Data to update with

  // Validate quoteId format
  if (!mongoose.Types.ObjectId.isValid(quoteId)) {
    return res.status(400).json({ msg: 'Invalid Quote ID format' });
  }

  try {
    // 1. Find the associated Quote to get the correct Project ID
    const quote = await Quote.findById(quoteId).select('projectId'); // Only select projectId
    if (!quote) {
      return res.status(404).json({ msg: 'Quote not found for the given ID' });
    }

    // 2. Remove validation checks that required projectId in the request body
    // Project ID validation is now implicitly handled by fetching the quote
    // and using its projectId.

    // 3. Perform the upsert operation, ensuring projectId is set correctly from the fetched quote
    const updatedLog = await InstructionLog.findOneAndUpdate(
      { quoteId: quoteId }, // Find document by quoteId
      {
        $set: { ...logData }, // Apply updates from the request body using $set
        $setOnInsert: {      // Fields to set only when creating (upserting)
            quoteId: quoteId,
            projectId: quote.projectId // **Set the projectId from the verified Quote on insert**
        }
      },
      {
        new: true, // Return the modified document (or new one if created)
        upsert: true, // Create if it doesn't exist
        runValidators: true, // Run schema validators on update/insert
        setDefaultsOnInsert: true // Apply schema defaults if creating
      }
    );

    // If the document existed and was updated, $setOnInsert doesn't run,
    // but we still want projectId to be implicitly correct (it was set on creation).
    // We could add an explicit check/set here if necessary, but findOneAndUpdate
    // should only update fields in $set, leaving existing projectId intact.

    res.json(updatedLog);

  } catch (err) {
    console.error('Error upserting instruction log:', err);
    // Handle potential validation errors from Mongoose
    if (err.name === 'ValidationError') {
        // Extract user-friendly error messages
        const errors = Object.values(err.errors).map(el => el.message);
        return res.status(400).json({ msg: 'Validation Error', errors: errors });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;