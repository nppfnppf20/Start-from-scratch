<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { Quote, LineItem } from '$lib/stores/projectStore';

  export let quote: Quote;

  const dispatch = createEventDispatcher<{ 
    confirm: { selectedItems: LineItem[] }, 
    cancel: void 
  }>();

  let selectedItemsMap: { [key: number]: boolean } = {}; // Use index as key

  // Initialize the map when the component mounts or quote changes
  $: {
    selectedItemsMap = {}; // Reset when quote changes
    quote.lineItems.forEach((_, index) => {
      // By default, no items are selected when opening the modal for partial instruction
      selectedItemsMap[index] = false; 
    });
  }

  function handleConfirm() {
    const selectedItems = quote.lineItems.filter((_, index) => selectedItemsMap[index]);
    if (selectedItems.length === 0) {
        alert("Please select at least one line item to partially instruct.");
        return;
    }
    dispatch('confirm', { selectedItems });
  }

  function handleCancel() {
    dispatch('cancel');
  }

  $: totalSelectedCost = quote.lineItems.reduce((sum, item, index) => {
      return selectedItemsMap[index] ? sum + item.cost : sum;
  }, 0);

</script>

<div class="modal-overlay" on:click|self={handleCancel}>
  <div class="modal-content partially-instructed-modal">
    <div class="modal-header">
      <h2>Select Instructed Items for {quote.organisation}</h2>
      <button class="close-btn" on:click={handleCancel}>×</button>
    </div>
    <div class="modal-body">
      <p>Choose the line items to mark as instructed for this quote:</p>
      {#if quote.lineItems.length > 0}
        <ul class="items-list">
          {#each quote.lineItems as item, index (index)}
            <li class="item">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  bind:checked={selectedItemsMap[index]}
                />
                <span class="item-description">{item.description}</span>
              </label>
              <span class="item-cost">£{item.cost.toFixed(2)}</span>
            </li>
          {/each}
        </ul>
        <hr />
        <div class="total-display">
          <strong>Total Selected Cost:</strong>
          <span>£{totalSelectedCost.toFixed(2)}</span>
        </div>
      {:else}
        <p>No line items found for this quote.</p>
      {/if}
    </div>
    <div class="modal-footer">
      <button class="cancel-btn" on:click={handleCancel}>Cancel</button>
      <button class="confirm-btn" on:click={handleConfirm}>Confirm Selection</button>
    </div>
  </div>
</div>

<style>
  /* Base modal styles (can potentially be shared/imported) */
  .modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(0, 0, 0, 0.6); /* Slightly darker overlay */
    display: flex; justify-content: center; align-items: center;
    z-index: 1050; /* Ensure it's above other elements */
  }
  
  .modal-content {
    background-color: white; border-radius: 6px;
    width: 90%; max-width: 650px; /* Slightly wider */
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
    max-height: 85vh;
    display: flex; 
    flex-direction: column;
  }
  
  .modal-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 1rem 1.5rem; border-bottom: 1px solid #dee2e6;
    background-color: #f8f9fa; /* Light header background */
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
    flex-shrink: 0;
  }
  
  .modal-header h2 { font-size: 1.25rem; margin: 0; color: #343a40; }
  
  .close-btn {
    background: none; border: none; font-size: 1.75rem;
    cursor: pointer; color: #6c757d; line-height: 1;
    padding: 0.25rem;
  }
  .close-btn:hover {
    color: #343a40;
  }
  
  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex-grow: 1;
  }

  .modal-body p:first-child {
    margin-top: 0;
    margin-bottom: 1.5rem;
    color: #495057;
  }
  
  .modal-footer {
    padding: 1rem 1.5rem; border-top: 1px solid #dee2e6;
    display: flex; justify-content: flex-end;
    gap: 0.75rem;
    background-color: #f8f9fa; /* Light footer background */
    border-bottom-left-radius: 6px;
    border-bottom-right-radius: 6px;
    flex-shrink: 0;
  }

  /* List styles */
  .items-list {
      list-style: none;
      padding: 0;
      margin: 0 0 1.5rem 0; /* Add margin bottom */
      border: 1px solid #e9ecef;
      border-radius: 4px;
      overflow: hidden; /* Clip border radius */
  }

  .item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem; /* Adjust padding */
      border-bottom: 1px solid #e9ecef;
      background-color: #fff;
  }
  
  .item:last-child {
      border-bottom: none;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    cursor: pointer;
    flex-grow: 1;
    margin-right: 1rem; /* Space before cost */
  }

  .checkbox-label input[type="checkbox"] {
    margin-right: 0.75rem;
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
  
  .item-description {
      color: #333;
      line-height: 1.4;
  }
  
  .item-cost {
      font-weight: 500;
      color: #555;
      white-space: nowrap;
      background-color: #e9ecef; /* Subtle background for cost */
      padding: 0.2rem 0.5rem;
      border-radius: 3px;
      font-size: 0.9em;
  }

  hr {
      border: 0;
      border-top: 1px solid #dee2e6;
      margin: 1.5rem 0;
  }

  .total-display {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      font-size: 1.1rem;
      gap: 0.75rem;
      padding-top: 0; /* Remove padding top */
      color: #343a40;
  }
  .total-display span {
      font-weight: 600;
  }

  /* Button Styles */
  .cancel-btn, .confirm-btn {
    padding: 0.6rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 500;
    transition: background-color 0.2s, border-color 0.2s;
  }

  .cancel-btn {
    border: 1px solid #6c757d;
    background-color: white;
    color: #6c757d;
  }
  .cancel-btn:hover {
    background-color: #f8f9fa;
    border-color: #5a6268;
  }

  .confirm-btn {
    border: 1px solid #007bff;
    background-color: #007bff;
    color: white;
  }
  .confirm-btn:hover {
    background-color: #0069d9;
    border-color: #0062cc;
  }

</style> 