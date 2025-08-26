import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { authStore } from '$lib/stores/authStore';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

export const load: LayoutLoad = async () => {
    if (browser) {
        const user = get(authStore).user;
        // This page is for admins and clients only.
        // If the user is not an admin or a client, redirect them.
        if (user?.role !== 'admin' && user?.role !== 'client') {
            // Redirect to project info as a safe default.
            throw redirect(307, '/projectinfo'); 
        }
    }
    // No data needs to be returned.
    return {};
};