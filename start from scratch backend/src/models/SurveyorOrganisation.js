const mongoose = require('mongoose');

// The Contact sub-schema remains unchanged.
const ContactSchema = new mongoose.Schema({
  contactName: { type: String, trim: true },
  email: { type: String, lowercase: true, trim: true },
  phoneNumber: { type: String, trim: true }
}, { _id: false });

const SurveyorOrganisationSchema = new mongoose.Schema({
  organisation: {
    type: String,
    required: [true, 'Organisation name is required'],
    trim: true,
  },
  // --- NEW FIELD ---
  // We are adding discipline as a required field.
  discipline: {
    type: String,
    required: [true, 'Discipline is required'],
    trim: true,
  },
  location: {
    type: String,
    trim: true,
    default: ''
  },
  contacts: [ContactSchema],
  
  // --- Aggregate Data Fields ---
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
  timestamps: true 
});

// --- NEW COMPOUND INDEX ---
// This is crucial. It tells MongoDB that the combination of 'organisation' 
// and 'discipline' must be unique. This prevents us from ever creating
// two "Tyler Grange Landscape" records by mistake.
// Using case-insensitive collation to match our validation logic
SurveyorOrganisationSchema.index(
  { organisation: 1, discipline: 1 }, 
  { 
    unique: true,
    collation: { locale: 'en', strength: 2 } // Case-insensitive comparison
  }
);


// --- Virtual Properties for Averages (Unchanged) ---
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

// Ensure virtuals are included in JSON output (Unchanged)
SurveyorOrganisationSchema.set('toJSON', { virtuals: true });
SurveyorOrganisationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SurveyorOrganisation', SurveyorOrganisationSchema);