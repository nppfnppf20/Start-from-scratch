const express = require('express');
const router = express.Router();
const ClientOrganisation = require('../models/ClientOrganisation');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   GET /api/client-organisations
// @desc    Get all client organisations
// @access  Admin only
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const organisations = await ClientOrganisation.find().sort({ organisationName: 1 });
        res.json(organisations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/client-organisations
// @desc    Create a new client organisation and associated users
// @access  Admin only
router.post('/', protect, authorize('admin'), async (req, res) => {
    const { organisationName, contacts } = req.body;

    try {
        let existingOrg = await ClientOrganisation.findOne({ organisationName });
        if (existingOrg) {
            return res.status(400).json({ msg: 'An organisation with this name already exists.' });
        }

        const newOrganisation = new ClientOrganisation({
            organisationName,
            contacts: contacts || [],
        });

        const savedOrganisation = await newOrganisation.save();

        // Automatically create user accounts for contacts with emails
        if (contacts && contacts.length > 0) {
            for (const contact of contacts) {
                if (contact.email) {
                    const userExists = await User.findOne({ email: contact.email });
                    if (!userExists) {
                        const newUser = new User({
                            email: contact.email,
                            // Password is not saved, as login is handled by shared role password
                            name: contact.contactName || organisationName,
                            role: 'client', // Assign client role
                            clientOrganisation: savedOrganisation._id
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
        console.error('Error creating client organisation:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/client-organisations/:id
// @desc    Update a client organisation and sync user accounts
// @access  Admin only
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    const { organisationName, contacts } = req.body;

    try {
        const organisation = await ClientOrganisation.findById(req.params.id);
        if (!organisation) {
            return res.status(404).json({ msg: 'Client organisation not found' });
        }

        const originalEmails = organisation.contacts.map(c => c.email).filter(Boolean);
        const newContacts = contacts || [];
        const newEmails = newContacts.map(c => c.email).filter(Boolean);

        // Update organisation details
        organisation.organisationName = organisationName;
        organisation.contacts = newContacts;
        
        const updatedOrganisation = await organisation.save();

        // Sync user accounts for contacts with emails
        // 1. Upsert users from the new contact list
        for (const contact of newContacts) {
            if (contact.email) {
                let user = await User.findOne({ email: contact.email });
                if (user) {
                    // Update user's name if it has changed
                    if (user.name !== (contact.contactName || organisationName)) {
                        user.name = contact.contactName || organisationName;
                        await user.save();
                    }
                } else {
                    // Create new user if they don't exist
                    const newUser = new User({
                        email: contact.email,
                        name: contact.contactName || organisationName,
                        role: 'client',
                        clientOrganisation: organisation._id
                    });
                    await newUser.save();
                }
            }
        }

        // 2. Delete users for contacts that were removed
        const emailsToDelete = originalEmails.filter(email => !newEmails.includes(email));
        if (emailsToDelete.length > 0) {
            await User.deleteMany({ email: { $in: emailsToDelete } });
        }

        res.json(updatedOrganisation);
    } catch (err) {
        console.error('Error updating client organisation:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/client-organisations/:id
// @desc    Delete a client organisation and its associated users
// @access  Admin only
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const organisation = await ClientOrganisation.findById(req.params.id);
        if (!organisation) {
            return res.status(404).json({ msg: 'Client organisation not found' });
        }

        // Delete associated user accounts
        if (organisation.contacts && organisation.contacts.length > 0) {
            const emails = organisation.contacts.map(c => c.email).filter(Boolean);
            if (emails.length > 0) {
                await User.deleteMany({ email: { $in: emails } });
            }
        }

        await organisation.deleteOne();

        res.json({ msg: 'Client organisation and associated users removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router; 