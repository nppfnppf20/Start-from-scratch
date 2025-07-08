const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const { check, validationResult } = require('express-validator');

// @route   POST /api/clients
// @desc    Add a new client
// @access  Protected (Admin only) - Protection is handled in index.js
router.post(
    '/',
    [
        check('organisation', 'Organisation name is required').not().isEmpty(),
        check('industry', 'Industry is required').not().isEmpty()
    ],
    async (req, res) => {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { organisation, industry, contacts } = req.body;

        try {
            // Check if a client with this organisation name already exists
            let client = await Client.findOne({ organisation });
            if (client) {
                return res.status(400).json({ msg: 'A client with this organisation name already exists.' });
            }

            // Create a new client instance
            client = new Client({
                organisation,
                industry,
                contacts
            });

            // Save the new client to the database
            await client.save();

            // Return the newly created client
            res.status(201).json(client);

        } catch (err) {
            console.error('Error adding new client:', err.message);
            res.status(500).json({ 
                msg: 'Server Error', 
                error: process.env.NODE_ENV === 'development' ? err.message : undefined 
            });
        }
    }
);

// @route   GET /api/clients
// @desc    Get all clients with aggregated project data
// @access  Protected (Admin only) - Protection is handled in index.js
router.get('/', async (req, res) => {
    try {
        const aggregationPipeline = [
            // Stage 1: Look up projects for each client
            {
                $lookup: {
                    from: 'projects', // The name of the projects collection
                    localField: 'organisation', // Field from the clients collection
                    foreignField: 'client', // Field from the projects collection
                    as: 'associatedProjects'
                }
            },
            // Stage 2: Project the required fields and calculate totals
            {
                $project: {
                    _id: 1,
                    organisation: 1,
                    industry: 1,
                    contacts: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    totalProjects: { $size: '$associatedProjects' },
                    projectNames: '$associatedProjects.name'
                }
            },
            // Stage 3: Sort by organisation name
            {
                $sort: {
                    organisation: 1
                }
            }
        ];

        const clients = await Client.aggregate(aggregationPipeline);
        
        // Mongoose's .aggregate() returns plain JS objects, but the IDs are still ObjectIds.
        // We need to map them to strings for frontend consistency.
        const clientsWithIdStrings = clients.map(c => ({...c, id: c._id.toString()}));

        res.json(clientsWithIdStrings);

    } catch (err) {
        console.error('Error fetching clients:', err.message);
        res.status(500).json({ 
            msg: 'Server Error', 
            error: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    }
});


module.exports = router; 