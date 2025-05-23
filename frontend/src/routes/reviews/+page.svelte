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

  // Filter for project quotes
  $: projectQuotes = $selectedProject
    ? $currentProjectQuotes // Assumes quotes are loaded when project is selected
    : [];

  // --- State for Edit Mode ---
  let editingQuoteId: string | null = null;
  // Temporary storage for feedback being edited
  let editableFeedback: Partial<SurveyorFeedback> = {};

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
        notes: currentFeedback?.notes || '', // Default notes to empty string
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

    // Prepare data for upsert: only send fields relevant to feedback
    const dataToSend: Partial<Omit<SurveyorFeedback, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'reviewDate'>> & { quoteId: string } = {
        quoteId: quoteIdToSave,
        quality: editableFeedback.quality,
        responsiveness: editableFeedback.responsiveness,
        deliveredOnTime: editableFeedback.deliveredOnTime,
        overallReview: editableFeedback.overallReview, // Already validated above
        notes: editableFeedback.notes
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

  // Notes are handled via direct binding to editableFeedback.notes when editing

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
          <button class="scroll-btn scroll-btn-left" on:click={scrollLeft} aria-label="Scroll table left">←</button>
          <div class="reviews-table-container" bind:this={tableContainerElement}>
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
                        {#if isEditing}
                            <textarea
                                class="notes-textarea"
                                rows="3"
                                bind:value={editableFeedback.notes}
                                placeholder="Enter review notes..."
                                aria-label="Review notes for {quote.organisation}"
                            ></textarea>
                        {:else}
                            <div class="notes-display" title={feedback?.notes || 'No notes added.'}>
                                 {#if feedback?.notes}
                                    <!-- Basic preview, could truncate -->
                                    <span>{feedback.notes.length > 100 ? feedback.notes.substring(0, 97) + '...' : feedback.notes}</span>
                                 {:else}
                                    <span class="placeholder">No notes added.</span>
                                 {/if}
                            </div>
                        {/if}
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
          <button class="scroll-btn scroll-btn-right" on:click={scrollRight} aria-label="Scroll table right">→</button>
      </div>
    {:else}
      <p class="no-data-message">No quotes found for this project yet.</p>
    {/if}

  {:else}
    <p>Please select a project to view reviews.</p>
  {/if}

</div>

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

  .notes-textarea {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #cbd5e0;
      border-radius: 6px;
      font-size: 0.9rem;
      font-family: inherit;
      resize: vertical;
      min-height: 60px;
  }
  .notes-textarea:focus {
      border-color: #4299e1; 
      box-shadow: 0 0 0 1px #4299e1; 
      outline: none;
  }

  .notes-display {
      color: #4a5568;
      font-size: 0.9rem;
      max-height: 100px; /* Limit height */
      overflow-y: auto; /* Add scroll if needed */
      padding: 0.2rem;
  }
  .notes-display .placeholder {
      color: #a0aec0;
      font-style: italic;
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