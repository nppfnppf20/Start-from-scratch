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
    role: {
        type: String,
        enum: ['admin', 'surveyor'],
        default: 'surveyor'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', UserSchema); 