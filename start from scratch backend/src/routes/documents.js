const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Document = require('../models/Document'); // Import the Document model
const fs = require('fs');
const path = require('path');

// @route   GET /api/documents
// @desc    Get all documents filtered by projectId
// @access  Public (adjust as needed)
router.get('/', async (req, res) => {
    const { projectId } = req.query;

    // --- Validation ---
    if (!projectId) {
        return res.status(400).json({ msg: 'Project ID query parameter is required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ msg: 'Invalid Project ID format.' });
    }

    try {
        // --- Query Database ---
        // Find documents matching the projectId, sort by uploadDate descending (newest first)
        const documents = await Document.find({ projectId: projectId }).sort({ uploadDate: -1 });

        // --- Send Response ---
        // Check if documents were found (though find returns [] if none)
        // if (!documents || documents.length === 0) {
        //     return res.status(404).json({ msg: 'No documents found for this project.' });
        // }
        // Always return JSON, even if it's an empty array
        res.status(200).json(documents);

    } catch (err) {
        // --- Error Handling ---
        console.error('Error fetching documents:', err.message);
        res.status(500).send('Server Error');
    }
});

// ... existing code ...
// const Document = require('../models/Document');
// router.get('/', async (req, res) => { ... });

// --- ADD THIS NEW ROUTE HANDLER ---
// @route   DELETE /api/documents/:id
// @desc    Delete a document by its ID (from DB and filesystem)
// @access  Public (adjust as needed)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    // --- Validate ID ---
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: 'Invalid Document ID format.' });
    }

    try {
        // --- Find the document by ID ---
        const document = await Document.findById(id);

        if (!document) {
            return res.status(404).json({ msg: 'Document not found.' });
        }

        // --- Delete the file from the filesystem ---
        // Construct the full path to the file.
        // Assumes 'uploads' directory is at the root of the backend project.
        const filePath = path.join(__dirname, '..', '..', 'uploads', document.serverFilename); 
                                // Adjust path if 'uploads' is elsewhere relative to this file
        
        fs.unlink(filePath, async (err) => {
            if (err) {
                // Log the error but proceed to delete DB record if file not found,
                // as the primary goal is to remove the DB reference.
                // If err.code === 'ENOENT', file doesn't exist, which is fine for DB deletion.
                console.warn(`Failed to delete file from filesystem: ${filePath}. Error: ${err.message}. Proceeding with DB deletion.`);
            } else {
                console.log(`Successfully deleted file: ${filePath}`);
            }

            // --- Delete the document from the database ---
            // Even if file deletion had an issue (e.g., file already gone), try to remove DB record.
            try {
                await Document.findByIdAndDelete(id);
                res.status(200).json({ msg: 'Document deleted successfully (DB record and attempted file deletion).' });
            } catch (dbDeleteError) {
                console.error('Error deleting document from DB after file operation:', dbDeleteError);
                // If file was deleted but DB op failed, this is an inconsistency.
                // For now, send server error. More complex recovery logic could be added.
                res.status(500).json({ msg: 'Error deleting document from database.' });
            }
        });

    } catch (findError) {
        // --- Error Handling for finding the document ---
        console.error('Error finding document to delete:', findError);
        res.status(500).send('Server Error while finding document.');
    }
});
// --- END OF NEW ROUTE HANDLER ---

module.exports = router;
