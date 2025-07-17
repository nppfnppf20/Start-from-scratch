const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Document = require('../models/Document');
const User = require('../models/User');
const Quote = require('../models/Quote'); // Added for cascade deletion
const ProgrammeEvent = require('../models/ProgrammeEvent'); // Added for cascade deletion
const SurveyorFeedback = require('../models/SurveyorFeedback'); // Added for cascade deletion
const InstructionLog = require('../models/InstructionLog');
const { protect, authorize, checkProjectAccess } = require('../middleware/authMiddleware'); // Import authorize and protect

// @route   GET /api/projects
// @desc    Get all projects (fetching selected fields)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let query = {};
        // If user is a surveyor, only return projects they are authorized for
        if (req.user.role === 'surveyor') {
            query.authorizedSurveyors = req.user._id;
        } else if (req.user.role === 'client') {
            query.authorizedClients = req.user._id;
        }

        const projects = await Project.aggregate([
            // Stage 1: Match projects based on user role
            { $match: query },
            // Stage 2: Lookup client organisation
            {
                $lookup: {
                    from: 'clientorganisations', // The collection name for ClientOrganisation
                    localField: 'client',
                    foreignField: '_id',
                    as: 'clientDetails'
                }
            },
            // Unwind the clientDetails array to get a single object
            {
                $unwind: {
                    path: '$clientDetails',
                    preserveNullAndEmptyArrays: true // Keep projects even if client is not set
                }
            },
            // Stage 3: Lookup quotes for each project
            {
                $lookup: {
                    from: 'quotes',
                    localField: '_id',
                    foreignField: 'projectId',
                    as: 'quotes'
                }
            },
            // Stage 4: Add fields with calculated values
            {
                $addFields: {
                    // Filter to get only instructed quotes
                    instructedQuotes: {
                        $filter: {
                            input: '$quotes',
                            as: 'quote',
                            cond: { 
                                $in: ['$$quote.instructionStatus', ['instructed', 'partially instructed']]
                            }
                        }
                    },
                }
            },
            {
                $addFields: {
                    // Count unique surveyors instructed
                    instructedCount: { $size: { $ifNull: [{ $setUnion: '$instructedQuotes.organisation' }, []] } },
                    
                    // Calculate total instructed spend
                    instructedSpend: {
                        $reduce: {
                            input: '$instructedQuotes',
                            initialValue: 0,
                            in: {
                                $add: [
                                    '$$value',
                                    { 
                                        $cond: {
                                            if: { $eq: ['$$this.instructionStatus', 'instructed'] },
                                            then: '$$this.total',
                                            else: '$$this.partiallyInstructedTotal'
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            // Stage 5: Lookup instruction logs for the instructed quotes
            {
                $lookup: {
                    from: 'instructionlogs',
                    localField: 'instructedQuotes._id',
                    foreignField: 'quoteId',
                    as: 'instructedLogs'
                }
            },
            // Stage 6: Calculate completed and outstanding counts
            {
                $addFields: {
                    completedCount: {
                        $size: {
                            $filter: {
                                input: '$instructedLogs',
                                as: 'log',
                                cond: { $eq: ['$$log.workStatus', 'completed'] }
                            }
                        }
                    },
                    outstandingSurveys: {
                        $map: {
                            input: {
                                $filter: {
                                    input: '$instructedQuotes',
                                    as: 'quote',
                                    cond: {
                                        $not: {
                                            $in: ['$$quote._id', '$instructedLogs.quoteId']
                                        }
                                    }
                                }
                            },
                            as: 'outstandingQuote',
                            in: {
                                quoteId: '$$outstandingQuote._id',
                                organisation: '$$outstandingQuote.organisation',
                                contactName: '$$outstandingQuote.contactName',
                                workStatus: 'Not Started'
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    // Combine outstanding from logs and those not in logs yet
                    outstandingSurveys: {
                        $concatArrays: [
                            '$outstandingSurveys',
                            {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$instructedLogs',
                                            as: 'log',
                                            cond: { $ne: ['$$log.workStatus', 'completed'] }
                                        }
                                    },
                                    as: 'log',
                                    in: {
                                        quoteId: '$$log.quoteId',
                                        organisation: {
                                            $let: {
                                                vars: {
                                                    quote: { $arrayElemAt: [{ $filter: { input: '$instructedQuotes', as: 'q', cond: { $eq: ['$$q._id', '$$log.quoteId'] } } }, 0] }
                                                },
                                                in: '$$quote.organisation'
                                            }
                                        },
                                        contactName: {
                                            $let: {
                                                vars: {
                                                    quote: { $arrayElemAt: [{ $filter: { input: '$instructedQuotes', as: 'q', cond: { $eq: ['$$q._id', '$$log.quoteId'] } } }, 0] }
                                                },
                                                in: '$$quote.contactName'
                                            }
                                        },
                                        workStatus: '$$log.workStatus'
                                    }
                                }
                            }
                        ]
                    }
                }
            },
            {
                $addFields: {
                    // Outstanding is instructed surveyors minus completed
                    outstandingCount: { $size: '$outstandingSurveys' }
                }
            },
            // Stage 7: Lookup programme events using a pipeline
            {
                $lookup: {
                    from: 'programmeevents',
                    let: { projectIdStr: { $toString: '$_id' } }, // Convert project _id to string
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ['$projectId', '$$projectIdStr'] // Match on the string versions
                                }
                            }
                        }
                    ],
                    as: 'programmeEvents'
                }
            },
            // Stage 8: Project the final fields
            {
                $project: {
                    name: 1,
                    client: '$clientDetails.organisationName', // Use the name from the populated client
                    projectLead: 1,
                    projectManager: 1,
                    instructedCount: 1,
                    completedCount: 1,
                    outstandingCount: 1,
                    outstandingSurveys: 1, // Pass the new detailed list
                    instructedSpend: 1,
                    createdAt: 1,
                    programmeEvents: 1,
                    authorizedSurveyors: 1,
                    authorizedClients: 1
                }
            },
            // Stage 9: Sort by creation date
            {
                $sort: { createdAt: -1 }
            }
        ]);
        res.json(projects);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/projects
// @desc    Create a new project
// @access  Admin only
router.post('/', protect, authorize('admin'), async (req, res) => {
    const { name, client, projectLead, projectManager, teamMembers, clientOrSpvName } = req.body;
    try {
        if (!name) {
            return res.status(400).json({ msg: 'Project name is required' });
        }
        const newProject = new Project({
            name,
            client,
            projectLead,
            projectManager,
            teamMembers,
            clientOrSpvName
        });
        const project = await newProject.save();
        res.status(201).json(project);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/projects/:id
// @desc    Get a single project by ID
// @access  Private (Admin or authorized surveyor)
router.get('/:id', protect, checkProjectAccess, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }
        res.json(project);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Project not found (invalid ID format)' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/projects/:id
// @desc    Update a project by ID
// @access  Admin only
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        let project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }
        project = await Project.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        res.json(project);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Project not found (invalid ID format)' });
        }
        if (err.name === 'ValidationError') {
             return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/projects/:id
// @desc    Delete a project by ID and all associated data
// @access  Admin only
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await Project.findById(projectId);
        
        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        // --- Cascade Deletion ---
        // 1. Delete associated Quotes
        await Quote.deleteMany({ projectId: projectId });
        
        // 2. Delete associated ProgrammeEvents
        await ProgrammeEvent.deleteMany({ projectId: projectId });

        // 3. Delete associated SurveyorFeedback
        await SurveyorFeedback.deleteMany({ projectId: projectId });

        // 4. Delete the Project itself
        await Project.findByIdAndDelete(projectId);

        res.json({ msg: 'Project and all associated data removed successfully' });

    } catch (err) {
        console.error('Error during project deletion:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Project not found (invalid ID format)' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/projects/:id/authorize-surveyors
// @desc    Authorize surveyors to a project by their email addresses
// @access  Private
router.post('/:id/authorize-surveyors', async (req, res) => {
    const { id } = req.params;
    const { emails } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({ msg: 'Emails array is required.' });
    }

    try {
        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        const users = await User.find({ email: { $in: emails } });
        if (users.length === 0) {
            // This isn't necessarily an error, maybe none of the emails are registered users yet.
            // Or we could choose to return a specific message.
            return res.status(200).json({ msg: 'No registered users found for the provided emails.', project });
        }

        const userIds = users.map(user => user._id);

        // Add only new user IDs to the authorizedSurveyors array
        const newSurveyorIds = userIds.filter(userId => !project.authorizedSurveyors.some(existingId => existingId.equals(userId)));

        if (newSurveyorIds.length > 0) {
            project.authorizedSurveyors.unshift(...newSurveyorIds);
            await project.save();
        }

        const updatedProject = await Project.findById(id).populate('authorizedSurveyors');

        res.json(updatedProject);

    } catch (error) {
        console.error('Error authorizing surveyors:', error);
        res.status(500).send('Server Error');
    }
});


// @route   POST /api/projects/:id/authorize-clients
// @desc    Authorize clients to a project by their email addresses
// @access  Private
router.post('/:id/authorize-clients', async (req, res) => {
    const { id } = req.params;
    const { emails } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({ msg: 'Emails array is required.' });
    }

    try {
        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        const users = await User.find({ email: { $in: emails } });
        if (users.length === 0) {
            return res.status(200).json({ msg: 'No registered users found for the provided emails.', project });
        }

        const userIds = users.map(user => user._id);

        // Add only new user IDs to the authorizedClients array
        const newClientIds = userIds.filter(userId => !project.authorizedClients.some(existingId => existingId.equals(userId)));

        if (newClientIds.length > 0) {
            project.authorizedClients.unshift(...newClientIds);
            await project.save();
        }

        const updatedProject = await Project.findById(id).populate('authorizedClients');

        res.json(updatedProject);

    } catch (error) {
        console.error('Error authorizing clients:', error);
        res.status(500).send('Server Error');
    }
});

// We can keep the debug log for now if you like, or remove it
console.log('Attempting to export project router...');

module.exports = router;
