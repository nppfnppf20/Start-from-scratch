<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
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

  $: processedQuotes = (() => {
    const sorted = [...$currentProjectQuotes].sort((a, b) => {
      const disciplineA = a.discipline || '';
      const disciplineB = b.discipline || '';
      return disciplineA.localeCompare(disciplineB);
    });

    let groupCounter = 0;
    let lastDiscipline: string | null = null;

    return sorted.map(quote => {
      if (quote.discipline !== lastDiscipline) {
        groupCounter++;
        lastDiscipline = quote.discipline;
      }
      return { ...quote, group: groupCounter };
    });
  })();

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
  <PageHeader 
    title="Surveyor Quotes" 
    subtitle={$selectedProject ? `Quotes for ${$selectedProject.name}` : 'Please select a project to view quotes.'}
  >
    <div slot="actions">
      {#if $selectedProject}
        <button class="add-quote-btn" on:click={openNewQuoteModal}>
          + Add New Quote
        </button>
      {/if}
    </div>
  </PageHeader>
  
  {#if $selectedProject}
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
            {#each processedQuotes as quote (quote.id)}
              <tr class:group-odd={quote.group % 2 !== 0}>
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
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <button class="scroll-btn scroll-btn-right" on:click={scrollRight} aria-label="Scroll table right">→</button>
    </div>
  {:else}
    <!-- Message is now in the subtitle -->
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
    padding: 1rem 2rem; /* Consistent padding */
  }
  
  h1 {
    font-size: 1.8rem; 
    font-weight: 600; 
    margin-bottom: 0.5rem;
  }

  .quotes-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  h2 {
    font-size: 1.25rem;
    color: #4a5568;
  }

  .add-quote-btn {
    background-color: #3182ce;
    color: white;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 500;
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
  
  .table-scroll-wrapper {
    position: relative;
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

  .quotes-table-container {
    overflow-x: auto; /* Changed from auto to scroll for persistent visibility */
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

  tr.group-odd {
    background-color: #f8f9fa; /* zebra striping for groups */
  }

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
    background-color: #f1f3f5;
    border: 1px solid #dee2e6;
    border-radius: 9999px; /* Pill shape */
    padding: 0.3rem 0.8rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    transition: background-color 0.2s, border-color 0.2s;
  }
  .line-items-button:hover {
    background-color: #e9ecef;
    border-color: #adb5bd;
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
    padding: 0.4rem 0.6rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    background-color: white;
    cursor: pointer;
    min-width: 150px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .instruction-status-select:focus {
      border-color: #80bdff; 
      outline: 0;
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25); 
  }

  /* Status-specific Select Styling */
  .status-instructed {
    background-color: #c6f6d5;
    color: #2f855a;
    font-weight: 500;
  }
  .status-partially-instructed {
    background-color: #faf089;
    color: #b7791f;
    font-weight: 500;
  }
  .status-pending {
    background-color: #e2e8f0;
    color: #4a5568;
  }
  .status-will-not-be-instructed {
    background-color: #fed7d7;
    color: #c53030;
    font-weight: 500;
  }
  
  /* Action Buttons in Table */
  .action-cell {
    text-align: right; /* Center align actions */
    white-space: nowrap;
  }
  
  .action-btn {
    padding: 0.3rem 0.7rem;
    margin-left: 0.4rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: background-color 0.2s;
  }
  .action-btn:hover {
     background-color: #edf2f7; /* Light grey background on hover */
     color: #2d3748; /* Darker text on hover */
  }

  /* Specific Button Styles */
  .edit-btn {
    background-color: #3182ce;
    color: white;
  }
  .edit-btn:hover {
    background-color: #2b6cb0;
  }
  .delete-btn {
    background-color: #e53e3e;
    color: white;
  }
  .delete-btn:hover {
      background-color: #c53030; /* Light red background on hover */
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
</style> 