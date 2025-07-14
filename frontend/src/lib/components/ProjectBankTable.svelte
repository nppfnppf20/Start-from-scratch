<script lang="ts">
    import { onMount } from 'svelte';
    import { projectBank, loadProjectBank, type ProjectBankItem, deleteProgrammeEvent } from '$lib/stores/projectStore';
    import { formatDate } from '$lib/utils/formatters';
  
    let isLoading = true;
    let error: string | null = null;
    let isDeleting = false;

    // --- Filter State ---
    let searchText = '';
  
    // --- Sorting State ---
    type SortKey = 'name' | 'client' | 'quotesReceived' | 'surveyorsInstructed' | 'instructedSpend';
    let sortKey: SortKey = 'name';
    let sortDirection: 'asc' | 'desc' = 'asc';
  
    onMount(async () => {
      try {
        await loadProjectBank();
      } catch (err) {
        error = err instanceof Error ? err.message : 'Failed to load project data';
      } finally {
        isLoading = false;
      }
    });
  
    // --- Helper Functions ---
    function formatCurrency(value: number | undefined | null): string {
      if (value === null || value === undefined) return '£0.00';
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
      }).format(value);
    }
  
    function setSortKey(key: SortKey) {
      if (sortKey === key) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortKey = key;
        sortDirection = 'asc';
      }
    }
  
    async function handleDeleteKeyDate(eventId: string) {
      if (isDeleting) return;
  
      // The deleteProgrammeEvent function in the store already has a confirm dialog.
      isDeleting = true;
      try {
        const success = await deleteProgrammeEvent(eventId);
        if (success) {
          // Refresh the data to show the change
          await loadProjectBank();
        }
      } catch (err) {
        alert(`Failed to delete key date: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        isDeleting = false;
      }
    }
  
    // --- Reactive Declaration for Sorting ---
    $: sortedProjects = [...$projectBank].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
  
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
  
      let comparison = 0;
      
      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = valA.localeCompare(valB);
      }
  
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    // --- Reactive Declaration for Filtering and Sorting ---
    $: finalProjects = sortedProjects.filter(project => {
      if (!searchText) return true;
      const lowercasedFilter = searchText.toLowerCase();
      
      const nameMatch = project.name.toLowerCase().includes(lowercasedFilter);
      const clientMatch = project.client?.toLowerCase().includes(lowercasedFilter) || false;
      const teamMatch = project.teamMembers?.join(', ').toLowerCase().includes(lowercasedFilter) || false;

      return nameMatch || clientMatch || teamMatch;
    });
  </script>
  
  <div class="project-bank-container">
    {#if error}
      <div class="error-message">
        <p>{error}</p>
      </div>
    {:else if isLoading}
      <div class="loading-state">
        <p>Loading project data...</p>
      </div>
    {:else}
      <div class="controls-container">
        <input
          type="text"
          bind:value={searchText}
          placeholder="Filter by Project Name, Client, or Team..."
          class="filter-input"
        />
      </div>
      <div class="table-container">
        <table class="projects-table">
          <thead>
            <tr>
              <th rowspan="2">
                <button on:click={() => setSortKey('name')}>
                  Project Name {#if sortKey === 'name'}{sortDirection === 'asc' ? '▲' : '▼'}{/if}
                </button>
              </th>
              <th rowspan="2">
                <button on:click={() => setSortKey('client')}>
                  Client {#if sortKey === 'client'}{sortDirection === 'asc' ? '▲' : '▼'}{/if}
                </button>
              </th>
              <th rowspan="2">Team</th>
              <th rowspan="2">Key Dates</th>
              <th colspan="3" class="text-center divider-left">Totals</th>
            </tr>
            <tr>
              <th class="sub-header divider-left">
                <button on:click={() => setSortKey('quotesReceived')}>
                  Quotes Received {#if sortKey === 'quotesReceived'}{sortDirection === 'asc' ? '▲' : '▼'}{/if}
                </button>
              </th>
              <th class="sub-header">
                <button on:click={() => setSortKey('surveyorsInstructed')}>
                  Surveyors Instructed {#if sortKey === 'surveyorsInstructed'}{sortDirection === 'asc' ? '▲' : '▼'}{/if}
                </button>
              </th>
              <th class="sub-header">
                <button on:click={() => setSortKey('instructedSpend')}>
                  Instructed Spend (£) {#if sortKey === 'instructedSpend'}{sortDirection === 'asc' ? '▲' : '▼'}{/if}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {#if finalProjects.length === 0}
              <tr>
                <td colspan="7" class="empty-state">
                  {#if searchText}
                    <p>No projects match your filter "{searchText}".</p>
                  {:else}
                    <p>No projects found.</p>
                  {/if}
                </td>
              </tr>
            {:else}
              {#each finalProjects as project (project.id)}
                <tr>
                  <td>{project.name}</td>
                  <td>{project.client || '-'}</td>
                  <td>{project.teamMembers?.join(', ') || '-'}</td>
                  <td class="key-dates-cell">
                    {#if project.programmeEvents && project.programmeEvents.length > 0}
                      <ul>
                        {#each project.programmeEvents as event (event.id)}
                          <li>
                            <span>
                              <strong>{event.title}:</strong>
                              {formatDate(event.date)}
                            </span>
                            <button
                              class="delete-btn"
                              on:click={() => handleDeleteKeyDate(event.id)}
                              disabled={isDeleting}
                              title="Delete this key date"
                            >
                              <svg
                                class="delete-icon"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            </button>
                          </li>
                        {/each}
                      </ul>
                    {:else}
                      -
                    {/if}
                  </td>
                  <td class="text-center divider-left">{project.quotesReceived}</td>
                  <td class="text-center">{project.surveyorsInstructed}</td>
                  <td class="text-center">{formatCurrency(project.instructedSpend)}</td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
  
  <style>
    .project-bank-container {
      padding: 2rem;
    }
    .controls-container {
      margin-bottom: 1.5rem;
    }
    .filter-input {
      padding: 0.5rem 1rem;
      font-size: 1rem;
      border-radius: 6px;
      border: 1px solid #cbd5e0;
      width: 100%;
      max-width: 400px;
    }
    .table-container {
      overflow: auto;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: white;
    }
    .projects-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 900px;
    }
    .projects-table th,
    .projects-table td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
      vertical-align: top;
      font-size: 0.85rem;
    }
    .key-dates-cell {
      white-space: normal;
      min-width: 200px;
    }
    .key-dates-cell ul {
      margin: 0;
      padding-left: 0;
      list-style: none;
    }
    .key-dates-cell li {
      margin-bottom: 0.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }
     .key-dates-cell li span {
      flex-grow: 1;
    }
    .delete-btn {
      background: none;
      border: none;
      color: #888; /* Greyscale color */
      cursor: pointer;
      padding: 0 0.25rem;
      margin-left: 0.5rem;
      opacity: 0.6;
      transition: opacity 0.2s;
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }
    .delete-btn:hover {
      opacity: 1;
    }
    .delete-btn:disabled {
      opacity: 0.2;
      cursor: not-allowed;
    }
    .delete-icon {
      width: 16px;
      height: 16px;
    }
    .projects-table th {
      background-color: #f7fafc;
      font-size: 0.75rem;
      font-weight: 600;
      color: #4a5568;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .projects-table th button {
      background: none;
      border: none;
      padding: 0;
      margin: 0;
      font: inherit;
      color: inherit;
      cursor: pointer;
      text-align: left;
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .sub-header button {
      justify-content: center;
    }
    .sub-header {
      font-size: 0.7rem !important;
      font-weight: 500 !important;
      border-top: 1px solid #e2e8f0;
      text-align: center;
    }
    .text-center {
      text-align: center;
    }
    .divider-left {
      border-left: 1px solid #e2e8f0;
    }
    .empty-state, .loading-state, .error-message {
      padding: 2rem;
      text-align: center;
      color: #a0aec0;
    }
    .error-message {
      background-color: #fed7d7;
      border: 1px solid #feb2b2;
      color: #c53030;
      border-radius: 6px;
    }
  </style>