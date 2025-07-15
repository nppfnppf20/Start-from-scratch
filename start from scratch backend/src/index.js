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
const { router: surveyorFeedbackRoutes } = require('./routes/surveyorFeedback'); // *** FIX: Destructure router from export ***
const surveyorOrganisationsRoutes = require('./routes/surveyorOrganisations');
const uploadRoutes = require('./routes/uploads');
const documentRoutes = require('./routes/documents');
const programmeEventRoutes = require('./routes/programmeEvents.js'); // Adjust path if needed
const authRoutes = require('./routes/auth');
const pendingSurveyorRoutes = require('./routes/pendingSurveyors');
const { protect, authorize } = require('./middleware/authMiddleware'); // Import new middleware
const User = require('./models/User'); // Import User model for seeding
const feeQuoteRequestsRouter = require('./routes/feeQuoteRequests');
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
    
    // Seed initial admin users
    await seedAdminUsers();
  } catch (err) {
    // +++ Add more specific error message +++
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

// Function to create initial admin users
const seedAdminUsers = async () => {
  try {
    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim()) : [];
    
    for (const email of adminEmails) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (!existingUser) {
        const adminUser = new User({
          email: email.toLowerCase(),
          role: 'admin'
        });
        await adminUser.save();
        console.log(`Created admin user: ${email}`);
      }
    }
  } catch (error) {
    console.error('Error seeding admin users:', error);
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



// +++ Statically serve the uploads directory +++
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// +++ Change base API route to /api +++
app.get('/api', (req, res) => {
  res.send('API is running...');
});

// Apply JWT protection to all data-related routes
app.use('/api/projects', protect, projectRoutes);
app.use('/api/quotes', protect, quoteRoutes);
app.use('/api/instruction-logs', protect, instructionLogRoutes);
app.use('/api/surveyor-feedback', protect, surveyorFeedbackRoutes);
app.use('/api/documents', protect, documentRoutes);
app.use('/api/programme-events', protect, programmeEventRoutes);
app.use('/api/surveyor-organisations', protect, surveyorOrganisationsRoutes);
app.use('/api/pending-surveyors', protect, pendingSurveyorRoutes);
app.use('/api/fee-quote-requests', feeQuoteRequestsRouter);

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/uploads', uploadRoutes); // Keeping this public for now


// --- Start Server ---\n
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

