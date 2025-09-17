import { browser } from '$app/environment';
import { createAuth0Client } from '@auth0/auth0-spa-js';
import type { Auth0Client } from '@auth0/auth0-spa-js';
import { PUBLIC_AUTH0_DOMAIN, PUBLIC_AUTH0_CLIENT_ID, PUBLIC_AUTH0_AUDIENCE } from '$env/static/public';

let auth0Client: Auth0Client | null = null;

export async function getAuth0Client(): Promise<Auth0Client> {
    if (!browser) throw new Error('Auth0 client is browser-only');
    if (!auth0Client) {
        const domain = PUBLIC_AUTH0_DOMAIN || (import.meta as any).env?.VITE_AUTH0_DOMAIN;
        const clientId = PUBLIC_AUTH0_CLIENT_ID || (import.meta as any).env?.VITE_AUTH0_CLIENT_ID;
        const audience = PUBLIC_AUTH0_AUDIENCE || (import.meta as any).env?.VITE_AUTH0_AUDIENCE;

        if (!domain || !clientId) {
            throw new Error('Auth0 env missing: set PUBLIC_AUTH0_DOMAIN and PUBLIC_AUTH0_CLIENT_ID (or VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID) in frontend/.env');
        }

        // Always log in production to debug the blank screen issue
        console.log('Auth0 config (prod):', { domain, clientId, audience });
        
        if ((import.meta as any).env?.DEV) {
            // Safe to log clientId; it's not a secret. Helps diagnose env loading.
            console.debug('Auth0 config', { domain, clientId, audience });
        }
        try {
            console.log('About to create Auth0 client with config:', { domain, clientId, audience });
            console.log('Redirect URI will be:', window.location.origin + '/auth/callback');
            
            auth0Client = await createAuth0Client({
                domain,
                clientId,
                authorizationParams: {
                    audience: audience || undefined,
                    redirect_uri: window.location.origin + '/auth/callback',
                    scope: 'openid profile email'
                }
            });
            
            console.log('Auth0 client created successfully');
        } catch (error) {
            console.error('Auth0 client creation failed:', error);
            throw error;
        }
    }
    return auth0Client;
}


