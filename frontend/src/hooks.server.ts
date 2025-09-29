import type { Handle } from '@sveltejs/kit';

// No server-side auth handling needed for pure Auth0 SPA
export const handle: Handle = async ({ event, resolve }) => {
    return resolve(event);
};


