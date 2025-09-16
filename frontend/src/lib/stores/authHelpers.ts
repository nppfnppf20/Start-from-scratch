import { getAccessToken } from './auth0';

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