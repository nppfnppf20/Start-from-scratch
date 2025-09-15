// @ts-nocheck
// src/lib/stores/auth0.js
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Stores - these work fine in SSR
export const isLoading = writable(false);
export const isAuthenticated = writable(false);
export const authError = writable(null);
export const userInfo = writable(null);
export const accessToken = writable(null);

// Auth0 client - only exists in browser
let auth0Client = null;

// Auth0 configuration
const AUTH0_CONFIG = {
  domain: 'dev-xppcpnbe4k8qmvmf.uk.auth0.com', // Replace with your actual domain
  clientId: 'aDaxa5lTp2eQrLMm00qtntf6Glnb0qhU', // Replace with your actual client ID
  authorizationParams: {
    audience: 'https://trpdashboard.co.uk/api'
  }
};

// Initialize Auth0 - only runs in browser
export const initAuth0 = async () => {
  // Guard: only run in browser
  if (!browser) {
    return;
  }

  try {
    isLoading.set(true);
    authError.set(null);

    // Dynamic import Auth0 only in browser
    const { createAuth0Client } = await import('@auth0/auth0-spa-js');

    // Create Auth0 client with callback URL
    auth0Client = await createAuth0Client({
      ...AUTH0_CONFIG,
      authorizationParams: {
        ...AUTH0_CONFIG.authorizationParams,
        redirect_uri: window.location.origin + '/callback'
      }
    });

    // Check authentication status
    const authenticated = await auth0Client.isAuthenticated();
    isAuthenticated.set(authenticated);

    if (authenticated) {
      // Get user and token
      const user = await auth0Client.getUser();
      const token = await auth0Client.getTokenSilently();
      
      userInfo.set(user || null);
      accessToken.set(token || null);

      // Fetch backend user data
      if (token) {
        await fetchUserFromBackend(token);
      }
    }

    // Handle callback if present
    if (window.location.search.includes('code=')) {
      await handleCallback();
    }

  } catch (error) {
    console.error('Auth0 initialization error:', error);
    authError.set(error instanceof Error ? error.message : 'Auth0 initialization failed');
  } finally {
    isLoading.set(false);
  }
};

// Handle Auth0 callback
const handleCallback = async () => {
  if (!browser || !auth0Client) return;

  try {
    await auth0Client.handleRedirectCallback();
    
    const user = await auth0Client.getUser();
    const token = await auth0Client.getTokenSilently();
    
    isAuthenticated.set(true);
    userInfo.set(user || null);
    accessToken.set(token || null);

    if (token) {
      await fetchUserFromBackend(token);
    }

    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
  } catch (error) {
    console.error('Callback error:', error);
    authError.set(error instanceof Error ? error.message : 'Login callback failed');
  }
};

// Fetch user from backend
const fetchUserFromBackend = async (token) => {
  if (!browser) return;

  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const backendUser = await response.json();
      userInfo.update(user => ({ ...(user || {}), ...backendUser }));
    }
  } catch (error) {
    console.error('Backend user fetch error:', error);
  }
};

// Login function
export const login = async () => {
  console.log('login: Function called');
  
  if (!browser) {
    console.log('login: Not in browser, returning');
    return;
  }
  
  if (!auth0Client) {
    console.log('login: Auth0 client not initialized');
    authError.set('Auth0 not initialized. Please refresh the page.');
    return;
  }

  try {
    console.log('login: Attempting to redirect to Auth0...');
    await auth0Client.loginWithRedirect();
    console.log('login: Redirect initiated');
  } catch (error) {
    console.error('login: Error occurred:', error);
    authError.set(error instanceof Error ? error.message : 'Login failed');
  }
};

// Logout function
export const logout = () => {
  if (!browser || !auth0Client) return;

  auth0Client.logout({
    logoutParams: {
      returnTo: window.location.origin
    }
  });
  
  // Clear stores
  isAuthenticated.set(false);
  userInfo.set(null);
  accessToken.set(null);
};

// Get access token
export const getAccessToken = async () => {
  if (!browser || !auth0Client) {
    throw new Error('Auth0 not available');
  }

  try {
    const token = await auth0Client.getTokenSilently();
    accessToken.set(token);
    return token;
  } catch (error) {
    console.error('Token error:', error);
    throw error;
  }
};

// Authenticated fetch helper
export const authenticatedFetch = async (url, options = {}) => {
  if (!browser) {
    throw new Error('Cannot fetch during SSR');
  }

  const token = await getAccessToken();
  
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};