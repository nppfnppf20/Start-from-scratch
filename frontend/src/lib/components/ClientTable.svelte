<script lang="ts">
  import { onMount } from 'svelte';
  import { clientOrganisations, loadClientOrganisations, type ClientOrganisation, deleteClientOrganisation } from '$lib/stores/clientStore';
  import EditClientOrganisationModal from './EditClientOrganisationModal.svelte';

  let displayClients: ClientOrganisation[] = [];
  let isLoading = true;
  let searchText = '';
  let showEditModal = false;
  let selectedClient: ClientOrganisation | null = null;

  onMount(async () => {
    await loadClientOrganisations();
    isLoading = false;
  });

  function handleEditClick(client: ClientOrganisation) {
    selectedClient = client;
    showEditModal = true;
  }

  async function handleDeleteClick(clientId: string) {
    if (confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      await deleteClientOrganisation(clientId);
    }
  }

  $: {
    let allClients = $clientOrganisations;
    if (searchText.trim() !== '') {
      const lowercasedFilter = searchText.toLowerCase();
      displayClients = allClients.filter(
        (client) =>
          client.organisationName.toLowerCase().includes(lowercasedFilter) ||
          client.contacts.some(c => c.contactName.toLowerCase().includes(lowercasedFilter) || (c.email && c.email.toLowerCase().includes(lowercasedFilter)))
      );
    } else {
      displayClients = allClients;
    }
  }

</script>

<div class="client-bank-container">
    {#if isLoading}
        <div class="loading-message">
            <p>Loading client data...</p>
        </div>
    {:else}
        <div class="controls-container">
            <input
                type="text"
                bind:value={searchText}
                placeholder="Filter by Client or Contact..."
                class="filter-input"
            />
        </div>

        {#if displayClients.length === 0 && searchText}
            <div class="empty-state">
                <p>No client data matches your filter "{searchText}".</p>
            </div>
        {:else if displayClients.length === 0}
            <div class="empty-state">
                <p>No clients in your bank yet.</p>
            </div>
        {:else}
            <div class="table-container">
                <table class="clients-table">
                    <thead>
                        <tr>
                            <th>Client</th>
                            <th>Contacts</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each displayClients as client (client.id)}
                            <tr>
                                <td class="client-cell">{client.organisationName}</td>
                                <td class="contacts-cell">
                                    {#if client.contacts && client.contacts.length > 0}
                                        <ul>
                                            {#each client.contacts as contact}
                                                <li>
                                                    <strong>{contact.contactName}</strong><br />
                                                    {#if contact.email}
                                                      <a href="mailto:{contact.email}">{contact.email}</a><br />
                                                    {/if}
                                                    {#if contact.phoneNumber}
                                                      <span>{contact.phoneNumber}</span>
                                                    {/if}
                                                </li>
                                            {/each}
                                        </ul>
                                    {:else}
                                        <span>-</span>
                                    {/if}
                                </td>
                                <td class="actions-cell">
                                    <button class="action-btn" on:click={() => handleEditClick(client)}>Edit</button>
                                    <button class="action-btn delete-btn" on:click={() => handleDeleteClick(client.id)}>Delete</button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    {/if}
</div>

<EditClientOrganisationModal
  bind:isOpen={showEditModal}
  client={selectedClient}
  on:close={() => {
    showEditModal = false;
    selectedClient = null;
  }}
/>

<style>
/* General container for the whole component */
.client-bank-container {
    font-family: var(--font-family, sans-serif);
}

/* Loading and error states */
.loading-message,
.error-message,
.empty-state {
    text-align: center;
    padding: 40px;
    background-color: #f8f9fa;
    border-radius: 8px;
    margin-top: 20px;
}

.error-message {
    color: #721c24;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
}

.retry-btn {
    margin-top: 10px;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    background-color: #007bff;
    color: white;
    cursor: pointer;
}

/* Controls like filter input */
.controls-container {
    margin-bottom: 1rem;
}

.filter-input {
    width: 100%;
    max-width: 400px;
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
}

/* Table styling */
.table-container {
    overflow-x: auto; /* Allow horizontal scrolling on small screens */
    background-color: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.clients-table {
    width: 100%;
    min-width: 800px; /* Min-width to prevent squishing on small screens */
    border-collapse: collapse;
    table-layout: fixed; /* Helps with consistent column widths */
}

.clients-table th,
.clients-table td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
    vertical-align: top; /* Align content to the top */
}

.clients-table thead th {
    background-color: #f8f9fa;
    font-weight: 600;
    font-size: 0.875rem;
    color: #343a40;
    position: sticky;
    top: 0;
    z-index: 1;
}

.clients-table th button {
    background: none;
    border: none;
    font-weight: 600;
    cursor: pointer;
    text-align: left;
    padding: 0;
    width: 100%;
    color: inherit;
}

/* Specific cell styling */
.client-cell {
    font-weight: 500;
    color: #0056b3;
    width: 20%;
}

.contacts-cell {
    width: 35%;
}

.contacts-cell ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.contacts-cell li {
    padding: 8px 0;
    border-bottom: 1px dashed #e0e0e0;
}

.contacts-cell li:last-child {
    border-bottom: none;
}

.contacts-cell strong {
    font-weight: 500;
}

.contacts-cell a {
    color: #007bff;
    text-decoration: none;
}

.contacts-cell a:hover {
    text-decoration: underline;
}

.actions-cell {
    width: 15%;
    text-align: right;
}

/* Action button styling */
.action-btn {
    padding: 6px 12px;
    font-size: 0.875rem;
    border-radius: 4px;
    border: 1px solid #007bff;
    background-color: transparent;
    color: #007bff;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    margin-right: 5px;
}

.action-btn:hover {
    background-color: #007bff;
    color: white;
}

.delete-btn {
    border-color: #dc3545;
    color: #dc3545;
}

.delete-btn:hover {
    background-color: #dc3545;
    color: white;
}
</style> 