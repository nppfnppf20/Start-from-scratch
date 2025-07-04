<script lang="ts">
  import { projects } from '$lib/stores/projectStore';
  // We'll need a modal component later for the quote submission
  // import QuoteModal from '$lib/components/QuoteModal.svelte';

  // let isModalOpen = false;
  // let selectedProjectIdForQuote: string | null = null;

  // function openQuoteModal(projectId: string) {
  //   selectedProjectIdForQuote = projectId;
  //   isModalOpen = true;
  // }
</script>

<div class="fee-quote-submission-container">
  <header>
    <h1>Fee Quote Submission</h1>
    <p>Select a project below to submit your fee quote.</p>
  </header>

  <div class="project-list">
    {#if $projects.length > 0}
      {#each $projects as project (project.id)}
        <div class="project-card">
          <div class="project-info">
            <h2>{project.name}</h2>
            <p class="client-name">{project.clientOrSpvName || project.client || 'N/A'}</p>
          </div>
          <div class="project-actions">
            <button class="submit-button" on:click={() => alert('Quote submission modal will open here.')}>
              Submit Quote
            </button>
          </div>
        </div>
      {/each}
    {:else}
      <p>No projects are currently available for quoting.</p>
    {/if}
  </div>
</div>

<!-- Placeholder for the modal -->
<!-- {#if isModalOpen && selectedProjectIdForQuote}
  <QuoteModal 
    projectId={selectedProjectIdForQuote} 
    on:close={() => isModalOpen = false} 
  />
{/if} -->

<style>
  .fee-quote-submission-container {
    padding: 2rem;
    max-width: 900px;
    margin: 0 auto;
  }
  header {
    margin-bottom: 2rem;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 1rem;
  }
  h1 {
    font-size: 2rem;
    font-weight: 600;
  }
  .project-list {
    display: grid;
    gap: 1.5rem;
  }
  .project-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #ffffff;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    transition: box-shadow 0.2s ease-in-out;
  }
  .project-card:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  .project-info h2 {
    font-size: 1.25rem;
    font-weight: 500;
    margin: 0 0 0.25rem 0;
  }
  .client-name {
    color: #666;
    font-size: 0.9rem;
    margin: 0;
  }
  .submit-button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 5px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .submit-button:hover {
    background-color: #0056b3;
  }
</style> 