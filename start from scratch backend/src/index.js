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
const authRoutes = require('./routes/auth');
const { protect, authorize } = require('./middleware/authMiddleware'); // Import new middleware
const User = require('./models/User'); // Import User model for seeding
console.log('Imported projectRoutes:', typeof projectRoutes, projectRoutes);

const app = express();
const PORT = process.env.PORT || 5000;

// --- Database Connection ---
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
// If RENDER_FRONTEND_URLS has a value, use it. Otherwise, allow all for local dev.
const corsOptions = {
  origin: process.env.RENDER_FRONTEND_URLS || "*",
  optionsSuccessStatus: 200,
  credentials: true, // This is important for sending cookies or authorization headers.
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type, Authorization'
};

app.use(cors(corsOptions));

// This is also important to handle preflight requests
app.options('*', cors(corsOptions));


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

// Public routes
app.use('/api/uploads', uploadRoutes);
app.use('/api/auth', authRoutes);


// --- Start Server ---
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

