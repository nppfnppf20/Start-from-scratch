import type { LayoutServerLoad } from './$types';

// No server-side auth needed for Auth0 SPA
export const load: LayoutServerLoad = async () => {
    return {};
};


