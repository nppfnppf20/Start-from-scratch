const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for a contact person
const ContactSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String
    },
    phoneNumber: {
        type: String
    }
}, { _id: false }); // Do not create a separate _id for contacts

// Define the main Client schema
const ClientSchema = new Schema({
    organisation: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    industry: {
        type: String,
        required: true,
        trim: true
    },
    contacts: [ContactSchema]
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

module.exports = mongoose.model('Client', ClientSchema); 