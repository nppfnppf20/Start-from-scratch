<script lang="ts">
    import { onMount } from 'svelte';
    import { auth0Store } from '$lib/stores/auth0Store';

    onMount(async () => {
        await auth0Store.login();
    });
</script>

<p>Redirecting to Auth0…</p>


