const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { authorize } = require('../middleware/authMiddleware'); // Import authorize

// @route   GET /api/projects
// @desc    Get all projects (fetching selected fields)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const projects = await Project.find().select('name client clientOrSpvName teamMembers createdAt').sort({ createdAt: -1 });
        res.json(projects);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/projects
// @desc    Create a new project
// @access  Public
router.post('/', async (req, res) => {
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
// @access  Public
router.get('/:id', async (req, res) => {
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
// @access  Public
router.put('/:id', async (req, res) => {
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
router.delete('/:id', authorize('admin'), async (req, res) => {
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
