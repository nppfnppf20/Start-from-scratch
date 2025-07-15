const express = require('express');
const router = express.Router();
const SurveyorOrganisation = require('../models/SurveyorOrganisation');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// GET /api/surveyor-organisations (Unchanged)
router.get('/', async (req, res) => {
  try {
    // We can enhance this later to fetch the performance data, but for now, it gets the raw bank.
    const organisations = await SurveyorOrganisation.find({})
      .sort({ organisation: 1, discipline: 1 })
      .collation({ locale: 'en', strength: 2 });
    res.json(organisations);
  } catch (err) {
    console.error('Error fetching surveyor organisations:', err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/surveyor-organisations (Updated)
// Creates a new surveyor organisation for a specific discipline
router.post('/', async (req, res) => {
  // Now requires 'discipline' in the request body
  const { organisation, discipline, contacts } = req.body;

  try {
    // The check for an existing org is now based on BOTH name and discipline
    // Using collation to match the index's case-insensitive behavior
    let existingOrg = await SurveyorOrganisation.findOne({ 
      organisation: organisation,
      discipline: discipline
    }).collation({ locale: 'en', strength: 2 });
    
    if (existingOrg) {
      return res.status(400).json({ msg: 'An organisation with this name and discipline already exists.' });
    }

    const newOrganisation = new SurveyorOrganisation({
      organisation,
      discipline,
      contacts: contacts || [],
    });

    const savedOrganisation = await newOrganisation.save();

    // Automatically create user accounts for contacts with emails
    if (contacts && contacts.length > 0) {
      const password = process.env.SURVEYOR_PASSWORD;
      if (!password) {
        console.error('SURVEYOR_PASSWORD not set in .env file');
        return res.status(500).send('Server configuration error.');
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      for (const contact of contacts) {
        if (contact.email) {
          const userExists = await User.findOne({ email: contact.email });
          if (!userExists) {
            const newUser = new User({
              email: contact.email,
              password: hashedPassword,
              name: contact.contactName || organisation,
              role: 'surveyor' // Assign a default role
            });
            await newUser.save();
          }
        }
      }
    }

    res.status(201).json(savedOrganisation);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(el => el.message);
      return res.status(400).json({ msg: 'Validation Error', errors: errors });
    }
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'An organisation with this name and discipline already exists.' });
    }
    console.error('Error creating surveyor organisation:', err.message);
    res.status(500).send('Server Error');
  }
});

// PUT /api/surveyor-organisations/:id (Updated)
// Updates an organisation's details
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  // Now allows updating 'discipline'
  const { organisation, discipline, contacts } = req.body;

  try {
    const updateFields = {};
    if (organisation !== undefined) updateFields.organisation = organisation;
    if (discipline !== undefined) updateFields.discipline = discipline;
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
    if (err.code === 11000) {
        return res.status(400).json({ msg: `An organisation with this name and discipline already exists.`});
    }
    console.error('Error updating surveyor organisation:', err);
    res.status(500).send('Server Error');
  }
});

// DELETE /api/surveyor-organisations/:id (Unchanged)
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