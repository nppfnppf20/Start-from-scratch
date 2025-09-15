const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route GET /api/auth/me
// @desc Get current user info
// @access Protected
router.get('/me', protect, async (req, res) => {
  try {
    // User is already loaded in protect middleware
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      auth0Id: req.user.auth0Id,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt
    });
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route GET /api/auth/users
// @desc Get all users (admin only)
// @access Protected (admin)
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find({})
      .select('-__v')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route PUT /api/auth/users/:userId/role
// @desc Update user role (admin only)
// @access Protected (admin)
router.put('/users/:userId/role', protect, authorize('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    if (!['admin', 'surveyor', 'client'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be admin, surveyor, or client' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({ 
      message: 'User role updated successfully', 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route DELETE /api/auth/users/:userId
// @desc Delete user (admin only)
// @access Protected (admin)
router.delete('/users/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route PUT /api/auth/users/:userId/name
// @desc Update user name (admin only)
// @access Protected (admin)
router.put('/users/:userId/name', protect, authorize('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name.trim();
    await user.save();

    res.json({ 
      message: 'User name updated successfully', 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating user name:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;