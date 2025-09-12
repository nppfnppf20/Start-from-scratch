<script lang="ts">
  import { onMount } from 'svelte';
  
  // The Auth0 store handles the callback automatically in its initialization
  // This page just shows a loading state while that happens
  
  onMount(() => {
    // The auth0Store will handle the callback and redirect automatically
  });
</script>

<div class="callback-container">
  <div class="loading-spinner"></div>
  <p>Completing login...</p>
</div>

<style>
  .callback-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background-color: #f0f2f5;
    font-family: sans-serif;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  p {
    color: #666;
    font-size: 1.1rem;
  }
</style>
