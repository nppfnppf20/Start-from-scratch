<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import {
    pendingSurveyors,
    loadPendingSurveyors,
    approvePendingSurveyor,
    rejectPendingSurveyor,
    type PendingSurveyor
  } from '$lib/stores/surveyorOrganisationStore';
  import MergeSurveyorModal from './MergeSurveyorModal.svelte';

  export let isOpen = false;

  let isLoading = true;
  let error: string | null = null;
  let showMergeModal = false;
  let selectedSurveyorForMerge: PendingSurveyor | null = null;

  const dispatch = createEventDispatcher();

  // Load data when the modal becomes visible
  $: if (isOpen) {
    loadData();
  }

  async function loadData() {
    isLoading = true;
    error = null;
    try {
      await loadPendingSurveyors();
    } catch (err) {
      error = err instanceof Error ? err.message : 'An unknown error occurred';
    } finally {
      isLoading = false;
    }
  }

  function closeModal() {
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }

  async function handleApprove(pendingId: string) {
    if (!confirm('Are you sure you want to approve this surveyor? This will add them to the main bank.')) return;
    await approvePendingSurveyor(pendingId);
  }

  async function handleReject(pendingId: string) {
    if (!confirm('Are you sure you want to reject this entry? This action cannot be undone.')) return;
    await rejectPendingSurveyor(pendingId);
  }

  function handleMerge(surveyor: PendingSurveyor) {
    selectedSurveyorForMerge = surveyor;
    showMergeModal = true;
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div class="modal-backdrop" on:click={closeModal}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Manage Pending Surveyors</h2>
        <button class="close-btn" on:click={closeModal}>&times;</button>
      </div>
      <div class="modal-body">
        {#if isLoading}
          <p>Loading pending surveyors...</p>
        {:else if error}
          <p class="error-message">Error: {error}</p>
        {:else if $pendingSurveyors.length === 0}
          <p>There are no pending surveyors to review.</p>
        {:else}
          <div class="table-container">
            <table class="pending-table">
              <thead>
                <tr>
                  <th>Organisation</th>
                  <th>Discipline</th>
                  <th>Source Contact</th>
                  <th>Source Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each $pendingSurveyors as surveyor (surveyor.id)}
                  <tr>
                    <td>{surveyor.organisation}</td>
                    <td>{surveyor.discipline}</td>
                    <td>{surveyor.sourceQuoteData?.contactName || 'N/A'}</td>
                    <td>{surveyor.sourceQuoteData?.email || 'N/A'}</td>
                    <td class="actions-cell">
                      <button class="action-btn approve" on:click={() => handleApprove(surveyor.id)}>Approve</button>
                      <button class="action-btn merge" on:click={() => handleMerge(surveyor)}>Merge</button>
                      <button class="action-btn reject" on:click={() => handleReject(surveyor.id)}>Reject</button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<MergeSurveyorModal 
  bind:isOpen={showMergeModal}
  pendingSurveyor={selectedSurveyorForMerge}
  on:close={() => showMergeModal = false}
/>

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
    z-index: 100;
  }

  .modal-content {
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    width: 90%;
    max-width: 900px; /* Wider modal */
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e5e5e5;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
    flex-shrink: 0;
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

  .modal-body {
    overflow-y: auto;
    flex-grow: 1;
  }

  .table-container {
    width: 100%;
  }

  .pending-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9em;
  }

  .pending-table th, .pending-table td {
    border: 1px solid #ddd;
    padding: 10px 12px;
    text-align: left;
    vertical-align: middle;
  }

  .pending-table th {
    background-color: #f7f7f7;
    font-weight: 600;
  }

  .actions-cell {
    display: flex;
    gap: 8px;
    justify-content: center;
  }

  .action-btn {
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    font-weight: 500;
  }

  .action-btn.approve { background-color: #28a745; }
  .action-btn.approve:hover { background-color: #218838; }

  .action-btn.merge { background-color: #ffc107; color: #212529; }
  .action-btn.merge:hover { background-color: #e0a800; }

  .action-btn.reject { background-color: #dc3545; }
  .action-btn.reject:hover { background-color: #c82333; }

  .error-message {
    color: #dc3545;
  }
</style> 