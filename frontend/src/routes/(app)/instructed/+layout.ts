import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { auth0Store } from '$lib/stores/auth0Store';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

export const load: LayoutLoad = async () => {
    if (browser) {
        const user = get(auth0Store).user;
        // This page is for admins and clients only.
        // If the user is not an admin or a client, redirect them.
        if (user?.role !== 'admin' && user?.role !== 'client') {
            // Redirect to the homepage as a safe default.
            throw redirect(307, '/'); 
        }
    }
    // No data needs to be returned.
    return {};
};