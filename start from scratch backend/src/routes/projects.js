const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Document = require('../models/Document');
const User = require('../models/User');
const Quote = require('../models/Quote'); // Added for cascade deletion
const ProgrammeEvent = require('../models/ProgrammeEvent'); // Added for cascade deletion
const SurveyorFeedback = require('../models/SurveyorFeedback'); // Added for cascade deletion
const InstructionLog = require('../models/InstructionLog');
const { protect, authorize, checkProjectAccess } = require('../middleware/authMiddleware'); // Import authorize and protect

const getProjectAggregationPipeline = (matchQuery = {}) => {
    return [
        { $match: matchQuery },
        {
            $lookup: {
                from: 'clientorganisations',
                localField: 'client',
                foreignField: '_id',
                as: 'clientDetails'
            }
        },
        {
            $unwind: {
                path: '$clientDetails',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: 'quotes',
                localField: '_id',
                foreignField: 'projectId',
                as: 'quotes'
            }
        },
        {
            $addFields: {
                instructedQuotes: {
                    $filter: {
                        input: '$quotes',
                        as: 'quote',
                        cond: { $in: ['$$quote.instructionStatus', ['instructed', 'partially instructed']] }
                    }
                },
            }
        },
        {
            $addFields: {
                instructedCount: { $size: { $ifNull: [{ $setUnion: '$instructedQuotes.organisation' }, []] } },
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
        {
            $lookup: {
                from: 'instructionlogs',
                localField: 'instructedQuotes._id',
                foreignField: 'quoteId',
                as: 'instructedLogs'
            }
        },
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
                                cond: { $not: { $in: ['$$quote._id', '$instructedLogs.quoteId'] } }
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
                outstandingCount: { $size: '$outstandingSurveys' }
            }
        },
        {
            $lookup: {
                from: 'programmeevents',
                let: { projectIdStr: { $toString: '$_id' } },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$projectId', '$$projectIdStr'] }
                        }
                    }
                ],
                as: 'programmeEvents'
            }
        },
        {
            $project: {
                name: 1,
                client: '$clientDetails.organisationName',
                projectLead: 1,
                projectManager: 1,
                instructedCount: 1,
                completedCount: 1,
                outstandingCount: 1,
                outstandingSurveys: 1,
                instructedSpend: 1,
                createdAt: 1,
                programmeEvents: 1,
                authorizedSurveyors: 1,
                authorizedClients: 1,
                // Add all other fields from the Project model that you need on the frontend
                clientOrSpvName: 1,
                detailedDescription: 1,
                proposedUseDuration: 1,
                projectType: 1,
                address: 1,
                area: 1,
                localPlanningAuthority: 1,
                distributionNetwork: 1,
                siteDesignations: 1,
                solarExportCapacity: 1,
                pvMaxPanelHeight: 1,
                fenceHeight: 1,
                pvClearanceFromGround: 1,
                numberOfSolarPanels: 1,
                panelTilt: 1,
                panelTiltDirection: 1,
                bessExportCapacity: 1,
                bessContainers: 1,
                gwhPerYear: 1,
                homesPowered: 1,
                co2Offset: 1,
                equivalentCars: 1,
                accessArrangements: 1,
                accessContact: 1,
                parkingDetails: 1,
                atvUse: 1,
                additionalNotes: 1,
                invoicingDetails: 1,
                sharepointLink: 1,
                updatedAt: 1
            }
        },
    ];
};

// @route   GET /api/projects
// @desc    Get all projects (fetching selected fields)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'surveyor') {
            query.authorizedSurveyors = req.user._id;
        } else if (req.user.role === 'client') {
            const user = await User.findById(req.user._id);
            if (user && user.clientOrganisation) {
                query.$or = [
                    { authorizedClients: req.user._id },
                    { client: user.clientOrganisation }
                ];
            } else {
                query.authorizedClients = req.user._id;
            }
        }

        const aggregation = getProjectAggregationPipeline(query);
        const projects = await Project.aggregate([...aggregation, { $sort: { createdAt: -1 } }]);
        
        // The aggregation returns an object with an 'id' field, but it's the raw _id.
        // We need to map it to a string 'id' for the frontend.
        const projectsWithId = projects.map(p => ({ ...p, id: p._id.toString() }));
        
        res.json(projectsWithId);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/projects
// @desc    Create a new project
// @access  Admin only
router.post('/', protect, authorize('admin'), async (req, res) => {
    const { name, client, projectLead, projectManager, clientOrSpvName } = req.body;
    try {
        if (!name) {
            return res.status(400).json({ msg: 'Project name is required' });
        }
        const newProject = new Project({
            name,
            client,
            projectLead,
            projectManager,
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
            const aggregation = getProjectAggregationPipeline({ _id: mongoose.Types.ObjectId(id) });
            const currentProjectState = await Project.aggregate(aggregation);
            return res.status(200).json({ 
                msg: 'No registered users found for the provided emails.', 
                project: currentProjectState.length > 0 ? { ...currentProjectState[0], id: currentProjectState[0]._id.toString() } : null
            });
        }

        const userIds = users.map(user => user._id);

        const newSurveyorIds = userIds.filter(userId => !project.authorizedSurveyors.some(existingId => existingId.equals(userId)));

        if (newSurveyorIds.length > 0) {
            project.authorizedSurveyors.unshift(...newSurveyorIds);
            await project.save();
        }

        const aggregation = getProjectAggregationPipeline({ _id: mongoose.Types.ObjectId(id) });
        const updatedProjectArray = await Project.aggregate(aggregation);
        
        if (updatedProjectArray.length === 0) {
            return res.status(404).json({ msg: 'Project not found after update.' });
        }

        const updatedProject = { ...updatedProjectArray[0], id: updatedProjectArray[0]._id.toString() };
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
            const aggregation = getProjectAggregationPipeline({ _id: mongoose.Types.ObjectId(id) });
            const currentProjectState = await Project.aggregate(aggregation);
            return res.status(200).json({ 
                msg: 'No registered users found for the provided emails.', 
                project: currentProjectState.length > 0 ? { ...currentProjectState[0], id: currentProjectState[0]._id.toString() } : null
            });
        }

        const userIds = users.map(user => user._id);

        const newClientIds = userIds.filter(userId => !project.authorizedClients.some(existingId => existingId.equals(userId)));

        if (newClientIds.length > 0) {
            project.authorizedClients.unshift(...newClientIds);
            await project.save();
        }

        const aggregation = getProjectAggregationPipeline({ _id: mongoose.Types.ObjectId(id) });
        const updatedProjectArray = await Project.aggregate(aggregation);
        
        if (updatedProjectArray.length === 0) {
            return res.status(404).json({ msg: 'Project not found after update.' });
        }

        const updatedProject = { ...updatedProjectArray[0], id: updatedProjectArray[0]._id.toString() };
        res.json(updatedProject);

    } catch (error) {
        console.error('Error authorizing clients:', error);
        res.status(500).send('Server Error');
    }
});

// We can keep the debug log for now if you like, or remove it
console.log('Attempting to export project router...');

module.exports = router;
