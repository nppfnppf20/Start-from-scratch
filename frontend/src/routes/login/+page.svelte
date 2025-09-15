<script lang="ts">
  import { login, isLoading, authError, isAuthenticated, userInfo } from '$lib/stores/auth0';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    console.log('=== LOGIN PAGE LOADED ===');
    console.log('Initial auth state:', $isAuthenticated);
    console.log('Initial user:', $userInfo?.email);
    
    // Debug current store values
    setTimeout(() => {
      console.log('LOGIN PAGE CHECK:', {
        isAuthenticated: $isAuthenticated,
        userInfo: $userInfo?.email,
        isLoading: $isLoading
      });
    }, 100);
    
    // Subscribe to auth changes
    const unsubscribe = isAuthenticated.subscribe(authenticated => {
      console.log('LOGIN PAGE: Auth subscription triggered:', authenticated);
      console.log('LOGIN PAGE: User info when auth changes:', $userInfo?.email);
      
      if (authenticated && $userInfo) {
        console.log('LOGIN PAGE: User is authenticated, redirecting to home');
        goto('/', { replaceState: true });
      } else if (authenticated && !$userInfo) {
        console.log('LOGIN PAGE: Authenticated but no user info yet, waiting...');
      }
    });
    
    // Also subscribe to userInfo changes
    const unsubscribeUser = userInfo.subscribe(user => {
      console.log('LOGIN PAGE: User info changed:', user?.email);
      
      if ($isAuthenticated && user) {
        console.log('LOGIN PAGE: Both auth and user ready, redirecting');
        goto('/', { replaceState: true });
      }
    });
    
    return () => {
      unsubscribe();
      unsubscribeUser();
    };
  });

  const handleLogin = () => {
    console.log('LOGIN PAGE: Login button clicked');
    login();
  };
</script>

<div class="login-container">
  <div class="login-box">
    <h1>TRP Dashboard</h1>
    <p>Please log in to continue.</p>
    
    <!-- Debug info on page -->
    <div class="debug-info">
      <p><strong>Debug:</strong></p>
      <p>Auth: {$isAuthenticated ? 'Yes' : 'No'}</p>
      <p>User: {$userInfo?.email || 'None'}</p>
      <p>Loading: {$isLoading ? 'Yes' : 'No'}</p>
    </div>
    
    {#if $authError}
      <p class="error-message">{$authError}</p>
    {/if}

    <button
      on:click={handleLogin}
      disabled={$isLoading}
      class="login-button"
    >
      {#if $isLoading}
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