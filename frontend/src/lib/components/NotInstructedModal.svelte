<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Quote } from '$lib/stores/projectStore';
  import { selectedProject } from '$lib/stores/projectStore';

  export let quote: Quote;
  export let isOpen = false;

  const dispatch = createEventDispatcher<{
    confirm: void;
    cancel: void;
  }>();

  // Editable email fields
  let emailTo = '';
  let emailSubject = '';
  let emailBody = '';

  // Track if email has been initialized to prevent re-initialization
  let emailInitialized = false;

  // Initialize email content when modal opens
  $: if (isOpen && quote && !emailInitialized) {
    emailTo = quote.email || '';
    emailSubject = `Project Update - ${quote.discipline} - ${$selectedProject?.name || 'Project'}`;
    
    emailBody = `<mark>${quote.contactName}</mark><br/><br/>

I wanted to let you know that unfortunately the client has chosen not to instruct the quoted works on the <strong>${$selectedProject?.name || '<mark>[Project Name]</mark>'}</strong> scheme at <strong>${$selectedProject?.address || '<mark>[Site Address]</mark>'}</strong>.<br/><br/>

Please do let us know if you have any questions. We look forward to working with you again in the future.<br/><br/>

Many thanks.`;
    
    emailInitialized = true;
  }

  // Reset initialization flag when modal closes
  $: if (!isOpen) {
    emailInitialized = false;
  }

  function handleOpenEmail() {
    if (!emailTo) {
      alert('Email address is required.');
      return;
    }

    // Convert HTML body to plain text for mailto link
    const plainTextBody = emailBody
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<mark[^>]*>/gi, '') // remove opening mark tag
      .replace(/<\/mark>/gi, '') // remove closing mark tag
      .replace(/<[^>]+>/g, '') // strip remaining html tags
      .trim();

    const mailtoLink = `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(plainTextBody)}`;
    window.open(mailtoLink, '_self');
  }

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
        <h2>Not Instructed Email</h2>
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

        <!-- Email Draft Section -->
        <div class="email-draft">
          <h3>Email Draft</h3>
          
          <div class="email-field">
            <label for="email-to">To:</label>
            <input
              id="email-to"
              type="email"
              bind:value={emailTo}
              placeholder="Enter email address"
            />
          </div>

          <div class="email-field">
            <label for="email-subject">Subject:</label>
            <input
              id="email-subject"
              type="text"
              bind:value={emailSubject}
              placeholder="Enter subject"
            />
          </div>

          <div class="email-field">
            <label for="email-body">Email Body:</label>
            <div
              id="email-body"
              class="email-body-editor"
              contenteditable="true"
              bind:innerHTML={emailBody}
            ></div>
          </div>
        </div>

        <!-- Instructions -->
        <div class="instructions">
          <p><strong>Instructions:</strong></p>
          <ul>
            <li>Click "Open Email Client" below to open the email in your default client</li>
            <li>Edit the email content as needed in your email client (or alternatively edit the email here in the browser before clicking the 'Open Email' button)</li>
            <li>Items highlighted in <mark>yellow</mark> and within [ ] may need your attention</li>
            <li>Click "Confirm Not Instructed" button below when done. This will remove the surveyor's project access and set status to 'Will Not Be Instructed'</li>
          </ul>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="cancel-btn" on:click={handleCancel}>
          Cancel
        </button>
        <button type="button" class="email-btn" on:click={handleOpenEmail}>
          Open Email Client
        </button>
        <button type="button" class="confirm-btn" on:click={handleConfirm}>
          Confirm Not Instructed
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

  /* Email Draft Section */
  .email-draft {
    margin-bottom: 1.5rem;
  }

  .email-draft h3 {
    font-size: 1.1rem;
    margin: 0 0 1rem 0;
    color: #495057;
    border-bottom: 2px solid #e9ecef;
    padding-bottom: 0.5rem;
  }

  .email-field {
    margin-bottom: 1rem;
  }

  .email-field label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #495057;
  }

  .email-field input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .email-field input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }

  .email-body-editor {
    min-height: 200px;
    padding: 0.75rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    background-color: white;
    font-family: inherit;
    font-size: 0.9rem;
    line-height: 1.5;
    overflow-y: auto;
  }

  .email-body-editor:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }

  /* Instructions Section */
  .instructions {
    padding: 1rem;
    background-color: #fff3cd;
    border-radius: 4px;
    border-left: 4px solid #ffc107;
    margin-bottom: 1rem;
  }

  .instructions p {
    margin: 0 0 0.5rem 0;
    color: #856404;
    font-weight: 600;
  }

  .instructions ul {
    margin: 0;
    padding-left: 1.5rem;
    color: #856404;
  }

  .instructions li {
    margin-bottom: 0.25rem;
  }

  /* Global styles for mark elements in the email editor */
  :global(.email-body-editor mark) {
    background-color: yellow;
    padding: 0.1em;
    border-radius: 3px;
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
  .cancel-btn, .email-btn, .confirm-btn {
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

  .email-btn {
    border-color: #007bff;
    background-color: #007bff;
    color: white;
  }

  .email-btn:hover {
    background-color: #0056b3;
    border-color: #004085;
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