/**
 * Main Application Logic for Office Add-in
 * Handles UI interactions and coordinates API calls with Word document manipulation
 */

(function() {
    'use strict';

    let projects = [];
    let selectedProject = null;

    // DOM Elements
    let elements = {};

    Office.onReady(info => {
        if (info.host === Office.HostType.Word) {
            console.log('Office Add-in loaded in Word');
            initializeApp();
        }
    });

    /**
     * Initialize the application
     */
    function initializeApp() {
        // Cache DOM elements
        elements = {
            loading: document.getElementById('loading'),
            error: document.getElementById('error'),
            errorMessage: document.getElementById('error-message'),
            retryBtn: document.getElementById('retry-btn'),
            mainInterface: document.getElementById('main-interface'),
            projectSelect: document.getElementById('project-select'),
            projectInfo: document.getElementById('project-info'),
            projectName: document.getElementById('project-name'),
            projectClient: document.getElementById('project-client'),
            projectAddress: document.getElementById('project-address'),
            projectType: document.getElementById('project-type'),
            templateSection: document.getElementById('template-section'),
            templateSelect: document.getElementById('template-select'),
            fillDocumentBtn: document.getElementById('fill-document-btn'),
            status: document.getElementById('status'),
            statusMessage: document.getElementById('status-message')
        };

        // Attach event listeners
        attachEventListeners();

        // Load initial data
        loadProjects();
    }

    /**
     * Attach event listeners
     */
    function attachEventListeners() {
        elements.retryBtn.addEventListener('click', loadProjects);
        elements.projectSelect.addEventListener('change', onProjectChange);
        elements.templateSelect.addEventListener('change', onTemplateChange);
        elements.fillDocumentBtn.addEventListener('click', onFillDocument);
    }

    /**
     * Load projects from API
     */
    async function loadProjects() {
        try {
            showLoading();
            
            // Test API connection first
            const isConnected = await window.projectAPI.testConnection();
            if (!isConnected) {
                throw new Error('Cannot connect to API server. Please check your connection.');
            }

            projects = await window.projectAPI.getProjects();
            
            if (!projects || projects.length === 0) {
                throw new Error('No projects found');
            }

            populateProjectSelect(projects);
            showMainInterface();
            
        } catch (error) {
            console.error('Failed to load projects:', error);
            showError(error.message);
        }
    }

    /**
     * Populate project dropdown
     */
    function populateProjectSelect(projects) {
        // Clear existing options except the first one
        while (elements.projectSelect.children.length > 1) {
            elements.projectSelect.removeChild(elements.projectSelect.lastChild);
        }

        // Add project options
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            elements.projectSelect.appendChild(option);
        });
    }

    /**
     * Handle project selection change
     */
    async function onProjectChange() {
        const projectId = elements.projectSelect.value;
        
        if (!projectId) {
            hideProjectInfo();
            hideTemplateSection();
            return;
        }

        try {
            showStatus('Loading project details...');
            
            // Find project in local array first
            selectedProject = projects.find(p => p.id === projectId);
            
            // If not found or incomplete, fetch from API
            if (!selectedProject || !selectedProject.detailedDescription) {
                selectedProject = await window.projectAPI.getProject(projectId);
            }

            displayProjectInfo(selectedProject);
            showTemplateSection();
            hideStatus();
            
        } catch (error) {
            console.error('Failed to load project details:', error);
            showError(`Failed to load project details: ${error.message}`);
        }
    }

    /**
     * Display project information
     */
    function displayProjectInfo(project) {
        elements.projectName.textContent = project.name;
        elements.projectClient.textContent = project.client || 'Not specified';
        elements.projectAddress.textContent = project.address || 'Not specified';
        elements.projectType.textContent = formatProjectType(project.projectType);
        
        showProjectInfo();
    }

    /**
     * Format project type for display
     */
    function formatProjectType(type) {
        if (!type) return 'Not specified';
        
        const typeMap = {
            'solar': 'Solar',
            'bess': 'Battery Energy Storage System',
            'solarBess': 'Solar + Battery Energy Storage System',
            'other': 'Other'
        };
        
        return typeMap[type] || type;
    }

    /**
     * Handle template selection change
     */
    function onTemplateChange() {
        const templateId = elements.templateSelect.value;
        elements.fillDocumentBtn.disabled = !templateId;
    }

    /**
     * Handle fill document button click
     */
    async function onFillDocument() {
        const templateId = elements.templateSelect.value;
        
        if (!templateId || !selectedProject) {
            return;
        }

        try {
            elements.fillDocumentBtn.disabled = true;
            showStatus('Filling document...');

            const result = await window.templateManager.populateDocument(templateId, selectedProject);
            
            showStatus(result);
            
            // Re-enable button after a delay
            setTimeout(() => {
                elements.fillDocumentBtn.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('Failed to fill document:', error);
            showError(`Failed to fill document: ${error.message}`);
            elements.fillDocumentBtn.disabled = false;
        }
    }

    /**
     * UI State Management Functions
     */
    function showLoading() {
        hideAll();
        elements.loading.classList.remove('hidden');
    }

    function showError(message) {
        hideAll();
        elements.errorMessage.textContent = message;
        elements.error.classList.remove('hidden');
    }

    function showMainInterface() {
        hideAll();
        elements.mainInterface.classList.remove('hidden');
    }

    function showProjectInfo() {
        elements.projectInfo.classList.remove('hidden');
    }

    function hideProjectInfo() {
        elements.projectInfo.classList.add('hidden');
    }

    function showTemplateSection() {
        elements.templateSection.classList.remove('hidden');
    }

    function hideTemplateSection() {
        elements.templateSection.classList.add('hidden');
        elements.templateSelect.value = '';
        elements.fillDocumentBtn.disabled = true;
    }

    function showStatus(message) {
        elements.statusMessage.textContent = message;
        elements.status.classList.remove('hidden');
    }

    function hideStatus() {
        elements.status.classList.add('hidden');
    }

    function hideAll() {
        elements.loading.classList.add('hidden');
        elements.error.classList.add('hidden');
        elements.mainInterface.classList.add('hidden');
        hideStatus();
    }

})();
