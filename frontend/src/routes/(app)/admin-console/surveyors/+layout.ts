import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { authStore } from '$lib/stores/authStore';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

export const load: LayoutLoad = async () => {
    if (browser) {
        const user = get(authStore).user;
        // This page is for admins only.
        // If the user is not an admin, redirect them.
        if (user?.role !== 'admin') {
            // Redirect to the homepage as a safe default.
            throw redirect(307, '/projectinfo'); 
        }
    }
    // No data needs to be returned.
    return {};
}; 