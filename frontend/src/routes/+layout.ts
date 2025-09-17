import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { auth0Store } from '$lib/stores/auth0Store';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { loadProjects } from '$lib/stores/projectStore';

export const load: LayoutLoad = async ({ url, fetch }) => {
    if (!browser) {
        return {};
    }

    const { isAuthenticated, isLoading } = get(auth0Store);
    const isAuthRoute = url.pathname.startsWith('/auth/');

    if (isLoading) {
        // Wait for Auth0 to initialize
        return {};
    }

    if (!isAuthenticated && !isAuthRoute) {
        throw redirect(307, '/auth/login');
    }

    if (isAuthenticated) {
        console.log('User is authenticated, loading projects...');
        try {
            await loadProjects(fetch);
        } catch (error) {
            console.error("Failed to load projects in layout:", error);
            
            // Check if it's a 403 Unauthorized error
            if (error.message.includes('403')) {
                console.log('User email not authorized - logging out');
                // Clear auth state and redirect to login with error message
                await auth0Store.logout();
                throw redirect(307, '/auth/login?error=unauthorized');
            }
        }
    } else {
        console.log('User not authenticated, isLoading:', isLoading);
    }

    return {};
}; 