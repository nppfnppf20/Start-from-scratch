const express = require('express');
const router = express.Router();
const SurveyorOrganisation = require('../models/surveyororganisations');

// GET /api/surveyor-organisations (Unchanged)
// Fetches all surveyor organisations
router.get('/', async (req, res) => {
  try {
    const organisations = await SurveyorOrganisation.find({}).sort({ organisation: 1 });
    res.json(organisations);
  } catch (err) {
    console.error('Error fetching surveyor organisations:', err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/surveyor-organisations (Updated)
// Creates a new surveyor organisation with an array of contacts
router.post('/', async (req, res) => {
  // We now expect 'organisation' and an array of 'contacts'
  const { organisation, contacts } = req.body;

  try {
    // The check for an existing org is now based on its name (case-insensitive)
    let existingOrg = await SurveyorOrganisation.findOne({ 
      organisation: { $regex: new RegExp(`^${organisation}$`, 'i') }
    });
    if (existingOrg) {
      return res.status(400).json({ msg: 'An organisation with this name already exists.' });
    }

    const newOrganisation = new SurveyorOrganisation({
      organisation,
      contacts: contacts || [], // Handle case where contacts array might not be provided
    });

    const savedOrganisation = await newOrganisation.save();
    res.status(201).json(savedOrganisation);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(el => el.message);
      return res.status(400).json({ msg: 'Validation Error', errors: errors });
    }
    // Handle unique constraint error on 'organisation' field
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'An organisation with this name already exists.' });
    }
    console.error('Error creating surveyor organisation:', err.message);
    res.status(500).send('Server Error');
  }
});

// PUT /api/surveyor-organisations/:id (Updated)
// Updates an existing surveyor organisation's name or its list of contacts
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  // We expect 'organisation' and/or 'contacts' in the body
  const { organisation, contacts } = req.body;

  try {
    const updateFields = {};
    // Only add fields to the update if they were provided in the request
    if (organisation !== undefined) updateFields.organisation = organisation;
    if (contacts !== undefined) updateFields.contacts = contacts;

    const updatedOrg = await SurveyorOrganisation.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedOrg) {
      return res.status(404).json({ msg: 'Surveyor organisation not found' });
    }

    res.json(updatedOrg);
  } catch (err) {
    // Handle unique constraint error if they try to rename to an existing org name
    if (err.code === 11000) {
        return res.status(400).json({ msg: `An organisation with the name '${req.body.organisation}' already exists.`});
    }
    console.error('Error updating surveyor organisation:', err);
    res.status(500).send('Server Error');
  }
});

// DELETE /api/surveyor-organisations/:id (Unchanged)
// Deletes a surveyor organisation
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const org = await SurveyorOrganisation.findByIdAndRemove(id);

    if (!org) {
      return res.status(404).json({ msg: 'Surveyor organisation not found' });
    }

    res.json({ msg: 'Surveyor organisation removed successfully' });
  } catch (err) {
    console.error('Error deleting surveyor organisation:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;