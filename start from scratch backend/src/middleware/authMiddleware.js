const User = require('../models/User');

// Protect routes with Auth0 Access Token
exports.protect = async (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ msg: 'Missing or invalid Authorization header' });
    }
    
    const token = parts[1];
    
    try {
        const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
        const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;
        
        if (!AUTH0_DOMAIN) {
            console.error('AUTH0_DOMAIN not set');
            return res.status(500).json({ msg: 'Server misconfiguration' });
        }

        // Dynamically import jose (ESM)
        const jose = await import('jose');
        const issuer = `https://${AUTH0_DOMAIN}/`;
        const JWKS = jose.createRemoteJWKSet(new URL(`${issuer}.well-known/jwks.json`));

        // Verify Auth0 Access Token
        const { payload } = await jose.jwtVerify(token, JWKS, { 
            issuer,
            audience: AUTH0_AUDIENCE || undefined
        });

        const email = (payload.email || payload.sub || '').toLowerCase();
        if (!email) {
            return res.status(400).json({ msg: 'Token missing email claim' });
        }

        // Find or create user in our database
        let user = await User.findOne({ email });
        if (!user) {
            // Create user with role based on email domain or Auth0 metadata
            const role = determineRoleFromAuth0(payload);
            user = new User({ email, role });
            await user.save();
        }

        req.user = user;
        req.auth0Payload = payload; // Store full Auth0 payload for reference
        next();
    } catch (err) {
        console.error('Auth0 token verification error:', err);
        return res.status(401).json({ msg: 'Invalid Auth0 token' });
    }
};

// Helper function to determine role from Auth0 token
function determineRoleFromAuth0(payload) {
    // Check for custom roles in Auth0 metadata first
    const customRoles = payload['https://your-app/roles'] || payload.roles || [];
    if (customRoles.includes('admin')) return 'admin';
    if (customRoles.includes('client')) return 'client';
    if (customRoles.includes('surveyor')) return 'surveyor';
    
    // Fallback to email-based role determination
    const email = payload.email || '';
    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];
    return adminEmails.includes(email.toLowerCase()) ? 'admin' : 'surveyor';
}

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