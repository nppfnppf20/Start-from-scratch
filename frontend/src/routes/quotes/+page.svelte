<script lang="ts">
  import {
    selectedProject, 
    currentProjectQuotes, 
    updateQuoteInstructionStatus, 
    deleteQuote,
    type InstructionStatus, 
    type Quote, 
    type LineItem
  } from "$lib/stores/projectStore";
  import { get } from 'svelte/store';
  import QuoteModal from '$lib/components/QuoteModal.svelte';
  import LineItemsModal from '$lib/components/LineItemsModal.svelte';
  import PartiallyInstructedModal from '$lib/components/PartiallyInstructedModal.svelte';
  import DocumentUploadModal from '$lib/components/DocumentUploadModal.svelte';
  
  const instructionStatuses: InstructionStatus[] = [
    'pending', 
    'will not be instructed',
    'partially instructed', 
    'instructed'
  ];
  
  let showQuoteModal = false;
  let currentQuoteToEdit: Quote | null = null;
  
  let showLineItemsModal = false;
  let selectedQuoteForLineItems: Quote | null = null;
  let showPartiallyInstructedModal = false;
  let quoteForPartialInstruction: Quote | null = null;
  let currentlySelectedStatus: InstructionStatus | null = null;
  let showDocumentUploadModal = false;
  let quoteForDocumentUpload: Quote | null = null;
  let documentUploadType: 'quote' | 'instruction' | null = null;

  function openNewQuoteModal() {
    currentQuoteToEdit = null;
    showQuoteModal = true;
  }
  
  function openEditQuoteModal(quote: Quote) {
    currentQuoteToEdit = quote;
    showQuoteModal = true;
  }

  function handleModalClose() {
    showQuoteModal = false;
    currentQuoteToEdit = null;
  }

  function openLineItemsModal(quote: Quote) { selectedQuoteForLineItems = quote; showLineItemsModal = true; }
  function closeLineItemsModal() { showLineItemsModal = false; selectedQuoteForLineItems = null; }
  function closePartiallyInstructedModal() { 
      showPartiallyInstructedModal = false;
      quoteForPartialInstruction = null;
      currentlySelectedStatus = null;
  }
  function openDocumentUploadModal(quote: Quote, type: 'quote' | 'instruction') {
      quoteForDocumentUpload = quote;
      documentUploadType = type;
      showDocumentUploadModal = true;
  }
  function closeDocumentUploadModal() {
      showDocumentUploadModal = false;
      quoteForDocumentUpload = null;
      documentUploadType = null;
  }
  function handleDocumentUploaded(event: CustomEvent<{ file: File; type: string }>) {
      const { file, type } = event.detail;
      console.log(`Successfully uploaded ${type} document "${file.name}"`);
  }

  async function handleStatusChange(quoteId: string, newStatus: InstructionStatus, currentQuote: Quote) { 
      if (newStatus === 'partially instructed') {
          quoteForPartialInstruction = currentQuote;
          currentlySelectedStatus = newStatus; 
          showPartiallyInstructedModal = true;
      } else {
          try {
              console.log(`Updating status for quote ${quoteId} to ${newStatus}`);
              const success = await updateQuoteInstructionStatus(quoteId, newStatus, undefined); 
              if (!success) {
                  alert('Failed to update quote status.');
                  const selectEl = document.getElementById(`status-select-${quoteId}`) as HTMLSelectElement | null;
                  if(selectEl) selectEl.value = currentQuote.instructionStatus;
              }
          } catch (error) {
               console.error(`Error updating status for quote ${quoteId}:`, error);
               alert('An error occurred while updating the status.');
               const selectEl = document.getElementById(`status-select-${quoteId}`) as HTMLSelectElement | null;
               if(selectEl) selectEl.value = currentQuote.instructionStatus;
          }
      }
  }
  
  async function handlePartialInstructionConfirm(event: CustomEvent<{ selectedItems: LineItem[] }>) { 
      const selectedItems = event.detail.selectedItems;
      if (quoteForPartialInstruction && currentlySelectedStatus === 'partially instructed') {
          const partialTotal = selectedItems.reduce((sum, item) => sum + (item.cost || 0), 0);
          try {
              const success = await updateQuoteInstructionStatus(quoteForPartialInstruction.id, currentlySelectedStatus, partialTotal); 
              if (!success) { alert('Failed to update quote status to partially instructed.'); }
          } catch(error) {
               console.error(`Error setting partial status for quote ${quoteForPartialInstruction.id}:`, error);
               alert('An error occurred while setting the partial status.');
          } finally {
              closePartiallyInstructedModal(); 
          }
      } else {
          closePartiallyInstructedModal(); 
      }
  }

  function handlePartialInstructionCancel() {
       const selectElement = document.getElementById(`status-select-${quoteForPartialInstruction?.id}`) as HTMLSelectElement | null;
       if (selectElement && quoteForPartialInstruction) {
           selectElement.value = quoteForPartialInstruction.instructionStatus; 
       }
      closePartiallyInstructedModal();
  }
  
  async function handleDeleteQuote(quoteId: string, organisationName: string) { 
      try {
          console.log(`Attempting to delete quote: ${quoteId}`);
          await deleteQuote(quoteId); 
      } catch(error) {
           console.error(`Error deleting quote ${quoteId}:`, error);
           alert('An error occurred while deleting the quote.');
      }
  }
</script>

<div class="quotes-container">
  <h1>Surveyor Quotes</h1>
  
  {#if $selectedProject}
    <div class="quotes-header">
      <h2>Quotes for {$selectedProject.name}</h2>
      <button class="add-quote-btn" on:click={openNewQuoteModal} disabled={!$selectedProject}>+ Add New Quote</button>
    </div>
    
    <div class="quotes-table-container">
      <table class="quotes-table">
        <thead>
          <tr>
            <th>Discipline</th>
            <th>Survey Type</th>
            <th>Organisation</th>
            <th>Contact Name</th>
            <th>Email</th>
            <th>Line Items</th>
            <th>Total (excl. VAT)</th>
            <th>Instruction Status</th>
            <th>Actions</th>
            <th>Quotes</th>
            <th>Instruction</th>
          </tr>
        </thead>
        <tbody>
          {#each $currentProjectQuotes as quote (quote.id)}
            <tr>
              <td>{quote.discipline}</td>
              <td>{quote.surveyType}</td>
              <td>{quote.organisation}</td>
              <td>{quote.contactName}</td>
              <td><a href="mailto:{quote.email}">{quote.email}</a></td>
              <td class="text-center">
                <button 
                    type="button" 
                    class="line-items-button" 
                    title="View Line Items" 
                    on:click={() => openLineItemsModal(quote)}
                    aria-label={`View ${quote.lineItems.length} line items`}
                >
                  {quote.lineItems.length}
                  <span class="plus-sign">+</span>
                </button>
              </td>
              <td class="text-right">£{quote.total.toFixed(2)}</td>
              <td>
                <select 
                  class="instruction-status-select"
                  class:status-instructed={quote.instructionStatus === 'instructed'}
                  class:status-partially-instructed={quote.instructionStatus === 'partially instructed'}
                  class:status-pending={quote.instructionStatus === 'pending'}
                  class:status-will-not-be-instructed={quote.instructionStatus === 'will not be instructed'}
                  value={quote.instructionStatus}
                  id={`status-select-${quote.id}`}
                  on:change={(e) => handleStatusChange(quote.id, e.currentTarget.value as InstructionStatus, quote)}
                >
                  {#each instructionStatuses as status}
                    <option value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                  {/each}
                </select>
              </td>
              <td class="action-cell">
                <button 
                  class="action-btn delete-btn" 
                  title="Delete Quote" 
                  on:click={() => handleDeleteQuote(quote.id, quote.organisation)}
                >Delete</button>
                <button 
                  class="action-btn edit-btn" 
                  title="Edit Quote"
                  on:click={() => openEditQuoteModal(quote)} 
                >Edit</button>
              </td>
              <td class="action-cell icon-cell">
                <button 
                  class="action-btn icon-btn" 
                  title="Manage Quote Documents"
                  on:click={() => openDocumentUploadModal(quote, 'quote')}
                >📎</button>
              </td>
              <td class="action-cell icon-cell">
                <button 
                  class="action-btn icon-btn" 
                  title="Manage Instruction Documents"
                  on:click={() => openDocumentUploadModal(quote, 'instruction')}
                >📎</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <p>Please select a project to view quotes.</p>
  {/if}
  
  <QuoteModal 
    bind:isOpen={showQuoteModal}
    quoteToEdit={currentQuoteToEdit} 
    projectId={$selectedProject?.id}
    on:close={handleModalClose}
  />

  {#if showLineItemsModal && selectedQuoteForLineItems}
    <LineItemsModal 
      items={selectedQuoteForLineItems.lineItems} 
      organisationName={selectedQuoteForLineItems.organisation} 
      on:close={closeLineItemsModal} 
    />
  {/if}

  {#if showPartiallyInstructedModal && quoteForPartialInstruction}
    <PartiallyInstructedModal 
      quote={quoteForPartialInstruction}
      on:confirm={handlePartialInstructionConfirm}
      on:cancel={handlePartialInstructionCancel} 
    />
  {/if}

  {#if showDocumentUploadModal && quoteForDocumentUpload && documentUploadType}
    <DocumentUploadModal 
      bind:showModal={showDocumentUploadModal}
      title={`Upload ${documentUploadType === 'quote' ? 'Quote' : 'Instruction'} Document`}
      quoteId={quoteForDocumentUpload.id}
      documentType={documentUploadType}
      on:close={closeDocumentUploadModal}
      on:uploaded={handleDocumentUploaded}
    />
  {/if}
</div>

<style>
  .quotes-container {
    padding: 1rem 0;
  }
  
  h1 {
    margin-bottom: 1.5rem;
    color: #333;
  }
  
  .quotes-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  h2 {
    font-size: 1.5rem;
    color: #555;
    margin: 0;
  }
  
  .quotes-table-container {
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    overflow-x: auto;
  }
  
  .quotes-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 1200px;
  }
  
  .quotes-table th,
  .quotes-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #eee;
    font-size: 0.95rem;
  }
  
  .quotes-table th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #495057;
    white-space: nowrap;
  }
  
  .quotes-table tr:last-child td {
    border-bottom: none;
  }
  
  .quotes-table tr:hover {
    background-color: #f8f9fa;
  }
  
  .text-center {
    text-align: center;
  }
  
  .text-right {
    text-align: right;
  }
  
  .status-badge {
    display: inline-block;
    padding: 0.3rem 0.6rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
    text-transform: capitalize;
    white-space: nowrap;
  }
  
  .status-pending {
    background-color: #ffc107;
    color: #212529;
  }
  
  .status-accepted {
    background-color: #28a745;
    color: white;
  }
  
  .status-rejected {
    background-color: #dc3545;
    color: white;
  }
  
  .action-cell {
    white-space: nowrap;
  }
  
  .action-btn {
    padding: 0.4rem 0.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
  }
  
  .view-btn, .details-btn {
    background-color: #6c757d;
    color: white;
  }
  
  .edit-btn, .download-btn {
    background-color: #007bff;
    color: white;
  }
  
  .instruct-btn {
    background-color: #28a745;
    color: white;
  }
  
  .action-btn:hover {
    opacity: 0.9;
  }
  
  a {
    color: #007bff;
    text-decoration: none;
  }
  
  a:hover {
    text-decoration: underline;
  }
  
  .instruction-status-select {
    padding: 0.4rem 1.8rem 0.4rem 0.8rem;
    border: 1px solid #ced4da;
    border-radius: 20px;
    font-size: 0.9rem;
    background-color: white;
    min-width: 150px;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%236c757d'%3E%3Cpath fill-rule='evenodd' d='M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.5rem center;
    background-size: 1em 1em;
  }
  
  .instruction-status-select:focus {
    outline: none;
    border-color: #80bdff;
    box-shadow: 0 0 0 0.1rem rgba(0, 123, 255, 0.25);
  }
  
  .instruction-status-select.status-instructed,
  .instruction-status-select.status-partially-instructed {
    background-color: #d4edda;
    color: #155724;
    border-color: #c3e6cb;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23155724'%3E%3Cpath fill-rule='evenodd' d='M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06z'/%3E%3C/svg%3E");
  }
  
  .instruction-status-select.status-pending {
    background-color: #fff3cd;
    color: #856404;
    border-color: #ffeeba;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23856404'%3E%3Cpath fill-rule='evenodd' d='M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06z'/%3E%3C/svg%3E");
  }
  
  .instruction-status-select.status-will-not-be-instructed {
    background-color: #f8d7da;
    color: #721c24;
    border-color: #f5c6cb;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23721c24'%3E%3Cpath fill-rule='evenodd' d='M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06z'/%3E%3C/svg%3E");
  }

  .line-items-button {
      background: none;
      border: none;
      padding: 0.2rem 0.5rem;
      cursor: pointer;
      font-size: 0.95rem;
      color: #007bff;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      border-radius: 4px;
  }

  .line-items-button:hover {
      text-decoration: underline;
      background-color: rgba(0, 123, 255, 0.1);
  }

  .plus-sign {
      font-weight: bold;
      font-size: 1.1em;
      line-height: 1;
  }

  .delete-btn {
    background-color: #dc3545;
    color: white;
  }

  .icon-cell {
      text-align: center;
  }

  .icon-btn {
      background: none;
      border: none;
      font-size: 1.3rem;
      cursor: pointer;
      color: #6c757d;
      padding: 0.2rem;
      line-height: 1;
  }
  
  .icon-btn:hover {
      color: #343a40;
  }

  .add-quote-btn {
    background-color: #28a745;
    color: white;
    padding: 0.6rem 1.2rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }
  
  .add-quote-btn:hover {
    background-color: #218838;
  }

  .add-quote-btn:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  .quotes-table th, .quotes-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
  .quotes-table th { background-color: #f2f2f2; }
  .action-buttons { display: flex; gap: 5px; }
  .action-btn { padding: 3px 6px; font-size: 0.8em; border-radius: 3px; cursor: pointer; border: 1px solid transparent; }
  .view-items-btn { background-color: #17a2b8; color: white; }
  .edit-btn { background-color: #ffc107; color: black; }
  .delete-btn { background-color: #dc3545; color: white; }
  .status-select { padding: 4px; border-radius: 4px; border: 1px solid #ccc; }
  .status-pending { background-color: #fff3cd; }
  .status-will-not-be-instructed { background-color: #f8d7da; }
  .status-partially-instructed { background-color: #d1ecf1; }
  .status-instructed { background-color: #d4edda; }
  .partial-total { font-size: 0.8em; color: #555; margin-left: 5px; }
  .no-quotes-message { margin-top: 1rem; font-style: italic; color: #666; }
</style> 