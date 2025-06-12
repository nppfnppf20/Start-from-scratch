const mongoose = require('mongoose');
const { Schema } = mongoose;

// --- Subdocument Schemas ---

const UploadedWorkSchema = new Schema({
    fileName: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    version: { type: String, required: true, trim: true },
    dateUploaded: { type: Date, required: true, default: Date.now },
    description: { type: String, trim: true },
    url: { type: String, trim: true } // Placeholder for actual file URL/path
}, { _id: true }); // Keep _id for potential individual manipulation later

const CustomDateSchema = new Schema({
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true }
}, { _id: true }); // Keep _id

// --- Main InstructionLog Schema ---

const InstructionLogSchema = new Schema({
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
        index: true
    },
    quoteId: {
        type: Schema.Types.ObjectId,
        ref: 'Quote',
        required: true,
        unique: true, // Ensure only one log per quote
        index: true
    },
    // Operational Fields (from old SurveyorReview)
    workStatus: {
        type: String,
        enum: ['not started', 'in progress', 'completed', 'Under TRP Review', 'Under Client Review'],
        default: 'not started'
    },
    siteVisitDate: { type: Date },
    reportDraftDate: { type: Date },
    operationalNotes: { // Renamed from notes? Keep separate from feedback notes.
        type: String,
        trim: true
    },
    uploadedWorks: {
        type: [UploadedWorkSchema],
        default: []
    },
    customDates: {
        type: [CustomDateSchema],
        default: []
    }
    // Exclude feedback fields: quality, responsiveness, deliveredOnTime, overallReview, notes (review notes)
}, {
    timestamps: true // Add createdAt, updatedAt
});

// Ensure quoteId is unique to prevent duplicates
// InstructionLogSchema.index({ quoteId: 1 }, { unique: true }); // Already set unique: true on field

module.exports = mongoose.model('InstructionLog', InstructionLogSchema); 