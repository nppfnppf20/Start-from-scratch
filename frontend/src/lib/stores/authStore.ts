    // File: frontend/src/lib/stores/authStore.ts
import { writable, get } from 'svelte/store';
    import { browser } from '$app/environment';
import { goto } from '$app/navigation';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Define the shape of the user object we'll get from the JWT
interface User {
  id: string;
  email: string;
  role: string;
}

// Define the shape of the auth store's state
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

// Helper function to decode a JWT.
// This is a simple, lightweight way to get the payload without a heavy library.
function decodeJwt(token: string): User | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const decoded = JSON.parse(jsonPayload);
    // The payload from our backend has a 'user' object inside it
    return decoded.user as User;
  } catch (e) {
    console.error("Failed to decode JWT:", e);
    return null;
  }
}


// --- The Main Auth Store ---
function createAuthStore() {
  const { subscribe, set } = writable<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
  });

  // This function runs when the store is first created.
  // It checks localStorage for a token to keep the user logged in.
  function initialize() {
    if (!browser) return;

    const token = localStorage.getItem('jwt_token');
    if (token) {
      const user = decodeJwt(token);
      if (user) {
        set({
          isAuthenticated: true,
          user: user,
          token: token,
        });
      } else {
        // The token was invalid or expired, so clean up.
        localStorage.removeItem('jwt_token');
      }
    }
  }

     // --- Login Function ---
   async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
     if (!browser) return { success: false, error: 'Browser not available' };

      try {
       const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
        const data = await response.json();
        const token = data.token;
        const user = decodeJwt(token);

        if (token && user) {
          localStorage.setItem('jwt_token', token);
          set({ isAuthenticated: true, user, token });
          return { success: true };
        }
        return { success: false, error: 'Invalid token received.' };
        } else {
        const errorData = await response.json();
        return { success: false, error: errorData.msg || 'Invalid credentials.' };
        }
      } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'A network or server error occurred.' };
    }
  }

  // --- Logout Function ---
  async function logout() {
    if (!browser) return;
    localStorage.removeItem('jwt_token');
    set({
      isAuthenticated: false,
      user: null,
      token: null,
    });
    // Redirect to login page to ensure a clean state
    await goto('/login');
  }

  // Initialize the store on creation
  initialize();

  return {
    subscribe,
    login,
    logout,
  };
}

export const authStore = createAuthStore();


// --- Helper function to get the auth header for API calls ---
export function getAuthTokenHeader(): { Authorization?: string } {
    if (!browser) return {};

    const token = get(authStore).token;

    if (token) {
        return { 'Authorization': `Bearer ${token}` };
      }
      return {};
    }