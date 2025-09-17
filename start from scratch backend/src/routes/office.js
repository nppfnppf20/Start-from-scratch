const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const ClientOrganisation = require('../models/ClientOrganisation');

// @route   GET /api/office/projects
// @desc    Get all projects for Office plugin (project selection dropdown)
// @access  Internal only - no authentication required
router.get('/projects', async (req, res) => {
    try {
        // Get ALL projects - no filtering since this is internal only
        const projects = await Project.find({})
            .populate('client', 'organisationName')
            .select('name client projectType createdAt address')
            .sort({ createdAt: -1 });
            
        // Format for easy selection in Office plugin
        const formattedProjects = projects.map(project => ({
            id: project._id,
            name: project.name,
            client: project.client?.organisationName || 'No Client',
            projectType: project.projectType || 'Not specified',
            address: project.address || 'No address',
            createdAt: project.createdAt
        }));
            
        res.json({
            success: true,
            projects: formattedProjects,
            total: formattedProjects.length
        });
    } catch (err) {
        console.error('Error fetching projects for Office plugin:', err);
        res.status(500).json({ 
            success: false, 
            msg: 'Server error while fetching projects' 
        });
    }
});

// @route   GET /api/office/projects/:id/template-data
// @desc    Get comprehensive project data formatted for Word mail merge
// @access  Internal only - no authentication required
router.get('/projects/:id/template-data', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('client', 'organisationName contacts address phone email website')
            .populate('authorizedSurveyors', 'email')
            .populate('authorizedClients', 'email');
            
        if (!project) {
            return res.status(404).json({ 
                success: false, 
                msg: 'Project not found' 
            });
        }
        
        // Format all data for Word template mail merge
        const templateData = {
            // === BASIC PROJECT INFORMATION ===
            projectName: project.name || '',
            projectId: project._id.toString(),
            clientName: project.client?.organisationName || '',
            projectLead: Array.isArray(project.projectLead) ? project.projectLead.join(', ') : (project.projectLead || ''),
            projectManager: Array.isArray(project.projectManager) ? project.projectManager.join(', ') : (project.projectManager || ''),
            teamMembers: Array.isArray(project.teamMembers) ? project.teamMembers.join(', ') : (project.teamMembers || ''),
            clientOrSpvName: project.clientOrSpvName || '',
            
            // === PROJECT DETAILS ===
            detailedDescription: project.detailedDescription || '',
            proposedUseDuration: project.proposedUseDuration || '',
            projectType: project.projectType || '',
            address: project.address || '',
            area: project.area || '',
            localPlanningAuthority: project.localPlanningAuthority || '',
            distributionNetwork: project.distributionNetwork || '',
            siteDesignations: project.siteDesignations || '',
            
            // === SOLAR SPECIFICATIONS ===
            solarExportCapacity: project.solarExportCapacity || '',
            pvMaxPanelHeight: project.pvMaxPanelHeight || '',
            fenceHeight: project.fenceHeight || '',
            pvClearanceFromGround: project.pvClearanceFromGround || '',
            numberOfSolarPanels: project.numberOfSolarPanels || '',
            panelTilt: project.panelTilt || '',
            panelTiltDirection: project.panelTiltDirection || '',
            
            // === BESS SPECIFICATIONS ===
            bessExportCapacity: project.bessExportCapacity || '',
            bessContainers: project.bessContainers || '',
            
            // === PROJECT METRICS ===
            gwhPerYear: project.gwhPerYear || '',
            homesPowered: project.homesPowered || '',
            co2Offset: project.co2Offset || '',
            equivalentCars: project.equivalentCars || '',
            
            // === SURVEYOR INFORMATION ===
            accessArrangements: project.accessArrangements || '',
            accessContact: project.accessContact || '',
            parkingDetails: project.parkingDetails || '',
            atvUse: project.atvUse || '',
            additionalNotes: project.additionalNotes || '',
            invoicingDetails: project.invoicingDetails || '',
            
            // === LINKS AND REFERENCES ===
            sharepointLink: project.sharepointLink || '',
            
            // === CLIENT ORGANISATION DETAILS ===
            clientAddress: project.client?.address || '',
            clientPhone: project.client?.phone || '',
            clientEmail: project.client?.email || '',
            clientWebsite: project.client?.website || '',
            
            // === DATES ===
            projectCreatedDate: project.createdAt ? project.createdAt.toISOString().split('T')[0] : '',
            projectUpdatedDate: project.updatedAt ? project.updatedAt.toISOString().split('T')[0] : '',
            
            // === FORMATTED ARRAYS FOR TEMPLATES ===
            projectLeadList: Array.isArray(project.projectLead) ? project.projectLead : (project.projectLead ? [project.projectLead] : []),
            projectManagerList: Array.isArray(project.projectManager) ? project.projectManager : (project.projectManager ? [project.projectManager] : []),
            teamMembersList: Array.isArray(project.teamMembers) ? project.teamMembers : (project.teamMembers ? [project.teamMembers] : []),
            
            // === AUTHORIZATION INFO ===
            authorizedSurveyorEmails: project.authorizedSurveyors?.map(u => u.email) || [],
            authorizedClientEmails: project.authorizedClients?.map(u => u.email) || [],
            
            // === CLIENT CONTACTS (if available) ===
            clientContacts: project.client?.contacts || []
        };
        
        res.json({
            success: true,
            projectId: project._id,
            projectName: project.name,
            templateData: templateData,
            generatedAt: new Date().toISOString()
        });
        
    } catch (err) {
        console.error('Error fetching project template data:', err);
        res.status(500).json({ 
            success: false, 
            msg: 'Server error while fetching project data' 
        });
    }
});

// @route   GET /api/office/user
// @desc    Get basic system info for Office plugin
// @access  Internal only - no authentication required
router.get('/user', async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Office plugin API - no authentication required',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Error with user endpoint:', err);
        res.status(500).json({ 
            success: false, 
            msg: 'Server error' 
        });
    }
});

// @route   GET /api/office/health
// @desc    Health check endpoint for Office plugin
// @access  Public
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Office plugin API is running',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
