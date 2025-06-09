// File: routes/programmeEvents.routes.js (Combined Routes and Logic)

const express = require('express');
const router = express.Router();
const ProgrammeEvent = require('../models/ProgrammeEvent.js'); // Import the Mongoose model directly

// --- Define API Routes and Handlers for Programme Events ---

// GET /api/programme-events/project/:projectId
// Fetches all programme events for a specific project
router.get('/project/:projectId', async (req, res) => {
  try {
    const projectId = req.params.projectId; // Get projectId from the URL parameter

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required.' });
    }

    // Find all ProgrammeEvent documents that match the projectId
    // .sort({ date: 1 }) sorts them by date in ascending order (oldest first)
    const events = await ProgrammeEvent.find({ projectId: projectId }).sort({ date: 1 });

    res.status(200).json(events); // Send the found events back as JSON
  } catch (error) {
    console.error('Error fetching programme events:', error);
    res.status(500).json({ message: 'Error fetching programme events from the database.', error: error.message });
  }
});

// POST /api/programme-events
// Creates a new programme event
// The project ID will be expected in the request body for this setup
router.post('/', async (req, res) => {
  try {
    // Get the event data from the request body
    // The frontend will send projectId, title, date, and color
    const { projectId, title, date, color } = req.body;

    // Basic validation
    if (!projectId || !title || !date || !color) {
      return res.status(400).json({ message: 'Missing required fields (projectId, title, date, color).' });
    }

    // Create a new ProgrammeEvent document using the Mongoose model
    const newEvent = new ProgrammeEvent({
      projectId,
      title,
      date: new Date(date), // Ensure the date string from frontend is converted to a JS Date object
      color,
    });

    // Save the new event to the MongoDB database
    const savedEvent = await newEvent.save();

    // Send the newly created and saved event back to the frontend (includes the DB-generated ID)
    res.status(201).json(savedEvent); // 201 Created status
  } catch (error) {
    console.error('Error creating programme event:', error);
    // Check for Mongoose validation error
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    res.status(500).json({ message: 'Error saving programme event to the database.', error: error.message });
  }
});

// PUT /api/programme-events/:eventId
// Updates an existing programme event by its ID
router.put('/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId; // Get eventId from the URL parameter
    const { title, date, color } = req.body; // Get the updated data from the request body

    // Basic validation
    if (!title || !date || !color) {
      return res.status(400).json({ message: 'Missing required fields for update (title, date, color).' });
    }

    // Find the event by its ID and update it
    // { new: true } option returns the modified document rather than the original
    // { runValidators: true } ensures that updates adhere to the schema's validation rules
    const updatedEvent = await ProgrammeEvent.findByIdAndUpdate(
      eventId,
      { title, date: new Date(date), color },
      { new: true, runValidators: true }
    );

    if (!updatedEvent) {
      // If no event was found with that ID
      return res.status(404).json({ message: 'Programme event not found.' });
    }

    res.status(200).json(updatedEvent); // Send the updated event back
  } catch (error) {
    console.error('Error updating programme event:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    res.status(500).json({ message: 'Error updating programme event in the database.', error: error.message });
  }
});

// DELETE /api/programme-events/:eventId
// Deletes a programme event by its ID
router.delete('/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId; // Get eventId from the URL parameter

    const deletedEvent = await ProgrammeEvent.findByIdAndDelete(eventId);

    if (!deletedEvent) {
      // If no event was found with that ID
      return res.status(404).json({ message: 'Programme event not found.' });
    }

    // Successfully deleted. Send a 204 No Content response, as there's no body to return.
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting programme event:', error);
    res.status(500).json({ message: 'Error deleting programme event from the database.', error: error.message });
  }
});


module.exports = router; // Export the router with embedded handlers