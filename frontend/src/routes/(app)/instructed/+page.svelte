<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { selectedProject, currentProjectQuotes, instructionLogsByQuoteId } from "$lib/stores/projectStore";
  import InstructedTable from '$lib/components/instructed/InstructedTable.svelte';

  const DEBUG = false;

  // Filter for instructed quotes based on selected project
  $: instructedQuotes = $currentProjectQuotes.filter(quote =>
      quote.instructionStatus === 'instructed' || quote.instructionStatus === 'partially instructed'
  );

  $: DEBUG && console.log('Instructed quotes count:', instructedQuotes.length);
</script>

<div class="instructed-container">
  <PageHeader
    title="Instructed Surveyors"
    subtitle={$selectedProject ? `Surveyors for ${$selectedProject.name}` : 'Please select a project'}
  />
  
  {#if $selectedProject}
    
    {#if instructedQuotes.length > 0}
      <InstructedTable quotes={instructedQuotes} logsByQuoteId={$instructionLogsByQuoteId} />
    {:else}
      <p>No instructed surveyors found for this project.</p>
    {/if}
  {:else}
    <p class="loading-info">Loading project details...</p>
    <!-- Could add a loading spinner here -->
  {/if}
</div>

<!-- Uploads feature kept for future enablement
  import InstructedDocumentUploadModal from "$lib/components/InstructedDocumentUploadModal.svelte";
  let showDocumentUploadModal = false;
  let currentQuoteForUpload: Quote | null = null;
  function openDocumentUploadModal(quote: Quote) { currentQuoteForUpload = quote; showDocumentUploadModal = true; }
  function closeDocumentUploadModal() { showDocumentUploadModal = false; currentQuoteForUpload = null; }
{#if showDocumentUploadModal && currentQuoteForUpload}
    <InstructedDocumentUploadModal bind:showModal={showDocumentUploadModal} quoteId={currentQuoteForUpload.id} documentType="instruction" on:close={closeDocumentUploadModal} />
{/if}
-->


<style>
  /* CSS Variables for status colors */
  :root {
    --status-not-started-bg: #fff5f5;
    --status-not-started-color: #c53030;
    --status-in-progress-bg: #fff3cd;
    --status-in-progress-color: #856404;
    --status-completed-bg: #d4edda;
    --status-completed-color: #155724;
    --status-trp-reviewing-bg: #cce5ff;
    --status-trp-reviewing-color: #004085;
    --status-client-reviewing-bg: #e2d9f3;
    --status-client-reviewing-color: #493267;
  }

  /* General page styling */
  .instructed-container {
    padding: 1rem 2rem;
  }
  
  /* Table styling moved into InstructedTable component */

  /* Keep only minimal page-level styles; all cell UI styles live with components */
  .instructed-container > p {
    text-align: center;
    margin: 3rem auto;
    padding: 2.5rem;
    background-color: #ffffff;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    color: #718096;
  }
</style> 
