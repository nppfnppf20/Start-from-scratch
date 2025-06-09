<script lang="ts">
  import { verifyAndSetPassword } from '$lib/stores/authStore';
  import { goto } from '$app/navigation';

  let password = '';
  let errorMessage = '';
  let isLoading = false;

  async function handleLogin() {
    isLoading = true;
    errorMessage = '';
    const success = await verifyAndSetPassword(password);
    isLoading = false;

    if (success) {
      // On successful login, redirect to the homepage.
      goto('/');
    } else {
      errorMessage = 'The password provided was incorrect. Please try again.';
    }
  }
</script>

<div class="login-container">
  <div class="login-box">
    <h1>Enter Password</h1>
    <p>Please enter the site password to continue.</p>
    <form on:submit|preventDefault={handleLogin}>
      <div class="input-group">
        <label for="password">Password</label>
        <input 
          type="password" 
          id="password"
          bind:value={password}
          required
          disabled={isLoading}
        />
      </div>
      
      {#if errorMessage}
        <p class="error-message">{errorMessage}</p>
      {/if}

      <button type="submit" class="login-button" disabled={isLoading}>
        {#if isLoading}
          <span>Verifying...</span>
        {:else}
          <span>Unlock</span>
        {/if}
      </button>
    </form>
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

  .input-group {
    text-align: left;
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #444;
  }

  input {
    width: 100%;
    padding: 0.8rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box; /* Important */
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
</style>