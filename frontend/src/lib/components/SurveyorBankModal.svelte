<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import {
        loadSurveyorOrganisations,
        surveyorOrganisations,
        deleteSurveyorOrganisation,
        updateSurveyorOrganisation,
        type SurveyorOrganisation,
        type Contact
    } from '$lib/stores/surveyorOrganisationStore';
    import EditSurveyorOrganisationModal from './EditSurveyorOrganisationModal.svelte';
    import NotesModal from './NotesModal.svelte';
    import DataTable, { type TableColumn } from './DataTable.svelte';
    
    // Props
    export let showActions: boolean = true;
    export let showSelectButton: boolean = false;
    
    // State
    let isLoading = false;
    let error: string | null = null;
    let showEditModal = false;
    let selectedOrganisation: SurveyorOrganisation | null = null;
    
    // Notes modal state
    let showNotesModal = false;
    let currentOrgForNotes: SurveyorOrganisation | null = null;
    let currentNotes: string = '';

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
            key: 'location',
            label: 'Location',
            sortable: true,
            className: 'location-cell',
            width: '120px'
        },
        {
            key: 'contacts',
            label: 'Contacts',
            className: 'contacts-cell',
            width: '250px'
        },
        {
            key: 'notes',
            label: 'Notes',
            className: 'notes-cell',
            width: '150px'
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

    // Notes modal functions
    function getNotesPreview(notes: string | undefined): string {
        if (!notes || notes.trim() === '') return 'Add notes...';
        return notes.length > 30 ? notes.substring(0, 30) + '...' : notes;
    }

    function openNotesModal(org: SurveyorOrganisation) {
        currentOrgForNotes = org;
        currentNotes = org.notes || '';
        showNotesModal = true;
    }

    function closeNotesModal() {
        showNotesModal = false;
        currentOrgForNotes = null;
        currentNotes = '';
    }

    async function handleSaveNotes(event: CustomEvent<{ notes: string }>) {
        if (!currentOrgForNotes) return;
        
        const success = await updateSurveyorOrganisation(currentOrgForNotes.id, {
            notes: event.detail.notes
        });
        
        if (success) {
            closeNotesModal();
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
        searchPlaceholder="Filter by Organisation, Discipline, or Location..."
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
            {:else if column.key === 'notes'}
                <button
                    class="notes-button"
                    on:click|stopPropagation={() => openNotesModal(item)}
                    title="View/Edit notes"
                >
                    {getNotesPreview(item.notes)}
                </button>
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

{#if showNotesModal && currentOrgForNotes}
    <NotesModal
        initialNotes={currentNotes}
        organisationName={currentOrgForNotes.organisation}
        on:save={handleSaveNotes}
        on:cancel={closeNotesModal}
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

    /* Notes button styling */
    .notes-button {
        width: 100%;
        max-width: 150px;
        padding: 0.3rem 0.6rem;
        font-size: 0.85rem;
        border-radius: 4px;
        border: 1px solid #cbd5e0;
        text-align: left;
        cursor: pointer;
        font-style: italic;
        color: #555;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        background-color: white;
        transition: all 0.2s ease;
    }

    .notes-button:hover {
        background-color: #e9ecef;
        border-color: #999;
    }

    .select-btn:hover {
        background-color: #28a745;
        color: white;
    }
</style>