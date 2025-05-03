<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { format, parseISO } from 'date-fns';
  import type { ProgrammeEvent } from '$lib/stores/projectStore'; // Import type

  export let showModal: boolean = false; // Controlled externally
  export let initialDate: Date | null = null; // Can be null if editing
  export let eventToEdit: ProgrammeEvent | null = null; // Event being edited

  // Define color options
  const colorOptions = [
    '#0d6efd', // Bootstrap Primary Blue
    '#198754', // Bootstrap Success Green
    '#ffc107', // Bootstrap Warning Yellow
    '#dc3545', // Bootstrap Danger Red
    '#6c757d'  // Bootstrap Secondary Gray
  ];
  
  // Local state for form fields
  let title: string = '';
  let dateStr: string = ''; 
  let color: string = colorOptions[0]; 
  let eventId: string | null = null; // Track the ID for editing/deleting

  const dispatch = createEventDispatcher<{ 
    save: { title: string; date: string; color: string; id?: string }; // Add optional id
    cancel: void; 
    delete: { id: string }; // Add delete event
  }>();

  let dialog: HTMLDialogElement;

  // Reactive logic to initialize form based on props
  $: {
    if (eventToEdit) {
      // Editing existing event
      title = eventToEdit.title;
      dateStr = eventToEdit.date; // Assumes date is already YYYY-MM-DD string
      color = eventToEdit.color;
      eventId = eventToEdit.id;
    } else {
      // Adding new event
      resetForm(initialDate); // Use initialDate for adding
      eventId = null;
    }
  }

  // Use dialog element for better accessibility and management
  $: if (dialog && showModal) dialog.showModal();
  $: if (dialog && !showModal) dialog.close();

  function handleSave() {
    if (!title || !dateStr || !color) {
      alert('Please fill in all fields.');
      return;
    }
    // Include id only if we are editing (eventId is not null)
    const detail: { title: string; date: string; color: string; id?: string } = {
        title,
        date: dateStr,
        color
    };
    if (eventId) {
        detail.id = eventId;
    }
    dispatch('save', detail);
    // Don't reset form here, parent closes modal which triggers reset via reactive block
  }

  function handleCancel() {
    dispatch('cancel');
    // Reset is handled reactively when eventToEdit/initialDate potentially change
  }

  function handleDelete() {
    if (eventId && confirm('Are you sure you want to delete this key date?')) {
      dispatch('delete', { id: eventId });
    }
    // Parent handles closing the modal
  }

  // Reset form fields, optionally using a date
  function resetForm(dateForReset: Date | null = null) {
    title = '';
    // Use provided date or today if null
    dateStr = format(dateForReset ?? new Date(), 'yyyy-MM-dd'); 
    color = colorOptions[0]; // Reset to default color
    eventId = null; // Ensure ID is cleared on reset
  }
  
  // Handle closing via Escape key or clicking backdrop (default dialog behavior)
  function handleDialogClose() {
      if (showModal) { // Only dispatch cancel if modal was meant to be open
          dispatch('cancel');
      }
      // Form state is reset reactively based on props changing
  }

  // No longer need the reactive block to reset based on showModal
  /*
  $: if (!showModal) {
      // Resetting is now handled by the main reactive block
  }
  */

</script>

<dialog bind:this={dialog} on:close={handleDialogClose} class="key-date-modal">
  <form method="dialog" on:submit|preventDefault={handleSave}>
    <h2>{eventId ? 'Edit Key Date' : 'Add New Key Date'}</h2>
    
    <div class="form-group">
      <label for="key-date-title">Title:</label>
      <input type="text" id="key-date-title" bind:value={title} required />
    </div>

    <div class="form-group">
      <label for="key-date-date">Date:</label>
      <input type="date" id="key-date-date" bind:value={dateStr} required />
    </div>

    <div class="form-group">
      <label>Color:</label>
      <div class="color-options-container">
          {#each colorOptions as option (option)}
              <button 
                  type="button"
                  class="color-swatch"
                  class:selected={color === option} 
                  style="background-color: {option};"
                  on:click={() => color = option}
                  aria-label="Select color {option}"
                  title="Select color {option}"
              >
                 {#if color === option}✓{/if}
              </button>
          {/each}
      </div>
    </div>

    <div class="modal-actions">
      {#if eventId} 
          <button type="button" class="danger" on:click={handleDelete}>Delete</button>
          <div style="flex-grow: 1;"></div> 
      {/if}
      <button type="button" on:click={handleCancel}>Cancel</button>
      <button type="submit" class="primary">{eventId ? 'Update' : 'Save'} Key Date</button>
    </div>
  </form>
</dialog>

<style>
  .key-date-modal {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 1.5rem 2rem;
    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
    min-width: 350px;
    max-width: 90vw; /* Ensure it doesn't get too wide */
  }
  
  /* Style backdrop */
  .key-date-modal::backdrop {
      background-color: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(2px);
  }

  h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    font-size: 1.4rem;
    color: #333;
    text-align: center;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.4rem;
    font-weight: bold;
    font-size: 0.9rem;
    color: #555;
  }

  .form-group input[type="text"],
  .form-group input[type="date"] {
    width: 100%;
    padding: 0.6rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box; 
    font-size: 1rem;
  }
  
  .color-options-container {
      display: flex;
      gap: 0.5rem; /* Space between swatches */
      align-items: center;
  }

  .color-swatch {
      width: 30px;
      height: 30px;
      border-radius: 50%; /* Make them circular */
      border: 2px solid #fff; /* White border */
      cursor: pointer;
      box-shadow: 0 0 0 1px #ccc; /* Subtle outer border */
      transition: transform 0.1s ease, box-shadow 0.1s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      color: white; /* Color for checkmark */
      text-shadow: 1px 1px 1px rgba(0,0,0,0.5); /* Shadow for checkmark */
  }
  
  .color-swatch:hover {
      transform: scale(1.1);
  }

  .color-swatch.selected {
      box-shadow: 0 0 0 2px #0d6efd; /* Blue border for selected */
      transform: scale(1.1);
  }

  .modal-actions {
    margin-top: 1.5rem;
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  .modal-actions button {
    padding: 0.6rem 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    background-color: #f8f9fa;
    transition: background-color 0.2s ease;
  }
  .modal-actions button:hover {
    background-color: #e2e6ea;
  }

  .modal-actions button.primary {
    background-color: #0d6efd;
    color: white;
    border-color: #0d6efd;
  }
  .modal-actions button.primary:hover {
    background-color: #0b5ed7;
  }
  
  /* Add styles for delete button */
  .modal-actions button.danger {
      background-color: #dc3545; 
      color: white;
      border-color: #dc3545;
  }
  .modal-actions button.danger:hover {
      background-color: #bb2d3b;
  }
</style> 