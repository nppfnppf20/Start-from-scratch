const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyAuth0Token, isAuth0Token } = require('../utils/auth0');

// Determine user role based on email (same logic as before)
function determineUserRole(email) {
    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];
    if (adminEmails.includes(email.toLowerCase())) return 'admin';
    
    // You can add more sophisticated role determination logic here
    // For now, default to surveyor
    return 'surveyor';
}

// Protect routes - handles both Auth0 and legacy tokens
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
        let user;

        if (isAuth0Token(token)) {
            // Handle Auth0 token
            const decoded = await verifyAuth0Token(token);
            
            // Find user by Auth0 ID first, then by email
            user = await User.findOne({ auth0Id: decoded.sub }).select('-password');
            
            if (!user) {
                // Auto-create user if they don't exist
                const email = decoded.email;
                const name = decoded.name || decoded.given_name || decoded.nickname;
                const role = determineUserRole(email);

                user = new User({
                    email: email,
                    name: name,
                    role: role,
                    auth0Id: decoded.sub,
                    isAuth0User: true
                });

                await user.save();
                console.log(`Auto-created user for Auth0 ID: ${decoded.sub}, Email: ${email}`);
            }
        } else {
            // Handle legacy JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            user = await User.findById(decoded.user.id).select('-password');
        }

        if (!user) {
            return res.status(401).json({ msg: 'User not found' });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
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
        const project = await require('../models/Project').findById(req.params.id);

        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        // Admins have automatic access
        if (req.user.role === 'admin') {
            return next();
        }

        // Surveyors must be in the authorizedSurveyors list
        if (req.user.role === 'surveyor') {
            if (project.authorizedSurveyors.map(id => id.toString()).includes(req.user._id.toString())) {
                return next();
            }
        }

        // Clients must be in the authorizedClients list
        if (req.user.role === 'client') {
            if (project.authorizedClients.map(id => id.toString()).includes(req.user._id.toString())) {
                return next();
            }
        }
        
        // If none of the above, deny access
        return res.status(403).json({ msg: 'User not authorized for this project' });

    } catch (err) {
        console.error(err);
        return res.status(500).send('Server Error');
    }
}; 