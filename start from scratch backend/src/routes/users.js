const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   GET /api/users/surveyors
// @desc    Get all users with the 'surveyor' role
// @access  Admin only
router.get('/surveyors', protect, authorize('admin'), async (req, res) => {
    try {
        const surveyors = await User.find({ role: 'surveyor' }).select('email');
        res.json(surveyors);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router; 