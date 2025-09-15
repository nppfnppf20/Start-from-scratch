// src/lib/stores/authHelpers.ts
import { getAccessToken } from './auth0';

/**
 * Get authorization header for API calls
 * Replaces the old getAuthTokenHeader function with Auth0 token
 */
export async function getAuthTokenHeader(): Promise<Record<string, string>> {
  try {
    const token = await getAccessToken();
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