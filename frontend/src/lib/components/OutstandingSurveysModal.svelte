<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let isOpen = false;
  export let outstandingSurveys: any[] = [];
  export let projectName = '';

  const dispatch = createEventDispatcher();

  function closeModal() {
    dispatch('close');
  }
</script>

{#if isOpen}
  <div class="modal-backdrop" on:click={closeModal}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Outstanding Surveys for: {projectName}</h2>
        <button class="close-btn" on:click={closeModal} aria-label="Close modal">&times;</button>
      </div>
      <div class="modal-body">
        {#if outstandingSurveys.length === 0}
          <p>There are no outstanding surveys for this project.</p>
        {:else}
          <table class="surveys-table">
            <thead>
              <tr>
                <th>Organisation</th>
                <th>Contact</th>
                <th>Work Status</th>
                <th>Key Dates</th>
              </tr>
            </thead>
            <tbody>
              {#each outstandingSurveys as survey (survey.quoteId)}
                <tr>
                  <td>{survey.organisation}</td>
                  <td>{survey.contactName}</td>
                  <td>{survey.workStatus || 'Not Started'}</td>
                  <td>-</td>
                </tr>
              {/each}
            </tbody>
          </table>
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
    z-index: 1000;
  }
  .modal-content {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    width: 90%;
    max-width: 800px;
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
    font-size: 2.5rem;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }
  .surveys-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }
  .surveys-table th,
  .surveys-table td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }
  .surveys-table th {
    background-color: #f4f4f4;
    font-weight: 600;
  }
  .surveys-table tbody tr:hover {
    background-color: #f9f9f9;
  }
</style> 