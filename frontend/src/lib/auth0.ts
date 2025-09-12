// Auth0 configuration
export const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN,
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
  authorizationParams: {
    redirect_uri: `${window.location.origin}/callback`,
    audience: import.meta.env.VITE_AUTH0_AUDIENCE, // Optional: for API access
    scope: 'openid profile email', // Standard scopes for web apps
  },
  cacheLocation: 'localstorage' as const,
  useRefreshTokens: true,
};
