import type { LayoutLoad } from './$types';
import { loadProjects } from '$lib/stores/projectStore';
import { browser } from '$app/environment';

// We only need to trigger the load function, 
// it populates the store which components can then subscribe to.
// This load function runs on both server and client.
export const load: LayoutLoad = async () => {
    // The loadProjects function itself checks for browser env, 
    // so it's safe to call here.
    if (browser) {
        console.log('Layout Load (browser): Triggering loadProjects...');
        await loadProjects();
    }
    
    // No data needs to be returned from load for this approach,
    // as the store handles the state.
    return {};
}; 