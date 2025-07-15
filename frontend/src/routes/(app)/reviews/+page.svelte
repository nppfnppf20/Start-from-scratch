<script lang="ts">
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
  import { format, parseISO } from 'date-fns';
  // Removed getContext, setContext, writable as they are not directly used here now

  // --- New: Reference to the scrollable table container ---
  // let tableContainerElement: HTMLDivElement; // Variable not added due to HTML edit issues

  // --- New: Scroll functions (kept for potential future use) ---
  // function scrollLeft() {
  //   if (tableContainerElement) {
  //     tableContainerElement.scrollBy({ left: -150, behavior: 'smooth' });
  //   }
  // }

  // function scrollRight() {
  //   if (tableContainerElement) {
  //     tableContainerElement.scrollBy({ left: 150, behavior: 'smooth' });
  //   }
  // }
  // ---------

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

</script>

<div class="reviews-container">
  <h1>Surveyor Reviews</h1>

  {#if $selectedProject}
    <div class="reviews-header">
      <h2>Reviews for Instructed Surveyors on {$selectedProject.name}</h2>
      <p>Click 'Edit' to rate surveyors and add notes.</p>
    </div>

    {#if projectQuotes.length > 0}
      <div class="table-scroll-wrapper">
          <div class="reviews-table-container">
            <table class="reviews-table">
              <thead>
                <tr>
                  <th>Contact Name</th>
                  <!-- <th>Email</th> -->
                  <th>Organisation</th>
                  <th>Quality</th>
                  <th>Responsiveness</th>
                  <th>Delivered on Time</th>
                  <th>Overall Review <span class="required-indicator">*</span></th>
                  <th>Notes</th>
                  <th>Actions</th> <!-- New Column for Buttons -->
                </tr>
              </thead>
              <tbody>
                {#each projectQuotes as quote (quote.id)}
                  <!-- Directly access the store and find the feedback reactively -->
                  {@const feedback = $surveyorFeedbacks.find(fb => fb.quoteId === quote.id)}
                  {@const isEditing = editingQuoteId === quote.id}
                  <tr class:is-editing={isEditing}>
                    <td>
                        <!-- {console.log(`[Component] Rendering row for ${quote.id}. IsEditing: ${isEditing}. Feedback:`, feedback)} --> <!-- Keep log commented/removed for now -->
                        {quote.contactName}
                    </td>
                    <!-- <td>{quote.email || 'N/A'}</td> -->
                    <td>{quote.organisation}</td>

                    <!-- Quality -->
                    <td class="rating-cell">
                        {#if isEditing}
                            <StarRating
                                value={editableFeedback?.quality}
                                readonly={!isEditing}
                                on:update={(e) => handleEditableRatingUpdate('quality', e.detail)}
                            />
                        {:else}
                            <StarRating value={feedback?.quality} readonly={true} />
                        {/if}
                    </td>

                    <!-- Responsiveness -->
                    <td class="rating-cell">
                         {#if isEditing}
                            <StarRating
                                value={editableFeedback?.responsiveness}
                                 readonly={!isEditing}
                                on:update={(e) => handleEditableRatingUpdate('responsiveness', e.detail)}
                            />
                        {:else}
                            <StarRating value={feedback?.responsiveness} readonly={true} />
                        {/if}
                    </td>

                     <!-- Delivered on Time -->
                     <td class="rating-cell">
                         {#if isEditing}
                            <StarRating
                                value={editableFeedback?.deliveredOnTime}
                                 readonly={!isEditing}
                                on:update={(e) => handleEditableRatingUpdate('deliveredOnTime', e.detail)}
                            />
                        {:else}
                            <StarRating value={feedback?.deliveredOnTime} readonly={true} />
                        {/if}
                    </td>

                    <!-- Overall Review -->
                    <td class="rating-cell">
                         {#if isEditing}
                            <StarRating
                                value={editableFeedback?.overallReview}
                                readonly={!isEditing}
                                on:update={(e) => handleEditableRatingUpdate('overallReview', e.detail)}
                            />
                        {:else}
                            <StarRating value={feedback?.overallReview} readonly={true} />
                        {/if}
                    </td>

                    <!-- Notes -->
                    <td class="notes-cell">
                        <button class="notes-button" on:click={() => openNotesModal(quote)} title="Edit review notes">
                            {getNotesPreview(feedback?.notes)}
                        </button>
                    </td>

                    <!-- Actions -->
                     <td class="actions-cell">
                        {#if isEditing}
                            <button class="save-btn" on:click={saveChanges} title="Save changes">Save</button>
                            <button class="cancel-btn" on:click={cancelEditing} title="Discard changes">Cancel</button>
                        {:else}
                            <button class="edit-btn" on:click={() => startEditing(quote)} title="Edit review">Edit</button>
                            <button class="delete-btn" on:click={() => handleDeleteReview(quote.id, quote.organisation)} title="Delete review">Delete</button>
                            <!-- Display saved date? -->
                             {#if feedback?.updatedAt}
                                <div class="last-saved" title="Last saved">Saved: {format(parseISO(feedback.updatedAt), 'd MMM yyyy HH:mm')}</div>
                             {/if}
                        {/if}
                     </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
      </div>
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
  /* General page styling (assumed globally applied) */

  .reviews-container {
    padding: 2rem 1rem; /* Match general-info padding */
  }
  
  /* Headings */
  h1 {
    font-size: 1.8rem; 
    font-weight: 600; 
    margin-bottom: 1.5rem;
    color: #1a202c; 
  }
  
  h2 {
    font-size: 1.3rem; 
    font-weight: 500; 
    color: #2d3748; 
    margin: 0; 
  }

  /* Header section */
  .reviews-header {
    margin-bottom: 1.5rem;
  }
  .reviews-header p {
      margin-top: 0.5rem;
      color: #718096; 
      font-size: 0.95rem;
  }
  
  /* Table Styling */
  .reviews-table-container { 
    overflow-x: auto; 
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border: 1px solid #e2e8f0;
    margin-bottom: 2rem; 
  }
  
  .reviews-table { 
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
    white-space: nowrap; 
  }
  
  .reviews-table th,
  .reviews-table td {
    padding: 0.9rem 1.2rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: middle;
    white-space: nowrap; 
  }

  .reviews-table td {
    color: #4a5568; 
  }
  
  .reviews-table th {
    background-color: #f7fafc; 
    font-weight: 600;
    color: #4a5568;
    text-transform: uppercase;
    font-size: 0.8rem;
    letter-spacing: 0.05em;
  }

  .reviews-table tbody tr:last-child td {
    border-bottom: none; 
  }

  .reviews-table tbody tr:hover {
    background-color: #f7fafc; 
  }

  /* Editing Row Highlight */
  tr.is-editing {
      background-color: #ebf8ff; /* Light blue highlight */
  }
  tr.is-editing:hover {
      background-color: #e0f2fe; /* Slightly darker blue on hover */
  }

  /* Required Indicator */
  .required-indicator {
      color: #e53e3e; /* Red */
      font-weight: bold;
      margin-left: 0.25rem;
  }

  /* Rating Cell */
  .rating-cell {
      /* Ensure star rating component fits well */
      min-width: 120px; 
      text-align: center;
  }

  /* Notes Cell Styling */
  .notes-cell {
      min-width: 200px; /* Ensure enough space */
      white-space: normal; /* Allow notes to wrap */
      vertical-align: top; /* Align notes content top */
  }

  /* Notes Button Styling (from instructed page) */
  .notes-button {
    width: 100%;
    max-width: 200px; /* Limit maximum width */
    padding: 10px;
    background-color: #f1f1f1;
    border: 1px solid #ddd;
    border-radius: 4px;
    text-align: left;
    cursor: pointer;
    font-style: italic;
    color: #555;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap; /* Prevent wrapping */
    min-height: 40px; /* Ensure consistent button height */
  }

  .notes-button:hover {
    background-color: #e9ecef;
    border-color: #adb5bd;
  }

  /* Actions Cell Styling */
  .actions-cell {
      text-align: center; /* Center buttons */
      white-space: normal; /* Allow wrapping if needed */
      vertical-align: top; /* Align top */
      min-width: 150px;
  }

  /* Action Buttons (Edit, Delete, Save, Cancel) */
  .actions-cell button {
      display: inline-block;
      padding: 0.4rem 0.8rem;
      margin: 0.2rem;
      font-size: 0.85rem;
      font-weight: 500;
      border-radius: 4px;
      text-decoration: none;
      cursor: pointer;
      transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out, box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out;
      border: 1px solid transparent;
      background: none;
      color: #718096; 
  }
  .actions-cell button:hover {
      background-color: #edf2f7; 
      color: #2d3748; 
  }

  .edit-btn {
      border-color: #a0aec0; /* Subtle border */
  }
  .delete-btn {
      /* Inherit default hover, but make text red */
       color: #e53e3e;
  }
  .delete-btn:hover {
      background-color: #fed7d7; /* Light red */
      color: #c53030; 
  }
  .save-btn {
      background-color: #38a169; /* Green */
      color: white;
      border-color: #38a169;
  }
  .save-btn:hover {
      background-color: #2f855a; 
  }
  .cancel-btn {
      border-color: #a0aec0; /* Similar to edit */
  }

  /* Last Saved Info */
  .last-saved {
      font-size: 0.75rem;
      color: #a0aec0;
      margin-top: 0.5rem;
      text-align: center;
  }

  /* No Quotes Message */
  .no-quotes {
    text-align: center;
    margin: 3rem auto;
    padding: 2.5rem;
    background-color: #ffffff;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    color: #718096;
  }

  /* --- Scroll Buttons CSS (Commented out as HTML was not added) --- */
  /* .table-scroll-wrapper { ... } */ 
  /* .scroll-btn { ... } */
  /* .scroll-btn-left { ... } */
  /* .scroll-btn-right { ... } */
  /* ------------------------------------------- */
</style>