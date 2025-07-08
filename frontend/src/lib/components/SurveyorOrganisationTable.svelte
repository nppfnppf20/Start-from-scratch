<script lang="ts">
	import type { SurveyorOrganisation } from '$lib/stores/projectStore';

	export let surveyors: SurveyorOrganisation[] = [];

	// --- State Management ---
	let displaySurveyors: SurveyorOrganisation[] = [];

	// --- Sorting State ---
	type SortKey = keyof SurveyorOrganisation | `averageRatings.${keyof SurveyorOrganisation['averageRatings']}`;
	let sortKey: SortKey = 'discipline';
	let sortDirection: 'asc' | 'desc' = 'asc';

	// --- Filtering State ---
	let searchText = '';

	// --- State for the notes modal ---
	let showNotesModal = false;
	let notesForModal: string[] = [];
	let selectedOrgForModal = '';

	// --- Helper Functions ---
	function openNotesModal(notes: string[], orgName: string, discipline: string) {
		notesForModal = notes;
		selectedOrgForModal = `${orgName} - ${discipline}`;
		showNotesModal = true;
	}

	function closeNotesModal() {
		showNotesModal = false;
		notesForModal = [];
		selectedOrgForModal = '';
	}

	function formatValue(value: number | undefined | null): string {
		if (value === null || value === undefined) return 'N/A';
		return value.toFixed(1);
	}

	function setSortKey(key: SortKey) {
		if (sortKey === key) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDirection = 'asc';
		}
	}

	// --- Reactive Declaration for Sorting and Filtering ---
	$: displaySurveyors = (() => {
		let result = [...surveyors];

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
			const getNestedValue = (obj: any, path: string) =>
				path.split('.').reduce((o, k) => (o || {})[k], obj);

			const valA = getNestedValue(a, sortKey);
			const valB = getNestedValue(b, sortKey);

			if (valA === null || valA === undefined) return 1;
			if (valB === null || valB === undefined) return -1;

			let comparison = 0;
			if (typeof valA === 'string' && typeof valB === 'string') {
				comparison = valA.localeCompare(valB);
			} else if (typeof valA === 'number' && typeof valB === 'number') {
				comparison = valA - valB;
			}

			return sortDirection === 'asc' ? comparison : -comparison;
		});

		return result;
	})();
</script>

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
{:else}
    <div class="table-container">
        <table class="surveyors-table">
            <thead>
                <tr>
                    <th rowspan="2"
                        ><button on:click={() => setSortKey('organisation')}
                            >Organisation {#if sortKey === 'organisation'}{sortDirection === 'asc' ? '▲' : '▼'}{/if}</button
                        ></th
                    >
                    <th rowspan="2"
                        ><button on:click={() => setSortKey('discipline')}
                            >Discipline {#if sortKey === 'discipline'}{sortDirection === 'asc' ? '▲' : '▼'}{/if}</button
                        ></th
                    >
                    <th rowspan="2">Contacts</th>
                    <th colspan="2" class="text-center divider-left">Totals</th>
                    <th colspan="4" class="text-center divider-left divider-right"
                        >Feedback (Average /5)</th
                    >
                    <th rowspan="2">Collated notes</th>
                </tr>
                <tr>
                    <th class="sub-header divider-left"
                        ><button on:click={() => setSortKey('totalQuotes')}
                            >Quotes {#if sortKey === 'totalQuotes'}{sortDirection === 'asc' ? '▲' : '▼'}{/if}</button
                        ></th
                    >
                    <th class="sub-header"
                        ><button on:click={() => setSortKey('totalInstructed')}
                            >Instructed {#if sortKey === 'totalInstructed'}{sortDirection === 'asc' ? '▲' : '▼'}{/if}</button
                        ></th
                    >
                    <th class="sub-header divider-left"
                        ><button on:click={() => setSortKey('averageRatings.quality')}
                            >Quality {#if sortKey === 'averageRatings.quality'}{sortDirection === 'asc' ? '▲' : '▼'}{/if}</button
                        ></th
                    >
                    <th class="sub-header"
                        ><button on:click={() => setSortKey('averageRatings.responsiveness')}
                            >Responsive {#if sortKey === 'averageRatings.responsiveness'}{sortDirection === 'asc' ? '▲' : '▼'}{/if}</button
                        ></th
                    >
                    <th class="sub-header"
                        ><button on:click={() => setSortKey('averageRatings.deliveredOnTime')}
                            >On Time {#if sortKey === 'averageRatings.deliveredOnTime'}{sortDirection === 'asc' ? '▲' : '▼'}{/if}</button
                        ></th
                    >
                    <th class="sub-header divider-right"
                        ><button on:click={() => setSortKey('averageRatings.overallReview')}
                            >Overall {#if sortKey === 'averageRatings.overallReview'}{sortDirection === 'asc' ? '▲' : '▼'}{/if}</button
                        ></th
                    >
                </tr>
            </thead>
            <tbody>
                {#each displaySurveyors as surveyor (surveyor.id)}
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
                        <td class="text-center divider-left">{surveyor.totalQuotes}</td>
                        <td class="text-center">{surveyor.totalInstructed}</td>
                        <td class="text-center divider-left"
                            >{formatValue(surveyor.averageRatings.quality)}</td
                        >
                        <td class="text-center">{formatValue(surveyor.averageRatings.responsiveness)}</td>
                        <td class="text-center">{formatValue(surveyor.averageRatings.deliveredOnTime)}</td>
                        <td class="text-center divider-right"
                            >{formatValue(surveyor.averageRatings.overallReview)}</td
                        >
                        <td>
                            {#if surveyor.collatedNotes && surveyor.collatedNotes.length > 0}
                                <button
                                    on:click={() =>
                                        openNotesModal(
                                            surveyor.collatedNotes,
                                            surveyor.organisation,
                                            surveyor.discipline
                                        )}
                                    class="notes-button"
                                >
                                    View {surveyor.collatedNotes.length} Note(s)
                                </button>
                            {:else}
                                <span class="no-notes">No Notes</span>
                            {/if}
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
{/if}

<!-- Notes Modal -->
{#if showNotesModal}
	<div class="modal-backdrop" on:click={closeNotesModal}>
		<div class="modal-content" on:click|stopPropagation>
			<h3 class="modal-header">Notes for {selectedOrgForModal}</h3>
			<div class="modal-body">
				<ol>
					{#each notesForModal as note}
						<li>{note}</li>
					{/each}
				</ol>
			</div>
			<div class="modal-footer">
				<button on:click={closeNotesModal} class="modal-close-button"> Close </button>
			</div>
		</div>
	</div>
{/if}

<style>
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
	.notes-button {
		color: #3182ce;
		text-decoration: none;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		font-size: inherit;
	}
	.notes-button:hover {
		text-decoration: underline;
	}
	.no-notes {
		color: #718096;
		font-style: italic;
	}

	/* Modal Styles */
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
		z-index: 1000;
	}
	.modal-content {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
		width: 90%;
		max-width: 600px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
	}
	.modal-header {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e2e8f0;
	}
	.modal-body {
		overflow-y: auto;
		flex-grow: 1;
	}
	.modal-body ol {
		list-style-type: decimal;
		padding-left: 1.5rem;
	}
	.modal-body li {
		margin-bottom: 0.75rem;
		line-height: 1.6;
	}
	.modal-footer {
		margin-top: 1.5rem;
		text-align: right;
	}
	.modal-close-button {
		padding: 0.5rem 1rem;
		background-color: #e2e8f0;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
	}
	.modal-close-button:hover {
		background-color: #cbd5e0;
	}
</style> 