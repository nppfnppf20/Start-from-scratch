<script lang="ts">
  import auth from '../../authService';
  import { isAuthenticated, user, popupOpen, error } from '../../store';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { setGlobalAuth0Client } from '$lib/stores/authHelpers';

  let auth0Client;

  onMount(async () => {
    auth0Client = await auth.createClient();
    setGlobalAuth0Client(auth0Client); // Make client available to auth helpers

    // Check if already authenticated
    if ($isAuthenticated && $user) {
      goto('/', { replaceState: true });
    }

    // Subscribe to auth changes
    const unsubscribe = isAuthenticated.subscribe(authenticated => {
      if (authenticated && $user) {
        goto('/', { replaceState: true });
      }
    });

    return () => {
      unsubscribe();
    };
  });

  const handleLogin = () => {
    auth.loginWithPopup(auth0Client);
  };
</script>

<div class="login-container">
  <div class="login-box">
    <h1>TRP Dashboard</h1>
    <p>Please log in to continue.</p>
    
    {#if $error}
      <p class="error-message">{$error}</p>
    {/if}

    <button
      on:click={handleLogin}
      disabled={$popupOpen}
      class="login-button"
    >
      {#if $popupOpen}
        <span>Signing in...</span>
      {:else}
        <span>Sign In with Auth0</span>
      {/if}
    </button>

    <div class="info-text">
      <p>New users can create an account on the next page.</p>
    </div>
  </div>
</div>

<style>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f0f2f5;
    font-family: sans-serif;
  }

  .login-box {
    background: white;
    padding: 2.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
    text-align: center;
  }

  h1 {
    font-size: 1.8rem;
    color: #333;
    margin-bottom: 0.5rem;
  }

  p {
    color: #666;
    margin-bottom: 2rem;
  }

  .login-button {
    width: 100%;
    padding: 0.9rem;
    border: none;
    border-radius: 4px;
    background-color: #007bff;
    color: white;
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .login-button:hover:not(:disabled) {
    background-color: #0056b3;
  }

  .login-button:disabled {
    background-color: #aaa;
    cursor: not-allowed;
  }

  .error-message {
    color: #d93025;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .info-text {
    margin-top: 1.5rem;
    font-size: 0.9rem;
  }

  .info-text p {
    color: #888;
    margin: 0;
  }

  .debug-info {
    background: #f8f9fa;
    border-radius: 4px;
    padding: 1rem;
    margin-bottom: 1rem;
    text-align: left;
    font-size: 0.85rem;
  }

  .debug-info p {
    margin: 0.25rem 0;
    color: #495057;
  }

  .debug-info strong {
    color: #212529;
  }
</style>