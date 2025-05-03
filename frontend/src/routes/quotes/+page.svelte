<script lang="ts">
  import {
    selectedProject, 
    allQuotes, 
    addQuote as addQuoteToStore, 
    updateQuote,
    updateQuoteInstructionStatus, 
    deleteQuote,
    type InstructionStatus, 
    type Quote, 
    type LineItem
  } from "$lib/stores/projectStore";
  import LineItemsModal from '$lib/components/LineItemsModal.svelte';
  import PartiallyInstructedModal from '$lib/components/PartiallyInstructedModal.svelte';
  import DocumentUploadModal from '$lib/components/DocumentUploadModal.svelte';
  import NotesModal from '$lib/components/NotesModal.svelte';
  
  // Instruction status options for dropdown (can be imported or defined here)
  const instructionStatuses: InstructionStatus[] = [
    'pending', 
    'will not be instructed',
    'partially instructed', 
    'instructed'
  ];
  
  // State for new quote modal
  let showNewQuoteModal = false;
  let isEditing = false;
  let quoteToEditId: string | null = null;
  
  // State for Add/Edit Notes Modal (within New Quote flow)
  let showAddNotesModal = false;
  let currentNotesForModal: string | undefined = '';
  
  // Function to create a blank line item object
  function createNewLineItem(): LineItem {
    return { description: '', cost: 0 };
  }

  // Function to create the initial empty form state
  function createInitialFormState() {
    return {
      discipline: '',
      surveyType: '',
      organisation: '',
      contactName: '',
      email: '',
      lineItems: [createNewLineItem()] as LineItem[],
      additionalNotes: '',
      instructionStatus: 'will not be instructed' as InstructionStatus,
      status: 'pending' as string,
      date: new Date().toISOString().split('T')[0],
      quoteFile: null as File | null
    };
  }

  // New quote/edit quote form data
  let newQuoteForm = createInitialFormState();
  let quoteFileInput: HTMLInputElement;
  
  // State for viewing line items modal
  let showLineItemsModal = false;
  let selectedQuoteForLineItems: Quote | null = null;
  
  // State for partially instructed modal
  let showPartiallyInstructedModal = false;
  let quoteForPartialInstruction: Quote | null = null;
  let currentlySelectedStatus: InstructionStatus | null = null;

  // State for document upload modal
  let showDocumentUploadModal = false;
  let quoteForDocumentUpload: Quote | null = null;
  let documentUploadType: 'quote' | 'instruction' | null = null;
  
  // --- Add/Edit Notes Modal Functions (within New Quote flow) ---
  function openAddNotesModal() {
    currentNotesForModal = newQuoteForm.additionalNotes;
    showAddNotesModal = true;
  }

  function closeAddNotesModal() {
    showAddNotesModal = false;
    // Optionally clear currentNotesForModal if needed, but it's probably fine
  }

  function handleSaveAddNotes(event: CustomEvent<{ notes: string }>) {
    newQuoteForm.additionalNotes = event.detail.notes;
    closeAddNotesModal();
  }
  // --- End Add/Edit Notes Modal Functions ---

  function openNewQuoteModal() {
    resetNewQuoteForm();
    isEditing = false;
    quoteToEditId = null;
    showNewQuoteModal = true;
  }
  
  function openEditQuoteModal(quote: Quote) {
    isEditing = true;
    quoteToEditId = quote.id;
    newQuoteForm = {
        ...createInitialFormState(),
        discipline: quote.discipline,
        surveyType: quote.surveyType || '', 
        organisation: quote.organisation,
        contactName: quote.contactName,
        email: quote.email || '', 
        lineItems: quote.lineItems.map(item => ({ ...item })),
        additionalNotes: quote.additionalNotes || '', 
        instructionStatus: quote.instructionStatus,
        status: quote.status || 'pending',
        date: quote.date || new Date().toISOString().split('T')[0]
    };
    if (newQuoteForm.lineItems.length === 0) {
        newQuoteForm.lineItems = [createNewLineItem()];
    }
    showNewQuoteModal = true;
  }
  
  function resetNewQuoteForm() {
    newQuoteForm = createInitialFormState();
    if (quoteFileInput) {
        quoteFileInput.value = '';
    }
  }
  
  function closeNewQuoteModal() {
    showNewQuoteModal = false;
    isEditing = false;
    quoteToEditId = null;
    resetNewQuoteForm();
  }
  
  function addLineItem() {
    newQuoteForm.lineItems = [...newQuoteForm.lineItems, createNewLineItem()];
  }
  
  function removeLineItem(index: number) {
    if (newQuoteForm.lineItems.length > 1) {
        newQuoteForm.lineItems = newQuoteForm.lineItems.filter((_, i) => i !== index);
    } else {
        newQuoteForm.lineItems[0] = createNewLineItem();
    }
  }
  
  function submitQuote() {
    if (!$selectedProject) {
      alert('Please select a project first.');
      return;
    }
    
    if (!newQuoteForm.discipline || !newQuoteForm.organisation || !newQuoteForm.contactName) {
      alert('Please fill in all required fields (Discipline, Organisation, Contact Name).');
      return;
    }
    
    const validLineItems = newQuoteForm.lineItems.filter(item => item.description.trim() !== '');

    if (validLineItems.length === 0 && !isEditing) {
        alert('Please add at least one valid line item with a description.');
        return;
    }
    
    const total = validLineItems.reduce((sum, item) => sum + (item.cost || 0), 0);

    if (newQuoteForm.quoteFile) {
        console.log('Selected file:', newQuoteForm.quoteFile.name);
    }

    const quoteDataForStore: Partial<Quote> = {
      discipline: newQuoteForm.discipline,
      surveyType: newQuoteForm.surveyType,
      organisation: newQuoteForm.organisation,
      contactName: newQuoteForm.contactName,
      email: newQuoteForm.email,
      lineItems: validLineItems,
      additionalNotes: newQuoteForm.additionalNotes,
      instructionStatus: newQuoteForm.instructionStatus,
      status: newQuoteForm.status,
      date: newQuoteForm.date,
      total: total
    };

    if (isEditing && quoteToEditId) {
      updateQuote(quoteToEditId, quoteDataForStore);
    } else {
      addQuoteToStore({ 
          ...quoteDataForStore, 
          projectId: $selectedProject.id 
      } as Omit<Quote, 'id' | 'total'> & { total: number });
    }
    
    closeNewQuoteModal();
  }
  
  function handleStatusChange(quoteId: string, newStatus: InstructionStatus, currentQuote: Quote) {
      if (newStatus === 'partially instructed') {
          quoteForPartialInstruction = currentQuote;
          currentlySelectedStatus = newStatus; 
          showPartiallyInstructedModal = true;
      } else {
          // Pass undefined for partialTotal to clear it if necessary
          updateQuoteInstructionStatus(quoteId, newStatus, undefined);
      }
  }
  
  function handleDeleteQuote(quoteId: string, organisationName: string) {
    if (confirm(`Are you sure you want to delete the quote from ${organisationName}? This cannot be undone.`)) {
      deleteQuote(quoteId);
    }
  }
  
  // Calculate total for new quote (now iterates through the array directly)
  $: newQuoteTotal = newQuoteForm.lineItems.reduce((sum, item) => sum + (item.cost || 0), 0);
  
  // Filter quotes based on selected project
  $: filteredQuotes = $selectedProject 
    ? $allQuotes.filter(quote => quote.projectId === $selectedProject.id) 
    : [];

  // Functions for Line Items Modal
  function openLineItemsModal(quote: Quote) {
      selectedQuoteForLineItems = quote;
      showLineItemsModal = true;
  }

  function closeLineItemsModal() {
      showLineItemsModal = false;
      selectedQuoteForLineItems = null;
  }

  // Functions for Partially Instructed Modal
  function handlePartialInstructionConfirm(event: CustomEvent<{ selectedItems: LineItem[] }>) {
      const selectedItems = event.detail.selectedItems;
      if (quoteForPartialInstruction && currentlySelectedStatus === 'partially instructed') {
          const partialTotal = selectedItems.reduce((sum, item) => sum + (item.cost || 0), 0);
          console.log("Selected partial items:", selectedItems, "Total:", partialTotal);
          // Pass the calculated partial total
          updateQuoteInstructionStatus(quoteForPartialInstruction.id, currentlySelectedStatus, partialTotal);
      }
      closePartiallyInstructedModal();
  }

  function handlePartialInstructionCancel() {
       if (quoteForPartialInstruction) {
       }
      closePartiallyInstructedModal();
  }
  
  function closePartiallyInstructedModal() {
      showPartiallyInstructedModal = false;
      quoteForPartialInstruction = null;
      currentlySelectedStatus = null;
  }

  // Functions for Document Upload Modal
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

  function handleUploadComplete(event: CustomEvent<{ quoteId: string, documentType: 'quote' | 'instruction', fileName: string }>) {
      const { quoteId, documentType, fileName } = event.detail;
      console.log(`Successfully uploaded ${documentType} document "${fileName}" for quote ${quoteId}`);
      // TODO: Potentially update UI or quote state to reflect uploaded file
  }
</script>

<div class="quotes-container">
  <h1>Surveyor Quotes</h1>
  
  {#if $selectedProject}
    <div class="quotes-header">
      <h2>Quotes for {$selectedProject.name}</h2>
      <button class="add-quote-btn" on:click={openNewQuoteModal}>+ Add New Quote</button>
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
          {#each filteredQuotes as quote (quote.id)}
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
  
  <!-- New Quote Modal -->
  {#if showNewQuoteModal}
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{isEditing ? 'Edit Quote' : 'Add New Quote'}</h2>
          <button class="close-btn" on:click={closeNewQuoteModal}>×</button>
        </div>
        
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label for="discipline">Discipline<span class="required">*</span></label>
              <input type="text" id="discipline" bind:value={newQuoteForm.discipline} required />
            </div>
            
            <div class="form-group">
              <label for="surveyType">Survey Type</label>
              <input type="text" id="surveyType" bind:value={newQuoteForm.surveyType} />
            </div>
            
            <div class="form-group">
              <label for="organisation">Organisation<span class="required">*</span></label>
              <input type="text" id="organisation" bind:value={newQuoteForm.organisation} required />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="contactName">Contact Name<span class="required">*</span></label>
              <input type="text" id="contactName" bind:value={newQuoteForm.contactName} required />
            </div>
            
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" bind:value={newQuoteForm.email} />
            </div>
          </div>
          
          <hr />
          
          <h3>Line Items</h3>
          
          <div class="line-items-input-area">
            {#each newQuoteForm.lineItems as item, index (index)}
              <div class="line-item-input-row">
                 <div class="line-item-inputs">
                    <input 
                      type="text" 
                      placeholder="Description" 
                      bind:value={item.description} 
                      class="line-item-desc-input"
                    />
                    <div class="cost-input-wrapper">
                      <label class="cost-label">£ (excl. VAT)</label>
                      <input 
                        type="number" 
                        placeholder="0" 
                        bind:value={item.cost} 
                        min="0" 
                        step="0.01"
                        class="cost-input"
                      />
                    </div>
                 </div>
                 <button 
                    class="remove-line-item-btn" 
                    title="Remove Line Item"
                    on:click={() => removeLineItem(index)}
                 >×</button>
              </div>
            {/each}
          </div>

          <button class="add-line-item-btn" on:click={addLineItem}>+ Add New Line Item</button>
          
          <div class="total-container">
            <span class="total-label">Total: £{newQuoteTotal.toFixed(2)}</span>
          </div>
          
          <h3>Additional Notes</h3>
          <div class="notes-display" on:click={openAddNotesModal} title="Click to edit notes">
            {#if newQuoteForm.additionalNotes}
              <pre>{newQuoteForm.additionalNotes}</pre>
            {:else}
              <span class="placeholder">Click to add notes...</span>
            {/if}
          </div>

          <h3 class="mt-4">Attach Quote Document</h3>
          <div class="form-group">
            <label for="quoteFile">Upload File</label>
            <input 
              type="file" 
              id="quoteFile" 
              bind:this={quoteFileInput} 
              on:change={(e) => newQuoteForm.quoteFile = e.currentTarget.files ? e.currentTarget.files[0] : null} 
            />
            {#if newQuoteForm.quoteFile}
              <span class="file-name">Selected: {newQuoteForm.quoteFile.name}</span>
            {/if}
          </div>

        </div>
        
        <div class="modal-footer">
          <button class="cancel-btn" on:click={closeNewQuoteModal}>Cancel</button>
          <button class="submit-btn" on:click={submitQuote}>
            {isEditing ? 'Update Quote' : 'Add Quote'}
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Notes Modal Instance (for Add/Edit Quote) -->
  {#if showAddNotesModal}
    <NotesModal
      initialNotes={currentNotesForModal}
      organisationName={newQuoteForm.organisation || 'New Quote'}
      on:save={handleSaveAddNotes}
      on:cancel={closeAddNotesModal}
    />
  {/if}

  <!-- Line Items Modal -->
  {#if showLineItemsModal && selectedQuoteForLineItems}
    <LineItemsModal 
      items={selectedQuoteForLineItems.lineItems} 
      organisationName={selectedQuoteForLineItems.organisation} 
      on:close={closeLineItemsModal} 
    />
  {/if}

  <!-- Partially Instructed Modal -->
  {#if showPartiallyInstructedModal && quoteForPartialInstruction}
    <PartiallyInstructedModal 
      quote={quoteForPartialInstruction}
      on:confirm={handlePartialInstructionConfirm}
      on:cancel={handlePartialInstructionCancel} 
    />
  {/if}

  <!-- Document Upload Modal -->
  {#if showDocumentUploadModal && quoteForDocumentUpload && documentUploadType}
    <DocumentUploadModal 
      bind:showModal={showDocumentUploadModal}
      title={`Upload ${documentUploadType === 'quote' ? 'Quote' : 'Instruction'} Document`}
      quoteId={quoteForDocumentUpload.id}
      documentType={documentUploadType}
      on:close={closeDocumentUploadModal}
      on:uploadComplete={handleUploadComplete}
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
  
  .status-badge { /* This remains for the internal status if ever needed */
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
  
  /* Styling for the new instruction status dropdown */
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
  
  /* Status Color Coding */
  .instruction-status-select.status-instructed,
  .instruction-status-select.status-partially-instructed {
    background-color: #d4edda; /* Light green */
    color: #155724; /* Dark green text */
    border-color: #c3e6cb;
    /* Keep custom arrow, changing its color */
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23155724'%3E%3Cpath fill-rule='evenodd' d='M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06z'/%3E%3C/svg%3E");
  }
  
  .instruction-status-select.status-pending {
    background-color: #fff3cd; /* Light orange/yellow */
    color: #856404; /* Dark orange/yellow text */
    border-color: #ffeeba;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23856404'%3E%3Cpath fill-rule='evenodd' d='M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06z'/%3E%3C/svg%3E");
  }
  
  .instruction-status-select.status-will-not-be-instructed {
    background-color: #f8d7da; /* Light red */
    color: #721c24; /* Dark red text */
    border-color: #f5c6cb;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23721c24'%3E%3Cpath fill-rule='evenodd' d='M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06z'/%3E%3C/svg%3E");
  }
  
  /* Modal Styles */
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
    z-index: 1000;
  }
  
  .modal-content {
    background-color: white;
    border-radius: 5px;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
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
    font-size: 1.5rem;
    margin: 0;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6c757d;
  }
  
  .modal-body {
    padding: 1.5rem;
  }
  
  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e9ecef;
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }
  
  .form-row {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .form-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  label {
    font-weight: 500;
    color: #555;
  }
  
  .required {
    color: #dc3545;
    margin-left: 2px;
  }
  
  input[type="text"],
  input[type="email"],
  input[type="number"],
  textarea {
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  hr {
    border: 0;
    border-top: 1px solid #e9ecef;
    margin: 1.5rem 0;
  }
  
  h3 {
    font-size: 1.2rem;
    color: #495057;
    margin-bottom: 0.75rem;
  }
  
  .line-items-input-area {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .line-item-input-row {
    display: flex;
    gap: 0.75rem;
    align-items: flex-end;
  }
  
  .line-item-inputs {
     display: flex;
     gap: 1rem;
     flex-grow: 1;
     align-items: flex-end;
  }
  
  .line-item-desc-input {
     flex: 1;
     height: 38px;
  }
  
  .cost-input-wrapper {
    display: flex;
    flex-direction: column;
    width: 200px;
  }
  
  .cost-label {
    font-size: 0.875rem;
    color: #495057;
    margin-bottom: 0.25rem;
  }
  
  .cost-input {
    width: 100%;
    border: 1px solid #ced4da;
    border-radius: 4px;
    height: 38px;
    padding: 0.5rem;
  }
  
  .remove-line-item-btn {
    background: none;
    border: 1px solid #ced4da;
    color: #dc3545;
    font-size: 1.25rem;
    font-weight: bold;
    cursor: pointer;
    padding: 0;
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    flex-shrink: 0;
    transition: background-color 0.2s, color 0.2s;
  }
  
  .remove-line-item-btn:hover {
    background-color: #f8d7da;
    color: #721c24;
    border-color: #f5c6cb;
  }
  
  .add-line-item-btn {
    background: none;
    border: 1px dashed #007bff;
    color: #007bff;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    width: 100%;
    text-align: center;
    transition: all 0.2s;
    font-weight: 500;
    margin-bottom: 1.5rem;
  }
  
  .add-line-item-btn:hover {
    background-color: rgba(0, 123, 255, 0.1);
    color: #0056b3;
    border-style: solid;
  }
  
  .total-container {
    margin: 1rem 0;
    text-align: right;
  }
  
  .total-label {
    font-size: 1.1rem;
    font-weight: 500;
  }
  
  .cancel-btn {
    padding: 0.6rem 1.5rem;
    border: 1px solid #ced4da;
    background-color: white;
    border-radius: 4px;
    color: #495057;
    cursor: pointer;
    font-size: 1rem;
  }
  
  .submit-btn {
    padding: 0.6rem 1.5rem;
    border: none;
    background-color: #007bff;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
  }
  
  .cancel-btn:hover {
    background-color: #f8f9fa;
  }
  
  .submit-btn:hover {
    background-color: #0069d9;
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

  /* Added simple margin-top utility class */
  .mt-4 {
    margin-top: 1.5rem;
  }

  /* Styling for the new notes display div */
  .notes-display {
    border: 1px solid #ced4da;
    border-radius: 4px;
    padding: 0.5rem;
    min-height: 60px;
    cursor: pointer;
    background-color: #f8f9fa;
    transition: background-color 0.2s;
    width: 100%;
    margin-bottom: 0.5rem;
  }

  .notes-display:hover {
    background-color: #e9ecef;
  }

  .notes-display pre {
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: inherit;
    font-size: 1rem;
  }

  .notes-display .placeholder {
    color: #6c757d;
    font-style: italic;
  }
  /* End Styling for notes display */
</style> 