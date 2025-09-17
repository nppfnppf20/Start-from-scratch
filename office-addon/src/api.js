/**
 * API Integration for Office Add-in
 * Handles communication with the backend API using shared API key
 */

class ProjectAPI {
    constructor() {
        // Configuration - Update these to match your deployment
        this.baseUrl = 'http://localhost:5000/api'; // Update for production
        this.apiKey = 'office-addon-key-2025'; // The key we defined in the backend
    }

    /**
     * Generic API request method
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
            ...options.headers
        };

        try {
            console.log(`API Request: ${options.method || 'GET'} ${url}`);
            
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.msg || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`API Response:`, data);
            return data;

        } catch (error) {
            console.error(`API Error for ${endpoint}:`, error);
            throw error;
        }
    }

    /**
     * Get all projects
     */
    async getProjects() {
        return this.request('/projects');
    }

    /**
     * Get a specific project by ID
     */
    async getProject(projectId) {
        return this.request(`/projects/${projectId}`);
    }

    /**
     * Get quotes for a project
     */
    async getProjectQuotes(projectId) {
        return this.request(`/quotes?projectId=${projectId}`);
    }

    /**
     * Test API connection
     */
    async testConnection() {
        try {
            await this.request('/');
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Create a global instance
window.projectAPI = new ProjectAPI();
