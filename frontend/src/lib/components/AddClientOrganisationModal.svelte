<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { addClientOrganisation } from '$lib/stores/clientStore';
  
    export let isOpen: boolean = false;
  
    const dispatch = createEventDispatcher<{close: void}>();
  
    let organisationForm = {
      organisationName: '',
      contacts: [{ contactName: '', email: '', phoneNumber: '' }]
    };
  
    let isSubmitting = false;
    let submitError = '';
  
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
      organisationForm = {
        organisationName: '',
        contacts: [createNewContact()]
      };
      submitError = '';
    }
  
    function closeModal() {
      resetForm();
      dispatch('close');
    }
  
    async function handleSubmit() {
      isSubmitting = true;
      submitError = '';
  
      try {
        const validContacts = organisationForm.contacts.filter(contact => 
          contact.contactName.trim() || contact.email.trim() || contact.phoneNumber.trim()
        );
  
        const payload = {
          organisationName: organisationForm.organisationName.trim(),
          contacts: validContacts
        };
  
        const result = await addClientOrganisation(payload);
        
        if (result) {
          closeModal();
        } else {
          submitError = 'Failed to add organisation. Please try again.';
        }
      } catch (error) {
        submitError = error instanceof Error ? error.message : 'An unexpected error occurred';
      } finally {
        isSubmitting = false;
      }
    }
  
    $: if (isOpen) {
      resetForm();
    }
</script>
  
{#if isOpen}
<div class="modal-backdrop" on:click|self={closeModal}>
  <div class="modal-content">
    <h3>Add New Client Organisation</h3>
    
    {#if submitError}
      <div class="error-message">{submitError}</div>
    {/if}

    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-row">
        <label for="organisationName">Organisation Name*</label>
        <input 
          type="text" 
          id="organisationName" 
          bind:value={organisationForm.organisationName} 
          required 
          disabled={isSubmitting}
        >
      </div>

      <h4>Contacts</h4>
      <div class="contacts-section">
        {#each organisationForm.contacts as contact, index}
          <div class="contact-row">
            <div class="contact-header">
              <span>Contact {index + 1}</span>
              {#if organisationForm.contacts.length > 1}
                <button type="button" class="remove-contact-btn" on:click={() => removeContact(index)} disabled={isSubmitting}>
                  Remove
                </button>
              {/if}
            </div>
            <div class="contact-fields">
              <div class="form-row">
                <label for="contactName-{index}">Contact Name</label>
                <input type="text" id="contactName-{index}" bind:value={contact.contactName} disabled={isSubmitting}>
              </div>
              <div class="form-row">
                <label for="email-{index}">Email</label>
                <input type="email" id="email-{index}" bind:value={contact.email} disabled={isSubmitting}>
              </div>
              <div class="form-row">
                <label for="phoneNumber-{index}">Phone Number</label>
                <input type="tel" id="phoneNumber-{index}" bind:value={contact.phoneNumber} disabled={isSubmitting}>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <button type="button" class="add-contact-btn" on:click={addContact} disabled={isSubmitting}>
        + Add Contact
      </button>

      <div class="modal-actions">
        <button type="submit" class="save-btn" disabled={isSubmitting || !organisationForm.organisationName.trim()}>
          {isSubmitting ? 'Adding...' : 'Add Organisation'}
        </button>
        <button type="button" class="cancel-btn" on:click={closeModal} disabled={isSubmitting}>
          Cancel
        </button>
      </div>
    </form>
  </div>
</div>
{/if}

<style>
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
.error-message {
  background-color: #f8d7da; color: #721c24;
  padding: 10px; border-radius: 4px; margin-bottom: 15px;
}
.contacts-section { margin-bottom: 15px; }
.contact-row {
  border: 1px solid #eee; border-radius: 6px;
  padding: 15px; margin-bottom: 15px;
}
.contact-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 10px; font-weight: bold;
}
.remove-contact-btn {
  background: none; border: 1px solid #dc3545; color: #dc3545;
  padding: 4px 8px; border-radius: 4px; cursor: pointer;
}
.add-contact-btn {
  margin-bottom: 20px;
}
.form-row {
  margin-bottom: 15px;
}
.form-row label {
  display: block; margin-bottom: 5px; font-weight: 500;
}
.form-row input {
  width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;
}
.modal-actions {
  display: flex; justify-content: flex-end; gap: 10px;
  border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px;
}
.save-btn, .cancel-btn {
  padding: 10px 15px; border-radius: 4px; border: none; cursor: pointer;
}
.save-btn { background-color: #007bff; color: white; }
.cancel-btn { background-color: #6c757d; color: white; }
</style>
