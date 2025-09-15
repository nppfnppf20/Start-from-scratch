<!-- src/components/Login.svelte -->
<script>
import { login, isLoading, authError, isAuthenticated } from '$lib/stores/auth0.js';
    
    // If already authenticated, don't show login
    $: if ($isAuthenticated) {
      // Redirect to dashboard or wherever you want
      window.location.href = '/dashboard';
    }
  
    const handleLogin = () => {
      login();
    };
  </script>
  
  <div class="login-container">
    <div class="login-card">
      <h1>TRP Dashboard</h1>
      <p>Welcome! Please log in to continue.</p>
      
      {#if $authError}
        <div class="error-message">
          <p>Error: {$authError}</p>
        </div>
      {/if}
  
      <button 
        on:click={handleLogin}
        disabled={$isLoading}
        class="login-button"
      >
        {#if $isLoading}
          Signing in...
        {:else}
          Sign In
        {/if}
      </button>
  
      <div class="info-text">
        <p>New to TRP Dashboard? You'll be able to create an account on the next page.</p>
      </div>
    </div>
  </div>
  
  <style>
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
  
    .login-card {
      background: white;
      padding: 2rem;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      text-align: center;
      max-width: 400px;
      width: 100%;
    }
  
    h1 {
      color: #333;
      margin-bottom: 1rem;
      font-size: 2rem;
    }
  
    p {
      color: #666;
      margin-bottom: 1.5rem;
    }
  
    .login-button {
      width: 100%;
      padding: 12px 24px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.3s;
    }
  
    .login-button:hover:not(:disabled) {
      background: #0056b3;
    }
  
    .login-button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  
    .error-message {
      background: #f8d7da;
      color: #721c24;
      padding: 10px;
      border-radius: 5px;
      margin-bottom: 1rem;
    }
  
    .info-text {
      margin-top: 1rem;
      font-size: 0.9rem;
    }
  
    .info-text p {
      color: #888;
      margin: 0;
    }
  </style>