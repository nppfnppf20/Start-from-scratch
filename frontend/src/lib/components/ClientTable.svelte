<script lang="ts">
	import type { Client } from '$lib/stores/projectStore';

	// The component now accepts an array of `Client` objects
	export let clients: Client[] = [];

	// --- State Management ---
	let displayClients: Client[] = [];

	// --- Sorting State (simplified for Client data) ---
	type SortKey = keyof Client;
	let sortKey: SortKey = 'organisation'; // Default sort
	let sortDirection: 'asc' | 'desc' = 'asc';

	// --- Filtering State ---
	let searchText = '';

	// --- State for the projects modal ---
	let showProjectsModal = false;
	let projectsForModal: string[] = [];
	let selectedClientForModal = '';

	// --- Helper Functions ---
	function openProjectsModal(projects: string[], clientName: string) {
		projectsForModal = projects;
		selectedClientForModal = clientName;
		showProjectsModal = true;
	}

	function closeProjectsModal() {
		showProjectsModal = false;
		projectsForModal = [];
		selectedClientForModal = '';
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
	$: displayClients = (() => {
		let result = [...clients];

		// 1. Apply Filter
		if (searchText.trim() !== '') {
			const lowercasedFilter = searchText.toLowerCase();
			result = result.filter(
				(item) =>
					item.organisation.toLowerCase().includes(lowercasedFilter) ||
					item.industry.toLowerCase().includes(lowercasedFilter)
			);
		}

		// 2. Apply Sort
		result.sort((a, b) => {
			const valA = a[sortKey];
			const valB = b[sortKey];

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
		placeholder="Filter by Organisation or Industry..."
		class="filter-input"
	/>
</div>

{#if displayClients.length === 0 && searchText}
	<div class="empty-state">
		<p>No clients match your filter "{searchText}".</p>
	</div>
{:else}
	<div class="table-container">
		<table class="clients-table">
			<thead>
				<tr>
					<th><button on:click={() => setSortKey('organisation')}>Organisation {#if sortKey === 'organisation'}{sortDirection === 'asc' ? '▲' : '▼'}{/if}</button></th>
					<th><button on:click={() => setSortKey('industry')}>Industry {#if sortKey === 'industry'}{sortDirection === 'asc' ? '▲' : '▼'}{/if}</button></th>
					<th>Contacts</th>
					<th class="text-center"><button on:click={() => setSortKey('totalProjects')}>Total Projects {#if sortKey === 'totalProjects'}{sortDirection === 'asc' ? '▲' : '▼'}{/if}</button></th>
					<th>Projects</th>
				</tr>
			</thead>
			<tbody>
				{#each displayClients as client (client.id)}
					<tr>
						<td class="organisation-cell">{client.organisation}</td>
						<td>{client.industry}</td>
						<td class="contacts-cell">
							{#if client.contacts.length > 0}
								<ul>
									{#each client.contacts as contact}
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
						<td class="text-center">{client.totalProjects}</td>
						<td>
							{#if client.projectNames && client.projectNames.length > 0}
								<button
									on:click={() => openProjectsModal(client.projectNames, client.organisation)}
									class="action-button"
								>
									View {client.projectNames.length} Project(s)
								</button>
							{:else}
								<span class="no-items-text">No Projects</span>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<!-- Projects Modal -->
{#if showProjectsModal}
	<div class="modal-backdrop" on:click={closeProjectsModal}>
		<div class="modal-content" on:click|stopPropagation>
			<h3 class="modal-header">Projects for {selectedClientForModal}</h3>
			<div class="modal-body">
				<ul class="item-list">
					{#each projectsForModal as project}
						<li>{project}</li>
					{/each}
				</ul>
			</div>
			<div class="modal-footer">
				<button on:click={closeProjectsModal} class="modal-close-button"> Close </button>
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
	.clients-table {
		width: 100%;
		min-width: 900px; /* Set a minimum width for better layout */
		border-collapse: collapse;
	}
	.clients-table th,
	.clients-table td {
		padding: 8px 12px;
		text-align: left;
		border-bottom: 1px solid #e2e8f0;
		white-space: nowrap;
		vertical-align: top;
		font-size: 0.85rem;
	}
	.clients-table th {
		background-color: #f7fafc;
		font-size: 0.75rem;
		font-weight: 600;
		color: #4a5568;
		vertical-align: middle;
		text-align: left; /* Set default alignment for headers */
	}
	.clients-table th button {
		background: none;
		border: none;
		padding: 0;
		margin: 0;
		font: inherit;
		color: inherit;
		cursor: pointer;
		width: 100%;
		text-align: inherit; /* Inherit alignment from parent th */
	}
	.clients-table th.text-center button {
		/* This rule is no longer needed */
	}
	.clients-table th button:hover {
		color: #000;
	}
	.clients-table tbody tr:last-child td {
		border-bottom: none;
	}
	.clients-table tbody tr:hover {
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
	.action-button {
		color: #3182ce;
		text-decoration: none;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		font-size: inherit;
	}
	.action-button:hover {
		text-decoration: underline;
	}
	.no-items-text {
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
		max-width: 500px;
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
	.item-list {
		list-style-type: disc;
		padding-left: 1.5rem;
        font-size: 0.9rem;
	}
	.item-list li {
		margin-bottom: 0.5rem;
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