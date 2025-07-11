// src/routes/+layout.ts
export const ssr = false;

// File: frontend/src/routes/+layout.ts
import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { authStore } from '$lib/stores/authStore';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { loadProjects } from '$lib/stores/projectStore';

// This load function runs on both the server and the client.
// It's the main entry point for protecting routes and loading initial data.
export const load: LayoutLoad = async ({ url }) => {
    if (!browser) {
        // On the server, we don't have access to localStorage, so we can't
        // know the auth state yet. We'll let the client-side handle redirects.
        return {};
    }

    const { isAuthenticated } = get(authStore);
    const isLoginPage = url.pathname === '/login';

    if (!isAuthenticated && !isLoginPage) {
        // If the user is not logged in and not trying to access the login page,
        // send them to the login page.
        throw redirect(307, '/login');
    }

    if (isAuthenticated && isLoginPage) {
        // If a logged-in user tries to visit the login page,
        // send them back to the main application.
        throw redirect(307, '/');
    }

    if (isAuthenticated) {
        // If the user is authenticated, we can safely load the initial
        // project data. The `loadProjects` function itself will handle
        // making sure this doesn't run multiple times unnecessarily.
        // NOTE: This will still fail until we update projectStore.ts
        try {
            await loadProjects();
        } catch (error) {
            console.error("Failed to load projects in layout:", error);
            // We might want to handle this more gracefully, e.g., by logging out
            // if the token is invalid (401 error).
            // For now, we'll allow the app to load so we can see other UI.
        }
    }

    return {}; // Return an empty object as we are managing state via stores.
}; 