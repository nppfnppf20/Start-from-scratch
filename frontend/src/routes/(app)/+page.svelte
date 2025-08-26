<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    goto('/projectinfo', { replaceState: true });
  });
</script>

<p>Redirecting…</p>


