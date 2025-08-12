<script lang="ts">
  export let title: string;
  export let description: string | undefined = undefined;
</script>

<section class="form-section">
  <h2>{title}</h2>
  {#if description}
    <p class="section-desc">{description}</p>
  {/if}
  <div class="form-grid">
    <slot />
  </div>
</section>

