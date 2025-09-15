<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { isAuthenticated, userInfo, accessToken } from '$lib/stores/auth0';
    
    let redirecting = false;
    
    onMount(() => {
      console.log('=== CALLBACK PAGE LOADED ===');
      console.log('URL:', window.location.href);
      console.log('URL Search params:', window.location.search);
      
      // Check auth status every second
      const checkAuth = setInterval(() => {
        console.log('Callback checking auth status:');
        console.log('  - isAuthenticated:', $isAuthenticated);
        console.log('  - userInfo:', $userInfo);
        console.log('  - accessToken exists:', !!$accessToken);
        
        if ($isAuthenticated && $userInfo && !redirecting) {
          console.log('=== CALLBACK SUCCESS ===');
          console.log('User authenticated, redirecting...');
          console.log('User role:', $userInfo.role);
          console.log('User email:', $userInfo.email);
          
          redirecting = true;
          clearInterval(checkAuth);
          
          if ($userInfo.role === 'surveyor') {
            console.log('Redirecting surveyor to fee-quote-submission');
            goto('/fee-quote-submission');
          } else {
            console.log('Redirecting to main dashboard');
            goto('/');
          }
        }
      }, 1000);
      
      // Timeout after 15 seconds
      setTimeout(() => {
        if (!redirecting) {
          console.log('=== CALLBACK TIMEOUT ===');
          console.log('Auth did not complete in time, redirecting to login');
          clearInterval(checkAuth);
          goto('/login');
        }
      }, 15000);
    });
  </script>
  
  <div class="callback-container">
    <div class="callback-box">
      <div class="loading-spinner"></div>
      <h2>Completing login...</h2>
      <p>Please wait while we log you in and set up your dashboard.</p>
      
      <!-- Debug info visible on page -->
      <div class="debug-info">
        <p><strong>Debug Info:</strong></p>
        <p>Auth status: {$isAuthenticated ? 'Authenticated' : 'Not authenticated'}</p>
        <p>User: {$userInfo?.email || 'No user info'}</p>
        <p>Role: {$userInfo?.role || 'No role'}</p>
        <p>Token: {$accessToken ? 'Present' : 'Missing'}</p>
      </div>
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
      max-width: 500px;
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
      margin-bottom: 1rem;
    }
  
    .debug-info {
      background: #f8f9fa;
      border-radius: 4px;
      padding: 1rem;
      margin-top: 1.5rem;
      text-align: left;
      font-size: 0.9rem;
    }
  
    .debug-info p {
      margin: 0.5rem 0;
      color: #495057;
    }
  
    .debug-info strong {
      color: #212529;
    }
  </style>