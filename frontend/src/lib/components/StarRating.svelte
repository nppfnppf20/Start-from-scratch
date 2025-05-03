<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let value: number | undefined = 0; // Current rating (0-5)
  export let readonly = false; // If true, cannot be changed
  export let maxRating = 5;

  const dispatch = createEventDispatcher<{ update: number }>();

  let hoverRating = 0;

  function handleClick(starIndex: number) {
    if (readonly) return;
    const newValue = starIndex + 1;
    // If clicking the same star again, reset to 0 (or handle differently if needed)
    value = value === newValue ? 0 : newValue;
    dispatch('update', value);
  }

  function handleMouseOver(starIndex: number) {
    if (readonly) return;
    hoverRating = starIndex + 1;
  }

  function handleMouseLeave() {
    if (readonly) return;
    hoverRating = 0;
  }
</script>

<div class="star-rating-container" class:readonly on:mouseleave={handleMouseLeave}>
  {#each { length: maxRating } as _, i}
    {@const starValue = i + 1}
    {@const isFilled = (hoverRating > 0 ? hoverRating : value ?? 0) >= starValue}
    <button 
      type="button" 
      class="star-button" 
      class:filled={isFilled}
      class:hovered={hoverRating >= starValue}
      disabled={readonly}
      on:click={() => handleClick(i)}
      on:mouseover={() => handleMouseOver(i)}
      aria-label={`Rate ${starValue} out of ${maxRating}`}
    >
      {isFilled ? '★' : '☆'}
    </button>
  {/each}
</div>

<style>
  .star-rating-container {
    display: inline-flex;
    align-items: center;
    line-height: 1;
  }

  .star-button {
    background: none;
    border: none;
    padding: 0 1px; /* Minimal horizontal padding */
    margin: 0;
    font-size: 1.3rem; /* Adjust star size */
    color: #ccc; /* Empty star color */
    cursor: pointer;
    transition: color 0.2s ease, transform 0.1s ease;
  }

  .star-button.filled {
    color: #ffc107; /* Filled star color */
  }

  .star-rating-container:not(.readonly) .star-button:hover {
     color: #f5b301; /* Hover color */
     transform: scale(1.1);
  }
  
  /* Dim stars slightly when readonly */
  .star-rating-container.readonly .star-button {
      cursor: default;
      opacity: 0.8;
  }
</style> 