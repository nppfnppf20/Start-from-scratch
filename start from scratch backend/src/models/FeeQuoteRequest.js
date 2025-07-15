const mongoose = require('mongoose');

const feeQuoteRequestSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
        index: true
    },
    discipline: {
        type: String,
        required: true
    },
    organisation: {
        type: String,
        required: true
    },
    contactName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String
    },
    requestSentDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const FeeQuoteRequest = mongoose.model('FeeQuoteRequest', feeQuoteRequestSchema);

module.exports = FeeQuoteRequest; 