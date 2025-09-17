import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
// TEMPORARILY DISABLED - import { getAuth0Client } from '$lib/auth/auth0Client';
// TEMPORARILY DISABLED - import type { User } from '@auth0/auth0-spa-js';

// Fake User type for testing
interface User {
    email?: string;
    name?: string;
}

interface Auth0State {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;
}

function createAuth0Store() {
    const { subscribe, set, update } = writable<Auth0State>({
        isAuthenticated: false,
        user: null,
        isLoading: true
    });

    let accessToken: string | null = null;

    async function initialize() {
        if (!browser) return;
        
        // COMPLETELY DISABLED FOR TESTING
        console.log('Auth0 store: COMPLETELY DISABLED - setting fake state');
        set({ isAuthenticated: false, user: null, isLoading: false });
    }

    async function login() {
        console.log('Login called - DISABLED FOR TESTING');
        return;
    }

    async function logout() {
        console.log('Logout called - DISABLED FOR TESTING');
        return;
    }

    async function getAccessToken(): Promise<string | null> {
        console.log('getAccessToken called - DISABLED FOR TESTING');
        return null;
    }

    // TEMPORARILY DISABLED - Initialize when store is created
    // if (browser) {
    //     initialize();
    // }
    
    // For testing: set a fake authenticated state
    if (browser) {
        console.log('Auth0 initialization DISABLED for testing');
        set({ isAuthenticated: false, user: null, isLoading: false });
    }

    return {
        subscribe,
        login,
        logout,
        getAccessToken,
        initialize
    };
}

export const auth0Store = createAuth0Store();

// Helper function to get auth headers for API calls
export async function getAuth0Headers(): Promise<{ Authorization?: string }> {
    if (!browser) return {};
    
    // Check if user is authenticated before trying to get token
    const { isAuthenticated, isLoading } = get(auth0Store);
    console.log('getAuth0Headers called:', { isAuthenticated, isLoading });
    
    if (!isAuthenticated || isLoading) {
        console.log('getAuth0Headers: User not authenticated, returning empty headers');
        return {};
    }
    
    const token = await auth0Store.getAccessToken();
    console.log('getAuth0Headers called, token available:', token ? 'YES' : 'NO');
    return token ? { Authorization: `Bearer ${token}` } : {};
}
