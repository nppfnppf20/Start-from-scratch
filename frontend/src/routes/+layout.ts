import type { LayoutLoad } from './$types';
import { loadProjects } from '$lib/stores/projectStore';
import { browser } from '$app/environment';
import { isAuthenticated } from '$lib/stores/authStore';
import { get } from 'svelte/store';
import { redirect } from '@sveltejs/kit';

// We only need to trigger the load function, 
// it populates the store which components can then subscribe to.
// This load function runs on both server and client.
export const load: LayoutLoad = async ({ route }) => {
    // The loadProjects function itself checks for browser env, 
    // so it's safe to call here.
    if (browser) {
        // If the user is not authenticated and not on the login page, redirect them.
        if (!get(isAuthenticated) && route.id !== '/login') {
            throw redirect(307, '/login');
        }

        // If the user is authenticated, load the project data.
        // We only load projects if we are not on the login page to avoid unnecessary calls.
        if (get(isAuthenticated)) {
            console.log('Layout Load (browser): Triggering loadProjects...');
            await loadProjects();
        }
    }
    
    // No data needs to be returned from load for this approach,
    // as the store handles the state.
    return {};
}; 