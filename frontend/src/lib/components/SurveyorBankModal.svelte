<script lang="ts">
    import { 
        loadSurveyorOrganisations, 
        surveyorOrganisations, 
        type SurveyorOrganisation 
    } from '$lib/stores/surveyorOrganisationStore';
    import EditSurveyorOrganisationModal from './EditSurveyorOrganisationModal.svelte';
    
    // Props
    export let showActions: boolean = true;
    
    // State
    let isLoading = false;
    let error: string | null = null;
    let displaySurveyors: SurveyorOrganisation[] = [];
    let showEditModal = false;
    let selectedOrganisation: SurveyorOrganisation | null = null;

    function handleEditClick(organisation: SurveyorOrganisation) {
        selectedOrganisation = organisation;
        showEditModal = true;
    }

    // --- Sorting State ---
    type SortKey = 'organisation' | 'discipline' | 'averageQuality' | 'averageResponsiveness' | 'averageDeliveredOnTime' | 'averageOverallReview';
    let sortKey: SortKey = 'organisation';
    let sortDirection: 'asc' | 'desc' = 'asc';

    // --- Filtering State ---
    let searchText = '';

    // --- Helper Functions ---
    function formatValue(value: number | string | undefined | null): string {
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'string') return value;
        return Number(value).toFixed(1);
    }

    function setSortKey(key: SortKey) {
        if (sortKey === key) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortKey = key;
            sortDirection = 'asc';
        }
    }

    // Load data when component mounts
    async function loadData() {
        isLoading = true;
        error = null;
        
        try {
            await loadSurveyorOrganisations();
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load surveyor data';
        } finally {
            isLoading = false;
        }
    }

    // Load data on mount
    loadData();

    // --- Reactive Declaration for Sorting and Filtering ---
    $: displaySurveyors = (() => {
        let result = [...$surveyorOrganisations];

        // 1. Apply Filter
        if (searchText.trim() !== '') {
            const lowercasedFilter = searchText.toLowerCase();
            result = result.filter(
                (item) =>
                    item.organisation.toLowerCase().includes(lowercasedFilter) ||
                    item.discipline.toLowerCase().includes(lowercasedFilter)
            );
        }

        // 2. Apply Sort
        result.sort((a, b) => {
            const valA = a[sortKey];
            const valB = b[sortKey];

            if (valA === null || valA === undefined) return 1;
            if (valB === null || valB === undefined) return -1;

            let comparison = 0;
            
            // Attempt to convert values to numbers for sorting.
            // This handles the feedback columns, which can be strings ('4.5') or numbers (0).
            const numA = Number(valA);
            const numB = Number(valB);

            if (!isNaN(numA) && !isNaN(numB)) {
                // If both are valid numbers, compare them numerically.
                comparison = numA - numB;
            } else if (typeof valA === 'string' && typeof valB === 'string') {
                // Otherwise, fall back to string comparison for fields like 'organisation'.
                comparison = valA.localeCompare(valB);
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return result;
    })();
</script>

<div class="surveyor-bank-container">
    {#if error}
        <div class="error-message">
            <p>{error}</p>
            <button on:click={loadData} class="retry-btn">Retry</button>
        </div>
    {:else if isLoading}
        <div class="loading-message">
            <p>Loading surveyor data...</p>
        </div>
    {:else}
        <div class="controls-container">
            <input
                type="text"
                bind:value={searchText}
                placeholder="Filter by Organisation or Discipline..."
                class="filter-input"
            />
        </div>

        {#if displaySurveyors.length === 0 && searchText}
            <div class="empty-state">
                <p>No surveyor data matches your filter "{searchText}".</p>
            </div>
        {:else if displaySurveyors.length === 0}
            <div class="empty-state">
                <p>No surveyor organisations in your bank yet.</p>
            </div>
        {:else}
            <div class="table-container">
                <table class="surveyors-table">
                    <thead>
                        <tr>
                            <th rowspan="2">
                                <button on:click={() => setSortKey('organisation')}>
                                    Organisation {#if sortKey === 'organisation'}{sortDirection === 'asc' ? '▲' : '▼'}{/if}
                                </button>
                            </th>
                            <th rowspan="2">
                                <button on:click={() => setSortKey('discipline')}>
                                    Discipline {#if sortKey === 'discipline'}{sortDirection === 'asc' ? '▲' : '▼'}{/if}
                                </button>
                            </th>
                            <th rowspan="2">Contacts</th>
                            <th colspan="4" class="text-center divider-left divider-right">Feedback (Average /5)</th>
                            {#if showActions}
                              <th rowspan="2">Actions</th>
                            {/if}
                        </tr>
                        <tr>
                            <th class="sub-header divider-left">
                                <button on:click={() => setSortKey('averageQuality')}>
                                    Quality {#if sortKey === 'averageQuality'}{sortDirection === 'asc' ? '▲' : '▼'}{/if}
                                </button>
                            </th>
                            <th class="sub-header">
                                <button on:click={() => setSortKey('averageResponsiveness')}>
                                    Responsive {#if sortKey === 'averageResponsiveness'}{sortDirection === 'asc' ? '▲' : '▼'}{/if}
                                </button>
                            </th>
                            <th class="sub-header">
                                <button on:click={() => setSortKey('averageDeliveredOnTime')}>
                                    On Time {#if sortKey === 'averageDeliveredOnTime'}{sortDirection === 'asc' ? '▲' : '▼'}{/if}
                                </button>
                            </th>
                            <th class="sub-header divider-right">
                                <button on:click={() => setSortKey('averageOverallReview')}>
                                    Overall {#if sortKey === 'averageOverallReview'}{sortDirection === 'asc' ? '▲' : '▼'}{/if}
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each displaySurveyors as surveyor (surveyor.id)}
                            <tr>
                                <td class="organisation-cell">{surveyor.organisation}</td>
                                <td>{surveyor.discipline}</td>
                                <td class="contacts-cell">
                                    {#if surveyor.contacts && surveyor.contacts.length > 0}
                                        <ul>
                                            {#each surveyor.contacts as contact}
                                                <li>
                                                    {#if contact.contactName}
                                                        <strong>{contact.contactName}</strong>
                                                    {/if}
                                                    {#if contact.email}
                                                        <br />
                                                        <a href="mailto:{contact.email}">{contact.email}</a>
                                                    {/if}
                                                    {#if contact.phoneNumber}
                                                        <br />
                                                        <span>{contact.phoneNumber}</span>
                                                    {/if}
                                                </li>
                                            {/each}
                                        </ul>
                                    {:else}
                                        <span>-</span>
                                    {/if}
                                </td>
                                <td class="text-center divider-left">{formatValue(surveyor.averageQuality)}</td>
                                <td class="text-center">{formatValue(surveyor.averageResponsiveness)}</td>
                                <td class="text-center">{formatValue(surveyor.averageDeliveredOnTime)}</td>
                                <td class="text-center divider-right">{formatValue(surveyor.averageOverallReview)}</td>
                                {#if showActions}
                                  <td>
                                      <button on:click={() => handleEditClick(surveyor)}>Edit</button>
                                  </td>
                                {/if}
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    {/if}
</div>

{#if showEditModal && selectedOrganisation}
    <EditSurveyorOrganisationModal 
        organisation={selectedOrganisation} 
        on:close={() => showEditModal = false}
        on:save={() => {
            showEditModal = false;
            loadData(); // Refresh data after save
        }}
    />
{/if}

<style>
    .surveyor-bank-container {
        padding: 2rem;
    }

    .page-header {
        margin-bottom: 2rem;
    }

    .page-header h1 {
        margin: 0 0 0.5rem 0;
        font-size: 2rem;
        font-weight: 600;
        color: #2d3748;
    }

    .page-header p {
        margin: 0;
        color: #718096;
        font-size: 1rem;
    }

    .error-message, .loading-message {
        padding: 1rem;
        border-radius: 6px;
        text-align: center;
        margin-bottom: 1rem;
    }

    .error-message {
        background-color: #fed7d7;
        border: 1px solid #feb2b2;
        color: #c53030;
    }

    .loading-message {
        background-color: #e6fffa;
        border: 1px solid #81e6d9;
        color: #285e61;
    }

    .retry-btn {
        margin-left: 1rem;
        padding: 0.5rem 1rem;
        background: #c53030;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    td button {
        padding: 6px 12px;
        background-color: #17a2b8;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9em;
        transition: background-color 0.2s;
    }

    td button:hover {
        background-color: #138496;
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

    .empty-state {
        padding: 2rem;
        background-color: #f7fafc;
        border: 1px dashed #cbd5e0;
        border-radius: 6px;
        text-align: center;
        color: #a0aec0;
    }

    .table-container {
        overflow: auto;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: white;
    }

    .surveyors-table {
        width: 100%;
        border-collapse: collapse;
        min-width: 800px;
    }

    .surveyors-table th,
    .surveyors-table td {
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
        color: #4a5568;
        vertical-align: middle;
        position: sticky;
        top: 0;
        z-index: 10;
    }

    .surveyors-table th button {
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

    .surveyors-table th button:hover {
        color: #000;
    }

    .sub-header {
        font-size: 0.7rem !important;
        font-weight: 500 !important;
        border-top: 1px solid #e2e8f0;
        text-align: center;
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

    .contacts-cell {
        max-width: 250px;
        white-space: normal;
    }

    .contacts-cell ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .contacts-cell li:not(:last-child) {
        margin-bottom: 0.5rem;
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

    .divider-left {
        border-left: 1px solid #e2e8f0;
    }

    .divider-right {
        border-right: 1px solid #e2e8f0;
    }
</style>