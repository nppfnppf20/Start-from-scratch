import type { LayoutLoad } from './$types';

// SPA mode - no server-side loading
// Auth logic moved to client-side components  
export const load: LayoutLoad = async () => {
    return {};
};