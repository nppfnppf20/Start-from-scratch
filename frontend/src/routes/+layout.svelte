<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { initAuth0 } from '$lib/stores/auth0';
  
    onMount(async () => {
      console.log('ROOT Layout onMount called, browser:', browser);
      
      if (browser) {
        console.log('ROOT Layout: About to call initAuth0');
        try {
          await initAuth0();
          console.log('ROOT Layout: initAuth0 completed');
        } catch (error) {
          console.error('ROOT Layout: initAuth0 failed:', error);
        }
      }
    });
  </script>
  
  <slot />