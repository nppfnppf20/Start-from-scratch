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
    'Fee quote request sent',
    'Decision pending', 
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

  // --- New: Reference to the scrollable table container ---
  let tableContainerElement: HTMLDivElement;

  // --- New: Scroll functions ---
  function scrollLeft() {
    if (tableContainerElement) {
      tableContainerElement.scrollBy({ left: -150, behavior: 'smooth' }); // Scroll 150px left
    }
  }

  function scrollRight() {
    if (tableContainerElement) {
      tableContainerElement.scrollBy({ left: 150, behavior: 'smooth' }); // Scroll 150px right
    }
  }
  // ---------

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
    
    <div class="table-scroll-wrapper">
      <button class="scroll-btn scroll-btn-left" on:click={scrollLeft} aria-label="Scroll table left">←</button>
      <div class="quotes-table-container" bind:this={tableContainerElement}>
        <table class="quotes-table">
          <thead>
            <tr>
              <th>Discipline</th>
              <th>Organisation</th>
              <th>Contact Name</th>
              <th>Email</th>
              <th>Line Items</th>
              <th>Total (excl. VAT)</th>
              <th>Instruction Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each $currentProjectQuotes as quote (quote.id)}
              <tr
                class:status-instructed={quote.instructionStatus === 'instructed'}
                class:status-partially-instructed={quote.instructionStatus === 'partially instructed'}
                class:status-decision-pending={quote.instructionStatus === 'Decision pending'}
                class:status-will-not-be-instructed={quote.instructionStatus === 'will not be instructed'}
                class:status-fee-request-sent={quote.instructionStatus === 'Fee quote request sent'}
              >
                <td>{quote.discipline}</td>
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
                    class:status-decision-pending={quote.instructionStatus === 'Decision pending'}
                    class:status-will-not-be-instructed={quote.instructionStatus === 'will not be instructed'}
                    class:status-fee-request-sent={quote.instructionStatus === 'Fee quote request sent'}
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
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <button class="scroll-btn scroll-btn-right" on:click={scrollRight} aria-label="Scroll table right">→</button>
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
  /* General page styling (assumed globally applied) */

  .quotes-container {
    padding: 2rem 1rem; /* Match general-info padding */
  }
  
  /* Headings */
  h1 {
    font-size: 1.8rem; 
    font-weight: 600; 
    margin-bottom: 1.5rem;
    color: #1a202c; 
  }
  
  h2 {
    font-size: 1.3rem; 
    font-weight: 500; 
    color: #2d3748; 
    margin: 0; 
  }

  /* Header section */
  .quotes-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  /* Add Quote Button */
  .add-quote-btn {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 500;
    background-color: #3182ce; /* Blue accent */
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }
  .add-quote-btn:hover {
    background-color: #2b6cb0; 
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  .add-quote-btn:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.5); 
  }
  .add-quote-btn:disabled {
    background-color: #a0aec0;
    cursor: not-allowed;
    box-shadow: none;
  }
  
  /* Table Styling */
  .quotes-table-container {
    overflow-x: scroll; /* Changed from auto to scroll for persistent visibility */
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border: 1px solid #e2e8f0;
    margin-bottom: 2rem; /* Space below table */
  }
  
  .quotes-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
    white-space: nowrap; /* Prevent wrapping in cells initially */
  }
  
  .quotes-table th,
  .quotes-table td {
    padding: 0.9rem 1.2rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: middle;
    white-space: nowrap; /* Keep cells from wrapping */
  }

  .quotes-table td {
    color: #4a5568; /* Slightly softer text color for data */
  }
  
  .quotes-table th {
    background-color: #f7fafc; 
    font-weight: 600;
    color: #4a5568;
    text-transform: uppercase;
    font-size: 0.8rem;
    letter-spacing: 0.05em;
  }

  .quotes-table tbody tr:last-child td {
    border-bottom: none; 
  }

  .quotes-table tbody tr:hover {
    background-color: #f7fafc; 
  }

  /* Status-specific ROW styling */
  tr.status-instructed { background-color: #f0fff4; }
  tr.status-partially-instructed { background-color: #fffaf0; }
  tr.status-will-not-be-instructed { background-color: #fff5f5; }
  tr.status-decision-pending { background-color: #ebf4ff; }
  tr.status-fee-request-sent { background-color: #f7fafc; }


  /* Specific Cell Alignments */
  .text-center {
    text-align: center;
  }
  .text-right {
    text-align: right;
  }

  /* Email Link */
  td a[href^="mailto:"] {
      color: #3182ce;
      text-decoration: none;
      transition: color 0.2s ease-in-out;
  }
  td a[href^="mailto:"]:hover {
      color: #2b6cb0;
      text-decoration: underline;
  }

  /* Line Items Button */
  .line-items-button {
    background-color: #edf2f7;
    color: #4a5568;
    border: 1px solid #e2e8f0;
    border-radius: 50%; /* Circle */
    width: auto; /* Adjust width based on content */
    min-width: 28px; /* Keep minimum size */
    height: 28px;
    font-size: 0.9rem;
    font-weight: 500;
    /* line-height: 26px; Remove fixed line height */
    text-align: center;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;
    display: inline-flex; /* Use flex for centering */
    align-items: center;
    justify-content: center;
    /* position: relative; Remove relative positioning */
    padding: 0 0.5rem; /* Add some horizontal padding */
    gap: 0.25rem; /* Add gap between number and plus */
  }
  .line-items-button:hover {
    background-color: #e2e8f0;
    border-color: #cbd5e0;
  }
  .line-items-button .plus-sign {
    /* display: none; Remove hiding */
    display: inline; /* Show the plus sign */
    font-size: 0.8em; /* Make plus slightly smaller */
    font-weight: bold;
    line-height: 1; /* Ensure it doesn't affect button height much */
  }

  /* Instruction Status Select */
  .instruction-status-select {
    padding: 0.4rem 2rem 0.4rem 0.8rem; /* Increase right padding for arrow */
    border: 1px solid #cbd5e0;
    border-radius: 15px; /* Pill shape */
    font-size: 0.85rem;
    background-color: #fff;
    cursor: pointer;
    transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    min-width: 120px; /* Ensure dropdown is wide enough */
    appearance: none; /* Hide default arrow */
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23718096'%3E%3Cpath fill-rule='evenodd' d='M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06z'/%3E%3C/svg%3E"); /* Add custom arrow */
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 1em 1em;
  }
  .instruction-status-select:focus {
      border-color: #4299e1; 
      box-shadow: 0 0 0 1px #4299e1; 
      outline: none;
  }

  /* Status-specific Select Styling */
  .instruction-status-select.status-instructed {
    background-color: #f0fff4; /* Light green */
    border-color: #c6f6d5;
    color: #276749;
  }
  .instruction-status-select.status-partially-instructed {
    background-color: #fffaf0; /* Light orange/yellow */
    border-color: #feebc8;
    color: #975a16;
  }
  .instruction-status-select.status-decision-pending {
    background-color: #ebf4ff; /* Light blue */
    border-color: #bee3f8;
    color: #2c5282;
  }
  .instruction-status-select.status-will-not-be-instructed {
    background-color: #fff5f5; /* Light red */
    border-color: #fed7d7;
    color: #c53030;
  }
  .instruction-status-select.status-fee-request-sent {
    background-color: #e2e3e5;
  }
  
  /* Action Buttons in Table */
  .action-cell {
    text-align: center; /* Center align actions */
  }
  
  .action-btn {
    display: inline-block;
    padding: 0.3rem 0.7rem;
    margin: 0 0.2rem; /* Adjust spacing */
    font-size: 0.8rem;
    font-weight: 500;
    border-radius: 4px;
    text-decoration: none;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out, box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out;
    border: 1px solid transparent;
    background: none;
    color: #718096; /* Default subtle grey */
  }
  .action-btn:hover {
     background-color: #edf2f7; /* Light grey background on hover */
     color: #2d3748; /* Darker text on hover */
  }

  /* Specific Button Styles */
  .edit-btn {
    /* Maybe a subtle blue hint? */
     /* border-color: #bee3f8; */
  }
  .delete-btn {
    /* Maybe a subtle red hint? */
     /* border-color: #fed7d7; */
     /* color: #e53e3e; */
  }
  .delete-btn:hover {
      background-color: #fed7d7; /* Light red background on hover */
      color: #c53030; /* Red text on hover */
  }

  /* Icon Buttons */
  .icon-cell {
    width: 40px; /* Fixed width for icon cells */
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
  .icon-btn {
    font-size: 1.1rem; /* Larger emoji */
    padding: 0.2rem 0.4rem;
    border: none;
  }
  .icon-btn:hover {
    background-color: #e2e8f0;
  }

  /* No Project State */
  .quotes-container > p {
    text-align: center;
    margin: 3rem auto;
    padding: 2.5rem;
    background-color: #ffffff;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    color: #718096;
  }

  /* --- New: Table Scroll Wrapper and Buttons --- */
  .table-scroll-wrapper {
    position: relative; /* Context for absolute positioning of buttons */
    margin-bottom: 2rem; /* Keep space below */
  }

  .scroll-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%); /* Center vertically */
    z-index: 10;
    background-color: rgba(255, 255, 255, 0.8); /* Slightly transparent white */
    border: 1px solid #cbd5e0;
    border-radius: 50%; /* Circle */
    width: 36px;
    height: 36px;
    font-size: 1.2rem; /* Slightly adjusted arrow size for better fit */
    cursor: pointer;
    color: #4a5568;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    display: inline-flex; /* Use inline-flex */
    align-items: center;    /* Flexbox: Vertically center content */
    justify-content: center; /* Flexbox: Horizontally center content */
    padding: 0; /* Remove padding if flex is centering */
  }

  .scroll-btn:hover {
    background-color: #fff;
    box-shadow: 0 4px 6px rgba(0,0,0,0.15);
  }

  .scroll-btn-left {
    left: -18px; /* Position halfway outside the container */
  }

  .scroll-btn-right {
    right: -18px; /* Position halfway outside the container */
  }
  /* ------------------------------------------- */
</style> 