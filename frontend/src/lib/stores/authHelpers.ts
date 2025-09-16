// src/lib/stores/authHelpers.ts
import { browser } from '$app/environment';

// Global variable to store the Auth0 client (set from layout)
let globalAuth0Client: any = null;

export function setGlobalAuth0Client(client: any) {
  globalAuth0Client = client;
}

export function getGlobalAuth0Client() {
  return globalAuth0Client;
}

/**
 * Get authorization header for API calls using Auth0 token directly
 */
export async function getAuthTokenHeader(): Promise<Record<string, string>> {
  if (!browser || !globalAuth0Client) {
    console.error('Auth0 client not available');
    throw new Error('Failed to get authentication token');
  }

  try {
    const token = await globalAuth0Client.getTokenSilently();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  } catch (error) {
    console.error('Error getting auth token:', error);
    throw new Error('Failed to get authentication token');
  }
}

/**
 * Make authenticated fetch request with Auth0 token
 * Alternative to using getAuthTokenHeader manually
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = await getAuthTokenHeader();

  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {})
    }
  });
}