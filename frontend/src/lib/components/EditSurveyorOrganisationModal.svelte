<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { SurveyorOrganisation } from '$lib/stores/surveyorOrganisationStore';
  import { surveyorOrganisations, updateSurveyorOrganisation } from '$lib/stores/surveyorOrganisationStore';

  export let organisation: SurveyorOrganisation;
  
  let name: string;
  let contacts: SurveyorOrganisation['contacts'];
  let disciplines: string[];
  let location: string;

  // Initialize form fields when the organisation prop is set
  $: {
    if (organisation) {
      name = organisation.organisation;
      contacts = JSON.parse(JSON.stringify(organisation.contacts || []));
      disciplines = [organisation.discipline];
      location = organisation.location || '';
    }
  }

  let isSaving = false;
  let errorMessage = '';
  const dispatch = createEventDispatcher();

  function addContact() {
    contacts = [...contacts, { contactName: '', email: '', phoneNumber: '' }];
  }

  function removeContact(index: number) {
    contacts = contacts.filter((_, i) => i !== index);
  }

  async function handleSubmit() {
    if (isSaving) return;
    if (!name.trim()) {
      errorMessage = 'Organisation name cannot be empty.';
      return;
    }

    isSaving = true;
    errorMessage = '';

    try {
      const success = await updateSurveyorOrganisation(organisation.id, {
        organisation: name,
        contacts: contacts,
        discipline: disciplines[0],
        location: location
      });

      if (success) {
        dispatch('save');
      } else {
        errorMessage = 'Failed to save organisation. Please try again.';
      }
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
    } finally {
      isSaving = false;
    }
  }

  function handleClose() {
    dispatch('close');
  }
</script>

<div class="modal-backdrop" on:click={handleClose}>
  <div class="modal-content" on:click|stopPropagation>
    <h3>Edit Organisation: {organisation.organisation}</h3>
    
    <form on:submit|preventDefault={handleSubmit}>
        {#if errorMessage}
            <div class="error-message">{errorMessage}</div>
        {/if}
        
        <div class="form-grid-modal">
            <div class="form-row">
                <label for="name">Organisation Name*</label>
                <input id="name" type="text" bind:value={name} required disabled={isSaving}/>
            </div>

            <div class="form-row">
                <label>Discipline*</label>
                <input type="text" bind:value={disciplines[0]} required disabled={isSaving}/>
            </div>

            <div class="form-row">
                <label for="location">Location</label>
                <input id="location" type="text" bind:value={location} disabled={isSaving}/>
            </div>
        </div>

      <h4>Contacts</h4>
      <div class="contacts-section">
        {#each contacts as contact, index}
          <div class="contact-row">
            <div class="contact-header">
                <span>Contact {index + 1}</span>
                <button type="button" class="remove-contact-btn" on:click={() => removeContact(index)} disabled={isSaving}>
                    Remove
                </button>
            </div>
            <div class="contact-fields">
                <div class="form-row">
                    <label for="contactName-{index}">Contact Name</label>
                    <input type="text" id="contactName-{index}" bind:value={contact.contactName} placeholder="Contact Name" disabled={isSaving} />
                </div>
                <div class="form-row">
                    <label for="email-{index}">Email</label>
                    <input type="email" id="email-{index}" bind:value={contact.email} placeholder="Email" disabled={isSaving} />
                </div>
                <div class="form-row">
                    <label for="phoneNumber-{index}">Phone Number</label>
                    <input type="tel" id="phoneNumber-{index}" bind:value={contact.phoneNumber} placeholder="Phone" disabled={isSaving} />
                </div>
            </div>
          </div>
        {/each}
      </div>
        <button type="button" class="add-contact-btn" on:click={addContact} disabled={isSaving}>+ Add Contact</button>
      
      <div class="modal-actions">
        <button type="submit" class="save-btn" disabled={isSaving}>
          {#if isSaving}Saving...{:else}Save Changes{/if}
        </button>
        <button type="button" class="cancel-btn" on:click={handleClose} disabled={isSaving}>
          Cancel
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }
  .modal-content {
    background-color: white;
    padding: 25px;
    border-radius: 8px;
    box-shadow: 0 5px 20px rgba(0,0,0,0.25);
    max-width: 700px;
    width: 95%;
    max-height: 90vh;
    overflow-y: auto;
  }
  .modal-content h3 {
    margin-top: 0;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
    margin-bottom: 20px;
  }
  .error-message {
    background-color: #f8d7da;
    color: #721c24;
    padding: 10px;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
    margin-bottom: 20px;
    text-align: center;
  }
  .form-grid-modal {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
  }
  .form-row {
    display: flex;
    flex-direction: column;
  }
  .form-row label {
    margin-bottom: 5px;
    font-weight: 600;
    font-size: 0.9em;
  }
  .form-row input {
    width: 100%;
    padding: 9px;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
    font-size: 0.95em;
  }
  .form-row input:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    outline: none;
  }
  h4 {
    margin-top: 20px;
    margin-bottom: 10px;
    border-bottom: 1px solid #eee;
    padding-bottom: 5px;
  }
  .contacts-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 15px;
  }
  .contact-row {
    background-color: #f9f9f9;
    padding: 15px;
    border-radius: 6px;
    border: 1px solid #e0e0e0;
  }
  .contact-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }
  .contact-header span {
    font-weight: 600;
    font-size: 1.1em;
  }
  .remove-contact-btn {
    background-color: #dc3545;
    color: white;
    padding: 5px 10px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9em;
  }
  .contact-fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
  }
  .add-contact-btn {
    margin-top: 5px;
    background-color: #007bff;
    color: white;
    padding: 8px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    align-self: flex-start;
  }
  .add-contact-btn:hover {
    background-color: #0069d9;
  }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 25px;
    border-top: 1px solid #eee;
    padding-top: 20px;
  }
  .save-btn, .cancel-btn {
    padding: 10px 18px;
    border-radius: 4px;
    cursor: pointer;
    border: none;
    font-weight: 500;
  }
  .save-btn {
    background-color: #007bff;
    color: white;
  }
  .cancel-btn {
    background-color: #6c757d;
    color: white;
  }
  .save-btn:hover {
    background-color: #0069d9;
  }
  .cancel-btn:hover {
    background-color: #5a6268;
  }
</style> 