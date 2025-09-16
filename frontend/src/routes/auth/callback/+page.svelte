<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { auth0Store } from '$lib/stores/auth0Store';
    import { getAuth0Client } from '$lib/auth/auth0Client';

    onMount(async () => {
        try {
            const client = await getAuth0Client();
            await client.handleRedirectCallback();
            
            // Re-initialize the store to get user and token
            await auth0Store.initialize();
            
            goto('/');
        } catch (error) {
            console.error('Auth0 callback error:', error);
            goto('/auth/login');
        }
    });
</script>

<p>Completing authentication…</p>


