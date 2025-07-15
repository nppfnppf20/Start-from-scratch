const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ msg: 'Not authorized, no token' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.user.id).select('-password');
        next();
    } catch (err) {
        return res.status(401).json({ msg: 'Not authorized, token failed' });
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                msg: `User role '${req.user ? req.user.role : 'none'}' is not authorized to access this route` 
            });
        }
        next();
    };
}; 

// Grant access to a specific project
exports.checkProjectAccess = async (req, res, next) => {
    try {
        // Admins have automatic access
        if (req.user.role === 'admin') {
            return next();
        }

        // Surveyors must be in the authorizedSurveyors list
        if (req.user.role === 'surveyor') {
            const project = await require('../models/Project').findById(req.params.id);

            if (!project) {
                return res.status(404).json({ msg: 'Project not found' });
            }

            // Check if surveyor is authorized
            if (project.authorizedSurveyors.map(id => id.toString()).includes(req.user._id.toString())) {
                return next();
            } else {
                return res.status(403).json({ msg: 'User not authorized for this project' });
            }
        }
        
        // Deny access by default
        return res.status(403).json({ msg: 'User not authorized' });

    } catch (err) {
        console.error(err);
        return res.status(500).send('Server Error');
    }
}; 