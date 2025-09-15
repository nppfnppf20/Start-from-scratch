<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { initAuth0, isLoading, isAuthenticated, userInfo, accessToken } from '$lib/stores/auth0';
  
    onMount(async () => {
      console.log('ROOT Layout onMount called, browser:', browser);
      
      if (browser) {
        console.log('ROOT Layout: About to call initAuth0');
        try {
          await initAuth0();
          console.log('ROOT Layout: initAuth0 completed');
          
          // Debug the store values after initialization
          setTimeout(() => {
            console.log('=== AUTH0 STORE DEBUG ===');
            isLoading.subscribe(value => console.log('Store isLoading:', value));
            isAuthenticated.subscribe(value => console.log('Store isAuthenticated:', value));
            userInfo.subscribe(value => console.log('Store userInfo:', value));
            accessToken.subscribe(value => console.log('Store accessToken exists:', !!value));
            console.log('=== END DEBUG ===');
          }, 500);
          
          // Also debug every 2 seconds to see if stores update
          setInterval(() => {
            console.log('Periodic check - Auth:', $isAuthenticated, 'User:', $userInfo?.email);
          }, 2000);
          
        } catch (error) {
          console.error('ROOT Layout: initAuth0 failed:', error);
        }
      }
    });
  </script>
  
  <slot />