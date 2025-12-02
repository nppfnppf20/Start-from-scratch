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
  import { auth0Store } from "$lib/stores/auth0Store";
  import { getUserRole, userRole } from "$lib/utils/auth";
  import QuoteModal from '$lib/components/QuoteModal.svelte';
  import LineItemsModal from '$lib/components/LineItemsModal.svelte';
  import PartiallyInstructedModal from '$lib/components/PartiallyInstructedModal.svelte';
  import DocumentUploadModal from '$lib/components/DocumentUploadModal.svelte';
  import InstructionEmailModal from '$lib/components/InstructionEmailModal.svelte';
  import NotInstructedModal from '$lib/components/NotInstructedModal.svelte';
  import DataTable, { type TableColumn } from '$lib/components/DataTable.svelte';

  // Check if user is a client (read-only access)
  $: if ($auth0Store.user) {
    getUserRole($auth0Store.user);
  }
  $: isClient = $userRole === 'client';
  
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

  // Define table columns for DataTable
  const columns: TableColumn[] = [
    {
      key: 'discipline',
      label: 'Discipline',
      sortable: true,
      width: '120px'
    },
    {
      key: 'organisation',
      label: 'Organisation',
      sortable: true,
      width: '150px'
    },
    {
      key: 'contactName',
      label: 'Contact Name',
      sortable: true,
      width: '130px'
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      width: '180px'
    },
    {
      key: 'lineItems',
      label: 'Line Items',
      align: 'center' as const,
      width: '80px'
    },
    {
      key: 'total',
      label: 'Total (excl. VAT)',
      align: 'right' as const,
      sortable: true,
      width: '120px'
    },
    {
      key: 'instructionStatus',
      label: 'Instruction Status',
      width: '140px'
    }
  ];

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

  // DataTable event handlers
  function handleAction(event: CustomEvent) {
    const { action, item } = event.detail;

    if (action === 'edit') {
      openEditQuoteModal(item);
    } else if (action === 'delete') {
      handleDeleteQuote(item.id, item.organisation);
    }
  }

  function handleRowClick(event: CustomEvent) {
    // Optional: Handle row clicks if needed
  }
</script>

<div class="quotes-container">
  <PageHeader
    title="Surveyor Quotes"
    subtitle={$selectedProject ? `Quotes for ${$selectedProject.name}` : 'Please select a project to view quotes.'}
  >
    <div slot="actions">
      {#if $selectedProject && !isClient}
        <button class="add-quote-btn" on:click={openNewQuoteModal}>
          + Add New Quote
        </button>
      {/if}
    </div>
  </PageHeader>
  
  {#if $selectedProject}
    <DataTable
      data={processedQuotes}
      {columns}
      searchPlaceholder="Search quotes by discipline, organisation, or contact..."
      emptyMessage="No quotes found for this project."
      showSearch={true}
      showActions={!isClient}
      minWidth="900px"
      on:action={handleAction}
      on:rowClick={handleRowClick}
    >
      <svelte:fragment slot="cell" let:column let:item let:index>
        {#if column.key === 'email'}
          <a href="mailto:{item.email}" class="email-link">{item.email}</a>
        {:else if column.key === 'lineItems'}
          <button
            type="button"
            class="line-items-button"
            title="View Line Items"
            on:click|stopPropagation={() => openLineItemsModal(item)}
            aria-label={`View ${item.lineItems.length} line items`}
          >
            {item.lineItems.length}
            <span class="plus-sign">+</span>
          </button>
        {:else if column.key === 'total'}
          £{item.total.toFixed(2)}
        {:else if column.key === 'instructionStatus'}
          <select
            class="instruction-status-select"
            class:status-instructed={item.instructionStatus === 'instructed'}
            class:status-partially-instructed={item.instructionStatus === 'partially instructed'}
            class:status-pending={item.instructionStatus === 'pending'}
            class:status-will-not-be-instructed={item.instructionStatus === 'will not be instructed'}
            value={item.instructionStatus}
            id={`status-select-${item.id}`}
            disabled={isClient}
            on:change|stopPropagation={(e) => handleStatusChange(item.id, e.currentTarget.value as InstructionStatus, item)}
          >
            {#each instructionStatuses as status}
              <option value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
            {/each}
          </select>
        {:else}
          {item[column.key] ?? '-'}
        {/if}
      </svelte:fragment>
    </DataTable>
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
    --status-completed-bg: #d4edda;
    --status-completed-color: #155724;
  }

  .quotes-container {
    padding: 1rem 2rem;
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

  /* Email Link */
  .email-link {
    color: #3182ce;
    text-decoration: none;
    transition: color 0.2s ease-in-out;
  }
  .email-link:hover {
    color: #2b6cb0;
    text-decoration: underline;
  }

  /* Line Items Button */
  .line-items-button {
    background-color: #f1f3f5;
    border: 1px solid #dee2e6;
    border-radius: 9999px; /* Pill shape */
    padding: 0.2rem 0.6rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    transition: background-color 0.2s, border-color 0.2s;
    font-size: 0.75rem;
  }
  .line-items-button:hover {
    background-color: #e9ecef;
    border-color: #adb5bd;
  }
  .line-items-button .plus-sign {
    display: inline;
    font-size: 0.8em;
    font-weight: bold;
    line-height: 1;
  }

  /* Instruction Status Select */
  .instruction-status-select {
    padding: 0.3rem 0.5rem;
    border-radius: 5px;
    border: 1px solid #cbd5e0;
    font-size: 0.85rem;
    background-color: white;
    cursor: pointer;
    transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out, background-color 0.2s ease-in-out;
    min-width: 120px;
    text-align: left;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23718096'%3E%3Cpath fill-rule='evenodd' d='M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 1em 1em;
  }
  .instruction-status-select:focus {
    border-color: #4299e1;
    box-shadow: 0 0 0 1px #4299e1;
    outline: none;
  }
  .instruction-status-select:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  /* Status-specific Select Styling */
  .status-instructed {
    background-color: var(--status-completed-bg);
    color: var(--status-completed-color);
    border-color: var(--status-completed-bg);
    font-weight: 500;
  }
  .status-partially-instructed {
    background-color: var(--status-completed-bg);
    color: var(--status-completed-color);
    border-color: var(--status-completed-bg);
    font-weight: 500;
  }
  .status-pending {
    background-color: #e2e8f0;
    color: #4a5568;
    border-color: #e2e8f0;
    font-weight: 500;
  }
  .status-will-not-be-instructed {
    background-color: var(--status-not-started-bg);
    color: var(--status-not-started-color);
    border-color: var(--status-not-started-bg);
    font-weight: 500;
  }
</style> 