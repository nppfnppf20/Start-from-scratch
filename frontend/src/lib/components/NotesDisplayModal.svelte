<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let notes = '';
  export let organisationName = 'Surveyor';
  export let modalType: 'holdUp' | 'surveyor' = 'holdUp'; // New prop to determine modal type

  const dispatch = createEventDispatcher();

  function closeModal() {
    dispatch('close');
  }

  // Dynamic title and prefix based on modal type
  $: modalTitle = modalType === 'holdUp' ? `Hold Up Notes for ${organisationName}` : `Surveyor Notes for ${organisationName}`;
  $: notesPrefix = modalType === 'holdUp' ? 'Hold Up:' : 'Surveyor Notes:';
</script>

<div class="modal-backdrop" on:click={closeModal}>
  <div class="modal-content" on:click|stopPropagation>
    <div class="modal-header">
      <h2>{modalTitle}</h2>
      <button on:click={closeModal} class="close-button">&times;</button>
    </div>
    <div class="modal-body">
      <p class="notes-prefix">{notesPrefix}</p>
      <div class="notes-display">
        {notes}
      </div>
    </div>
    <div class="modal-footer">
      <button on:click={closeModal}>Close</button>
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    width: 90%;
    max-width: 600px;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
  }

  .modal-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 2rem;
    cursor: pointer;
    color: #6b7280;
    line-height: 1;
  }

  .modal-body {
    flex-grow: 1;
    margin-bottom: 1.5rem;
  }
  
  .notes-prefix {
    font-weight: bold;
    font-size: 1.1rem;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .notes-display {
    background-color: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 1rem;
    white-space: pre-wrap; /* Preserves whitespace and wraps text */
    word-wrap: break-word;
    font-size: 0.95rem;
    color: #374151;
    min-height: 100px;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid #e5e7eb;
    padding-top: 1rem;
  }

  .modal-footer button {
    background-color: #3b82f6;
    color: white;
    padding: 0.6rem 1.2rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
  }
  
  .modal-footer button:hover {
    background-color: #2563eb;
  }
</style> 