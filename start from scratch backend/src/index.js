// File: start from scratch backend/src/index.js
const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors'); // Import the cors package

// +++ Correct dotenv path +++
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// +++ Import Routes +++
const projectRoutes = require('./routes/projects');
const quoteRoutes = require('./routes/quotes'); // Import quote routes
const instructionLogRoutes = require('./routes/instructionLogs'); // Import new routes
const surveyorFeedbackRoutes = require('./routes/surveyorFeedback'); // *** ADD THIS LINE ***
const uploadRoutes = require('./routes/uploads');
const documentRoutes = require('./routes/documents');
const programmeEventRoutes = require('./routes/programmeEvents.js'); // Adjust path if needed
console.log('Imported projectRoutes:', typeof projectRoutes, projectRoutes);

const app = express();
const PORT = process.env.PORT || 5000;

// --- Database Connection ---\n
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('FATAL ERROR: MONGO_URI is not defined. Check your .env file.');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 6+ no longer needs useNewUrlParser/useUnifiedTopology
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    // +++ Add more specific error message +++
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};
connectDB();

// --- CORS Configuration ---
const RENDER_FRONTEND_URLS = process.env.RENDER_FRONTEND_URLS; // You'll set this in Render's env vars for the backend

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [];
    if (RENDER_FRONTEND_URLS) {
      // Split the comma-separated string into an array of origins
      allowedOrigins.push(...RENDER_FRONTEND_URLS.split(',').map(url => url.trim()));
    }
    // Allow local development origins if not in a 'production' environment
    // You might set NODE_ENV=production in Render's environment variables
    if (process.env.NODE_ENV !== 'production') {
      allowedOrigins.push("http://localhost:5173"); // SvelteKit's default dev port
      allowedOrigins.push("http://127.0.0.1:5173"); // Another common localhost variant
      // Add any other local frontend ports you might use
    }

    // Allow requests with no origin (like Postman, server-to-server) or from allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS: Request from origin '${origin}' blocked.`); // Optional: Log blocked origins
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));

// Middleware to parse JSON bodies
app.use(express.json());

    // --- Simple Password Authentication Middleware ---
    const requireAuth = (req, res, next) => {
      // This is a special, unprotected route the frontend can use to verify a password.
      if (req.path === '/api/auth/verify') {
        const { password } = req.body;
        if (password && password === process.env.SITE_PASSWORD) {
          return res.status(200).json({ msg: 'Password is correct.' });
        } else {
          return res.status(401).json({ msg: 'Incorrect password.' });
        }
      }

      // For all other API routes, check for the authorization header.
      const providedPassword = req.headers.authorization;
      const secretPassword = process.env.SITE_PASSWORD;

      if (!secretPassword) {
        console.error('FATAL: SITE_PASSWORD is not set in the .env file.');
        return res.status(500).json({ msg: 'Server configuration error.' });
      }

      if (providedPassword && providedPassword === secretPassword) {
        next(); // Password is correct, proceed to the actual route.
      } else {
        res.status(401).json({ msg: 'Unauthorized' }); // Block the request.
      }
    };

    // Apply the authentication middleware to all /api routes.
    app.use('/api', requireAuth);

// +++ Statically serve the uploads directory +++
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// +++ Change base API route to /api +++
app.get('/api', (req, res) => {
  res.send('API is running...');
});

// +++ Use Project routes +++
app.use('/api/projects', projectRoutes);
// +++ Use Quote routes +++
app.use('/api/quotes', quoteRoutes);
// +++ Use InstructionLog routes +++
app.use('/api/instruction-logs', instructionLogRoutes);
// +++ Use SurveyorFeedback routes +++
app.use('/api/surveyor-feedback', surveyorFeedbackRoutes); // *** ADD THIS LINE ***
app.use('/api/uploads', uploadRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/programme-events', programmeEventRoutes);

// --- Start Server ---\n
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

