<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import {
    selectedProject,
    currentProjectQuotes,
    surveyorFeedbacks,      // Use new store
    upsertSurveyorFeedback, // Use new upsert function
    deleteSurveyorFeedback, // Import the delete function
    type Quote,
    type SurveyorFeedback   // Use new interface
  } from "$lib/stores/projectStore";
  import StarRating from "$lib/components/StarRating.svelte";
  import NotesModal from "$lib/components/NotesModal.svelte";
  import DataTable, { type TableColumn } from '$lib/components/DataTable.svelte';
  import { format, parseISO } from 'date-fns';
  // Removed getContext, setContext, writable as they are not directly used here now

  // DataTable event handlers
  function handleAction(event: CustomEvent) {
    // Handle edit/delete actions from DataTable
    const { action, item } = event.detail;
    if (action === 'edit') {
      startEditing(item);
    } else if (action === 'delete') {
      handleDeleteReview(item.id, item.organisation);
    }
  }

  // Filter for project quotes that are instructed or partially instructed
  $: projectQuotes = $selectedProject
    ? $currentProjectQuotes.filter(q => 
        q.instructionStatus === 'instructed' || 
        q.instructionStatus === 'partially instructed'
      )
    : [];

  // --- State for Edit Mode ---
  let editingQuoteId: string | null = null;
  // Temporary storage for feedback being edited
  let editableFeedback: Partial<SurveyorFeedback> = {};

  // --- Modal state for Notes ---
  let showNotesModal = false;
  let currentQuoteForNotes: Quote | null = null;
  let currentNotes: string | undefined = '';

  // --- Edit/Save/Cancel Functions ---
  function startEditing(quote: Quote) {
    const quoteId = quote.id;
    const currentFeedback = $surveyorFeedbacks.find(fb => fb.quoteId === quoteId);
    // Initialize editableFeedback with current values or defaults
    editableFeedback = {
        // Do NOT set id, projectId, createdAt, updatedAt, reviewDate - backend handles these
        quoteId: quoteId, // Essential reference
        quality: currentFeedback?.quality,
        responsiveness: currentFeedback?.responsiveness,
        deliveredOnTime: currentFeedback?.deliveredOnTime,
        overallReview: currentFeedback?.overallReview, // Required field - handle default/validation later if needed
    };
    editingQuoteId = quoteId;
    console.log('Started editing quote:', quoteId, 'Initial editable data:', editableFeedback);
  }

  function cancelEditing() {
    editingQuoteId = null;
    editableFeedback = {}; // Clear temporary data
    console.log('Cancelled editing');
  }

  async function saveChanges() {
    // Use the quoteId stored in editingQuoteId
    if (!editingQuoteId || !editableFeedback) {
        console.error("Cannot save, no quote ID in edit mode or no editable data.");
        return;
    }
    const quoteIdToSave = editingQuoteId;

    console.log('Saving feedback for quote:', quoteIdToSave, editableFeedback);

    // Client-side validation: Ensure overallReview has a value (as schema requires it)
    if (editableFeedback.overallReview === undefined || editableFeedback.overallReview === null) {
        alert('Overall Review rating is required before saving.');
        // TODO: Add visual feedback to highlight the missing field
        return;
    }

    // Prepare data for upsert: only send fields relevant to feedback (notes handled separately via modal)
    const dataToSend: Partial<Omit<SurveyorFeedback, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'reviewDate'>> & { quoteId: string } = {
        quoteId: quoteIdToSave,
        quality: editableFeedback.quality,
        responsiveness: editableFeedback.responsiveness,
        deliveredOnTime: editableFeedback.deliveredOnTime,
        overallReview: editableFeedback.overallReview, // Already validated above
    };


    const result = await upsertSurveyorFeedback(dataToSend);

    if (result) {
        console.log('Save successful for', quoteIdToSave);
        cancelEditing(); // Exit edit mode on successful save
    } else {
        // Error alert is handled within upsertSurveyorFeedback
        console.error("Save failed for", quoteIdToSave, ", staying in edit mode.");
        // Optionally, provide more specific UI feedback here based on error type if available
    }
  }

  // --- Notes Modal Functions ---
  function openNotesModal(quote: Quote) {
    const feedback = $surveyorFeedbacks.find(fb => fb.quoteId === quote.id);
    currentQuoteForNotes = quote;
    currentNotes = feedback?.notes; // Load existing notes
    showNotesModal = true;
  }

  function closeNotesModal() {
    showNotesModal = false;
    currentQuoteForNotes = null;
    currentNotes = '';
  }

  async function handleSaveNotes(event: CustomEvent<{ notes: string }>) {
    if (!currentQuoteForNotes) return;
    
    const newNotes = event.detail.notes;
    console.log(`Saving notes for quote ${currentQuoteForNotes.id}`);
    
    // Use the same upsert function to save notes
    const dataToSend = {
      quoteId: currentQuoteForNotes.id,
      notes: newNotes
    };
    
    await upsertSurveyorFeedback(dataToSend);
    closeNotesModal();
  }

  // Helper function to get notes preview
  function getNotesPreview(notes: string | undefined): string {
    if (!notes || notes.trim() === '') {
      return "Add notes...";
    }
    // Simple preview - show first line, truncated
    const firstLine = notes.split('\n')[0];
    return firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine;
  }

  // --- Delete Review Function ---
  async function handleDeleteReview(quoteId: string, quoteOrg: string) {
    if (!quoteId) {
      console.error("Cannot delete, no quote ID provided.");
      alert("Error: Quote ID is missing, cannot delete review.");
      return;
    }

    const confirmation = confirm(`Are you sure you want to delete the review for ${quoteOrg}? This action cannot be undone.`);
    if (confirmation) {
      console.log('Attempting to delete review for quote ID:', quoteId);
      const success = await deleteSurveyorFeedback(quoteId);
      if (success) {
        alert(`Review for ${quoteOrg} deleted successfully.`);
        // Optionally, clear editing state if the deleted review was being edited, though not typical flow
        if (editingQuoteId === quoteId) {
          cancelEditing();
        }
      } else {
        // Error is typically alerted from within deleteSurveyorFeedback
        console.error('Failed to delete review for quote ID:', quoteId);
      }
    } else {
      console.log('Review deletion cancelled by user for quote ID:', quoteId);
    }
  }

  // --- Update Handlers (Modify local editable state during edit) ---
  function handleEditableRatingUpdate(field: keyof SurveyorFeedback, value: number | undefined) {
      // Only update if we are in edit mode for this specific row
      if (!editingQuoteId || editableFeedback.quoteId !== editingQuoteId) return;

      // Check if the field is a valid rating field before updating
      const ratingFields: (keyof SurveyorFeedback)[] = ['quality', 'responsiveness', 'deliveredOnTime', 'overallReview'];
      if (ratingFields.includes(field)) {
          // Create a new object for reactivity
          editableFeedback = { ...editableFeedback, [field]: value };
          console.log('Updated editable feedback:', editableFeedback);
      }
  }

  // Define table columns for DataTable
  const columns: TableColumn[] = [
    {
      key: 'contactName',
      label: 'Contact Name',
      sortable: true
    },
    {
      key: 'organisation',
      label: 'Organisation',
      sortable: true
    },
    {
      key: 'quality',
      label: 'Quality',
      align: 'center' as const
    },
    {
      key: 'responsiveness',
      label: 'Responsiveness',
      align: 'center' as const
    },
    {
      key: 'deliveredOnTime',
      label: 'Delivered on Time',
      align: 'center' as const
    },
    {
      key: 'overallReview',
      label: 'Overall Review *',
      align: 'center' as const
    },
    {
      key: 'notes',
      label: 'Notes'
    }
  ];

</script>

<div class="reviews-container">
  <PageHeader 
    title="Surveyor Reviews"
    subtitle={$selectedProject ? `Reviews for Instructed Surveyors on ${$selectedProject.name}` : 'Please select a project'}
  />

  {#if $selectedProject}
    <p class="page-description">Click 'Edit' to rate surveyors and add notes.</p>

    {#if projectQuotes.length > 0}
      <DataTable
        data={projectQuotes}
        {columns}
        searchPlaceholder="Search by contact name, organisation..."
        emptyMessage="This project has no instructed surveyors to review."
        showSearch={true}
        showActions={true}
        minWidth="1000px"
        on:action={handleAction}
      >
        <svelte:fragment slot="cell" let:column let:item let:index>
          {@const feedback = $surveyorFeedbacks.find(fb => fb.quoteId === item.id)}
          {@const isEditing = editingQuoteId === item.id}

          {#if column.key === 'quality'}
            <div class="rating-cell">
              {#if isEditing}
                <StarRating
                  value={editableFeedback?.quality}
                  readonly={!isEditing}
                  on:update={(e) => handleEditableRatingUpdate('quality', e.detail)}
                />
              {:else}
                <StarRating value={feedback?.quality} readonly={true} />
              {/if}
            </div>
          {:else if column.key === 'responsiveness'}
            <div class="rating-cell">
              {#if isEditing}
                <StarRating
                  value={editableFeedback?.responsiveness}
                  readonly={!isEditing}
                  on:update={(e) => handleEditableRatingUpdate('responsiveness', e.detail)}
                />
              {:else}
                <StarRating value={feedback?.responsiveness} readonly={true} />
              {/if}
            </div>
          {:else if column.key === 'deliveredOnTime'}
            <div class="rating-cell">
              {#if isEditing}
                <StarRating
                  value={editableFeedback?.deliveredOnTime}
                  readonly={!isEditing}
                  on:update={(e) => handleEditableRatingUpdate('deliveredOnTime', e.detail)}
                />
              {:else}
                <StarRating value={feedback?.deliveredOnTime} readonly={true} />
              {/if}
            </div>
          {:else if column.key === 'overallReview'}
            <div class="rating-cell">
              {#if isEditing}
                <StarRating
                  value={editableFeedback?.overallReview}
                  readonly={!isEditing}
                  on:update={(e) => handleEditableRatingUpdate('overallReview', e.detail)}
                />
              {:else}
                <StarRating value={feedback?.overallReview} readonly={true} />
              {/if}
            </div>
          {:else if column.key === 'notes'}
            <button class="notes-button" on:click|stopPropagation={() => openNotesModal(item)} title="Edit review notes">
              {getNotesPreview(feedback?.notes)}
            </button>
          {:else}
            {item[column.key] ?? '-'}
          {/if}
        </svelte:fragment>

        <svelte:fragment slot="actions" let:item let:handleAction>
          {@const feedback = $surveyorFeedbacks.find(fb => fb.quoteId === item.id)}
          {@const isEditing = editingQuoteId === item.id}

          {#if isEditing}
            <button class="action-btn save-btn" on:click|stopPropagation={saveChanges} title="Save changes">Save</button>
            <button class="action-btn cancel-btn" on:click|stopPropagation={cancelEditing} title="Discard changes">Cancel</button>
          {:else}
            <button class="action-btn edit-btn" on:click|stopPropagation={() => startEditing(item)} title="Edit review">Edit</button>
            <button class="action-btn delete" on:click|stopPropagation={() => handleDeleteReview(item.id, item.organisation)} title="Delete review">Delete</button>
            {#if feedback?.updatedAt}
              <div class="last-saved" title="Last saved">Saved: {format(parseISO(feedback.updatedAt), 'd MMM yyyy HH:mm')}</div>
            {/if}
          {/if}
        </svelte:fragment>
      </DataTable>
    {:else}
      <p>This project has no instructed surveyors to review.</p>
    {/if}

  {:else}
    <p>Please select a project to view reviews.</p>
  {/if}

</div>

<!-- Notes Modal -->
{#if showNotesModal && currentQuoteForNotes}
  <NotesModal
    initialNotes={currentNotes}
    organisationName={currentQuoteForNotes.organisation}
    on:save={handleSaveNotes}
    on:cancel={closeNotesModal}
  />
{/if}

<style>
  .reviews-container {
    padding: 1rem 2rem;
  }

  .page-description {
    margin-bottom: 1.5rem;
    color: #718096;
    font-size: 0.95rem;
  }

  /* Rating Cell */
  .rating-cell {
    min-width: 120px;
    text-align: left;
  }

  /* Notes Button Styling */
  .notes-button {
    width: 100%;
    max-width: 200px;
    padding: 0.3rem 0.6rem;
    font-size: 0.8rem;
    border-radius: 5px;
    border: 1px solid #cbd5e0;
    text-align: left;
    cursor: pointer;
    font-style: italic;
    color: #555;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-height: 40px;
  }

  .notes-button:hover {
    background-color: #e9ecef;
    border-color: #adb5bd;
  }

  /* Action Button Overrides for this page */
  .save-btn {
    background-color: #38a169 !important;
    color: white !important;
    border-color: #38a169 !important;
  }
  .save-btn:hover {
    background-color: #2f855a !important;
  }

  .cancel-btn {
    border-color: #a0aec0 !important;
  }

  .edit-btn {
    border-color: #a0aec0 !important;
  }

  /* Last Saved Info */
  .last-saved {
    font-size: 0.75rem;
    color: #a0aec0;
    margin-top: 0.5rem;
    text-align: center;
  }

  /* Adjust Notes column spacing */
  :global(.data-table td:nth-last-child(2)) {
    width: 250px !important;
    max-width: 250px !important;
    padding-right: 8px !important;
  }

  :global(.data-table .actions-cell) {
    padding-left: 8px !important;
  }
</style>