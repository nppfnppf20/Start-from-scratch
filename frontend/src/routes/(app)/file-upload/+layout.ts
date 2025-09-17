import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { auth0Store } from '$lib/stores/auth0Store';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { getUserRole } from '$lib/utils/auth';

export const load: LayoutLoad = async () => {
    if (browser) {
        const { isAuthenticated, user, isLoading } = get(auth0Store);
        
        if (isLoading) return {};
        if (!isAuthenticated) throw redirect(307, '/auth/login');
        
        const userRole = getUserRole(user);
        if (userRole !== 'admin' && userRole !== 'client') {
            throw redirect(307, '/');
        }
    }
    return {};
};
