const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
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
        }

        const projects = await Project.aggregate([
            // Stage 1: Match projects based on user role
            { $match: query },
            // Stage 2: Lookup quotes for each project
            {
                $lookup: {
                    from: 'quotes',
                    localField: '_id',
                    foreignField: 'projectId',
                    as: 'quotes'
                }
            },
            // Stage 2: Add fields with calculated values
            {
                $addFields: {
                    // Count total quotes received for the project
                    quotesReceived: { $size: '$quotes' },
                    
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
                    surveyorsInstructed: { $size: { $setUnion: '$instructedQuotes.organisation' } },
                    
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
            // Stage 3: Lookup programme events using a pipeline to handle ObjectId to string conversion
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
            // Stage 4: Project the final fields
            {
                $project: {
                    name: 1,
                    client: 1,
                    teamMembers: 1,
                    quotesReceived: 1,
                    surveyorsInstructed: 1,
                    instructedSpend: 1,
                    createdAt: 1,
                    programmeEvents: 1 // Now this field exists and can be included
                }
            },
            // Stage 5: Sort by creation date
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
    const { name, client, teamMembers, clientOrSpvName } = req.body;
    try {
        if (!name) {
            return res.status(400).json({ msg: 'Project name is required' });
        }
        const newProject = new Project({
            name,
            client,
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
// @desc    Delete a project by ID
// @access  Admin only
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }
        await Project.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Project removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Project not found (invalid ID format)' });
        }
        res.status(500).send('Server Error');
    }
});

// We can keep the debug log for now if you like, or remove it
console.log('Attempting to export project router...');

module.exports = router;
