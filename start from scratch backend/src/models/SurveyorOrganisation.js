const mongoose = require('mongoose');

// A sub-schema for individual contacts.
// By setting _id: false, we prevent Mongoose from creating a separate ID for each contact.
const ContactSchema = new mongoose.Schema({
  contactName: { 
    type: String, 
    trim: true 
  },
  email: { 
    type: String, 
    lowercase: true, 
    trim: true,
    // Note: We don't enforce uniqueness here, as different organisations might have a contact with the same email.
  },
  phoneNumber: { 
    type: String, 
    trim: true 
  }
}, { _id: false });

const SurveyorOrganisationSchema = new mongoose.Schema({
  organisation: {
    type: String,
    required: [true, 'Organisation name is required'],
    unique: true, // The organisation name is now the unique identifier.
    trim: true,
  },
  contacts: [ContactSchema], // This is now an array of contact objects.
  
  // --- Aggregate Data Fields (Unchanged) ---
  projectCount: {
    type: Number,
    default: 0,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  totalQuality: { type: Number, default: 0 },
  totalResponsiveness: { type: Number, default: 0 },
  totalDeliveredOnTime: { type: Number, default: 0 },
  totalOverallReview: { type: Number, default: 0 },
}, {
  // We've added timestamps to automatically track when a record is created or updated.
  timestamps: true 
});

// --- Virtual Properties for Averages (Unchanged) ---
// These will continue to work perfectly.
SurveyorOrganisationSchema.virtual('averageQuality').get(function() {
  return this.reviewCount > 0 ? (this.totalQuality / this.reviewCount).toFixed(1) : 0;
});
SurveyorOrganisationSchema.virtual('averageResponsiveness').get(function() {
  return this.reviewCount > 0 ? (this.totalResponsiveness / this.reviewCount).toFixed(1) : 0;
});
SurveyorOrganisationSchema.virtual('averageDeliveredOnTime').get(function() {
  return this.reviewCount > 0 ? (this.totalDeliveredOnTime / this.reviewCount).toFixed(1) : 0;
});
SurveyorOrganisationSchema.virtual('averageOverallReview').get(function() {
  return this.reviewCount > 0 ? (this.totalOverallReview / this.reviewCount).toFixed(1) : 0;
});

// Ensure virtual properties are included in the JSON output.
SurveyorOrganisationSchema.set('toJSON', { virtuals: true });
SurveyorOrganisationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SurveyorOrganisation', SurveyorOrganisationSchema);