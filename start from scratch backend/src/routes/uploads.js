const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define storage destination and filename
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure the uploads directory exists
        const uploadDir = path.join(__dirname, '../../uploads'); // Relative to src/routes
        fs.mkdirSync(uploadDir, { recursive: true }); // Create if it doesn't exist
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create a unique filename: timestamp-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

// Configure Multer with storage options
// We expect a single file field named 'file' (matching the frontend FormData)
const upload = multer({ storage: storage }).single('file');

// POST /api/uploads
// Handles the file upload
router.post('/', (req, res) => {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            console.error('Multer error:', err);
            return res.status(500).json({ msg: 'File upload error (Multer)', error: err.message });
        } else if (err) {
            // An unknown error occurred when uploading.
            console.error('Unknown upload error:', err);
            return res.status(500).json({ msg: 'File upload error (Unknown)', error: err.message });
        }

        // Everything went fine. File is in req.file
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded.' });
        }

        // Construct the URL path for the frontend to use
        // This assumes the /uploads directory is served statically at the root
        const fileUrl = `/uploads/${req.file.filename}`;

        // Send back file info and the generated URL
        // The frontend will use this info to dispatch 'uploadComplete'
        res.status(200).json({
            message: 'File uploaded successfully',
            fileName: req.file.filename, // The unique filename on the server
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            url: fileUrl // The crucial part for the frontend
        });
    });
});

module.exports = router;