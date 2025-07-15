<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { ProjectBankItem } from '$lib/stores/projectStore';
  import { updateProject } from '$lib/stores/projectStore';
  import { authStore } from '$lib/stores/authStore';

  export let project: ProjectBankItem;
  
  let name: string;
  let client: string;
  let teamMembersStr: string;
  let authorizedSurveyors: string[] = [];
  let allSurveyors: { _id: string; email: string }[] = [];

  // Initialize form fields when the project prop is set
  $: {
    if (project) {
      name = project.name;
      client = project.client || '';
      teamMembersStr = project.teamMembers?.join(', ') || '';
      authorizedSurveyors = project.authorizedSurveyors || [];
    }
  }

  let isSaving = false;
  let errorMessage = '';
  const dispatch = createEventDispatcher();

  onMount(async () => {
    try {
        const token = $authStore.token;
        const res = await fetch('/api/users/surveyors', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (res.ok) {
            allSurveyors = await res.json();
        } else {
            console.error('Failed to fetch surveyors');
        }
    } catch (error) {
        console.error('Error fetching surveyors:', error);
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

    // Convert team members string back to an array
    const teamMembers = teamMembersStr.split(',').map(s => s.trim()).filter(Boolean);

    try {
      const success = await updateProject(project.id, {
        name,
        client,
        teamMembers,
        authorizedSurveyors,
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
        <input id="client" type="text" bind:value={client} />
      </div>

      <div class="form-group">
        <label for="team">Team Members</label>
        <input id="team" type="text" bind:value={teamMembersStr} placeholder="e.g., AB, CD, EF" />
        <small>Enter initials or names separated by commas.</small>
      </div>

      <div class="form-group">
        <label for="surveyors">Authorized Surveyors</label>
        <select id="surveyors" multiple bind:value={authorizedSurveyors}>
            {#each allSurveyors as surveyor}
                <option value={surveyor._id}>
                    {surveyor.email}
                </option>
            {/each}
        </select>
        <small>Hold Ctrl or Cmd to select multiple.</small>
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
  }
  h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
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
  .form-group small {
    display: block;
    margin-top: 0.25rem;
    color: #666;
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
  .form-group select[multiple] {
    height: 150px;
  }
</style> 