<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { formatDate } from '$lib/utils/formatters';
  import { currentProjectFeeQuoteLogs } from '$lib/stores/projectStore';

  export let showModal = false;
  export let projectName = '';

  const dispatch = createEventDispatcher();

  function closeModal() {
    dispatch('close');
  }

  function formatEmails(emails: string[]): string {
    if (emails.length === 1) {
      return emails[0];
    } else if (emails.length === 2) {
      return `${emails[0]} and ${emails[1]}`;
    } else {
      return `${emails[0]} and ${emails.length - 1} others`;
    }
  }

  function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    const formattedDate = formatDate(dateString);
    const time = date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    return `${formattedDate} at ${time}`;
  }
</script>

<div class="modal-backdrop" class:show={showModal} on:click={closeModal}>
  <div class="modal-content" on:click|stopPropagation>
    <div class="modal-header">
      <h2>Fee Quote Request History</h2>
      <p class="project-name">{projectName}</p>
    </div>

    <div class="history-content">
      {#if $currentProjectFeeQuoteLogs.length === 0}
        <div class="empty-state">
          <p>No fee quote requests have been sent for this project yet.</p>
        </div>
      {:else}
        <div class="table-container">
          <table class="history-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Recipients</th>
              </tr>
            </thead>
            <tbody>
              {#each $currentProjectFeeQuoteLogs as log (log.id)}
                <tr>
                  <td class="date-cell">{formatDateTime(log.sentDate)}</td>
                  <td class="emails-cell">
                    <span class="emails-summary">{formatEmails(log.emails)}</span>
                    {#if log.emails.length > 1}
                      <div class="emails-detail">
                        {#each log.emails as email, index}
                          <span class="email-item">{email}</span>
                        {/each}
                      </div>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

    <div class="modal-actions">
      <button class="btn-secondary" on:click={closeModal}>Close</button>
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
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s, visibility 0.3s;
    z-index: 1000;
  }

  .modal-backdrop.show {
    opacity: 1;
    visibility: visible;
  }

  .modal-content {
    background: white;
    border-radius: 8px;
    width: 100%;
    max-width: 700px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }

  .modal-header {
    padding: 2rem 2rem 1rem 2rem;
    border-bottom: 1px solid #e0e0e0;
    flex-shrink: 0;
  }

  .modal-header h2 {
    margin: 0 0 0.5rem 0;
    color: #333;
  }

  .project-name {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
    font-style: italic;
  }

  .history-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 2rem;
    min-height: 0;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #888;
  }

  .table-container {
    overflow-x: auto;
  }

  .history-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
  }

  .history-table th {
    background-color: #f8f9fa;
    padding: 0.75rem 1rem;
    text-align: left;
    font-weight: 600;
    color: #555;
    border-bottom: 2px solid #e0e0e0;
    position: sticky;
    top: 0;
  }

  .history-table td {
    padding: 1rem;
    border-bottom: 1px solid #e0e0e0;
    vertical-align: top;
  }

  .history-table tr:hover {
    background-color: #f8f9fa;
  }

  .date-cell {
    white-space: nowrap;
    font-family: monospace;
    font-size: 0.9rem;
    color: #555;
    min-width: 180px;
  }

  .emails-cell {
    position: relative;
  }

  .emails-summary {
    font-weight: 500;
    color: #333;
  }

  .emails-detail {
    margin-top: 0.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .email-item {
    background-color: #e3f2fd;
    color: #1976d2;
    padding: 0.2rem 0.5rem;
    border-radius: 12px;
    font-size: 0.8rem;
    border: 1px solid #bbdefb;
  }

  .modal-actions {
    padding: 1rem 2rem 2rem 2rem;
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid #e0e0e0;
    background: white;
    flex-shrink: 0;
  }

  .btn-secondary {
    padding: 0.6rem 1.2rem;
    border-radius: 6px;
    border: 1px solid #6c757d;
    background-color: #6c757d;
    color: white;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s ease;
  }

  .btn-secondary:hover {
    background-color: #5a6268;
  }
</style>