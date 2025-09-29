const mongoose = require('mongoose');
const { Schema } = mongoose;

const FeeQuoteLogSchema = new Schema({
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Project ID is required'],
        index: true // Index for faster lookups by project
    },
    emails: {
        type: [String],
        required: [true, 'At least one email is required'],
        validate: {
            validator: function(v) {
                return Array.isArray(v) && v.length > 0;
            },
            message: 'At least one email address must be provided'
        }
    },
    sentDate: {
        type: Date,
        required: [true, 'Sent date is required'],
        default: Date.now
    }
}, {
    timestamps: true // Automatically add createdAt and updatedAt fields
});

// Index for efficient queries
FeeQuoteLogSchema.index({ projectId: 1, sentDate: -1 });

// Optional: Add validation to ensure emails are valid format
FeeQuoteLogSchema.path('emails').validate(function(emails) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emails.every(email => emailRegex.test(email.trim()));
}, 'All emails must be valid email addresses');

module.exports = mongoose.model('FeeQuoteLog', FeeQuoteLogSchema);