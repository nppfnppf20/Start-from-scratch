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

// Helper function to validate password for role
function validateRolePassword(role, password) {
    if (role === 'admin') {
        return password === process.env.ADMIN_PASSWORD;
    } else if (role === 'surveyor') {
        return password === process.env.SURVEYOR_PASSWORD;
    } else if (role === 'client') {
        return password === process.env.CLIENT_DEFAULT_PASSWORD;
    }
    return false;
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
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Validate password against role-based shared password
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
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router; 