import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { auth0Store } from '$lib/stores/auth0Store';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { getUserRole, userRole } from '$lib/utils/auth';

export const load: LayoutLoad = async () => {
    if (browser) {
        const { isAuthenticated, user, isLoading } = get(auth0Store);
        
        if (isLoading) return {};
        if (!isAuthenticated) throw redirect(307, '/auth/login');
        
        // Trigger role fetch
        if (user) {
            getUserRole(user);
        }
        
        const currentRole = get(userRole);
        if (currentRole !== 'admin' && currentRole !== 'surveyor') {
            throw redirect(307, '/');
        }
    }
    return {};
};