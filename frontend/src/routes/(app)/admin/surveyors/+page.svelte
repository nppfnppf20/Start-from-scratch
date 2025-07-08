<script lang="ts">
    import { onMount } from 'svelte';
    import { surveyorOrganisations, loadSurveyorOrganisations } from '$lib/stores/projectStore';
    import SurveyorOrganisationTable from '$lib/components/SurveyorOrganisationTable.svelte';

    let isLoading = true;
    let error: string | null = null;

    onMount(async () => {
        try {
            await loadSurveyorOrganisations();
        } catch (e: any) {
            error = e.message;
        } finally {
            isLoading = false;
        }
    });
</script>

<svelte:head>
    <title>Admin - Surveyors</title>
</svelte:head>

<div class="surveyors-page">
    <div class="page-header">
        <h1>Surveyor Organisations</h1>
        <p>Aggregated information for all surveyor organisations across all projects.</p>
    </div>

    {#if isLoading}
        <div class="loading-state">
            <p>Loading surveyor data...</p>
        </div>
    {:else if error}
        <p class="text-red-500">Error loading data: {error}</p>
    {:else if $surveyorOrganisations.length === 0}
        <div class="empty-state">
            <p>No surveyor data found.</p>
        </div>
    {:else}
        <SurveyorOrganisationTable surveyors={$surveyorOrganisations} />
    {/if}
</div>

<style>
    .surveyors-page {
      padding: 1.5rem;
      max-width: 1600px;
      margin: 0 auto;
    }
    .page-header {
      margin-bottom: 2rem;
    }
    .page-header h1 {
      font-size: 2rem;
      font-weight: 600;
      color: #1a202c;
      margin: 0 0 0.5rem 0;
    }
    .page-header p {
      font-size: 1.1rem;
      color: #4a5568;
      margin: 0;
    }
    .loading-state, .empty-state {
      padding: 2rem;
      background-color: #f7fafc;
      border: 1px dashed #cbd5e0;
      border-radius: 6px;
      text-align: center;
      color: #a0aec0;
    }
</style> 