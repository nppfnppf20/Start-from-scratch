<script lang="ts">
  import { onMount } from 'svelte';
  import { surveyorOrganisations, loadSurveyorOrganisations } from '$lib/stores/projectStore';

  let isLoading = true;

  onMount(async () => {
    await loadSurveyorOrganisations();
    isLoading = false;
  });

  $: surveyors = $surveyorOrganisations;

  function formatValue(value: number | undefined | null): string {
    if (value === null || value === undefined) return 'N/A';
    return value.toFixed(1);
  }
</script>

<div class="surveyors-page">
  <div class="page-header">
    <h1>Surveyors</h1>
    <p>Aggregated information for all surveyor organisations across all projects.</p>
  </div>

  {#if isLoading}
    <div class="loading-state">
      <p>Loading surveyor data...</p>
    </div>
  {:else if surveyors.length === 0}
    <div class="empty-state">
      <p>No surveyor data found. Add quotes to projects to see information here.</p>
    </div>
  {:else}
    <div class="table-container">
      <table class="surveyors-table">
        <thead>
          <tr>
            <th rowspan="2">Organisation</th>
            <th rowspan="2">Discipline</th>
            <th rowspan="2">Contacts</th>
            <th colspan="4" class="text-center">Feedback (Average /5)</th>
            <th rowspan="2">Total Quotes</th>
            <th rowspan="2">Total Instructed</th>
          </tr>
          <tr>
            <th class="sub-header">Quality</th>
            <th class="sub-header">Responsiveness</th>
            <th class="sub-header">On Time</th>
            <th class="sub-header">Overall</th>
          </tr>
        </thead>
        <tbody>
          {#each surveyors as surveyor (surveyor.id)}
            <tr>
              <td class="organisation-cell">{surveyor.organisation}</td>
              <td>{surveyor.discipline}</td>
              <td class="contacts-cell">
                {#if surveyor.contacts.length > 0}
                  <ul>
                    {#each surveyor.contacts as contact}
                      <li>
                        <strong>{contact.name}</strong>
                        {#if contact.email}
                          <br />
                          <a href="mailto:{contact.email}">{contact.email}</a>
                        {/if}
                      </li>
                    {/each}
                  </ul>
                {:else}
                  <span>-</span>
                {/if}
              </td>
              <td class="text-center">{formatValue(surveyor.averageRatings.quality)}</td>
              <td class="text-center">{formatValue(surveyor.averageRatings.responsiveness)}</td>
              <td class="text-center">{formatValue(surveyor.averageRatings.deliveredOnTime)}</td>
              <td class="text-center">{formatValue(surveyor.averageRatings.overallReview)}</td>
              <td class="text-center">{surveyor.totalQuotes}</td>
              <td class="text-center">{surveyor.totalInstructed}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
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
  .table-container {
    overflow-x: auto;
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: white;
  }
  .surveyors-table {
    width: 100%;
    border-collapse: collapse;
  }
  .surveyors-table th, .surveyors-table td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
    white-space: nowrap;
    vertical-align: top;
    font-size: 0.85rem;
  }
  .surveyors-table th {
    background-color: #f7fafc;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: #4a5568;
    vertical-align: middle;
  }
  .sub-header {
      font-size: 0.7rem !important;
      font-weight: 500 !important;
      border-top: 1px solid #e2e8f0;
  }
  .surveyors-table tbody tr:last-child td {
    border-bottom: none;
  }
  .surveyors-table tbody tr:hover {
    background-color: #f7fafc;
  }
  .organisation-cell {
    font-weight: 600;
    color: #2d3748;
  }
  .contacts-cell ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .contacts-cell li {
    margin-bottom: 8px;
  }
  .contacts-cell a {
    color: #3182ce;
    text-decoration: none;
  }
  .contacts-cell a:hover {
    text-decoration: underline;
  }
  .text-center {
    text-align: center;
  }
</style> 