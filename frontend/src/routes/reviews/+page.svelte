<script lang="ts">
  import {
    selectedProject,
    currentProjectQuotes,
    surveyorFeedbacks,      // Use new store
    upsertSurveyorFeedback, // Use new upsert function
    type Quote,
    type SurveyorFeedback   // Use new interface
  } from "$lib/stores/projectStore";
  import StarRating from "$lib/components/StarRating.svelte";
  import { format, parseISO } from 'date-fns';
  // Removed getContext, setContext, writable as they are not directly used here now

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
    {:else}
      <p class="no-data-message">No quotes found for this project yet.</p>
    {/if}

  {:else}
    <p>Please select a project to view reviews.</p>
  {/if}

</div>

<style>
  .reviews-container {
    padding: 25px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    max-width: 1400px;
    margin: 0 auto;
  }

  h1, h2 {
      color: #333;
  }
  .reviews-header {
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
  }
   .reviews-header p {
      font-size: 0.9em;
      color: #666;
  }

  .reviews-table-container {
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    overflow-x: auto;
    border: 1px solid #ddd;
  }

  .reviews-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 900px;
  }

  .reviews-table th,
  .reviews-table td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid #eee;
    font-size: 0.9rem;
    vertical-align: middle;
  }

  .reviews-table th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #495057;
    white-space: nowrap;
    position: sticky;
    top: 0;
    z-index: 1;
  }
  .reviews-table th .required-indicator {
      color: #dc3545;
      font-weight: bold;
      margin-left: 2px;
  }

  .reviews-table tr:last-child td {
      border-bottom: none;
  }

  .reviews-table tr:hover {
      background-color: #f8f9fa;
  }
  .reviews-table tr.is-editing {
      background-color: #fffcee; /* Light yellow background for editing row */
  }

  .rating-cell {
      min-width: 110px;
      text-align: center;
      padding-top: 15px; /* Extra padding for stars */
      padding-bottom: 15px;
  }

  .notes-cell {
      min-width: 250px;
      max-width: 400px; /* Prevent excessive width */
      vertical-align: top;
      white-space: normal;
  }
  .notes-display {
      max-height: 80px; /* Limit display height */
      overflow-y: auto;
      padding: 6px;
      border: 1px solid transparent; /* Match textarea border for alignment */
      line-height: 1.4;
      cursor: default; /* Indicate non-editable */
  }
  .notes-textarea {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #ced4da;
      border-radius: 4px;
      padding: 6px 8px;
      font-family: inherit;
      font-size: inherit;
      resize: vertical;
      min-height: 60px;
      transition: border-color 0.2s ease;
  }
  .notes-textarea:focus {
      border-color: #80bdff;
      outline: 0;
      box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
  }

  .actions-cell {
      text-align: center;
      white-space: nowrap;
      vertical-align: middle;
      min-width: 150px; /* Ensure buttons fit */
  }

  .actions-cell button {
      margin: 0 4px;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.85em;
      border: 1px solid;
      transition: background-color 0.2s ease, border-color 0.2s ease;
  }

  .edit-btn {
      background-color: #ffc107;
      border-color: #e0a800;
      color: #212529;
  }
  .edit-btn:hover {
       background-color: #e0a800;
       border-color: #c69500;
  }

  .save-btn {
      background-color: #198754; /* Updated green */
      border-color: #146c43;
      color: white;
  }
  .save-btn:hover {
      background-color: #146c43;
      border-color: #105635;
  }

  .cancel-btn {
      background-color: #6c757d;
      border-color: #5c636a;
      color: white;
  }
  .cancel-btn:hover {
      background-color: #5c636a;
      border-color: #51585e;
  }

  .last-saved {
      font-size: 0.75em;
      color: #6c757d;
      margin-top: 5px;
      text-align: center;
  }

  .placeholder {
     color: #6c757d;
     font-style: italic;
  }

  .no-data-message, p { /* General message styling */
      padding: 20px;
      text-align: center;
      color: #6c757d;
      font-style: italic;
  }

</style>