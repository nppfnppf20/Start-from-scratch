const express = require('express');
const router = express.Router();
const SurveyorOrganisation = require('../models/SurveyorOrganisation');

// Middleware to check import API key
const checkImportKey = (req, res, next) => {
  const apiKey = req.headers['x-import-key'];
  const validKey = process.env.IMPORT_API_KEY;
  
  if (!validKey) {
    return res.status(500).json({ msg: 'Import API key not configured' });
  }
  
  if (apiKey !== validKey) {
    return res.status(401).json({ msg: 'Invalid import API key' });
  }
  
  next();
};

// @route   POST /api/import-surveyors
// @desc    Bulk import surveyor organisations (for one-time data migration)
// @access  Requires import API key
router.post('/', checkImportKey, async (req, res) => {
    const { organisations } = req.body;
    
    if (!organisations || !Array.isArray(organisations)) {
        return res.status(400).json({ msg: 'organisations array required' });
    }
    
    const results = {
        success: [],
        errors: [],
        skipped: []
    };
    
    try {
        for (const org of organisations) {
            try {
                // Check if already exists
                const existingOrg = await SurveyorOrganisation.findOne({ 
                    organisation: org.organisation,
                    discipline: org.discipline
                }).collation({ locale: 'en', strength: 2 });
                
                if (existingOrg) {
                    results.skipped.push({
                        org: `${org.organisation} - ${org.discipline}`,
                        reason: 'Already exists'
                    });
                    continue;
                }
                
                // Create new organisation
                const newOrganisation = new SurveyorOrganisation({
                    organisation: org.organisation,
                    discipline: org.discipline,
                    location: org.location || '',
                    notes: org.notes || '',
                    contacts: org.contacts || [],
                    projectCount: org.projectCount || 0,
                    reviewCount: org.reviewCount || 0,
                    totalQuality: org.totalQuality || 0,
                    totalResponsiveness: org.totalResponsiveness || 0,
                    totalDeliveredOnTime: org.totalDeliveredOnTime || 0,
                    totalOverallReview: org.totalOverallReview || 0
                });
                
                await newOrganisation.save();

                // Note: User accounts are NOT created during import.
                // When contacts log in with Auth0, the authMiddleware will automatically
                // create User records if their email is found in SurveyorOrganisation contacts.

                results.success.push(`${org.organisation} - ${org.discipline}`);
                
            } catch (orgErr) {
                results.errors.push({
                    org: `${org.organisation} - ${org.discipline}`,
                    error: orgErr.message
                });
            }
        }
        
        res.json({
            msg: 'Bulk import completed',
            summary: {
                total: organisations.length,
                success: results.success.length,
                errors: results.errors.length,
                skipped: results.skipped.length
            },
            details: results
        });
        
    } catch (err) {
        console.error('Bulk import error:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

module.exports = router;

