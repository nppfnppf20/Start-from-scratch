<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Quote, LineItem } from '$lib/stores/projectStore';
  import { selectedProject } from '$lib/stores/projectStore';

  export let quote: Quote;
  export let isOpen: boolean = false;
  export let isPartialInstruction: boolean = false;
  export let selectedLineItems: LineItem[] = [];

  const dispatch = createEventDispatcher<{
    confirm: void,
    cancel: void
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
    const instructionType = isPartialInstruction ? 'Partial Survey Instruction' : 'Survey Instruction';
    emailSubject = `${instructionType} - ${quote.discipline} - ${$selectedProject?.name || 'Project'}`;
    
    // Use selectedLineItems instead of quote.lineItems for partial instructions
    const itemsToUse = isPartialInstruction ? selectedLineItems : quote.lineItems;
    const formattedLineItems = '<ul>' + itemsToUse
      .map(item => `<li>${item.description} - £${item.cost?.toFixed(2) || '0.00'}</li>`)
      .join('') + '</ul>';

    const instructionText = isPartialInstruction 
      ? 'partial instruction for the following selected works'
      : 'formal instruction for the following works';

    emailBody = `${quote.contactName} <mark>[please edit as needed]</mark><br/><br/>

Please take this email as instruction for the following works on the <strong>${$selectedProject?.name || '<mark>[Project Name]</mark>'}</strong> scheme at <strong>${$selectedProject?.address || '<mark>[Site Address]</mark>'}</strong>.<br/><br/>

The instruction is for the below items:<br/>

${formattedLineItems}

<mark>[Please add any other specific instructions if relevant]</mark><br/><br/>

Please visit trpprojectdashboard.co.uk and select your project from the drop-down at the top of the page for the most up-to-date project information. The dashboard may be updated as the scheme progresses - please ensure final reports are consistent with the information shown there. Invoicing and access details are also available on the dashboard.<br/><br/>

Can you please confirm receipt of this instruction as well as indicative timescales for reports and site visits <mark>[if site visit is required]</mark>.<br/><br/>

Please do get in touch if you have any further queries.<br/><br/>

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
      .replace(/<li[^>]*>/gi, '\n• ') // bullet point for list items
      .replace(/<mark[^>]*>/gi, '') // remove opening mark tag
      .replace(/<\/mark>/gi, '') // remove closing mark tag
      .replace(/<[^>]+>/g, '') // strip remaining html tags
      .trim();

    const mailtoLink = `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(plainTextBody)}`;
    window.location.href = mailtoLink;
  }

  function handleConfirm() {
    dispatch('confirm');
  }

  function handleCancel() {
    dispatch('cancel');
  }

  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleCancel();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleCancel();
    }
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="modal-overlay" on:click={handleOverlayClick} on:keydown={handleKeydown}>
    <div class="modal-content instruction-email-modal">
      <div class="modal-header">
        <h2>Send Instruction Email</h2>
        <button class="close-btn" on:click={handleCancel}>×</button>
      </div>
      
      <div class="modal-body">
        <div class="surveyor-summary">
          <h3>{isPartialInstruction ? 'Partial Instruction' : 'Instruction'} for: {quote.organisation} ({quote.discipline})</h3>
          <p><strong>Contact:</strong> {quote.contactName} • <strong>Line Items:</strong> {isPartialInstruction ? selectedLineItems.length : quote.lineItems.length}{isPartialInstruction ? ` of ${quote.lineItems.length} selected` : ''}</p>
        </div>

        <div class="email-draft">
          <h3>Email Draft</h3>
          <div class="email-headers">
            <div class="form-group">
              <label for="email-to">To:</label>
              <input type="text" id="email-to" bind:value={emailTo} placeholder="recipient@example.com" />
            </div>
            <div class="form-group">
              <label for="email-subject">Subject:</label>
              <input type="text" id="email-subject" bind:value={emailSubject} placeholder="Email subject line" />
            </div>
          </div>
          <div contenteditable="true" class="email-body-editor" bind:innerHTML={emailBody}></div>
        </div>

        <div class="instructions">
          <p><strong>Instructions:</strong></p>
          <ul>
            <li>Click "Open Email Client" below to open the email in your default client</li>
            <li>Edit the email content as needed in your email client (or alternatively edit the email here in the browser before clicking the 'Open Email Client' button)</li>
            <li>Items highlighted in <mark>yellow</mark> and within [ ] may need your attention</li>
            <li>Once you have sent the email, save a copy in the relevant project folder</li>
            <li>Click "Confirm Instruction Sent" button below when done</li>
          </ul>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="cancel-btn" on:click={handleCancel}>Cancel</button>
        <button class="email-btn" on:click={handleOpenEmail}>Open Email Client</button>
        <button class="confirm-btn" on:click={handleConfirm}>Confirm Instruction Sent</button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Modal Base Styles - matching existing pattern */
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
    z-index: 1050;
  }

  .modal-content {
    background-color: white;
    border-radius: 5px;
    width: 95%;
    max-width: 900px;
    max-height: 90vh;
    overflow: hidden;
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
    margin: 0;
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

  .email-headers {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .form-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .form-group label {
    font-weight: 600;
    color: #495057;
    min-width: 60px;
  }

  .form-group input {
    flex-grow: 1;
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-family: inherit;
    font-size: 1rem;
  }

  .form-group input:focus {
    outline: none;
    border-color: #80bdff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }

  .email-body-editor {
    width: 100%;
    min-height: 300px;
    max-height: 400px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    padding: 1rem;
    font-family: inherit;
    font-size: 1rem;
    overflow-y: auto;
    background-color: white;
  }

  .email-body-editor:focus {
    outline: 2px solid #007bff;
    border-color: transparent;
  }



  /* Instructions */
  .instructions {
    background-color: #fff3cd;
    border: 1px solid #ffeeba;
    border-radius: 4px;
    padding: 1rem;
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

  /* Button Styles - matching existing pattern */
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
    border-color: #28a745;
    background-color: #28a745;
    color: white;
  }

  .confirm-btn:hover {
    background-color: #218838;
    border-color: #1e7e34;
  }
</style>