<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import {
    selectedProject, 
    currentProjectQuotes, 
    updateQuoteInstructionStatus, 
    deleteQuote,
    revokeSurveyorAuthorization,
    type InstructionStatus, 
    type Quote, 
    type LineItem
  } from "$lib/stores/projectStore";
  import { get } from 'svelte/store';
  import QuoteModal from '$lib/components/QuoteModal.svelte';
  import LineItemsModal from '$lib/components/LineItemsModal.svelte';
  import PartiallyInstructedModal from '$lib/components/PartiallyInstructedModal.svelte';
  import DocumentUploadModal from '$lib/components/DocumentUploadModal.svelte';
  import InstructionEmailModal from '$lib/components/InstructionEmailModal.svelte';
  import NotInstructedModal from '$lib/components/NotInstructedModal.svelte';
  import QuotesTable from '$lib/components/quotes/QuotesTable.svelte';
  
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
  
  // Instruction Email Modal state
  let showInstructionEmailModal = false;
  let quoteForInstruction: Quote | null = null;
  let selectedLineItemsForPartial: LineItem[] = [];
  let isPartialInstruction = false;
  
  // Not Instructed Modal state
  let showNotInstructedModal = false;
  let quoteForNotInstructed: Quote | null = null;

  import { processedQuotes } from '$lib/stores/selectors/quotesSelectors';

  // Table rendering moved into QuotesTable component

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
      } else if (newStatus === 'instructed') {
          // NEW: Open instruction email modal instead of immediate update
          isPartialInstruction = false;
          selectedLineItemsForPartial = [];
          quoteForInstruction = currentQuote;
          showInstructionEmailModal = true;
      } else if (newStatus === 'will not be instructed') {
          // NEW: Open not instructed confirmation modal
          quoteForNotInstructed = currentQuote;
          showNotInstructedModal = true;
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
          // Store selected line items and open instruction email modal
          selectedLineItemsForPartial = selectedItems;
          isPartialInstruction = true;
          quoteForInstruction = quoteForPartialInstruction;
          closePartiallyInstructedModal();
          showInstructionEmailModal = true;
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

  // Instruction Email Modal handlers
  async function handleInstructionConfirmed() {
    if (quoteForInstruction) {
      try {
        if (isPartialInstruction) {
          // Handle partially instructed case
          const partialTotal = selectedLineItemsForPartial.reduce((sum, item) => sum + (item.cost || 0), 0);
          console.log(`Confirming partial instruction for quote ${quoteForInstruction.id} with ${selectedLineItemsForPartial.length} items`);
          const success = await updateQuoteInstructionStatus(quoteForInstruction.id, 'partially instructed', partialTotal);
          if (success) {
            closeInstructionEmailModal();
          } else {
            alert('Failed to update quote status to partially instructed.');
            // Don't close modal, let user try again or cancel
          }
        } else {
          // Handle regular instructed case
          console.log(`Confirming instruction for quote ${quoteForInstruction.id}`);
          const success = await updateQuoteInstructionStatus(quoteForInstruction.id, 'instructed', undefined);
          if (success) {
            closeInstructionEmailModal();
          } else {
            alert('Failed to update quote status to instructed.');
            // Don't close modal, let user try again or cancel
          }
        }
      } catch (error) {
        console.error(`Error confirming instruction for quote ${quoteForInstruction.id}:`, error);
        alert('An error occurred while updating the status.');
        // Don't close modal, let user try again or cancel
      }
    }
  }

  function handleInstructionCancelled() {
    if (quoteForInstruction) {
      // Revert dropdown to original status
      const selectEl = document.getElementById(`status-select-${quoteForInstruction.id}`) as HTMLSelectElement | null;
      if (selectEl) {
        selectEl.value = quoteForInstruction.instructionStatus;
      }
    }
    closeInstructionEmailModal();
  }

  function closeInstructionEmailModal() {
    showInstructionEmailModal = false;
    quoteForInstruction = null;
    selectedLineItemsForPartial = [];
    isPartialInstruction = false;
  }

  async function handleNotInstructedConfirm() {
    if (quoteForNotInstructed && $selectedProject) {
      try {
        console.log(`Confirming not instructed for quote ${quoteForNotInstructed.id}`);
        
        // First revoke surveyor authorization if email exists
        if (quoteForNotInstructed.email) {
          const authRevoked = await revokeSurveyorAuthorization($selectedProject.id, quoteForNotInstructed.email);
          if (!authRevoked) {
            alert('Failed to revoke surveyor authorization.');
            return;
          }
        }

        // Then update quote status
        const success = await updateQuoteInstructionStatus(quoteForNotInstructed.id, 'will not be instructed', undefined);
        if (success) {
          closeNotInstructedModal();
        } else {
          alert('Failed to update quote status to will not be instructed.');
        }
      } catch (error) {
        console.error(`Error confirming not instructed for quote ${quoteForNotInstructed.id}:`, error);
        alert('An error occurred while updating the status.');
      }
    }
  }

  function handleNotInstructedCancel() {
    if (quoteForNotInstructed) {
      // Revert dropdown to original status
      const selectEl = document.getElementById(`status-select-${quoteForNotInstructed.id}`) as HTMLSelectElement | null;
      if (selectEl) {
        selectEl.value = quoteForNotInstructed.instructionStatus;
      }
    }
    closeNotInstructedModal();
  }

  function closeNotInstructedModal() {
    showNotInstructedModal = false;
    quoteForNotInstructed = null;
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
    <QuotesTable
      rows={$processedQuotes}
      onStatusChange={(quote, status) => handleStatusChange(quote.id, status as InstructionStatus, quote)}
      onViewLineItems={(quote) => openLineItemsModal(quote)}
      onEdit={(quote) => openEditQuoteModal(quote)}
      onDelete={(quote) => handleDeleteQuote(quote.id, quote.organisation)}
    />
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

  {#if showInstructionEmailModal && quoteForInstruction}
    <InstructionEmailModal
      quote={quoteForInstruction}
      bind:isOpen={showInstructionEmailModal}
      isPartialInstruction={isPartialInstruction}
      selectedLineItems={isPartialInstruction ? selectedLineItemsForPartial : quoteForInstruction.lineItems}
      on:confirm={handleInstructionConfirmed}
      on:cancel={handleInstructionCancelled}
    />
  {/if}

  {#if showNotInstructedModal && quoteForNotInstructed}
    <NotInstructedModal
      quote={quoteForNotInstructed}
      bind:isOpen={showNotInstructedModal}
      on:confirm={handleNotInstructedConfirm}
      on:cancel={handleNotInstructedCancel}
    />
  {/if}
</div>

<style>
  /* CSS Variables for status colors */
  :root {
    --status-not-started-bg: #fff5f5;
    --status-not-started-color: #c53030;
    --status-in-progress-bg: #fff3cd;
    --status-in-progress-color: #856404;
    --status-completed-bg: #d4edda;
    --status-completed-color: #155724;
    --status-trp-reviewing-bg: #cce5ff;
    --status-trp-reviewing-color: #004085;
    --status-client-reviewing-bg: #e2d9f3;
    --status-client-reviewing-color: #493267;
  }

  /* General page styling (assumed globally applied) */

  .quotes-container {
    padding: 1rem 2rem; /* Consistent padding */
  }
  
  /* Removed unused legacy header styles */

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
  
  /* Scroll controls moved to QuotesTable component */
  /* ------------------------------------------- */

  /* Table styles moved into QuotesTable / QuoteRow */

  /* Specific Cell Alignments */
  /* Alignment helpers moved into QuoteRow */

  /* Email Link */
  /* Email link styles moved into QuoteRow if needed */

  /* Line Items Button styles moved into QuoteRow */

  /* Instruction Status Select */
  /* Status select styles moved into QuoteRow */
  
  /* Action Buttons in Table */
  /* Action button styles moved into QuoteRow */

  /* Icon Buttons */
  /* Icon styles moved */

  /* No Project State message handled in PageHeader subtitle */
</style> 