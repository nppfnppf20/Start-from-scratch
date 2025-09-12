import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { createAuth0Client, type Auth0Client, type User } from '@auth0/auth0-spa-js';
import { auth0Config } from '../auth0';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Define the shape of our local user object (from your database)
interface LocalUser {
  id: string;
  email: string;
  role: string;
  auth0Id?: string;
}

// Define the shape of the auth store's state
interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: LocalUser | null;
  auth0User: User | null;
  token: string | null;
}

// Create the Auth0 store
function createAuth0Store() {
  const { subscribe, set, update } = writable<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    auth0User: null,
    token: null,
  });

  let auth0Client: Auth0Client | null = null;

  // Initialize Auth0 client
  async function initializeAuth0() {
    if (!browser) return;

    try {
      auth0Client = await createAuth0Client(auth0Config);

      // Check if we're returning from Auth0 callback
      if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
        await handleCallback();
        return;
      }

      // Check if user is already authenticated
      const isAuthenticated = await auth0Client.isAuthenticated();
      
      if (isAuthenticated) {
        await updateUserState();
      } else {
        update(state => ({ ...state, isLoading: false }));
      }
    } catch (error) {
      console.error('Auth0 initialization error:', error);
      update(state => ({ ...state, isLoading: false }));
    }
  }

  // Handle Auth0 callback
  async function handleCallback() {
    if (!auth0Client) return;

    try {
      await auth0Client.handleRedirectCallback();
      await updateUserState();
      
      // Remove the callback params from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Redirect based on user role
      const currentState = get({ subscribe });
      if (currentState.user?.role === 'surveyor') {
        await goto('/fee-quote-submission');
      } else {
        await goto('/');
      }
    } catch (error) {
      console.error('Callback handling error:', error);
      update(state => ({ ...state, isLoading: false }));
    }
  }

  // Update user state after authentication
  async function updateUserState() {
    if (!auth0Client) return;

    try {
      const auth0User = await auth0Client.getUser();
      const token = await auth0Client.getTokenSilently();

      if (auth0User && token) {
        // Fetch user data from your backend
        const localUser = await fetchLocalUser(token);
        
        set({
          isAuthenticated: true,
          isLoading: false,
          user: localUser,
          auth0User,
          token,
        });
      }
    } catch (error) {
      console.error('Error updating user state:', error);
      update(state => ({ ...state, isLoading: false }));
    }
  }

  // Fetch user data from your backend (or create if doesn't exist)
  async function fetchLocalUser(token: string): Promise<LocalUser | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Error fetching local user:', error);
      return null;
    }
  }

  // Login function
  async function login() {
    if (!auth0Client) {
      await initializeAuth0();
    }

    if (auth0Client) {
      await auth0Client.loginWithRedirect();
    }
  }

  // Logout function
  async function logout() {
    if (auth0Client) {
      await auth0Client.logout({
        logoutParams: {
          returnTo: window.location.origin
        }
      });
    }

    set({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      auth0User: null,
      token: null,
    });
  }

  // Get access token for API calls
  async function getAccessToken(): Promise<string | null> {
    if (!auth0Client) return null;

    try {
      return await auth0Client.getTokenSilently();
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  // Initialize on store creation
  if (browser) {
    initializeAuth0();
  }

  return {
    subscribe,
    login,
    logout,
    getAccessToken,
  };
}

export const auth0Store = createAuth0Store();

// Helper function to get auth header for API calls
export async function getAuthTokenHeader(): Promise<{ Authorization?: string }> {
  if (!browser) return {};

  const token = await auth0Store.getAccessToken();
  
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  
  return {};
}
