const mongoose = require('mongoose');

const SurveyorFeedbackSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  quoteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote',
    required: [true, 'Quote ID is required'],
    unique: true // Ensure only one feedback entry per quote
  },
  quality: {
    type: Number,
    min: [1, 'Quality rating must be between 1 and 5'],
    max: [5, 'Quality rating must be between 1 and 5']
  },
  responsiveness: {
    type: Number,
    min: [1, 'Responsiveness rating must be between 1 and 5'],
    max: [5, 'Responsiveness rating must be between 1 and 5']
  },
  deliveredOnTime: {
    type: Number, 
    // Assuming 0 might mean 'Not Applicable' or very late? Range 0-5.
    min: [0, 'Delivered on Time rating must be between 0 and 5'], 
    max: [5, 'Delivered on Time rating must be between 0 and 5']
  },
  overallReview: {
    type: Number,
    required: [true, 'Overall review rating is required'],
    min: [1, 'Overall review rating must be between 1 and 5'],
    max: [5, 'Overall review rating must be between 1 and 5']
  },
  notes: { // Specific notes/comments for the review itself
    type: String,
    trim: true
  },
  reviewDate: {
    type: Date,
    default: Date.now // Automatically set when the review is created/saved
  }
}, { timestamps: true }); // Add createdAt and updatedAt timestamps automatically

module.exports = mongoose.model('SurveyorFeedback', SurveyorFeedbackSchema); 