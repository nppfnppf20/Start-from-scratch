    // File: frontend/src/lib/stores/authStore.ts
    import { writable, derived } from 'svelte/store';
    import { browser } from '$app/environment';

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    // --- Private writable store for the password ---
    // We initialize it from localStorage so the session can persist across page reloads.
    const storedPassword = browser ? window.localStorage.getItem('site_password') : null;
    const password = writable<string | null>(storedPassword);

    // --- Public derived store for authentication status ---
    // Anyone can subscribe to this to know if the user is logged in.
    export const isAuthenticated = derived(
      password,
      $password => !!$password
    );

    // --- Function to verify and set the password ---
    export async function verifyAndSetPassword(pw: string): Promise<boolean> {
      if (!browser) return false;

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pw }),
        });

        if (response.ok) {
          // Password is correct. Save it to the store and localStorage.
          password.set(pw);
          window.localStorage.setItem('site_password', pw);
          console.log('Authentication successful.');
          return true;
        } else {
          // Password is incorrect. Clear any stored password.
          password.set(null);
          window.localStorage.removeItem('site_password');
          console.error('Authentication failed: Incorrect password.');
          return false;
        }
      } catch (error) {
        console.error('Error during password verification:', error);
        password.set(null);
        window.localStorage.removeItem('site_password');
        return false;
      }
    }

    // --- Function to get the current password for API calls ---
    // This is not a store, but a simple getter function.
    export function getAuthHeader(): { Authorization?: string } {
      let currentPassword = null;
      // We use a temporary subscriber to get the current value from the store.
      const unsubscribe = password.subscribe(value => {
        currentPassword = value;
      });
      unsubscribe(); // Immediately unsubscribe

      if (currentPassword) {
        return { 'Authorization': currentPassword };
      }
      return {};
    }

    // --- Logout function ---
    export function logout() {
      if (!browser) return;
      password.set(null);
      window.localStorage.removeItem('site_password');
      // Optional: redirect to login page after logout
      // window.location.href = '/login'; 
    }