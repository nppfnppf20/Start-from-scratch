// Auth utility functions for Auth0 integration
import { writable } from 'svelte/store';
import { getAuth0Headers } from '$lib/stores/auth0Store';

// Reactive store for user role
export const userRole = writable<string>('surveyor');

// Cache for user role to avoid repeated API calls
let cachedUserRole: string | null = null;
let cachedUserEmail: string | null = null;

export function getUserRole(user: any): string {
    if (!user) {
        userRole.set('surveyor');
        return 'surveyor';
    }
    
    // For immediate UI rendering, return cached role if available for same user
    if (cachedUserRole && cachedUserEmail === user.email) {
        userRole.set(cachedUserRole);
        return cachedUserRole;
    }
    
    // If no cached role, start async fetch and return default for now
    fetchUserRoleFromBackend(user.email);
    
    // Return cached role or default
    const role = cachedUserRole || 'surveyor';
    userRole.set(role);
    return role;
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
            
            // Update the reactive store so UI re-renders
            userRole.set(userData.role);
        } else if (response.status === 403) {
            // Email not authorized - trigger logout
            console.error('User email not authorized:', response.status);
            const { auth0Store } = await import('$lib/stores/auth0Store');
            await auth0Store.logout();
            // Redirect will be handled by the layout
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
