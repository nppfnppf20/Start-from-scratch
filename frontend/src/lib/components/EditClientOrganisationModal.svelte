<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { addClientOrganisation, updateClientOrganisation, type ClientOrganisation } from '$lib/stores/clientStore';

  export let isOpen = false;
  export let client: ClientOrganisation | null = null;

  let organisationName = '';
  let contacts: { contactName: string; email: string; phoneNumber: string }[] = [];
  let error = '';

  const dispatch = createEventDispatcher();

  function closeModal() {
    isOpen = false;
    dispatch('close');
  }

  function addContact() {
    contacts = [...contacts, { contactName: '', email: '', phoneNumber: '' }];
  }

  function removeContact(index: number) {
    contacts = contacts.filter((_, i) => i !== index);
  }

  async function handleSubmit() {
    if (!organisationName) {
      error = 'Organisation name is required.';
      return;
    }
    if (!client) {
        error = 'No client to update'
        return
    }
    const updatedClient: ClientOrganisation = {
      id: client.id,
      organisationName,
      contacts: contacts.filter(c => c.contactName || c.email || c.phoneNumber),
      projects: client.projects || []
    };
    try {
      await updateClientOrganisation(updatedClient);
      closeModal();
    } catch (err: any) {
      error = err.message;
    }
  }

  $: if (isOpen && client) {
    organisationName = client.organisationName;
    contacts = client.contacts && client.contacts.length > 0 ? JSON.parse(JSON.stringify(client.contacts)) : [{ contactName: '', email: '', phoneNumber: '' }];
  } else {
    organisationName = '';
    contacts = [{ contactName: '', email: '', phoneNumber: '' }];
  }
</script>

{#if isOpen}
  <div class="modal-backdrop" on:click={closeModal}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Edit Client Organisation</h2>
        <button class="close-btn" on:click={closeModal}>&times;</button>
      </div>
      <div class="modal-body">
        {#if error}
          <div class="error-message">{error}</div>
        {/if}
        <form on:submit|preventDefault={handleSubmit}>
          <div class="form-group">
            <label for="organisationName">Organisation Name</label>
            <input
              type="text"
              id="organisationName"
              bind:value={organisationName}
              placeholder="Enter organisation name"
              required
            />
          </div>

          <fieldset class="contacts-fieldset">
            <legend>Contacts</legend>
            {#each contacts as contact, index}
              <div class="contact-entry">
                <div class="contact-inputs">
                  <div class="form-group">
                    <label for="contactName-{index}">Name</label>
                    <input
                      type="text"
                      id="contactName-{index}"
                      bind:value={contact.contactName}
                    />
                  </div>
                  <div class="form-group">
                    <label for="email-{index}">Email</label>
                    <input
                      type="email"
                      id="email-{index}"
                      bind:value={contact.email}
                    />
                  </div>
                  <div class="form-group">
                    <label for="phoneNumber-{index}">Phone</label>
                    <input
                      type="tel"
                      id="phoneNumber-{index}"
                      bind:value={contact.phoneNumber}
                    />
                  </div>
                </div>
                <div class="contact-actions">
                  <button type="button" class="remove-contact-btn" on:click={() => removeContact(index)}>
                    &times;
                  </button>
                </div>
              </div>
            {/each}
          </fieldset>

          <button type="button" class="add-contact-btn" on:click={addContact}>+ Add Contact</button>

          <div class="modal-footer">
            <button type="button" class="cancel-btn" on:click={closeModal}>Cancel</button>
            <button type="submit" class="submit-btn">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<style>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.contacts-fieldset {
  border: 1px solid #ccc;
  padding: 1.5rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

.contacts-fieldset legend {
  font-weight: 600;
  padding: 0 0.5rem;
}

.contact-entry {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1rem;
  border-bottom: 1px dashed #eee;
  padding-bottom: 1rem;
}

.contact-inputs {
  flex-grow: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.contact-actions {
  padding-top: 2rem; /* Align with input fields */
  margin-left: 1rem;
}

.remove-contact-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  color: #333;
  line-height: 1;
  opacity: 0.6;
  transition: opacity 0.2s ease-in-out;
}

.remove-contact-btn:hover {
  opacity: 1;
}

.add-contact-btn {
  background: none;
  border: 1px solid #007bff;
  color: #007bff;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
  margin-bottom: 1.5rem;
  transition: all 0.2s ease-in-out;
}

.add-contact-btn:hover {
    background: #007bff;
    color: white;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.cancel-btn, .submit-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
}

.cancel-btn {
  background-color: #f0f0f0;
}

.submit-btn {
  background-color: #007bff;
  color: white;
}

.error-message {
  color: #D8000C;
  background-color: #FFD2D2;
  border: 1px solid #D8000C;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
}
</style>
