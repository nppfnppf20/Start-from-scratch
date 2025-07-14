const mongoose = require('mongoose');
const { Schema } = mongoose;

// Schema for line items within a quote
const LineItemSchema = new Schema({
    item: {
        type: String,
        required: [true, 'Line item type/category is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Line item description is required'],
        trim: true
    },
    cost: {
        type: Number,
        required: [true, 'Line item cost is required'],
        min: [0, 'Cost cannot be negative']
    }
}, { _id: false }); // Don't create separate _id for line items

const QuoteSchema = new Schema({
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project', // Reference to the Project model
        required: [true, 'Project ID is required'],
        index: true // Index for faster lookups by project
    },
    surveyor: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    discipline: {
        type: String,
        required: [true, 'Discipline is required'],
        trim: true
    },
    organisation: {
        type: String,
        required: [true, 'Organisation is required'],
        trim: true
    },
    contactName: {
        type: String,
        required: [true, 'Contact name is required'],
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
        // Add validation (match: /regex/) if needed
    },
    lineItems: {
        type: [LineItemSchema],
        validate: [v => Array.isArray(v) && v.length > 0, 'At least one line item is required']
        // default: [] // Not needed if validation requires > 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
        // This will be calculated before saving
    },
    instructionStatus: {
        type: String,
        required: [true, 'Instruction status is required'],
        enum: ['pending', 'will not be instructed', 'partially instructed', 'instructed'],
        default: 'pending'
    },
    partiallyInstructedTotal: {
        type: Number,
        min: 0,
        // Only relevant if instructionStatus is 'partially instructed'
        // Make validation conditional
        validate: {
            validator: function(v) {
                // Only require if status is 'partially instructed'
                return this.instructionStatus !== 'partially instructed' || typeof v === 'number';
            },
            message: 'Partially instructed total is required when status is partially instructed'
        }
    },
    additionalNotes: {
        type: String,
        trim: true
    },
    status: { // Internal status (optional) - might relate to draft/sent/accepted/rejected
        type: String,
        trim: true
    },
    date: { // Optional quote date
        type: Date
    }
}, {
    timestamps: true // Add createdAt, updatedAt
});

// Middleware to calculate total before saving/validating
QuoteSchema.pre('validate', function(next) {
    if (this.lineItems && this.lineItems.length > 0) {
        this.total = this.lineItems.reduce((sum, item) => sum + (item.cost || 0), 0);
    } else {
        this.total = 0; // Ensure total is 0 if no line items (though validation prevents this case)
    }

    // Clear partiallyInstructedTotal if status is not 'partially instructed'
    if (this.instructionStatus !== 'partially instructed') {
        this.partiallyInstructedTotal = undefined;
    } else if (this.instructionStatus === 'partially instructed' && typeof this.partiallyInstructedTotal !== 'number') {
        // If status IS partial, but total isn't set, maybe default it or handle differently?
        // For now, the validation above will catch this. Could set a default:
        // this.partiallyInstructedTotal = this.partiallyInstructedTotal ?? 0;
    }
    next();
});


module.exports = mongoose.model('Quote', QuoteSchema); 