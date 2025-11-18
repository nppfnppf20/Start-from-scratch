<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { addSurveyorOrganisation, surveyorOrganisations } from '$lib/stores/surveyorOrganisationStore';
  
    // Props
    export let isOpen: boolean = false;
  
    // Events
    const dispatch = createEventDispatcher<{close: void}>();
  
    // Form state
    let organisationForm = {
      organisation: '',
      discipline: '',
      location: '',
      contacts: [
        { contactName: '', email: '', phoneNumber: '' }
      ]
    };
  
    // UI state
    let isSubmitting = false;
    let submitError = '';
  
    // Helper functions
    function createNewContact() {
      return { contactName: '', email: '', phoneNumber: '' };
    }
  
    function addContact() {
      organisationForm.contacts = [...organisationForm.contacts, createNewContact()];
    }
  
    function removeContact(index: number) {
      if (organisationForm.contacts.length > 1) {
        organisationForm.contacts = organisationForm.contacts.filter((_, i) => i !== index);
      }
    }
  
    function resetForm() {
      console.log('🔄 RESET: Form reset called');
      console.log('🔄 RESET: Form BEFORE reset:', JSON.stringify(organisationForm, null, 2));
      
      organisationForm = {
        organisation: '',
        discipline: '',
        location: '',
        contacts: [createNewContact()]
      };
      submitError = '';
      
      console.log('🔄 RESET: Form AFTER reset:', JSON.stringify(organisationForm, null, 2));
    }
  
    function closeModal() {
      console.log('🚪 CLOSE: Modal being closed');
      resetForm();
      dispatch('close');
    }
  
    async function handleSubmit() {
      console.log('🚀 SUBMIT: Form submission started');
      console.log('🚀 SUBMIT: Current form state:', JSON.stringify(organisationForm, null, 2));
      
      isSubmitting = true;
      submitError = '';
  
      try {
        // Filter out empty contacts
        const validContacts = organisationForm.contacts.filter(contact => 
          contact.contactName.trim() || contact.email.trim() || contact.phoneNumber.trim()
        );
  
        const payload = {
          organisation: organisationForm.organisation.trim(),
          discipline: organisationForm.discipline.trim(),
          location: organisationForm.location?.trim() || '',
          contacts: validContacts
        };

        console.log('🚀 SUBMIT: Payload being sent:', JSON.stringify(payload, null, 2));
  
        const result = await addSurveyorOrganisation(payload);
        
        if (result) {
          closeModal();
        } else {
          submitError = 'Failed to add organisation. Please try again.';
        }
      } catch (error) {
        console.error('Error adding organisation:', error);
        submitError = error instanceof Error ? error.message : 'An unexpected error occurred';
      } finally {
        isSubmitting = false;
      }
    }
  
      // Reset form when modal opens
  $: if (isOpen) {
    console.log('🚪 MODAL: Modal opened, isOpen =', isOpen);
    console.log('📋 EXISTING ORGS: What already exists in database:', $surveyorOrganisations.map((org: any) => `"${org.organisation}" + "${org.discipline}"`));
    resetForm();
  }
  </script>
  
  {#if isOpen}
  <div class="modal-backdrop" on:click|self={closeModal}>
    <div class="modal-content">
      <h3>Add New Surveyor Organisation</h3>
      

        
        {#if submitError}
          <div class="error-message">
            {submitError}
          </div>
        {/if}
  
        <form on:submit|preventDefault={handleSubmit}>
          <!-- Basic Information -->
          <div class="form-grid-modal">
            <div class="form-row">
              <label for="organisation">Organisation Name*</label>
              <input 
                type="text" 
                id="organisation" 
                bind:value={organisationForm.organisation} 
                required 
                disabled={isSubmitting}
                autocomplete="off"
              >
            </div>
            
            <div class="form-row">
              <label for="discipline">Discipline*</label>
              <input 
                type="text" 
                id="discipline" 
                bind:value={organisationForm.discipline} 
                required 
                disabled={isSubmitting}
                autocomplete="off"
              >
            </div>
            
            <div class="form-row">
              <label for="location">Location</label>
              <input 
                type="text" 
                id="location" 
                bind:value={organisationForm.location} 
                disabled={isSubmitting}
                autocomplete="off"
              >
            </div>
          </div>
  
          <!-- Contacts Section -->
          <h4>Contacts</h4>
          <div class="contacts-section">
            {#each organisationForm.contacts as contact, index}
              <div class="contact-row">
                <div class="contact-header">
                  <span>Contact {index + 1}</span>
                  {#if organisationForm.contacts.length > 1}
                    <button 
                      type="button" 
                      class="remove-contact-btn"
                      on:click={() => removeContact(index)}
                      disabled={isSubmitting}
                      title="Remove Contact"
                    >
                      Remove
                    </button>
                  {/if}
                </div>
                
                <div class="contact-fields">
                  <div class="form-row">
                    <label for="contactName-{index}">Contact Name</label>
                    <input 
                      type="text" 
                      id="contactName-{index}"
                      bind:value={contact.contactName}
                      disabled={isSubmitting}
                      autocomplete="off"
                    >
                  </div>
                  
                  <div class="form-row">
                    <label for="email-{index}">Email</label>
                    <input 
                      type="email" 
                      id="email-{index}"
                      bind:value={contact.email}
                      disabled={isSubmitting}
                      autocomplete="off"
                    >
                  </div>
                  
                  <div class="form-row">
                    <label for="phoneNumber-{index}">Phone Number</label>
                    <input 
                      type="tel" 
                      id="phoneNumber-{index}"
                      bind:value={contact.phoneNumber}
                      disabled={isSubmitting}
                      autocomplete="off"
                    >
                  </div>
                </div>
              </div>
            {/each}
          </div>
  
          <button 
            type="button" 
            class="add-contact-btn" 
            on:click={addContact}
            disabled={isSubmitting}
            title="Add Additional Contact"
          >
            + Add Additional Contact
          </button>
  
          <!-- Modal Actions -->
          <div class="modal-actions">
            <button 
              type="submit" 
              class="save-btn"
              disabled={isSubmitting || !organisationForm.organisation.trim() || !organisationForm.discipline.trim()}
            >
              {isSubmitting ? 'Adding...' : 'Add Organisation'}
            </button>
            <button 
              type="button" 
              class="cancel-btn"
              on:click={closeModal}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
  
  <style>
    /* Modal Structure - Same as QuoteModal */
    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background-color: rgba(0,0,0,0.6);
      display: flex; justify-content: center; align-items: center; z-index: 9999;
    }
    
    .modal-content {
      background-color: white; padding: 25px; border-radius: 8px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.25);
      max-width: 700px; width: 95%; max-height: 90vh; overflow-y: auto;
    }
    
    .modal-content h3 {
      margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 20px;
    }
  
    /* Form Grid - Same as QuoteModal */
    .form-grid-modal {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .form-row {
      margin-bottom: 0;
      display: flex; flex-direction: column;
    }
    
    .form-row label { 
      margin-bottom: 5px; font-weight: 600; font-size: 0.9em; 
    }
    
    .form-row input[type="text"],
    .form-row input[type="email"],
    .form-row input[type="tel"] {
      width: 100%; padding: 9px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;
      font-size: 0.95em;
    }
    
    .form-row input:focus {
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
      outline: none;
    }
  
    .form-row input:disabled {
      background-color: #f8f9fa;
      cursor: not-allowed;
    }
  
    /* Section Headers */
    h4 { 
      margin-top: 20px; margin-bottom: 15px; 
      border-bottom: 1px solid #eee; padding-bottom: 5px; 
    }
  
    /* Contacts Section */
    .contacts-section {
      margin-bottom: 15px;
    }
  
    .contact-row {
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 15px;
      background-color: #fafafa;
    }
  
    .contact-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e0e0e0;
    }
  
    .contact-header span {
      font-weight: 600;
      color: #333;
    }
  
    .contact-fields {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }
  
    /* Buttons */
    .remove-contact-btn {
      padding: 4px 8px;
      background-color: #dc3545;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.85em;
      font-weight: 500;
    }
  
    .remove-contact-btn:hover:not(:disabled) {
      background-color: #c82333;
    }
  
    .remove-contact-btn:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
  
    .add-contact-btn {
      margin-bottom: 20px;
      background-color: #007bff;
      color: white;
      padding: 8px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      align-self: flex-start;
    }
  
    .add-contact-btn:hover:not(:disabled) {
      background-color: #0069d9;
    }
  
    .add-contact-btn:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
  
    /* Modal Actions - Same as QuoteModal */
    .modal-actions { 
      display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px; 
      border-top: 1px solid #eee; padding-top: 20px; 
    }
    
    .modal-actions button { 
      padding: 10px 18px; border-radius: 4px; cursor: pointer; border: none; font-weight: 500; 
    }
    
    .save-btn { 
      background-color: #007bff; color: white; 
    }
    
    .cancel-btn { 
      background-color: #6c757d; color: white; 
    }
    
    .save-btn:hover:not(:disabled) { 
      background-color: #0069d9; 
    }
    
    .cancel-btn:hover:not(:disabled) { 
      background-color: #5a6268; 
    }
  
    .save-btn:disabled, .cancel-btn:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
  
    /* Error Message */
    .error-message {
      background-color: #f8d7da;
      color: #721c24;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 20px;
      border: 1px solid #f5c6cb;
    }
  </style>