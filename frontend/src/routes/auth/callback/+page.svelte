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

<div class="loading-container">
    <div class="loading-spinner"></div>
    <p>Completing authentication…</p>
</div>

<style>
    .loading-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background-color: #f8f9fa;
    }

    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #e2e8f0;
        border-top: 4px solid #3182ce;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .loading-container p {
        color: #4a5568;
        font-size: 1.1rem;
        margin: 0;
    }
</style>


