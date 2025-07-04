import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { authStore } from '$lib/stores/authStore';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

export const load: LayoutLoad = async () => {
    if (browser) {
        const user = get(authStore).user;
        // This page is for surveyors only.
        // If the user is not a surveyor, or not logged in, redirect them.
        if (user?.role !== 'surveyor') {
            // Redirect to the homepage as a safe default.
            throw redirect(307, '/'); 
        }
    }
    // No data needs to be returned.
    return {};
}; 