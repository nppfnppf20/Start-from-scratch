<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { format } from 'date-fns';

  export let showModal: boolean = false; // Controlled externally
  export let initialDate: Date | null = null; // Pre-filled date from clicked week
  export let quoteId: string = ''; // The surveyor quote ID
  export let surveyorName: string = ''; // For display in modal title
  export let customDateToEdit: any = null; // Custom date being edited (if any)

  // Define color options with grey as default
  const colorOptions = [
    '#6c757d', // Bootstrap Secondary Gray - DEFAULT
    '#0d6efd', // Bootstrap Primary Blue
    '#198754', // Bootstrap Success Green
    '#ffc107', // Bootstrap Warning Yellow
    '#dc3545', // Bootstrap Danger Red
    '#8b5cf6', // Purple
    '#f97316', // Orange
    '#14b8a6'  // Teal
  ];
  
  // Local state for form fields
  let title: string = '';
  let dateStr: string = ''; 
  let color: string = colorOptions[0]; // Default to grey
  let customDateId: string | null = null; // Track the ID for editing/deleting

  const dispatch = createEventDispatcher<{ 
    save: { title: string; date: string; color: string; quoteId: string; id?: string }; 
    cancel: void; 
    delete: { id: string; quoteId: string };
  }>();

  let dialog: HTMLDialogElement;

  // Reactive logic to initialize form based on props
  $: {
    if (customDateToEdit) {
      // Editing existing custom date
      title = customDateToEdit.title;
      dateStr = customDateToEdit.date;
      color = customDateToEdit.color || colorOptions[0];
      customDateId = customDateToEdit.id;
    } else if (showModal && initialDate) {
      // Adding new custom date
      resetForm(initialDate);
      customDateId = null;
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
    
    // Include id only if we are editing (customDateId is not null)
    const detail: { title: string; date: string; color: string; quoteId: string; id?: string } = {
      title,
      date: dateStr,
      color,
      quoteId
    };
    if (customDateId) {
      detail.id = customDateId;
    }
    
    dispatch('save', detail);
    // Don't reset form here, parent closes modal which triggers reset via reactive block
  }

  function handleCancel() {
    dispatch('cancel');
  }

  function handleDelete() {
    if (customDateId && confirm('Are you sure you want to delete this custom date?')) {
      dispatch('delete', { id: customDateId, quoteId });
    }
    // Parent handles closing the modal
  }

  // Reset form fields, optionally using a date
  function resetForm(dateForReset: Date | null = null) {
    title = '';
    // Use provided date or today if null
    dateStr = format(dateForReset ?? new Date(), 'yyyy-MM-dd'); 
    color = colorOptions[0]; // Reset to default grey color
  }
  
  // Handle closing via Escape key or clicking backdrop (default dialog behavior)
  function handleDialogClose() {
      if (showModal) { // Only dispatch cancel if modal was meant to be open
          dispatch('cancel');
      }
  }

</script>

<dialog bind:this={dialog} on:close={handleDialogClose} class="surveyor-date-modal">
  <form method="dialog" on:submit|preventDefault={handleSave}>
    <h2>{customDateId ? 'Edit Surveyor Date' : 'Add Surveyor Date'}</h2>
    <p class="surveyor-info">{customDateId ? 'Editing' : 'Adding'} date for: <strong>{surveyorName}</strong></p>
    
    <div class="form-group">
      <label for="surveyor-date-title">Title:</label>
      <input type="text" id="surveyor-date-title" bind:value={title} placeholder="e.g., Site Visit, Report Due" required />
    </div>

    <div class="form-group">
      <label for="surveyor-date-date">Date:</label>
      <input type="date" id="surveyor-date-date" bind:value={dateStr} required />
    </div>

    <div class="form-group">
      <span class="form-label">Color:</span>
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
      {#if customDateId} 
          <button type="button" class="danger" on:click={handleDelete}>Delete</button>
          <div style="flex-grow: 1;"></div> 
      {/if}
      <button type="button" on:click={handleCancel}>Cancel</button>
      <button type="submit" class="primary">{customDateId ? 'Update' : 'Save'} Date</button>
    </div>
  </form>
</dialog>

<style>
  .surveyor-date-modal {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 1.5rem 2rem;
    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
    min-width: 350px;
    max-width: 90vw; /* Ensure it doesn't get too wide */
  }
  
  /* Style backdrop */
  .surveyor-date-modal::backdrop {
      background-color: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(2px);
  }

  h2 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    font-size: 1.4rem;
    color: #333;
    text-align: center;
  }

  .surveyor-info {
    text-align: center;
    margin-bottom: 1.5rem;
    color: #666;
    font-size: 0.9rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label,
  .form-group .form-label {
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
      flex-wrap: wrap; /* Allow wrapping for more colors */
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
      box-shadow: 0 0 0 2px #6c757d; /* Grey border for selected (matches default) */
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
    background-color: #6c757d; /* Grey primary button to match theme */
    color: white;
    border-color: #6c757d;
  }
  .modal-actions button.primary:hover {
    background-color: #5a6268;
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