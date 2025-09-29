const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  contactName: { type: String, trim: true, required: true },
  email: { type: String, lowercase: true, trim: true },
  phoneNumber: { type: String, trim: true }
}, { _id: false });

const ClientOrganisationSchema = new mongoose.Schema({
  organisationName: {
    type: String,
    required: [true, 'Organisation name is required'],
    trim: true,
    unique: true
  },
  contacts: [ContactSchema],
  // We can add more fields here later, such as associated projects or users
}, {
  timestamps: true 
});

module.exports = mongoose.model('ClientOrganisation', ClientOrganisationSchema); 