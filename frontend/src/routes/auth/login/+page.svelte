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
    <p>Redirecting to Auth0…</p>
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
</style>


