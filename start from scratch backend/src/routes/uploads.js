const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose'); // Needed for ObjectId validation

// --- Import the Document model ---
const Document = require('../models/Document');

// Define storage destination and filename
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure the uploads directory exists (relative to this file's location)
        const uploadDir = path.join(__dirname, '..', '..', 'uploads'); 
        fs.mkdirSync(uploadDir, { recursive: true }); 
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create a unique filename: timestamp-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Keep extension
        const ext = path.extname(file.originalname);
        // Sanitize originalname slightly (replace spaces, etc. - basic example)
        const safeOriginalName = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
        cb(null, uniqueSuffix + '-' + safeOriginalName);
    }
});

// Configure Multer middleware
// We expect a single file field named 'file'
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Optional: Limit file size (e.g., 10MB)
}).single('file'); // Key 'file' must match the FormData key from frontend

// POST /api/uploads
// Handles the file upload and saves metadata to DB
router.post('/', (req, res) => {
    upload(req, res, async function (err) { // Make the callback async
        if (err instanceof multer.MulterError) {
            console.error('Multer error:', err);
            return res.status(400).json({ msg: `File upload error: ${err.message}` });
        } else if (err) {
            console.error('Unknown upload error:', err);
            return res.status(500).json({ msg: 'File upload error (Unknown)', error: err.message });
        }

        // --- File successfully uploaded by multer, req.file is available ---
        if (!req.file) {
            return res.status(400).json({ msg: 'No file was included in the request.' });
        }

        // --- Extract metadata from request body (sent via FormData) ---
        const { projectId, name, category } = req.body;

        // --- Basic Validation ---
        if (!projectId || !name || !category) {
            // If validation fails, we should ideally delete the orphaned file
            // fs.unlink(req.file.path, (unlinkErr) => {
            //     if (unlinkErr) console.error("Error deleting orphaned file:", unlinkErr);
            // });
            return res.status(400).json({ msg: 'Missing required fields: projectId, name, or category.' });
        }
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            // fs.unlink(req.file.path, ...); // Delete orphaned file
            return res.status(400).json({ msg: 'Invalid Project ID format.' });
        }
        // Add more validation for name/category if needed


        // --- Prepare data for saving to Document model ---
        const fileUrl = `/uploads/${req.file.filename}`; // Path for frontend access

        const newDocument = new Document({
            projectId: projectId,
            name: name, // User-provided name
            category: category, // User-selected category
            originalFilename: req.file.originalname, // Original name from upload
            serverFilename: req.file.filename, // Unique name saved on server
            url: fileUrl, // Access path
            mimetype: req.file.mimetype,
            size: req.file.size,
            // uploadDate, createdAt, updatedAt are handled by defaults/timestamps
        });

        try {
            // --- Save the document metadata to MongoDB ---
            const savedDocument = await newDocument.save();

            console.log('Document metadata saved:', savedDocument);

            // --- Send successful response back to frontend ---
            // Include the saved document details (especially ID and URL)
            res.status(201).json({ // 201 Created status
                message: 'File uploaded and metadata saved successfully',
                document: savedDocument // Send the full saved document object
            });

        } catch (dbError) {
            console.error('Database error saving document:', dbError);
            // Attempt to delete the uploaded file if DB save fails
            // fs.unlink(req.file.path, (unlinkErr) => {
            //    if (unlinkErr) console.error("Error deleting file after DB error:", unlinkErr);
            // });
            if (dbError.name === 'ValidationError') {
                 return res.status(400).json({ msg: 'Validation Error saving document', errors: dbError.errors });
            }
            res.status(500).json({ msg: 'Database error saving document metadata.' });
        }
    });
});

module.exports = router;