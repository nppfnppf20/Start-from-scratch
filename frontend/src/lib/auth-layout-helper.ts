// Helper for layout.ts files to check authentication and roles
import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { getAuthTokenHeader } from '$lib/stores/authHelpers';

export async function requireAuth(allowedRoles: string[] = []) {
    if (!browser) return {};

    try {
        // Make a call to get user info from backend to check role
        const headers = await getAuthTokenHeader();
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/me`, {
            headers
        });

        if (response.ok) {
            const user = await response.json();

            // If specific roles are required, check them
            if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
                // Redirect to the homepage as a safe default.
                throw redirect(307, '/');
            }

            return { user };
        } else {
            // Not authenticated, redirect to login
            throw redirect(307, '/login');
        }
    } catch (error) {
        // Auth error, redirect to login
        throw redirect(307, '/login');
    }
}