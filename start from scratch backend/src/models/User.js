const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: function() { return this.role !== 'client'; }
    },
    name: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['admin', 'surveyor', 'client'],
        default: 'surveyor'
    },
    clientOrganisation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClientOrganisation'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', UserSchema); 