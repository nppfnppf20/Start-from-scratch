const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const User = require('../models/User');

// Auth0 JWKS client for token verification
const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  requestHeaders: {}, 
  timeout: 30000,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  jwksRequestsPerHour: 10
});

// Helper function to get signing key with proper error handling
function getKey(header, callback) {
  console.log('Getting signing key for kid:', header.kid);
  
  client.getSigningKey(header.kid, function(err, key) {
    if (err) {
      console.error('Error getting signing key:', err);
      return callback(err);
    }
    
    if (!key) {
      console.error('No key returned from JWKS');
      return callback(new Error('Unable to find a signing key that matches'));
    }
    
    console.log('Key retrieved:', Object.keys(key));
    
    const signingKey = key.publicKey || key.rsaPublicKey;
    if (!signingKey) {
      console.error('No public key found in signing key');
      return callback(new Error('Unable to find a signing key that matches'));
    }
    
    console.log('Signing key extracted successfully');
    callback(null, signingKey);
  });
}

// Admin emails array (keep your existing logic)
const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];

// Debug admin emails on startup
console.log('Admin emails configured:', adminEmails);

// Determine role based on email (keep your existing logic)
function determineRole(email) {
  const isAdmin = adminEmails.includes(email.toLowerCase());
  console.log(`Role check for ${email}: ${isAdmin ? 'admin' : 'surveyor'} (admin emails: ${adminEmails.join(', ')})`);
  return isAdmin ? 'admin' : 'surveyor';
}

// Replace your current protect middleware
const protect = async (req, res, next) => {
  console.log('Auth middleware called');
  console.log('AUTH0_DOMAIN:', process.env.AUTH0_DOMAIN);
  console.log('AUTH0_API_IDENTIFIER:', process.env.AUTH0_API_IDENTIFIER);
  
  let token;

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token extracted, length:', token.length);

      // Verify the Auth0 JWT token
      jwt.verify(token, getKey, {
        audience: process.env.AUTH0_API_IDENTIFIER,
        issuer: `https://${process.env.AUTH0_DOMAIN}/`,
        algorithms: ['RS256']
      }, async (err, decoded) => {
        if (err) {
          console.error('JWT verification error:', err);
          return res.status(401).json({ message: 'Not authorized, token failed' });
        }

        try {
          console.log('JWT decoded successfully:', Object.keys(decoded));
          
// Get user info from Auth0 userinfo endpoint using the access token
console.log('Fetching user info from Auth0...');
const userInfoResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

if (!userInfoResponse.ok) {
  console.error('Failed to fetch user info from Auth0:', userInfoResponse.status);
  return res.status(401).json({ message: 'Failed to get user information' });
}

const userInfo = await userInfoResponse.json();
console.log('User info from Auth0:', Object.keys(userInfo));

const email = userInfo.email;
const name = userInfo.name || userInfo.nickname || email.split('@')[0];

if (!email) {
  console.error('No email found in Auth0 user info');
  return res.status(401).json({ message: 'No email found in user information' });
}

console.log('Email extracted from Auth0 userinfo:', email);

          // Find or create user in your database
          let user = await User.findOne({ email: email.toLowerCase() });
          
          if (!user) {
            // Create new user from Auth0 data
            const role = determineRole(email);
            console.log('Creating new user with role:', role);

            user = await User.create({
              name: name,
              email: email.toLowerCase(),
              role: role,
              auth0Id: decoded.sub // Store Auth0 user ID for reference
            });
            console.log('Created new user from Auth0:', email, 'with role:', role);
          } else {
            // Update Auth0 ID if not set
            if (!user.auth0Id) {
              user.auth0Id = decoded.sub;
              await user.save();
              console.log('Updated existing user with Auth0 ID');
            }

            // Check if user's role needs updating based on current admin email configuration
            const currentRole = determineRole(email);
            if (user.role !== currentRole) {
              console.log(`Updating user role from ${user.role} to ${currentRole} for ${email}`);
              user.role = currentRole;
              await user.save();
            }
          }

          // Attach user to request object (same as before)
          req.user = user;
          console.log('User attached to request:', user.email, user.role);
          next();
        } catch (error) {
          console.error('Error in protect middleware:', error);
          res.status(401).json({ message: 'Not authorized' });
        }
      });

    } catch (error) {
      console.error('Token extraction error:', error);
      res.status(401).json({ message: 'Not authorized, no token' });
    }
  } else {
    console.log('No authorization header found');
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Keep your existing authorize middleware (works exactly the same)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
};

// Keep your existing checkProjectAccess middleware (works exactly the same)
const checkProjectAccess = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const user = req.user;

    // Admin users have access to all projects
    if (user.role === 'admin') {
      return next();
    }

    // Get project and check authorized arrays
    const Project = require('../models/Project');
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is authorized for this project
    const isAuthorizedSurveyor = project.authorizedSurveyors.includes(user._id);
    const isAuthorizedClient = project.authorizedClients.includes(user._id);

    if (user.role === 'surveyor' && !isAuthorizedSurveyor) {
      return res.status(403).json({ message: 'Not authorized to access this project' });
    }

    if (user.role === 'client' && !isAuthorizedClient) {
      return res.status(403).json({ message: 'Not authorized to access this project' });
    }

    next();
  } catch (error) {
    console.error('Error in checkProjectAccess:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { protect, authorize, checkProjectAccess };