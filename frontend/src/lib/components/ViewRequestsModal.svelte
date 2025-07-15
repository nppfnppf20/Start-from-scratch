<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { getAuthTokenHeader } from '$lib/stores/authStore';
  import { format } from 'date-fns';

  export let projectId: string;

  const dispatch = createEventDispatcher();
  
  interface FeeQuoteRequest {
    _id: string;
    discipline: string;
    organisation: string;
    contactName: string;
    email: string;
    phoneNumber?: string;
    requestSentDate: string;
  }

  let requests: FeeQuoteRequest[] = [];
  let isLoading = true;
  let error: string | null = null;

  onMount(async () => {
    if (!projectId) {
      error = "No Project ID provided.";
      isLoading = false;
      return;
    }

    try {
      const response = await fetch(`/api/fee-quote-requests?projectId=${projectId}`, {
        headers: getAuthTokenHeader()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch fee quote requests.');
      }

      requests = await response.json();
    } catch (err) {
      error = err instanceof Error ? err.message : 'An unknown error occurred.';
    } finally {
      isLoading = false;
    }
  });

  function formatDate(dateString: string) {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
  }

</script>

<div class="modal-backdrop" on:click|self={() => dispatch('close')}>
  <div class="modal-content" on:click|stopPropagation>
    <div class="modal-header">
      <h2>Fee Quote Requests & Permissions</h2>
      <button class="close-btn" on:click={() => dispatch('close')}>&times;</button>
    </div>
    
    <div class="table-container">
      {#if isLoading}
        <p>Loading requests...</p>
      {:else if error}
        <p class="error-message">Error: {error}</p>
      {:else if requests.length === 0}
        <p>No fee quote requests have been sent for this project yet.</p>
      {:else}
        <table class="surveyors-table">
          <thead>
            <tr>
              <th>Discipline</th>
              <th>Organisation</th>
              <th>Contact Name</th>
              <th>Email</th>
              <th>Phone Number</th>
              <th>Date Request Sent</th>
              <th>Project Permission</th>
            </tr>
          </thead>
          <tbody>
            {#each requests as request (request._id)}
              <tr>
                <td>{request.discipline}</td>
                <td>{request.organisation}</td>
                <td>{request.contactName}</td>
                <td>{request.email}</td>
                <td>{request.phoneNumber || 'N/A'}</td>
                <td>{formatDate(request.requestSentDate)}</td>
                <td>{request._id}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
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
    padding: 1.5rem;
    border-radius: 8px;
    width: 90%;
    max-width: 1200px; /* Increased width for more columns */
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #eee;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
  }

  .modal-header h2 {
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    line-height: 1;
  }
  
  /* Reusing styles from SurveyorBankTable for consistency */
  .table-container {
    overflow-x: auto;
    max-height: 60vh;
  }

  .surveyors-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  .surveyors-table th,
  .surveyors-table td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #ddd;
    white-space: nowrap;
  }

  .surveyors-table th {
    background-color: #f8f8f8;
    font-weight: 600;
    position: sticky;
    top: 0;
  }

  .error-message {
    color: #d9534f;
  }
</style> 