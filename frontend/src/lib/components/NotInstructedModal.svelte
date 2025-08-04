<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Quote } from '$lib/stores/projectStore';

  export let quote: Quote;
  export let isOpen = false;

  const dispatch = createEventDispatcher<{
    confirm: void;
    cancel: void;
  }>();

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      dispatch('cancel');
    }
  }

  function handleConfirm() {
    dispatch('confirm');
  }

  function handleCancel() {
    dispatch('cancel');
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="modal-overlay" on:click={handleCancel} on:keydown={handleKeydown}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Confirm Not Instructed</h2>
        <button type="button" class="close-btn" on:click={handleCancel} aria-label="Close">
          &times;
        </button>
      </div>
      
      <div class="modal-body">
        <!-- Surveyor Summary -->
        <div class="surveyor-summary">
          <h3>Surveyor Details</h3>
          <p><strong>Contact:</strong> {quote.contactName}</p>
          <p><strong>Email:</strong> {quote.email || 'No email provided'}</p>
          <p><strong>Organisation:</strong> {quote.organisation}</p>
          <p><strong>Discipline:</strong> {quote.discipline}</p>
        </div>

        <!-- Warning Message -->
        <div class="warning-message">
          <p>
            <strong>Confirm surveyor will not be instructed?</strong>
          </p>
          <p>
            This will remove their permission to access the project and set the instruction status to "will not be instructed".
          </p>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="cancel-btn" on:click={handleCancel}>
          Cancel
        </button>
        <button type="button" class="confirm-btn" on:click={handleConfirm}>
          Confirm
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Modal Overlay */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  /* Modal Content */
  .modal-content {
    background-color: white;
    border-radius: 8px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
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
    color: #343a40;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6c757d;
    transition: color 0.2s;
  }

  .close-btn:hover {
    color: #343a40;
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex-grow: 1;
  }

  /* Surveyor Summary */
  .surveyor-summary {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 4px;
    border-left: 4px solid #007bff;
  }

  .surveyor-summary h3 {
    margin: 0 0 0.5rem 0;
    color: #495057;
    font-size: 1.1rem;
  }

  .surveyor-summary p {
    margin: 0.25rem 0;
    color: #6c757d;
  }

  /* Warning Message */
  .warning-message {
    padding: 1rem;
    background-color: #fff3cd;
    border-radius: 4px;
    border-left: 4px solid #ffc107;
  }

  .warning-message p {
    margin: 0.5rem 0;
    color: #856404;
  }

  .warning-message p:first-child {
    font-weight: 600;
    color: #721c24;
  }

  /* Modal Footer */
  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e9ecef;
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }

  /* Button Styles */
  .cancel-btn, .confirm-btn {
    padding: 0.6rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 500;
    transition: background-color 0.2s, border-color 0.2s;
    border: 1px solid;
  }

  .cancel-btn {
    border-color: #6c757d;
    background-color: white;
    color: #6c757d;
  }

  .cancel-btn:hover {
    background-color: #f8f9fa;
    border-color: #5a6268;
  }

  .confirm-btn {
    border-color: #dc3545;
    background-color: #dc3545;
    color: white;
  }

  .confirm-btn:hover {
    background-color: #c82333;
    border-color: #bd2130;
  }
</style>