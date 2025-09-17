<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { auth0Store } from '$lib/stores/auth0Store';

    $: errorMessage = $page.url.searchParams.get('error');
    
    onMount(async () => {
        // Only auto-redirect if there's no error message to show
        if (!errorMessage) {
            await auth0Store.login();
        }
    });

    async function handleLoginClick() {
        await auth0Store.login();
    }
</script>

{#if errorMessage === 'unauthorized'}
    <div class="error-container">
        <h2>Access Denied</h2>
        <p>Your email address is not authorized to access this system.</p>
        <p>Please contact an administrator to be added to the client or surveyor database.</p>
        <button on:click={handleLoginClick} class="login-button">
            Try Different Account
        </button>
    </div>
{:else}
    <div class="login-container">
        <div class="loading-spinner"></div>
        <p>Redirecting to Auth0...</p>
    </div>
{/if}

<style>
    .error-container {
        max-width: 500px;
        margin: 2rem auto;
        padding: 2rem;
        background: #fee;
        border: 1px solid #fcc;
        border-radius: 8px;
        text-align: center;
    }
    
    .error-container h2 {
        color: #c33;
        margin-bottom: 1rem;
    }
    
    .error-container p {
        margin-bottom: 1rem;
        color: #666;
    }
    
    .login-button {
        background: #007cba;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
    }
    
    .login-button:hover {
        background: #005a8b;
    }

    /* Login loading state */
    .login-container {
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
        border-top: 4px solid #007cba;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .login-container p {
        color: #4a5568;
        font-size: 1.1rem;
        margin: 0;
    }
</style>


