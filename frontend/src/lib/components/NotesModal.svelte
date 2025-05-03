<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  export let initialNotes: string | undefined = '';
  export let organisationName: string = 'Surveyor'; // Default value

  const dispatch = createEventDispatcher<{
    save: { notes: string },
    cancel: void
  }>();

  let notes = '';
  let textareaElement: HTMLTextAreaElement;

  // Initialize notes when component mounts or initialNotes changes
  $: notes = initialNotes || '';

  function handleSave() {
    dispatch('save', { notes });
  }

  function handleCancel() {
    dispatch('cancel');
  }

  // Focus textarea when modal opens
  onMount(() => {
    if (textareaElement) {
      textareaElement.focus();
    }
  });

</script>

<div class="modal-overlay" on:click|self={handleCancel}>
  <div class="modal-content notes-modal">
    <div class="modal-header">
      <h2>Notes for {organisationName}</h2>
      <button class="close-btn" on:click={handleCancel}>×</button>
    </div>
    <div class="modal-body">
      <textarea
        bind:this={textareaElement}
        bind:value={notes}
        placeholder="Enter notes here..."
        rows="10"
      ></textarea>
    </div>
    <div class="modal-footer">
      <button class="cancel-btn" on:click={handleCancel}>Cancel</button>
      <button class="save-btn" on:click={handleSave}>Save Notes</button>
    </div>
  </div>
</div>

<style>
  /* Basic Modal Styles (reuse or adapt from existing modals) */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1050; /* Ensure it's above other elements if needed */
  }

  .modal-content {
    background-color: white;
    border-radius: 5px;
    width: 90%;
    max-width: 600px; /* Adjust width as needed */
    max-height: 80vh;
    overflow: hidden; /* Prevent content overflow */
    display: flex;
    flex-direction: column;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e9ecef;
  }

  .modal-header h2 {
    font-size: 1.3rem;
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6c757d;
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto; /* Allow scrolling for body content if needed */
    flex-grow: 1;
  }

  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 1rem;
    font-family: inherit;
    resize: vertical; /* Allow vertical resizing */
  }

  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e9ecef;
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }

  /* Button Styles (reuse or adapt) */
  .cancel-btn, .save-btn {
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

  .save-btn {
    border: 1px solid #007bff;
    background-color: #007bff;
    color: white;
  }
  .save-btn:hover {
    background-color: #0069d9;
    border-color: #0062cc;
  }
</style> 