const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ProgrammeEvent = require('../models/ProgrammeEvent');
const Project = require('../models/Project'); // Needed for projectId validation

// GET /api/programme-events?projectId=...
// Fetches all events for a specific project
router.get('/', async (req, res) => {
  const { projectId } = req.query;

  if (!projectId) {
    return res.status(400).json({ msg: 'Project ID query parameter is required' });
  }
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({ msg: 'Invalid Project ID format' });
  }

  try {
    const events = await ProgrammeEvent.find({ projectId }).sort({ date: 'asc' }); // Sort by date
    res.json(events);
  } catch (err) {
    console.error('Error fetching programme events:', err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/programme-events
// Creates a new programme event
router.post('/', async (req, res) => {
  const { projectId, title, date, color } = req.body;

  // Basic validation
  if (!projectId || !title || !date || !color) {
    return res.status(400).json({ msg: 'Missing required fields: projectId, title, date, color' });
  }
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({ msg: 'Invalid Project ID format' });
  }

  try {
    // Check if the referenced project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found for the given ID' });
    }

    const newEvent = new ProgrammeEvent({
      projectId,
      title,
      date,
      color
    });

    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent); // Return 201 Created status

  } catch (err) {
    console.error('Error creating programme event:', err);
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(el => el.message);
        return res.status(400).json({ msg: 'Validation Error', errors: errors });
    }
    res.status(500).send('Server Error');
  }
});

// PUT /api/programme-events/:eventId
// Updates an existing programme event
router.put('/:eventId', async (req, res) => {
  const { eventId } = req.params;
  const { title, date, color } = req.body;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ msg: 'Invalid Event ID format' });
  }

  // Prepare update object
  const updateData = {};
    // Check for undefined to allow setting empty string or null
  if (title !== undefined) updateData.title = title;
  if (date !== undefined) updateData.date = date;
  if (color !== undefined) updateData.color = color;


  if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ msg: 'No update fields provided (title, date, color)'});
  }

  try {
    const updatedEvent = await ProgrammeEvent.findByIdAndUpdate(
      eventId,
      { $set: updateData },
      { new: true, runValidators: true } // Return updated doc, run validators
    );

    if (!updatedEvent) {
      return res.status(404).json({ msg: 'Programme event not found' });
    }

    res.json(updatedEvent);

  } catch (err) {
    console.error('Error updating programme event:', err);
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(el => el.message);
        return res.status(400).json({ msg: 'Validation Error', errors: errors });
    }
    res.status(500).send('Server Error');
  }
});

// DELETE /api/programme-events/:eventId
// Deletes a programme event
router.delete('/:eventId', async (req, res) => {
  const { eventId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ msg: 'Invalid Event ID format' });
  }

  try {
    const deletedEvent = await ProgrammeEvent.findByIdAndDelete(eventId);

    if (!deletedEvent) {
      return res.status(404).json({ msg: 'Programme event not found' });
    }

    res.json({ msg: 'Programme event deleted successfully', id: eventId }); // Confirm deletion

  } catch (err) {
    console.error('Error deleting programme event:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;