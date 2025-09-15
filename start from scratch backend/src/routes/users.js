const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Import the model instead of defining it
const { protect, authorize } = require('../middleware/authMiddleware');

// Example route - get all users (admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find({}).select('-__v').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;