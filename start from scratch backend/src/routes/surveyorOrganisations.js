const express = require('express');
const router = express.Router();
const SurveyorOrganisation = require('../models/SurveyorOrganisation');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { protect, authorize } = require('../middleware/authMiddleware');

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
  const { organisation, discipline, location, contacts } = req.body;

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
      location: location || '',
      contacts: contacts || [],
    });

    const savedOrganisation = await newOrganisation.save();

    // Automatically create user accounts for contacts with emails
    if (contacts && contacts.length > 0) {
      const password = process.env.SURVEYOR_PASSWORD;
      if (!password) {
        console.warn('SURVEYOR_PASSWORD not set in .env file - skipping user account creation');
        // Don't fail the request - just skip user creation
      } else {
        try {
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
        } catch (userErr) {
          // Log the error but don't fail the request
          console.error('Error creating user accounts:', userErr.message);
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
    console.error('Error creating surveyor organisation:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code
    });
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// PUT /api/surveyor-organisations/:id (Updated)
// Updates an organisation's details
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  // Now allows updating 'discipline' and 'location'
  const { organisation, discipline, location, contacts } = req.body;

  try {
    const updateFields = {};
    if (organisation !== undefined) updateFields.organisation = organisation;
    if (discipline !== undefined) updateFields.discipline = discipline;
    if (location !== undefined) updateFields.location = location;
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

// @route   DELETE /api/surveyor-organisations/:id
// @desc    Delete a surveyor organisation and its associated users
// @access  Admin only
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const organisation = await SurveyorOrganisation.findById(req.params.id);
        if (!organisation) {
            return res.status(404).json({ msg: 'Surveyor organisation not found' });
        }

        // Delete associated user accounts
        if (organisation.contacts && organisation.contacts.length > 0) {
            const emails = organisation.contacts.map(c => c.email).filter(Boolean);
            if (emails.length > 0) {
                await User.deleteMany({ email: { $in: emails } });
            }
        }

        await organisation.deleteOne();

        res.json({ msg: 'Surveyor organisation and associated users removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;