<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import auth from '../authService';
    import { setGlobalAuth0Client } from '$lib/stores/authHelpers';

    let auth0Client;

    onMount(async () => {
      if (browser) {
        auth0Client = await auth.createClient();
        setGlobalAuth0Client(auth0Client); // Make client available to auth helpers
        await auth.initializeAuth(auth0Client);
      }
    });
  </script>
  
  <slot />