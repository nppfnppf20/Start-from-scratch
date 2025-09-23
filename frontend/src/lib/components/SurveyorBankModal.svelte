<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import {
        loadSurveyorOrganisations,
        surveyorOrganisations,
        deleteSurveyorOrganisation,
        type SurveyorOrganisation,
        type Contact
    } from '$lib/stores/surveyorOrganisationStore';
    import EditSurveyorOrganisationModal from './EditSurveyorOrganisationModal.svelte';
    import DataTable, { type TableColumn } from './DataTable.svelte';
    
    // Props
    export let showActions: boolean = true;
    export let showSelectButton: boolean = false;
    
    // State
    let isLoading = false;
    let error: string | null = null;
    let showEditModal = false;
    let selectedOrganisation: SurveyorOrganisation | null = null;

    const dispatch = createEventDispatcher();

    // Helper function to format values
    function formatValue(value: number | string | undefined | null): string {
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'string') return value;
        return Number(value).toFixed(1);
    }

    // Define table columns
    const columns: TableColumn[] = [
        {
            key: 'organisation',
            label: 'Organisation',
            sortable: true,
            className: 'organisation-cell',
            width: '180px'
        },
        {
            key: 'discipline',
            label: 'Discipline',
            sortable: true,
            className: 'discipline-cell',
            width: '150px'
        },
        {
            key: 'contacts',
            label: 'Contacts',
            className: 'contacts-cell',
            width: '250px'
        },
        {
            key: 'feedback',
            label: 'Feedback (Average /5)',
            colspan: 4,
            align: 'center' as const,
            className: 'divider-left divider-right',
            subHeaders: [
                {
                    key: 'averageQuality',
                    label: 'Quality',
                    sortable: true,
                    align: 'center' as const,
                    className: 'divider-left'
                },
                {
                    key: 'averageResponsiveness',
                    label: 'Responsive',
                    sortable: true,
                    align: 'center' as const
                },
                {
                    key: 'averageDeliveredOnTime',
                    label: 'On Time',
                    sortable: true,
                    align: 'center' as const
                },
                {
                    key: 'averageOverallReview',
                    label: 'Overall',
                    sortable: true,
                    align: 'center' as const,
                    className: 'divider-right'
                }
            ]
        }
    ];

    // Event handlers
    function handleAction(event: CustomEvent) {
        const { action, item } = event.detail;

        if (action === 'edit') {
            handleEditClick(item);
        } else if (action === 'delete') {
            handleDeleteClick(item.id);
        }
    }

    function handleEditClick(organisation: SurveyorOrganisation) {
        selectedOrganisation = organisation;
        showEditModal = true;
    }

    async function handleDeleteClick(organisationId: string) {
        if (confirm('Are you sure you want to delete this organisation? This will also delete all associated user accounts and cannot be undone.')) {
            try {
                await deleteSurveyorOrganisation(organisationId);
            } catch (err) {
                alert(`Failed to delete organisation: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
        }
    }

    function handleSelectContact(contact: Contact) {
        if (contact.email) {
            dispatch('select', { email: contact.email });
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

    function handleRetry() {
        loadData();
    }
</script>

<div class="surveyor-bank-container">
    <DataTable
        data={$surveyorOrganisations}
        {columns}
        {isLoading}
        {error}
        searchPlaceholder="Filter by Organisation or Discipline..."
        emptyMessage="No surveyor organisations in your bank yet."
        {showActions}
        on:action={handleAction}
        on:retry={handleRetry}
    >
        <svelte:fragment slot="cell" let:column let:item let:index>
            {#if column.key === 'contacts'}
                {#if item.contacts && item.contacts.length > 0}
                    <ul class="contacts-list">
                        {#each item.contacts as contact}
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
                                {#if showSelectButton}
                                    <br />
                                    <button class="select-btn" on:click|stopPropagation={() => handleSelectContact(contact)}>Select</button>
                                {/if}
                            </li>
                        {/each}
                    </ul>
                {:else}
                    <span>-</span>
                {/if}
            {:else if column.key === 'averageQuality' || column.key === 'averageResponsiveness' || column.key === 'averageDeliveredOnTime' || column.key === 'averageOverallReview'}
                {formatValue(item[column.key])}
            {:else}
                {item[column.key] ?? '-'}
            {/if}
        </svelte:fragment>
    </DataTable>
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

    /* Custom styling for contacts column */
    :global(.organisation-cell) {
        font-weight: 600;
        color: #2d3748;
        white-space: normal !important;
        word-wrap: break-word;
        overflow-wrap: break-word;
    }

    :global(.discipline-cell) {
        white-space: normal !important;
        word-wrap: break-word;
        overflow-wrap: break-word;
    }

    :global(.contacts-cell) {
        white-space: normal !important;
        word-wrap: break-word;
        overflow-wrap: break-word;
        hyphens: auto;
        line-height: 1.4;
    }

    .contacts-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .contacts-list li:not(:last-child) {
        margin-bottom: 0.5rem;
    }

    .contacts-list a {
        color: #3182ce;
        text-decoration: none;
        word-break: break-all;
    }

    .contacts-list a:hover {
        text-decoration: underline;
    }

    .contacts-list strong {
        display: inline-block;
        word-wrap: break-word;
        max-width: 100%;
    }

    .select-btn {
        margin-top: 5px;
        padding: 4px 8px;
        font-size: 0.8rem;
        border-radius: 4px;
        border: 1px solid #28a745;
        background-color: transparent;
        color: #28a745;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .select-btn:hover {
        background-color: #28a745;
        color: white;
    }
</style>