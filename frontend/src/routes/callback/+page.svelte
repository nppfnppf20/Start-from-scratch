<!-- src/routes/callback/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { userInfo, isAuthenticated, isLoading, authError } from '$lib/stores/auth0';
    
    onMount(async () => {
      console.log('Callback page loaded');
      
      // Wait for Auth0 to complete the callback
      const waitForAuth = () => {
        console.log('Checking auth status:', {
          isLoading: $isLoading,
          isAuthenticated: $isAuthenticated,
          userInfo: $userInfo?.email,
          authError: $authError
        });
        
        if ($authError) {
          console.error('Auth error:', $authError);
          goto('/login');
          return;
        }
        
        if (!$isLoading && $isAuthenticated && $userInfo) {
          console.log('Auth completed successfully, redirecting...');
          if ($userInfo.role === 'surveyor') {
            goto('/fee-quote-submission');
          } else {
            goto('/');
          }
        } else if (!$isLoading && !$isAuthenticated) {
          console.log('Auth failed, redirecting to login');
          goto('/login');
        } else {
          // Still loading, wait a bit more
          setTimeout(waitForAuth, 500);
        }
      };
      
      // Start checking auth status
      waitForAuth();
    });
</script>

<div class="callback-container">
  <div class="callback-box">
    <div class="loading-spinner"></div>
    <h2>Completing login...</h2>
    <p>Please wait while we log you in and set up your dashboard.</p>
    {#if $authError}
      <p class="error">Error: {$authError}</p>
    {/if}
  </div>
</div>

<style>
  .callback-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f0f2f5;
    font-family: sans-serif;
  }

  .callback-box {
    background: white;
    padding: 2.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    text-align: center;
    max-width: 400px;
    width: 100%;
  }

  .loading-spinner {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #007bff;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: 0 auto 1.5rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  h2 {
    color: #333;
    margin-bottom: 1rem;
  }

  p {
    color: #666;
    margin: 0;
  }

  .error {
    color: #d93025;
    margin-top: 1rem;
  }
</style>