<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { addProject as addProjectToStore, authorizeClients } from '$lib/stores/projectStore';
  import { clientOrganisations, loadClientOrganisations } from '$lib/stores/clientStore';
  import { get } from 'svelte/store';

  export let isOpen = false;

  let newProjectName = '';
  let selectedClient = '';
  let projectLead: string[] = [];
  let projectManager: string[] = [];
  let selectedTeamMembers: string[] = [];
  
  const teamMembersList = ['JR', 'AD', 'BM', 'BW', 'RS', 'S Smith', 'S Scott', 'CB', 'PE', 'RM', 'GE', 'RK', 'DH', 'AC'];

  let isSubmitting = false;
  let submitError = '';

  const dispatch = createEventDispatcher();

  onMount(() => {
    if (isOpen) {
      loadClientOrganisations();
    }
  });

  $: if (isOpen) {
    // Also load clients if the modal is opened after initial mount
    loadClientOrganisations();
  }

  function resetForm() {
    newProjectName = '';
    selectedClient = '';
    projectLead = [];
    projectManager = [];
    selectedTeamMembers = [];
    submitError = '';
  }

  function closeModal() {
    resetForm();
    dispatch('close');
  }

  async function handleSubmit() {
    const name = newProjectName.trim();
    if (!name) {
      submitError = 'Please enter a project name.';
      return;
    }

    isSubmitting = true;
    submitError = '';

    const projectData = {
      name: name,
      client: selectedClient || undefined,
      projectLead: projectLead.length > 0 ? projectLead : undefined,
      projectManager: projectManager.length > 0 ? projectManager : undefined,
      teamMembers: selectedTeamMembers.length > 0 ? selectedTeamMembers : undefined
    };

    try {
      const addedProject = await addProjectToStore(projectData);
      if (addedProject) {
        // If a client was selected, authorize its contact emails as client users for this project
        if (selectedClient) {
          const orgs = get(clientOrganisations);
          const selectedOrg = orgs.find(org => org.id === selectedClient);
          if (selectedOrg && Array.isArray(selectedOrg.contacts)) {
            const emails = Array.from(new Set(
              selectedOrg.contacts.map(c => c.email).filter((e): e is string => Boolean(e))
            ));
            if (emails.length > 0) {
              await authorizeClients(addedProject.id, emails);
            }
          }
        }
        closeModal();
      } else {
        submitError = 'Failed to add project. Please try again.';
      }
    } catch (error) {
        submitError = error instanceof Error ? error.message : 'An unexpected error occurred.';
    } finally {
        isSubmitting = false;
    }
  }
</script>

{#if isOpen}
  <div class="modal-backdrop" on:click={closeModal}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Add New Project</h2>
        <button class="close-btn" on:click={closeModal}>&times;</button>
      </div>
      <div class="modal-body">
        {#if submitError}
          <p class="error-message">{submitError}</p>
        {/if}
        <form on:submit|preventDefault={handleSubmit}>
          <div class="form-group">
            <label for="project-name">Project Name</label>
            <input type="text" id="project-name" bind:value={newProjectName} placeholder="Enter project name" required>
          </div>
          
          <div class="form-group">
            <label for="client-select">Client</label>
            <select id="client-select" bind:value={selectedClient}>
              <option value="">-- Select a Client (Optional) --</option>
              {#each $clientOrganisations as client (client.id)}
                <option value={client.id}>{client.organisationName}</option>
              {/each}
            </select>
          </div>

          <div class="form-group">
              <label for="project-lead-select">Project Lead</label>
              <div class="checkbox-group">
                  {#each teamMembersList as member}
                      <label>
                          <input type="checkbox" bind:group={projectLead} value={member} />
                          {member}
                      </label>
                  {/each}
              </div>
          </div>

          <div class="form-group">
              <label for="project-manager-select">Project Manager</label>
              <div class="checkbox-group">
                  {#each teamMembersList as member}
                      <label>
                          <input type="checkbox" bind:group={projectManager} value={member} />
                          {member}
                      </label>
                  {/each}
              </div>
          </div>

          <div class="modal-actions">
              <button type="button" class="btn-secondary" on:click={closeModal} disabled={isSubmitting}>Cancel</button>
              <button type="submit" class="btn-primary" disabled={isSubmitting}>
                {#if isSubmitting}Adding...{:else}Add Project{/if}
              </button>
            </div>
        </form>
        
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex; justify-content: center; align-items: center; z-index: 1000;
  }
  .modal-content {
    background: white; padding: 2rem; border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    width: 100%; max-width: 500px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }
  .modal-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 1.5rem; border-bottom: 1px solid #eee; padding-bottom: 1rem;
  }
  .modal-body {
    overflow-y: auto;
    flex-grow: 1;
    padding-right: 1rem; /* Add some padding for the scrollbar */
  }
  .modal-header h2 { margin: 0; font-size: 1.5rem; }
  .close-btn { background: none; border: none; font-size: 2rem; cursor: pointer; }
  .form-group { margin-bottom: 1rem; }
  .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
  .form-group input, .form-group select {
    width: 100%; padding: 0.6rem; border-radius: 4px; border: 1px solid #ccc;
    font-size: 1rem;
  }
  .error-message { color: #d9534f; margin-bottom: 1rem; }
  .modal-actions {
    display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 2rem;
  }
  .btn-primary, .btn-secondary {
    padding: 0.7rem 1.2rem; border-radius: 4px; border: none; cursor: pointer;
    font-weight: 500;
  }
  .btn-primary { background-color: #007bff; color: white; }
  .btn-primary:disabled { background-color: #0056b3; opacity: 0.7; }
  .btn-secondary { background-color: #6c757d; color: white; }
  .team-placeholder {
    font-style: italic;
    color: #666;
    background-color: #f9f9f9;
    padding: 0.6rem;
    border: 1px dashed #ccc;
    border-radius: 4px;
    margin: 0;
  }

  .checkbox-group {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    max-height: 150px;
    overflow-y: auto;
  }

  .checkbox-group label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-weight: normal;
    white-space: nowrap;
  }

  .checkbox-group input[type="checkbox"] {
    margin: 0;
  }
</style> 