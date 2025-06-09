// File: models/ProgrammeEvent.js

const mongoose = require('mongoose');

// Define the structure of a ProgrammeEvent document in MongoDB
const programmeEventSchema = new mongoose.Schema({
  // Link to the project this event belongs to
  projectId: {
    type: String, // Using String for simplicity, assuming project IDs are strings.
                  // Change to mongoose.Schema.Types.ObjectId if your project IDs are MongoDB ObjectIds.
    required: [true, 'A project ID is required for a programme event.'], // Make it mandatory
    index: true, // Add an index for faster lookups based on projectId
  },
  // The text description of the key date
  title: {
    type: String,
    required: [true, 'A title is required for a programme event.'],
    trim: true, // Remove leading/trailing whitespace
  },
  // The date of the event. Storing as a Date object is best practice in MongoDB.
  date: {
    type: Date,
    required: [true, 'A date is required for a programme event.'],
  },
  // The color associated with the event in the timeline
  color: {
    type: String,
    required: [true, 'A color is required for a programme event.'],
    default: '#007bff', // Provide a default color if none is specified
  },
  // Optional: Add timestamps to automatically track creation and update times
  // timestamps: true,
});

// Optional but recommended: Modify the JSON output when sending data back to the frontend
// This transforms the MongoDB '_id' field into a more standard 'id' string
programmeEventSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString(); // Convert ObjectId to string
        delete returnedObject._id; // Remove the original '_id'
        delete returnedObject.__v; // Remove the version key '__v'
    }
});


// Create the Mongoose model based on the schema
const ProgrammeEvent = mongoose.model('ProgrammeEvent', programmeEventSchema);

// Export the model so it can be used in other parts of your backend (like controllers)
module.exports = ProgrammeEvent;