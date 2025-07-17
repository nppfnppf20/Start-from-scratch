const mongoose = require('mongoose');

const PendingSurveyorSchema = new mongoose.Schema({
  organisation: {
    type: String,
    required: [true, 'Organisation name is required'],
    trim: true,
  },
  discipline: {
    type: String,
    required: [true, 'Discipline is required'],
    trim: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'merged', 'rejected'],
    default: 'pending'
  },
  sourceQuoteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote',
    required: [true, 'Source quote ID is required']
  },
  // Optional: Store additional context from the original quote
  sourceQuoteData: {
    contactName: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phoneNumber: { type: String, trim: true }
  }
}, {
  timestamps: true 
});

// Compound index to prevent duplicate pending entries for the same organisation+discipline
PendingSurveyorSchema.index(
  { organisation: 1, discipline: 1 }, 
  { 
    unique: true,
    collation: { locale: 'en', strength: 2 } // Case-insensitive comparison
  }
);

// Index on status for efficient querying of pending items
PendingSurveyorSchema.index({ status: 1 });

module.exports = mongoose.model('PendingSurveyor', PendingSurveyorSchema); 