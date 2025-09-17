import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { auth0Store } from '$lib/stores/auth0Store';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { loadProjects } from '$lib/stores/projectStore';

// SPA mode - minimal server-side loading
export const load: LayoutLoad = async () => {
    return {};
}; 