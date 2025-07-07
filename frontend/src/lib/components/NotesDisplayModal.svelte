<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let notes = '';
  export let organisationName = 'Surveyor';
  export let modalType: 'holdUp' | 'surveyor' = 'holdUp';
  export let editable = false; // New prop to enable editing
  export let quoteId = ''; // New prop needed for saving

  const dispatch = createEventDispatcher();

  // Edit mode state
  let isEditing = false;
  let editedNotes = notes;

  // Reset edited notes when notes prop changes
  $: editedNotes = notes;

  function closeModal() {
    isEditing = false; // Reset edit mode when closing
    dispatch('close');
  }

  function startEditing() {
    isEditing = true;
    editedNotes = notes; // Reset to current notes
  }

  function cancelEditing() {
    isEditing = false;
    editedNotes = notes; // Reset to original notes
  }

  async function saveNotes() {
    // Dispatch save event to parent component
    dispatch('save', {
      quoteId,
      notes: editedNotes.trim(),
      modalType
    });
    isEditing = false;
  }

  // Dynamic title and prefix based on modal type
  $: modalTitle = modalType === 'holdUp' ? `Hold Up Notes for ${organisationName}` : `Surveyor Notes for ${organisationName}`;
  $: notesPrefix = modalType === 'holdUp' ? 'Hold Up:' : 'Surveyor Notes:';
  $: canEdit = editable; // Allow editing for both types when editable prop is true
</script>

<div class="modal-backdrop" on:click={closeModal}>
  <div class="modal-content" on:click|stopPropagation>
    <div class="modal-header">
      <h2>{modalTitle}</h2>
      <div class="header-buttons">
        {#if canEdit && !isEditing}
          <button on:click={startEditing} class="edit-button" title="Edit notes">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
            </svg>
          </button>
        {/if}
        <button on:click={closeModal} class="close-button">&times;</button>
      </div>
    </div>
    <div class="modal-body">
      <p class="notes-prefix">{notesPrefix}</p>
      {#if isEditing}
        <textarea 
          bind:value={editedNotes}
          class="notes-textarea"
          placeholder="Enter notes..."
          rows="6"
        ></textarea>
      {:else}
        <div class="notes-display">
          {notes || 'No notes available.'}
        </div>
      {/if}
    </div>
    <div class="modal-footer">
      {#if isEditing}
        <div class="edit-buttons">
          <button on:click={cancelEditing} class="cancel-button">Cancel</button>
          <button on:click={saveNotes} class="save-button">Save</button>
        </div>
      {:else}
        <button on:click={closeModal}>Close</button>
      {/if}
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

  .header-buttons {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .edit-button {
    background: none;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    padding: 0.5rem;
    cursor: pointer;
    color: #6b7280;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .edit-button:hover {
    background-color: #f3f4f6;
    color: #374151;
    border-color: #9ca3af;
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
    white-space: pre-wrap;
    word-wrap: break-word;
    font-size: 0.95rem;
    color: #374151;
    min-height: 100px;
  }

  .notes-textarea {
    width: 100%;
    background-color: #ffffff;
    border: 2px solid #3b82f6;
    border-radius: 6px;
    padding: 1rem;
    font-size: 0.95rem;
    color: #374151;
    resize: vertical;
    min-height: 120px;
    font-family: inherit;
  }

  .notes-textarea:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid #e5e7eb;
    padding-top: 1rem;
  }

  .edit-buttons {
    display: flex;
    gap: 0.75rem;
  }

  .modal-footer button, .cancel-button, .save-button {
    padding: 0.6rem 1.2rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
  }

  .modal-footer button {
    background-color: #3b82f6;
    color: white;
  }

  .modal-footer button:hover {
    background-color: #2563eb;
  }

  .cancel-button {
    background-color: #6b7280;
    color: white;
  }

  .cancel-button:hover {
    background-color: #4b5563;
  }

  .save-button {
    background-color: #10b981;
    color: white;
  }

  .save-button:hover {
    background-color: #059669;
  }
</style> 