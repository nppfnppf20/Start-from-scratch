<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { ProjectBankItem } from '$lib/stores/projectStore';
  import { updateProject } from '$lib/stores/projectStore';
  import { authStore, getAuthTokenHeader } from '$lib/stores/authStore';
  import { clientOrganisations, loadClientOrganisations } from '$lib/stores/clientStore';

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  export let project: ProjectBankItem;
  
  let name: string;
  let client: string;
  let projectLead: string[] = [];
  let projectManager: string[] = [];
  let authorizedSurveyors: string[] = [];
  let allSurveyors: { _id: string; email: string }[] = [];
  let authorizedClients: string[] = [];
  let allClients: { _id: string; email: string }[] = [];
  
  const teamMembersList = ['JR', 'AD', 'BM', 'BW', 'RS', 'S Smith', 'S Scott', 'CB', 'PE', 'RM', 'GE', 'RK', 'DH', 'AC'];

  // This reactive block ensures that when the project data or the list of clients loads,
  // the form is correctly populated, including finding the right client ID for the dropdown.
  $: {
    if (project && $clientOrganisations) {
      name = project.name;
      projectLead = project.projectLead || [];
      projectManager = project.projectManager || [];
      authorizedSurveyors = project.authorizedSurveyors || [];
      authorizedClients = project.authorizedClients || [];
      
      console.log('DEBUG: Project authorized surveyors:', authorizedSurveyors);
      
      // Find the client organisation that matches the project's client name
      const matchingOrg = $clientOrganisations.find(org => org.organisationName === project.client);
      // Set the client variable to the ID of the matching org, which the dropdown will use
      client = matchingOrg ? matchingOrg.id : '';
    }
  }

  let isSaving = false;
  let errorMessage = '';
  const dispatch = createEventDispatcher();

  onMount(async () => {
    loadClientOrganisations();
    try {
        const [surveyorsRes, clientsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/users/surveyors`, { headers: getAuthTokenHeader() }),
            fetch(`${API_BASE_URL}/users/clients`, { headers: getAuthTokenHeader() })
        ]);

        if (surveyorsRes.ok) {
            allSurveyors = await surveyorsRes.json();
            console.log('DEBUG: Fetched surveyors:', allSurveyors);
        } else {
            console.error('Failed to fetch surveyors:', surveyorsRes.status, surveyorsRes.statusText);
        }

        if (clientsRes.ok) {
            allClients = await clientsRes.json();
        } else {
            console.error('Failed to fetch clients:', clientsRes.status, clientsRes.statusText);
        }
    } catch (error) {
        console.error('Error fetching users:', error);
    }
  });

  async function handleSubmit() {
    if (isSaving) return;
    if (!name.trim()) {
      errorMessage = 'Project name cannot be empty.';
      return;
    }

    isSaving = true;
    errorMessage = '';

    try {
      const success = await updateProject(project.id, {
        name,
        client,
        projectLead,
        projectManager,
        authorizedSurveyors,
        authorizedClients,
      });

      if (success) {
        dispatch('save');
      } else {
        errorMessage = 'Failed to save project. Please try again.';
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
    <h2>Edit Project: {project.name}</h2>
    
    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label for="name">Project Name</label>
        <input id="name" type="text" bind:value={name} required />
      </div>

      <div class="form-group">
        <label for="client">Client</label>
        <select id="client" bind:value={client}>
          <option value="">-- Select a Client --</option>
          {#each $clientOrganisations as org (org.id)}
            <option value={org.id}>{org.organisationName}</option>
          {/each}
        </select>
      </div>

      <div class="form-group">
        <label for="project-lead">Project Lead</label>
        <div class="checkbox-group">
          {#each teamMembersList as member}
            <div class="checkbox-item">
              <input type="checkbox" id="project-lead-{member}" value={member} bind:group={projectLead} />
              <label for="project-lead-{member}">{member}</label>
            </div>
          {/each}
        </div>
      </div>

      <div class="form-group">
        <label for="project-manager">Project Manager</label>
        <div class="checkbox-group">
          {#each teamMembersList as member}
            <div class="checkbox-item">
              <input type="checkbox" id="project-manager-{member}" value={member} bind:group={projectManager} />
              <label for="project-manager-{member}">{member}</label>
            </div>
          {/each}
        </div>
      </div>

      <div class="form-group">
        <label for="surveyors">Authorized Surveyors</label>
        <div class="checkbox-group">
          {#each allSurveyors as surveyor}
            <div class="checkbox-item">
              <input type="checkbox" id="surveyor-{surveyor._id}" value={surveyor._id} bind:group={authorizedSurveyors} />
              <label for="surveyor-{surveyor._id}">{surveyor.email}</label>
            </div>
          {/each}
        </div>
      </div>

      <div class="form-group">
        <label for="clients">Authorized Clients</label>
        <div class="checkbox-group">
          {#each allClients as client}
            <div class="checkbox-item">
              <input type="checkbox" id="client-{client._id}" value={client._id} bind:group={authorizedClients} />
              <label for="client-{client._id}">{client.email}</label>
            </div>
          {/each}
        </div>
      </div>

      {#if errorMessage}
        <p class="error-message">{errorMessage}</p>
      {/if}

      <div class="modal-actions">
        <button type="button" class="btn-secondary" on:click={handleClose} disabled={isSaving}>
          Cancel
        </button>
        <button type="submit" class="btn-primary" disabled={isSaving}>
          {#if isSaving}Saving...{:else}Save Changes{/if}
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
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  .modal-content {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    flex-shrink: 0;
  }
  
  form {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }
  .form-group {
    margin-bottom: 1rem;
  }
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
  .form-group input {
    width: 100%;
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid #ccc;
  }

  .error-message {
    color: #d9534f;
    margin-bottom: 1rem;
  }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #e0e0e0;
    flex-shrink: 0;
    background: white;
  }
  .btn-primary, .btn-secondary {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-weight: 500;
  }
  .btn-primary {
    background-color: #007bff;
    color: white;
  }
  .btn-primary:disabled {
    background-color: #0056b3;
    opacity: 0.7;
  }
  .btn-secondary {
    background-color: #6c757d;
    color: white;
  }

  .checkbox-group {
    max-height: 150px;
    overflow-y: auto;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 0.5rem;
  }

  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .checkbox-item:not(:last-child) {
    margin-bottom: 0.5rem;
  }

  /* Overrides for checkbox elements to fix alignment */
  .checkbox-item input[type="checkbox"] {
    width: auto; /* Prevent taking full width */
    margin: 0;
    padding: 0;
  }

  .checkbox-item label {
    display: inline; /* Place label next to checkbox */
    font-weight: normal; /* Use regular font weight */
    margin-bottom: 0;
  }
</style> 