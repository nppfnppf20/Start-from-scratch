import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { auth0Store } from '$lib/stores/auth0Store';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

export const load: LayoutLoad = async () => {
    if (browser) {
        const user = get(auth0Store).user;
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