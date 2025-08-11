<script lang="ts">
  import LineItemsModal from '$lib/components/LineItemsModal.svelte';
  import type { LineItem } from '$lib/stores/projectStore';

  export let items: LineItem[] = [];
  export let organisationName: string;
  let open = false;
</script>

<button type="button" class="line-items-button" title="View Line Items" on:click={() => (open = true)} aria-label={`View ${items.length} line items`}>
  {items.length}
  <span class="plus-sign">+</span>
</button>

{#if open}
  <LineItemsModal items={items} {organisationName} on:close={() => (open = false)} />
{/if}

<style>
  .line-items-button { background-color: #f1f3f5; border: 1px solid #dee2e6; border-radius: 9999px; padding: 0.2rem 0.6rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; }
  .line-items-button:hover { background-color: #e9ecef; border-color: #adb5bd; }
  .plus-sign { font-weight: bold; }
</style>

