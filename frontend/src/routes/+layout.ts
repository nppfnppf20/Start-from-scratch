import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { auth0Store } from '$lib/stores/auth0Store';
import { get } from 'svelte/store';
import { loadProjects } from '$lib/stores/projectStore';

/**
 * This load function now primarily handles loading data for an already authenticated user
 * when the app first loads. The redirect logic for unauthenticated users has been moved
 * to the reactive block in /(app)/+layout.svelte for better reliability.
 */
export const load: LayoutLoad = async ({ url, fetch }) => {
    if (!browser) {
        return {};
    }

    const { isAuthenticated, isLoading } = get(auth0Store);

    // Only attempt to load projects if the user is already authenticated on load.
    // The reactive block in the layout component will handle loading projects after a successful login.
    if (!isLoading && isAuthenticated) {
        console.log('User is authenticated on initial load, loading projects...');
        try {
            await loadProjects(fetch);
        } catch (error) {
            console.error("Failed to load projects in root layout:", error);
            if (error.message.includes('403')) {
                console.log('User email not authorized - logging out');
                await auth0Store.logout();
                // The reactive redirect in the layout component will handle the redirect to login.
            }
        }
    }

    return {};
}; 