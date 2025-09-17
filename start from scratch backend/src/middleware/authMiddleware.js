const User = require('../models/User');
// For Node.js fetch support
const fetch = globalThis.fetch || require('node-fetch');

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
        
        console.log('Auth0 verification - Domain:', AUTH0_DOMAIN);
        console.log('Auth0 verification - Audience:', AUTH0_AUDIENCE);
        
        if (!AUTH0_DOMAIN) {
            console.error('AUTH0_DOMAIN not set');
            return res.status(500).json({ msg: 'Server misconfiguration' });
        }

        // Dynamically import jose (ESM)
        const jose = await import('jose');
        const issuer = `https://${AUTH0_DOMAIN}/`;
        const JWKS = jose.createRemoteJWKSet(new URL(`${issuer}.well-known/jwks.json`));

        console.log('Verifying token with issuer:', issuer, 'audience:', AUTH0_AUDIENCE);

        // Verify Auth0 Access Token
        const { payload } = await jose.jwtVerify(token, JWKS, { 
            issuer,
            audience: AUTH0_AUDIENCE || undefined
        });
        
        console.log('Token verified successfully, payload:', JSON.stringify(payload, null, 2));

        // For access tokens, email might not be in the payload
        // We need to get it from Auth0's userinfo endpoint or use sub as identifier
        let email = payload.email;
        const sub = payload.sub;

        // Simple approach: always look up by auth0Sub if no email in token
        if (!email && sub) {
            console.log('No email in token, looking up user by Auth0 sub:', sub);
            
            // Try to find user by Auth0 sub (should work after first successful login)
            user = await User.findOne({ auth0Sub: sub });
            
            if (user) {
                console.log('Found existing user by Auth0 sub:', user.email);
            } else {
                console.log('User not found by Auth0 sub, fetching email from userinfo');
                
                // Get email from userinfo 
                try {
                    const userInfoResponse = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    if (userInfoResponse.ok) {
                        const userInfo = await userInfoResponse.json();
                        email = userInfo.email?.toLowerCase();
                        console.log('Got email from userinfo:', email);
                    }
                } catch (err) {
                    console.error('Failed to get userinfo:', err);
                }
                
                if (!email) {
                    return res.status(400).json({ msg: 'Unable to determine user email' });
                }
                
                // Try to find by email (for existing users from old system)
                user = await User.findOne({ email });
                
                if (user) {
                    // Link existing user to Auth0
                    user.auth0Sub = sub;
                    await user.save();
                    console.log('Linked existing user to Auth0:', user.email);
                } else {
                    // Check if email is authorized in any bank
                    const role = await determineRoleFromEmailBanks(email);
                    if (!role) {
                        return res.status(403).json({ msg: 'Email not authorized - contact admin to be added to the system' });
                    }
                    
                    // Create new user
                    user = new User({ email, role, auth0Sub: sub });
                    await user.save();
                    console.log('Created new user:', user.email, 'with role:', role);
                }
            }
        } else if (email) {
            // Email is in the token
            email = email.toLowerCase();
            
            // Find or create user in our database
            user = await User.findOne({ email });
            if (!user) {
                // Check if email is authorized in any bank
                const role = await determineRoleFromEmailBanks(email);
                if (!role) {
                    return res.status(403).json({ msg: 'Email not authorized - contact admin to be added to the system' });
                }
                
                user = new User({ 
                    email, 
                    role,
                    auth0Sub: sub 
                });
                await user.save();
                console.log('Created new user:', user.email, 'with role:', role);
            } else if (!user.auth0Sub) {
                // Update existing user with auth0Sub
                user.auth0Sub = sub;
                await user.save();
                console.log('Linked existing user to Auth0:', user.email);
            }
        } else {
            return res.status(400).json({ msg: 'Token missing email claim' });
        }

        req.user = user;
        req.auth0Payload = payload; // Store full Auth0 payload for reference
        next();
    } catch (err) {
        console.error('Auth0 token verification error:', err);
        return res.status(401).json({ msg: 'Invalid Auth0 token' });
    }
};

// Helper function to determine role from email banks
async function determineRoleFromEmailBanks(email) {
    const emailLower = email.toLowerCase();
    
    // 1. Check admin emails (database)
    const Admin = require('../models/Admin');
    const adminUser = await Admin.findOne({ email: emailLower, isActive: true });
    if (adminUser) {
        console.log(`Email ${emailLower} found in admin bank (database)`);
        return 'admin';
    }
    
    // 2. Check client organizations 
    const ClientOrganisation = require('../models/ClientOrganisation');
    const clientOrg = await ClientOrganisation.findOne({ 'contacts.email': emailLower });
    if (clientOrg) {
        console.log(`Email ${emailLower} found in client bank (org: ${clientOrg.organisationName})`);
        return 'client';
    }
    
    // 3. Check surveyor organizations
    const SurveyorOrganisation = require('../models/SurveyorOrganisation');  
    const surveyorOrg = await SurveyorOrganisation.findOne({ 'contacts.email': emailLower });
    if (surveyorOrg) {
        console.log(`Email ${emailLower} found in surveyor bank (org: ${surveyorOrg.organisation})`);
        return 'surveyor';
    }
    
    console.log(`Email ${emailLower} NOT FOUND in any email bank`);
    return null; // Not authorized
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