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

// Helper function to get signing key
function getKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

// Admin emails array (keep your existing logic)
const adminEmails = [
  'admin@trpdashboard.co.uk',
  // Add your admin emails here
];

// Determine role based on email (keep your existing logic)
function determineRole(email) {
  return adminEmails.includes(email.toLowerCase()) ? 'admin' : 'surveyor';
}

// Replace your current protect middleware
const protect = async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

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
          // Extract email from Auth0 token
          const email = decoded.email || decoded['https://trpdashboard.co.uk/email'];
          
          if (!email) {
            return res.status(401).json({ message: 'No email found in token' });
          }

          // Find or create user in your database
          let user = await User.findOne({ email: email.toLowerCase() });
          
          if (!user) {
            // Create new user from Auth0 data
            const role = determineRole(email);
            user = await User.create({
              name: decoded.name || email.split('@')[0],
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
            }
          }

          // Attach user to request object (same as before)
          req.user = user;
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
  }

  if (!token) {
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