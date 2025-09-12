<script lang="ts">
  import { auth0Store } from '$lib/stores/auth0Store';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let isLoading = false;

  // If a user who is already logged in navigates to this page,
  // redirect them to the main application.
  onMount(() => {
    const unsubscribe = auth0Store.subscribe(state => {
      if (state.isAuthenticated && !state.isLoading) {
        goto('/', { replaceState: true });
      }
    });

    // Clean up the subscription when the component is destroyed.
    return unsubscribe;
  });

  async function handleAuth0Login() {
    isLoading = true;
    try {
      await auth0Store.login();
    } catch (error) {
      console.error('Login error:', error);
      isLoading = false;
    }
  }
</script>

<div class="login-container">
  <div class="login-box">
    <h1>Welcome</h1>
    <p>Sign in to access your surveyor management portal</p>
    
    <button 
      type="button" 
      class="login-button" 
      disabled={isLoading}
      on:click={handleAuth0Login}
    >
      {#if isLoading}
        <span>Redirecting...</span>
      {:else}
        <span>Sign In</span>
      {/if}
    </button>

    <p class="info-text">
      You'll be redirected to a secure login page. If you don't have an account, 
      you can register with the same email your administrator used to give you access.
    </p>
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

  .info-text {
    margin-top: 1.5rem;
    font-size: 0.9rem;
    color: #777;
    line-height: 1.4;
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

  /* Removed error message and registration styles as they're no longer needed */
</style>