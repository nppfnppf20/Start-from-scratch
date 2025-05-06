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
  } catch (err) {
    // +++ Add more specific error message +++
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};
connectDB();

// Enable CORS for all origins
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

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

// --- Start Server ---
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));