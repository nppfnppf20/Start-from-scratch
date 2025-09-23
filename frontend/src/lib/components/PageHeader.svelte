<!-- frontend/src/lib/components/PageHeader.svelte -->
<script lang="ts">
  export let title: string;
  export let subtitle: string | undefined = undefined;
</script>

<div class="page-header-container">
  <div class="header-content">
    <h1 class="header-title">{title}</h1>
    {#if subtitle}
      <p class="header-subtitle">{subtitle}</p>
    {/if}
  </div>
  <div class="header-actions">
    <slot name="actions"></slot>
  </div>
</div>

<style>
  .page-header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 1rem;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #e2e8f0; /* Light gray border */
  }

  .header-content {
    flex-grow: 1;
  }

  .header-title {
    font-size: 2.25rem; /* ~text-4xl */
    font-weight: 600;   /* font-semibold */
    color: #1a202c;
    margin: 0;
  }

  .header-subtitle {
    color: #718096; /* ~text-gray-500 */
    margin-top: 0.5rem;
    font-size: 1.125rem;
  }

  .header-actions {
    /* Align actions with the content, provides spacing */
    margin-left: 1rem;
  }
</style> 