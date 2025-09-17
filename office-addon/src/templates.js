/**
 * Template Definitions for Word Document Population
 * Maps project data to Word document elements
 */

class TemplateManager {
    constructor() {
        this.templates = {
            'project-summary': {
                name: 'Project Summary',
                description: 'Basic project information and overview',
                populate: this.populateProjectSummary.bind(this)
            },
            'surveyor-brief': {
                name: 'Surveyor Brief',
                description: 'Detailed information for surveyors',
                populate: this.populateSurveyorBrief.bind(this)
            },
            'technical-spec': {
                name: 'Technical Specification',
                description: 'Technical project specifications',
                populate: this.populateTechnicalSpec.bind(this)
            }
        };
    }

    /**
     * Get available templates
     */
    getTemplates() {
        return Object.keys(this.templates).map(key => ({
            id: key,
            ...this.templates[key]
        }));
    }

    /**
     * Populate document with selected template
     */
    async populateDocument(templateId, projectData) {
        const template = this.templates[templateId];
        if (!template) {
            throw new Error(`Template ${templateId} not found`);
        }

        return template.populate(projectData);
    }

    /**
     * Project Summary Template
     */
    async populateProjectSummary(project) {
        return Word.run(async (context) => {
            const doc = context.document;
            
            // Clear existing content
            doc.body.clear();
            
            // Add title
            const title = doc.body.insertParagraph(`PROJECT SUMMARY: ${project.name}`, Word.InsertLocation.start);
            title.styleBuiltIn = Word.Style.title;
            
            // Add basic information
            const basicInfo = [
                `Client: ${project.client || 'Not specified'}`,
                `Project Type: ${project.projectType || 'Not specified'}`,
                `Address: ${project.address || 'Not specified'}`,
                `Area: ${project.area ? `${project.area} hectares` : 'Not specified'}`,
                `Local Planning Authority: ${project.localPlanningAuthority || 'Not specified'}`
            ];
            
            const basicSection = doc.body.insertParagraph('BASIC INFORMATION', Word.InsertLocation.end);
            basicSection.styleBuiltIn = Word.Style.heading1;
            
            basicInfo.forEach(info => {
                doc.body.insertParagraph(info, Word.InsertLocation.end);
            });
            
            // Add project description if available
            if (project.detailedDescription) {
                const descSection = doc.body.insertParagraph('PROJECT DESCRIPTION', Word.InsertLocation.end);
                descSection.styleBuiltIn = Word.Style.heading1;
                doc.body.insertParagraph(project.detailedDescription, Word.InsertLocation.end);
            }
            
            // Add team information
            if (project.projectLead || project.projectManager || project.teamMembers) {
                const teamSection = doc.body.insertParagraph('PROJECT TEAM', Word.InsertLocation.end);
                teamSection.styleBuiltIn = Word.Style.heading1;
                
                if (project.projectLead && project.projectLead.length > 0) {
                    doc.body.insertParagraph(`Project Lead: ${project.projectLead.join(', ')}`, Word.InsertLocation.end);
                }
                if (project.projectManager && project.projectManager.length > 0) {
                    doc.body.insertParagraph(`Project Manager: ${project.projectManager.join(', ')}`, Word.InsertLocation.end);
                }
                if (project.teamMembers && project.teamMembers.length > 0) {
                    doc.body.insertParagraph(`Team Members: ${project.teamMembers.join(', ')}`, Word.InsertLocation.end);
                }
            }
            
            await context.sync();
            return 'Project summary populated successfully';
        });
    }

    /**
     * Surveyor Brief Template
     */
    async populateSurveyorBrief(project) {
        return Word.run(async (context) => {
            const doc = context.document;
            
            // Clear existing content
            doc.body.clear();
            
            // Add title
            const title = doc.body.insertParagraph(`SURVEYOR BRIEF: ${project.name}`, Word.InsertLocation.start);
            title.styleBuiltIn = Word.Style.title;
            
            // Site Information
            const siteSection = doc.body.insertParagraph('SITE INFORMATION', Word.InsertLocation.end);
            siteSection.styleBuiltIn = Word.Style.heading1;
            
            const siteInfo = [
                `Address: ${project.address || 'Not specified'}`,
                `Area: ${project.area ? `${project.area} hectares` : 'Not specified'}`,
                `Site Designations: ${project.siteDesignations || 'Not specified'}`,
                `Local Planning Authority: ${project.localPlanningAuthority || 'Not specified'}`,
                `Distribution Network: ${project.distributionNetwork || 'Not specified'}`
            ];
            
            siteInfo.forEach(info => {
                doc.body.insertParagraph(info, Word.InsertLocation.end);
            });
            
            // Access Information
            const accessSection = doc.body.insertParagraph('ACCESS INFORMATION', Word.InsertLocation.end);
            accessSection.styleBuiltIn = Word.Style.heading1;
            
            const accessInfo = [
                `Access Arrangements: ${project.accessArrangements || 'Not specified'}`,
                `Access Contact: ${project.accessContact || 'Not specified'}`,
                `Parking Details: ${project.parkingDetails || 'Not specified'}`,
                `ATV Use Required: ${project.atvUse || 'Not specified'}`
            ];
            
            accessInfo.forEach(info => {
                doc.body.insertParagraph(info, Word.InsertLocation.end);
            });
            
            // Additional Notes
            if (project.additionalNotes) {
                const notesSection = doc.body.insertParagraph('ADDITIONAL NOTES', Word.InsertLocation.end);
                notesSection.styleBuiltIn = Word.Style.heading1;
                doc.body.insertParagraph(project.additionalNotes, Word.InsertLocation.end);
            }
            
            // Invoicing Details
            if (project.invoicingDetails) {
                const invoiceSection = doc.body.insertParagraph('INVOICING DETAILS', Word.InsertLocation.end);
                invoiceSection.styleBuiltIn = Word.Style.heading1;
                doc.body.insertParagraph(project.invoicingDetails, Word.InsertLocation.end);
            }
            
            await context.sync();
            return 'Surveyor brief populated successfully';
        });
    }

    /**
     * Technical Specification Template
     */
    async populateTechnicalSpec(project) {
        return Word.run(async (context) => {
            const doc = context.document;
            
            // Clear existing content
            doc.body.clear();
            
            // Add title
            const title = doc.body.insertParagraph(`TECHNICAL SPECIFICATION: ${project.name}`, Word.InsertLocation.start);
            title.styleBuiltIn = Word.Style.title;
            
            // Project Overview
            const overviewSection = doc.body.insertParagraph('PROJECT OVERVIEW', Word.InsertLocation.end);
            overviewSection.styleBuiltIn = Word.Style.heading1;
            
            const overview = [
                `Project Type: ${project.projectType || 'Not specified'}`,
                `Proposed Use Duration: ${project.proposedUseDuration ? `${project.proposedUseDuration} years` : 'Not specified'}`,
                `Site Area: ${project.area ? `${project.area} hectares` : 'Not specified'}`
            ];
            
            overview.forEach(info => {
                doc.body.insertParagraph(info, Word.InsertLocation.end);
            });
            
            // Solar Specifications (if applicable)
            if (project.projectType === 'solar' || project.projectType === 'solarBess') {
                const solarSection = doc.body.insertParagraph('SOLAR SPECIFICATIONS', Word.InsertLocation.end);
                solarSection.styleBuiltIn = Word.Style.heading1;
                
                const solarSpecs = [
                    `Export Capacity: ${project.solarExportCapacity ? `${project.solarExportCapacity} MW` : 'Not specified'}`,
                    `Number of Panels: ${project.numberOfSolarPanels || 'Not specified'}`,
                    `Maximum Panel Height: ${project.pvMaxPanelHeight ? `${project.pvMaxPanelHeight}m` : 'Not specified'}`,
                    `Clearance from Ground: ${project.pvClearanceFromGround ? `${project.pvClearanceFromGround}m` : 'Not specified'}`,
                    `Panel Tilt: ${project.panelTilt ? `${project.panelTilt}°` : 'Not specified'}`,
                    `Panel Tilt Direction: ${project.panelTiltDirection || 'Not specified'}`,
                    `Fence Height: ${project.fenceHeight ? `${project.fenceHeight}m` : 'Not specified'}`
                ];
                
                solarSpecs.forEach(spec => {
                    doc.body.insertParagraph(spec, Word.InsertLocation.end);
                });
            }
            
            // BESS Specifications (if applicable)
            if (project.projectType === 'bess' || project.projectType === 'solarBess') {
                const bessSection = doc.body.insertParagraph('BATTERY ENERGY STORAGE SPECIFICATIONS', Word.InsertLocation.end);
                bessSection.styleBuiltIn = Word.Style.heading1;
                
                const bessSpecs = [
                    `Export Capacity: ${project.bessExportCapacity ? `${project.bessExportCapacity} MW` : 'Not specified'}`,
                    `Number of Containers: ${project.bessContainers || 'Not specified'}`
                ];
                
                bessSpecs.forEach(spec => {
                    doc.body.insertParagraph(spec, Word.InsertLocation.end);
                });
            }
            
            // Project Metrics
            if (project.gwhPerYear || project.homesPowered || project.co2Offset || project.equivalentCars) {
                const metricsSection = doc.body.insertParagraph('PROJECT METRICS', Word.InsertLocation.end);
                metricsSection.styleBuiltIn = Word.Style.heading1;
                
                const metrics = [
                    project.gwhPerYear ? `Energy Generation: ${project.gwhPerYear} GWh per year` : null,
                    project.homesPowered ? `Homes Powered: ${project.homesPowered}` : null,
                    project.co2Offset ? `CO2 Offset: ${project.co2Offset} tonnes per year` : null,
                    project.equivalentCars ? `Equivalent Cars Removed: ${project.equivalentCars}` : null
                ].filter(Boolean);
                
                metrics.forEach(metric => {
                    doc.body.insertParagraph(metric, Word.InsertLocation.end);
                });
            }
            
            await context.sync();
            return 'Technical specification populated successfully';
        });
    }
}

// Create global instance
window.templateManager = new TemplateManager();
