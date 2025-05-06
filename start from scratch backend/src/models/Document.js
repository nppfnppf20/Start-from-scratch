const mongoose = require('mongoose');
const { Schema } = mongoose;

const DocumentSchema = new Schema({
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project', // Link to the Project model
        required: [true, 'Project ID is required'],
        index: true // Index for faster querying by project
    },
    name: { // User-defined name for the document
        type: String,
        required: [true, 'Document name is required'],
        trim: true
    },
    category: { // User-selected category
        type: String,
        enum: ['Drawing', 'Surveyor Report', 'Other'], // Ensure valid category
        required: [true, 'Document category is required'],
        trim: true
    },
    originalFilename: { // Original name of the file uploaded by the user
        type: String,
        required: true,
        trim: true
    },
    serverFilename: { // The unique filename stored on the server (e.g., timestamp-originalname)
        type: String,
        required: true,
        unique: true, // Ensure server filenames are unique
        trim: true
    },
    url: { // The relative path/URL to access the file
        type: String,
        required: true,
        trim: true
    },
    mimetype: { // File type (e.g., 'application/pdf', 'image/jpeg')
        type: String,
        required: true,
        trim: true
    },
    size: { // File size in bytes
        type: Number,
        required: true
    },
    uploadDate: { // When the document was uploaded/record created
        type: Date,
        default: Date.now
    }
    // Add any other fields you might need later, e.g., uploadedBy (if you have users)
}, {
    timestamps: true // Automatically add createdAt and updatedAt fields
});

module.exports = mongoose.model('Document', DocumentSchema);