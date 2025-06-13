<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import {
    addQuote,
    updateQuote,
    type InstructionStatus,
    type Quote,
    type LineItem
  } from "$lib/stores/projectStore"; // Import only necessary store functions

  // --- Props ---
  export let isOpen: boolean = false;
  export let quoteToEdit: Quote | null = null; // Pass null for new quote, quote object for edit
  export let projectId: string | undefined = undefined; // Needed for adding new quotes

  // --- Events ---
  const dispatch = createEventDispatcher<{close: void}>(); // Only 'close' needed, save handled internally

  // --- Internal State ---
  let isEditing = false;
  let quoteToEditId: string | null = null;

  // --- Utility Functions ---
  function createNewLineItem(): LineItem {
    return { item: '', description: '', cost: 0 };
  }

  function createInitialFormState() {
    return {
      discipline: '',
      surveyType: '',
      organisation: '',
      contactName: '',
      email: '',
      phoneNumber: '',
      lineItems: [createNewLineItem()] as LineItem[],
      additionalNotes: '',
      instructionStatus: 'pending' as InstructionStatus, // Default to pending for new
    };
  }

  // Form state
  let quoteForm = createInitialFormState();
  // let quoteFileInput: HTMLInputElement; // Removed

  // Reactive statement to update form when props change (modal opens/quoteToEdit changes)
  $: if (isOpen) {
      initializeForm();
  }

  function initializeForm() {
      if (quoteToEdit) {
          console.log("Initializing modal form for editing quote:", quoteToEdit);
          isEditing = true;
          quoteToEditId = quoteToEdit.id;
          quoteForm = {
              ...createInitialFormState(), // Start fresh but override
              discipline: quoteToEdit.discipline,
              surveyType: quoteToEdit.surveyType || '',
              organisation: quoteToEdit.organisation,
              contactName: quoteToEdit.contactName,
              email: quoteToEdit.email || '',
              phoneNumber: quoteToEdit.phoneNumber || '',
              lineItems: quoteToEdit.lineItems.length > 0 ? quoteToEdit.lineItems.map(item => ({ ...item })) : [createNewLineItem()], // Ensure at least one line item row
              additionalNotes: quoteToEdit.additionalNotes || '',
              instructionStatus: quoteToEdit.instructionStatus,
          };
      } else {
          console.log("Initializing modal form for new quote");
          isEditing = false;
          quoteToEditId = null;
          quoteForm = createInitialFormState(); // Reset to blank for new quote
      }
      // Reset file input visually if it existed
      // if (quoteFileInput) quoteFileInput.value = '';
  }


  // --- Modal Functions ---
  function closeModal() {
    isOpen = false; // Update prop locally (binding handles parent)
    dispatch('close');
    // Reset internal state *after* dispatching close, just in case
    // setTimeout(resetForm, 0); // Delay reset slightly? Or handled by initializeForm on reopen
  }

  function resetForm() {
      quoteForm = createInitialFormState();
      isEditing = false;
      quoteToEditId = null;
      // if (quoteFileInput) quoteFileInput.value = '';
  }


  // --- Line Item Functions ---
  function addLineItem() {
    quoteForm.lineItems = [...quoteForm.lineItems, createNewLineItem()];
  }

  function removeLineItem(index: number) {
    if (quoteForm.lineItems.length > 1) {
        quoteForm.lineItems = quoteForm.lineItems.filter((_, i) => i !== index);
    } else {
        // Clear the only line item instead of removing the row
        quoteForm.lineItems[0] = createNewLineItem();
    }
  }

  // --- Form Submission ---
  async function submitQuote() {
    if (!isEditing && !projectId) {
      alert('Error: Project ID is missing. Cannot add quote.');
      console.error("Attempted to add quote without projectId prop.");
      return;
    }

    // Basic form validation
    if (!quoteForm.discipline || !quoteForm.organisation || !quoteForm.contactName) {
      alert('Please fill in all required fields (Discipline, Organisation, Contact Name).');
      return;
    }
    const validLineItems = quoteForm.lineItems.filter(item => item.description.trim() !== '');
    if (validLineItems.length === 0) {
      alert('Please add at least one valid line item with a description.');
      return;
    }

    // New validation for 'item' field
    const invalidItem = validLineItems.find(item => !item.item || item.item.trim() === '');
    if (invalidItem) {
        alert('Please fill in the "Item" for all line items.');
        return;
    }

    // Prepare data for the store/API call
    const quoteDataForStore: Partial<Omit<Quote, 'id' | 'total'>> = {
      discipline: quoteForm.discipline,
      surveyType: quoteForm.surveyType || undefined,
      organisation: quoteForm.organisation,
      contactName: quoteForm.contactName,
      email: quoteForm.email || undefined,
      phoneNumber: quoteForm.phoneNumber || undefined,
      lineItems: validLineItems,
      additionalNotes: quoteForm.additionalNotes || undefined,
      instructionStatus: quoteForm.instructionStatus,
      ...( !isEditing && { projectId: projectId } )
    };

    try {
        let success = false;
        if (isEditing && quoteToEditId) {
          console.log('Attempting to update quote via modal:', quoteToEditId, quoteDataForStore);
          // Pass only changed fields? No, API expects full update state usually via $set
          success = await updateQuote(quoteToEditId, quoteDataForStore);
        } else if (!isEditing && projectId) {
          console.log('Attempting to add quote via modal:', quoteDataForStore);
          const addedQuote = await addQuote(quoteDataForStore as Omit<Quote, 'id' | 'total' | 'createdAt' | 'updatedAt'>);
          success = !!addedQuote;
        } else {
            throw new Error("Invalid state for submission (missing projectId or quoteToEditId).");
        }

        if (success) {
            closeModal(); // Close modal on success
            // Parent page reactivity should update the table via store subscription
        } else {
            // Error alert is likely shown by the store function itself
            alert(`Failed to ${isEditing ? 'update' : 'add'} quote. See console for details.`);
        }
    } catch (error) {
        console.error(`Error ${isEditing ? 'updating' : 'adding'} quote via modal:`, error);
        alert(`An error occurred while ${isEditing ? 'updating' : 'adding'} the quote.`);
    }
  }

  // Derived state for total calculation
  $: quoteTotal = quoteForm.lineItems.reduce((sum, item) => sum + (item.cost || 0), 0);

</script>

{#if isOpen}
  <div class="modal-backdrop" on:click|self={closeModal}>
    <div class="modal quote-modal-content"> <!-- Added specific class -->
      <h3>{isEditing ? 'Edit Quote' : 'Add New Quote'}</h3>
      <form on:submit|preventDefault={submitQuote}>
          <!-- Form Fields -->
          <div class="form-grid-modal"> <!-- Use grid for better layout -->
              <div class="form-row">
                <label for="discipline">Discipline*</label>
                <input type="text" id="discipline" bind:value={quoteForm.discipline} required>
              </div>
              <div class="form-row">
                 <label for="surveyType">Survey Type</label>
                 <input type="text" id="surveyType" bind:value={quoteForm.surveyType}>
              </div>
               <div class="form-row">
                 <label for="organisation">Organisation*</label>
                 <input type="text" id="organisation" bind:value={quoteForm.organisation} required>
               </div>
               <div class="form-row">
                 <label for="contactName">Contact Name*</label>
                 <input type="text" id="contactName" bind:value={quoteForm.contactName} required>
               </div>
               <div class="form-row">
                 <label for="email">Email</label>
                 <input type="email" id="email" bind:value={quoteForm.email}>
               </div>
               <div class="form-row">
                 <label for="phoneNumber">Phone Number</label>
                 <input type="tel" id="phoneNumber" bind:value={quoteForm.phoneNumber}>
               </div>
          </div>

          <!-- Line Items Section -->
          <h4>Line Items</h4>
          <div class="line-item-headers">
             <span>Item</span>
             <span>Description</span>
             <span>£ excl. VAT</span>
          </div>
          {#each quoteForm.lineItems as item, index}
             <div class="line-item-row">
                <input type="text" bind:value={item.item} required maxlength="100">
                <input type="text" bind:value={item.description} required={index === 0 || quoteForm.lineItems.length > 1}>
                <input type="number" placeholder="0.00" step="0.01" min="0" bind:value={item.cost} required={index === 0 || quoteForm.lineItems.length > 1}>
                <button type="button" on:click={() => removeLineItem(index)} disabled={quoteForm.lineItems.length <= 1} title="Remove Line Item">-</button>
             </div>
          {/each}
          <button type="button" on:click={addLineItem} class="add-line-item-btn" title="Add Line Item">+ Add Line Item</button>
          <p class="modal-total">Calculated Total: £{quoteTotal.toFixed(2)}</p>

          <!-- Notes Section -->
          <div class="form-row notes-row">
             <label>Additional Notes</label>
             <textarea rows="4" bind:value={quoteForm.additionalNotes}></textarea>
          </div>

          <!-- Optional File Upload Placeholder -->
          <!--
          <div class="form-row">
            <label for="quoteFile">Upload Quote PDF</label>
            <input type="file" id="quoteFile" accept=".pdf" bind:this={quoteFileInput} on:change={(e) => quoteForm.quoteFile = e.currentTarget.files ? e.currentTarget.files[0] : null}>
          </div>
          -->

          <!-- Modal Actions -->
          <div class="modal-actions">
            <button type="submit" class="save-btn">{isEditing ? 'Save Changes' : 'Add Quote'}</button>
            <button type="button" on:click={closeModal} class="cancel-btn">Cancel</button>
          </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background-color: rgba(0,0,0,0.6);
    display: flex; justify-content: center; align-items: center; z-index: 100;
  }
  .quote-modal-content { /* Use specific class */
    background-color: white; padding: 25px; border-radius: 8px;
    box-shadow: 0 5px 20px rgba(0,0,0,0.25);
    max-width: 700px; width: 95%; max-height: 90vh; overflow-y: auto;
  }
  .quote-modal-content h3 {
    margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 20px;
  }
  .form-grid-modal { /* Simple two-column grid for basic info */
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); /* Responsive columns */
      gap: 15px;
      margin-bottom: 15px;
  }
  .modal form .form-row {
     margin-bottom: 0; /* Grid handles spacing */
     display: flex; flex-direction: column;
  }
  .modal form label { margin-bottom: 5px; font-weight: 600; font-size: 0.9em; }
  .modal form input[type="text"],
  .modal form input[type="email"],
  .modal form input[type="tel"],
  .modal form input[type="number"],
  .modal form select,
  .modal form textarea {
    width: 100%; padding: 9px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;
    font-size: 0.95em;
  }
   .modal form input:focus, .modal form select:focus, .modal form textarea:focus {
       border-color: #007bff;
       box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
       outline: none;
   }

  h4 { margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }

  .line-item-row {
    display: flex;
    gap: 0.5rem; /* spacing between elements */
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .line-item-row input {
    flex: 1; /* a little more space for text */
    min-width: 0;
  }

  .line-item-row input[type="number"] {
    flex: 0.5; /* less space for cost */
  }

  .line-item-row button {
    flex-shrink: 0; /* prevent button from shrinking */
    padding: 5px 9px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; line-height: 1;
  }
  .line-item-row button:disabled { background-color: #ccc; cursor: not-allowed; }

  /* Hide arrows from number input */
  .line-item-row input[type=number] {
    -moz-appearance: textfield;
  }
  .line-item-row input[type=number]::-webkit-outer-spin-button,
  .line-item-row input[type=number]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .add-line-item-btn {
      margin-top: 5px;
      background-color: #007bff;
      color: white;
      padding: 6px 10px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      align-self: flex-start;
  }

  .modal-total { font-weight: bold; margin: 15px 0; text-align: right; font-size: 1.1em; }

  .notes-row {
    grid-column: 1 / -1; /* Make notes span full width */
  }
  .notes-row textarea {
    width: 100%;
    resize: vertical;
  }

  .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px; border-top: 1px solid #eee; padding-top: 20px; }
  .modal-actions button { padding: 10px 18px; border-radius: 4px; cursor: pointer; border: none; font-weight: 500; }
  .save-btn { background-color: #007bff; color: white; }
  .cancel-btn { background-color: #6c757d; color: white; }
  .save-btn:hover { background-color: #0069d9; }
  .cancel-btn:hover { background-color: #5a6268; }

  .line-item-headers {
    display: flex;
    gap: 0.5rem;
    padding-right: 40px; /* Space for the remove button to align columns */
    margin-bottom: 4px;
    font-weight: bold;
    font-size: 0.9em;
    color: #333;
  }
  .line-item-headers span {
    flex: 1;
  }
  .line-item-headers span:last-child {
    flex: 0.5;
  }

</style> 