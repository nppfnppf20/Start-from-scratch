<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { PendingSurveyor, SurveyorOrganisation } from '$lib/stores/surveyorOrganisationStore';
  import { 
    surveyorOrganisations,
    loadSurveyorOrganisations,
    mergePendingSurveyor
  } from '$lib/stores/surveyorOrganisationStore';

  export let isOpen = false;
  export let pendingSurveyor: PendingSurveyor | null = null;

  let isLoading = true;
  let error: string | null = null;
  let selectedTargetId: string | null = null;

  const dispatch = createEventDispatcher();

  $: if (isOpen) {
    loadData();
  }

  async function loadData() {
    isLoading = true;
    error = null;
    selectedTargetId = null; // Reset selection when opened
    try {
      // Ensure the main list of surveyors is loaded to select from
      if ($surveyorOrganisations.length === 0) {
        await loadSurveyorOrganisations();
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'An unknown error occurred';
    } finally {
      isLoading = false;
    }
  }

  function closeModal() {
    dispatch('close');
  }

  async function handleMergeConfirm() {
    if (!pendingSurveyor || !selectedTargetId) {
      alert('You must select a target surveyor to merge into.');
      return;
    }

    if (confirm(`Are you sure you want to merge "${pendingSurveyor.organisation}" into the selected surveyor? This cannot be undone.`)) {
      const success = await mergePendingSurveyor(pendingSurveyor.id, selectedTargetId);
      if (success) {
        closeModal();
      }
    }
  }
</script>

{#if isOpen && pendingSurveyor}
  <div class="modal-backdrop" on:click={closeModal}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Merge Surveyor</h2>
        <button class="close-btn" on:click={closeModal}>&times;</button>
      </div>
      <div class="modal-body">
        {#if isLoading}
          <p>Loading surveyor list...</p>
        {:else if error}
          <p class="error-message">{error}</p>
        {:else}
          <div class="merge-info">
            <p>
              Merging: <strong>{pendingSurveyor.organisation}</strong> ({pendingSurveyor.discipline})
            </p>
            <p class="arrow-down">⇩</p>
          </div>
          
          <div class="form-group">
            <label for="target-surveyor">Merge Into Existing Surveyor:</label>
            <select id="target-surveyor" bind:value={selectedTargetId} class="target-select">
              <option value={null} disabled>-- Select a target --</option>
              {#each $surveyorOrganisations as org (org.id)}
                <option value={org.id}>
                  {org.organisation} ({org.discipline})
                </option>
              {/each}
            </select>
          </div>
          
          <div class="modal-actions">
            <button class="confirm-btn" on:click={handleMergeConfirm} disabled={!selectedTargetId}>
              Confirm Merge
            </button>
            <button class="cancel-btn" on:click={closeModal}>Cancel</button>
          </div>
        {/if}
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
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 101;
  }

  .modal-content {
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    width: 90%;
    max-width: 600px;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e5e5e5;
    padding-bottom: 1rem;
    margin-bottom: 1.5rem;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 2rem;
    cursor: pointer;
    color: #888;
  }
  
  .merge-info {
    text-align: center;
    margin-bottom: 1.5rem;
    font-size: 1.1em;
  }
  
  .merge-info p {
    margin: 0.2rem 0;
  }
  
  .arrow-down {
    font-size: 2em;
    color: #007bff;
    margin: 0.5rem 0;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }
  
  .target-select {
    width: 100%;
    padding: 0.8rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #fff;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
  }
  
  .confirm-btn, .cancel-btn {
    padding: 10px 20px;
    border-radius: 5px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    font-size: 1rem;
  }
  
  .confirm-btn {
    background-color: #28a745;
    color: white;
  }
  
  .confirm-btn:disabled {
    background-color: #a5d6a7;
    cursor: not-allowed;
  }

  .cancel-btn {
    background-color: #6c757d;
    color: white;
  }
  
  .error-message {
    color: #dc3545;
  }
</style>