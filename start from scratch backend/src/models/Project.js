const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Project name is required'],
        trim: true
    },
    client: { // Umbrella term from modal
        type: String,
        trim: true
    },
    teamMembers: { // Initials from modal
        type: [String],
        default: []
    },
    clientOrSpvName: { // Specific name from main form
        type: String,
        trim: true
    },
    detailedDescription: {
        type: String,
        trim: true
    },
    proposedUseDuration: {
        type: Number
    },
    projectType: {
        type: String,
        enum: ['solar', 'bess', 'solarBess', 'other', null], // Allow null or specific values
    },
    address: {
        type: String,
        trim: true
    },
    area: {
        type: Number
    },
    localPlanningAuthority: {
        type: String,
        trim: true
    },
    distributionNetwork: {
        type: String,
        trim: true
    },
    siteDesignations: {
        type: String,
        trim: true
    },
    // --- Equipment Specification (Solar) ---
    solarExportCapacity: { type: Number },
    pvMaxPanelHeight: { type: Number },
    fenceHeight: { type: Number },
    pvClearanceFromGround: { type: Number },
    numberOfSolarPanels: { type: Number },
    panelTilt: { type: Number },
    panelTiltDirection: { type: String, trim: true },
    // --- Equipment Specification (BESS) ---
    bessExportCapacity: { type: Number },
    bessContainers: { type: Number },
    // --- Project Metrics ---
    gwhPerYear: { type: Number },
    homesPowered: { type: Number },
    co2Offset: { type: Number },
    equivalentCars: { type: Number },
    // --- Information for Surveyors ---
    accessArrangements: { type: String, trim: true },
    accessContact: { type: String, trim: true },
    parkingDetails: { type: String, trim: true },
    atvUse: { type: String, enum: ['yes', 'no', null] },
    additionalNotes: { type: String, trim: true },
    invoicingDetails: { type: String, trim: true },
    // --- SharePoint Document Link ---
    sharepointLink: { type: String, trim: true },
    // --- NEW FIELD for Surveyor Permissions ---
    authorizedSurveyors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true // Automatically add createdAt and updatedAt fields
});

module.exports = mongoose.model('Project', ProjectSchema);
