<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { LineItem } from '$lib/stores/projectStore'; // Import the type

  export let items: LineItem[];
  export let organisationName: string;

  const dispatch = createEventDispatcher<{ close: void }>();

  function handleClose() {
    dispatch('close');
  }
  
  $: total = items.reduce((sum, item) => sum + item.cost, 0);

</script>

<div class="modal-overlay" on:click|self={handleClose}>
  <div class="modal-content line-items-modal">
    <div class="modal-header">
      <h2>Line Items for {organisationName}</h2>
      <button class="close-btn" on:click={handleClose}>×</button>
    </div>
    <div class="modal-body">
      {#if items.length > 0}
        <ul class="items-list">
          {#each items as item, index}
            <li class="item">
              <span class="item-description">{index + 1}. {item.description}</span>
              <span class="item-cost">£{item.cost.toFixed(2)}</span>
            </li>
          {/each}
        </ul>
        <hr />
        <div class="total-display">
          <strong>Total (excl. VAT):</strong>
          <span>£{total.toFixed(2)}</span>
        </div>
      {:else}
        <p>No line items found for this quote.</p>
      {/if}
    </div>
    <div class="modal-footer">
      <button class="close-footer-btn" on:click={handleClose}>Close</button>
    </div>
  </div>
</div>

<style>
  /* Adapted modal styles */
  .modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex; justify-content: center; align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background-color: white; border-radius: 5px;
    width: 90%; max-width: 600px; /* Adjust width */
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    max-height: 80vh;
    display: flex; 
    flex-direction: column;
  }
  
  .modal-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 1rem 1.5rem; border-bottom: 1px solid #e9ecef;
    flex-shrink: 0;
  }
  
  .modal-header h2 { font-size: 1.3rem; margin: 0; }
  
  .close-btn {
    background: none; border: none; font-size: 1.5rem;
    cursor: pointer; color: #6c757d; line-height: 1;
  }
  
  .modal-body {
    padding: 1.5rem;
    overflow-y: auto; /* Allow body scroll */
    flex-grow: 1;
  }
  
  .modal-footer {
    padding: 1rem 1.5rem; border-top: 1px solid #e9ecef;
    display: flex; justify-content: flex-end;
    flex-shrink: 0;
  }

  .items-list {
      list-style: none;
      padding: 0;
      margin: 0;
  }

  .item {
      display: flex;
      justify-content: space-between;
      padding: 0.6rem 0;
      border-bottom: 1px solid #f0f0f0;
  }
  
  .item:last-child {
      border-bottom: none;
  }
  
  .item-description {
      color: #333;
  }
  
  .item-cost {
      font-weight: 500;
      color: #555;
      white-space: nowrap;
      margin-left: 1rem;
  }

  hr {
      border: 0;
      border-top: 1px solid #e0e0e0;
      margin: 1rem 0;
  }

  .total-display {
      display: flex;
      justify-content: flex-end;
      font-size: 1.1rem;
      gap: 0.5rem;
      padding-top: 0.5rem;
  }

  .close-footer-btn {
    padding: 0.6rem 1.5rem; border: 1px solid #ced4da;
    background-color: white; border-radius: 4px;
    color: #495057; cursor: pointer; font-size: 1rem;
  }
  .close-footer-btn:hover { background-color: #f8f9fa; }

</style> 