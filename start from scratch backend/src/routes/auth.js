const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Helper function to determine role based on email
function determineRole(email) {
    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];
    return adminEmails.includes(email.toLowerCase()) ? 'admin' : 'surveyor';
}

function validateRolePassword(role, password) {
    // NOTE: Ensure these env vars are set in Render!
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    const SURVEYOR_PASSWORD = process.env.SURVEYOR_PASSWORD;
    // Support legacy/alternate env var name for client password
    const CLIENT_PASSWORD = process.env.CLIENT_PASSWORD || process.env.CLIENT_DEFAULT_PASSWORD; // Assuming clients also have a shared password

    if (!password) return false;

    switch (role) {
        case 'admin':
            return password === ADMIN_PASSWORD;
        case 'surveyor':
            return password === SURVEYOR_PASSWORD;
        case 'client':
            return password === CLIENT_PASSWORD;
        default:
            return false; // Deny by default
    }
}

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Determine role based on email
        const role = determineRole(email);

        // Validate that they're using the correct password for their role
        if (!validateRolePassword(role, password)) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Create new user (without storing password)
        user = new User({ email, role });
        await user.save();
        res.status(201).json({ msg: 'User registered successfully', role });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Find user by email
        let user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Use role-based password validation instead of individual passwords
        if (!validateRolePassword(user.role, password)) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const payload = {
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { email: user.email, role: user.role } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', require('../middleware/authMiddleware').protect, async (req, res) => {
    try {
        // Return user data (password already excluded by middleware)
        res.json({
            id: req.user._id,
            email: req.user.email,
            name: req.user.name,
            role: req.user.role,
            auth0Id: req.user.auth0Id,
            isAuth0User: req.user.isAuth0User
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router; 