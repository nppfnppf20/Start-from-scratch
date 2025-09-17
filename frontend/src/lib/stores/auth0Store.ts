import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { getAuth0Client } from '$lib/auth/auth0Client';
import type { User } from '@auth0/auth0-spa-js';

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
        
        try {
            console.log('Auth0 store: Starting initialization');
            const client = await getAuth0Client();
            console.log('Auth0 store: Got client, checking authentication');
            const isAuthenticated = await client.isAuthenticated();
            console.log('Auth0 store: isAuthenticated =', isAuthenticated);
            
            if (isAuthenticated) {
                console.log('Auth0 store: Getting user info');
                const user = await client.getUser();
                console.log('Auth0 store: Getting access token');
                accessToken = await client.getTokenSilently();
                set({ isAuthenticated: true, user: user || null, isLoading: false });
            } else {
                set({ isAuthenticated: false, user: null, isLoading: false });
            }
            console.log('Auth0 store: Initialization completed successfully');
        } catch (error) {
            console.error('Auth0 initialization error:', error);
            set({ isAuthenticated: false, user: null, isLoading: false });
        }
    }

    async function login() {
        if (!browser) return;
        try {
            const client = await getAuth0Client();
            await client.loginWithRedirect();
        } catch (error) {
            console.error('Login error:', error);
        }
    }

    async function logout() {
        if (!browser) return;
        try {
            // Clear role cache before logging out
            const { clearUserRoleCache } = await import('$lib/utils/auth');
            clearUserRoleCache();
            
            const client = await getAuth0Client();
            await client.logout({
                logoutParams: {
                    returnTo: window.location.origin
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    async function getAccessToken(): Promise<string | null> {
        if (!browser) return null;
        
        try {
            const client = await getAuth0Client();
            accessToken = await client.getTokenSilently();
            console.log('Access token obtained:', accessToken ? 'YES' : 'NO');
            return accessToken;
        } catch (error) {
            console.error('Token error:', error);
            return null;
        }
    }

    // Initialize when store is created
    if (browser) {
        initialize();
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
    
    const token = await auth0Store.getAccessToken();
    console.log('getAuth0Headers called, token available:', token ? 'YES' : 'NO');
    return token ? { Authorization: `Bearer ${token}` } : {};
}
