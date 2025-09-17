// Auth utility functions for Auth0 integration
import { getAuth0Headers } from '$lib/stores/auth0Store';

// Cache for user role to avoid repeated API calls
let cachedUserRole: string | null = null;
let cachedUserEmail: string | null = null;

export function getUserRole(user: any): string {
    if (!user) return 'surveyor'; // Default fallback
    
    // For immediate UI rendering, return cached role if available for same user
    if (cachedUserRole && cachedUserEmail === user.email) {
        return cachedUserRole;
    }
    
    // If no cached role, start async fetch but return default for now
    fetchUserRoleFromBackend(user.email);
    
    // Return default while fetching (this will be updated when role store is implemented)
    return cachedUserRole || 'surveyor';
}

// Async function to fetch user role from backend
async function fetchUserRoleFromBackend(email: string) {
    if (!email) return;
    
    // Skip if already cached for this email
    if (cachedUserRole && cachedUserEmail === email) return;
    
    try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const headers = await getAuth0Headers();
        
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            headers
        });
        
        if (response.ok) {
            const userData = await response.json();
            cachedUserRole = userData.role;
            cachedUserEmail = email;
            console.log('Fetched user role from backend:', userData.role);
        } else {
            console.error('Failed to fetch user role:', response.status);
        }
    } catch (error) {
        console.error('Error fetching user role:', error);
    }
}

// Function to clear role cache (call when user logs out)
export function clearUserRoleCache() {
    cachedUserRole = null;
    cachedUserEmail = null;
}
