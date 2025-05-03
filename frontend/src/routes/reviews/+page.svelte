<script lang="ts">
  import {
    selectedProject, 
    allQuotes, 
    allReviews, 
    addOrUpdateReview,
    type Quote, 
    type SurveyorReview 
  } from "$lib/stores/projectStore";
  import StarRating from "$lib/components/StarRating.svelte";
  import { getContext, setContext } from 'svelte';
  import { writable, type Writable } from 'svelte/store';
  
  // Filter for instructed quotes based on selected project
  $: instructedQuotes = $selectedProject 
    ? $allQuotes.filter(quote => 
        quote.projectId === $selectedProject.id && 
        (quote.instructionStatus === 'instructed' || quote.instructionStatus === 'partially instructed')
      ) 
    : [];

  // Modal state for Notes
  let showNotesModal = false;
  let currentQuoteForNotes: Quote | null = null;
  let currentNotes: string | undefined = '';
  let currentReviewId: string | undefined = undefined;

  // Function to handle star rating updates directly from the table
  function handleRatingUpdate(quoteId: string, field: keyof SurveyorReview, value: number) {
    if (!$selectedProject) return;

    const existingReview = $allReviews.find(r => r.quoteId === quoteId);

    const reviewData: Omit<SurveyorReview, 'id'> & { id?: string } = {
      projectId: $selectedProject.id,
      quoteId: quoteId,
      // Include existing values or defaults
      quality: existingReview?.quality,
      responsiveness: existingReview?.responsiveness,
      deliveredOnTime: existingReview?.deliveredOnTime,
      overallReview: existingReview?.overallReview || 1, // Default to 1 if no review exists yet
      notes: existingReview?.notes,
      reviewDate: existingReview?.reviewDate || new Date().toISOString().split('T')[0],
      // Add existing ID if updating
      ...(existingReview?.id ? { id: existingReview.id } : {}),
      // Update the specific field that was changed
      [field]: value 
    };

    addOrUpdateReview(reviewData);
  }

  // Functions for Notes Modal
  function openNotesModal(quote: Quote) {
    currentQuoteForNotes = quote;
    const existingReview = $allReviews.find(r => r.quoteId === quote.id);
    currentNotes = existingReview?.notes || '';
    currentReviewId = existingReview?.id;
    showNotesModal = true;
  }

  function closeNotesModal() {
    showNotesModal = false;
    currentQuoteForNotes = null;
    currentNotes = '';
    currentReviewId = undefined;
  }

  function submitNotes() {
    if (!currentQuoteForNotes || !$selectedProject) return;

    // Use the same addOrUpdateReview, ensuring we have necessary fields
    const existingReview = $allReviews.find(r => r.quoteId === currentQuoteForNotes!.id);
    
    const reviewData: Omit<SurveyorReview, 'id'> & { id?: string } = {
      projectId: $selectedProject.id,
      quoteId: currentQuoteForNotes.id,
      // Keep existing ratings or provide defaults if creating new
      quality: existingReview?.quality,
      responsiveness: existingReview?.responsiveness,
      deliveredOnTime: existingReview?.deliveredOnTime,
      overallReview: existingReview?.overallReview || 1, // Need a default overall if creating via notes
      notes: currentNotes, // Update notes
      reviewDate: existingReview?.reviewDate || new Date().toISOString().split('T')[0],
      ...(currentReviewId ? { id: currentReviewId } : {})
    };

    addOrUpdateReview(reviewData);
    closeNotesModal();
  }
  
  // Helper to find review for a quote reactively
  function findReview(quoteId: string): SurveyorReview | undefined {
      return $allReviews.find(r => r.quoteId === quoteId);
  }
</script>

<div class="reviews-container">
  <h1>Surveyor Reviews</h1>
  
  {#if $selectedProject}
    <div class="reviews-header">
      <h2>Reviews for Instructed Surveyors on {$selectedProject.name}</h2>
    </div>
    
    {#if instructedQuotes.length > 0}
      <div class="reviews-table-container">
        <table class="reviews-table">
          <thead>
            <tr>
              <th>Contact Name</th>
              <th>Email</th>
              <th>Organisation</th>
              <th>Quality</th>
              <th>Responsiveness</th>
              <th>Delivered on Time</th>
              <th>Overall Review</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {#each instructedQuotes as quote (quote.id)}
              {@const review = findReview(quote.id)}
              <tr>
                <td>{quote.contactName}</td>
                <td>{quote.email || 'N/A'}</td>
                <td>{quote.organisation}</td>
                <td class="rating-cell">
                    <StarRating 
                        value={review?.quality} 
                        on:update={(e) => handleRatingUpdate(quote.id, 'quality', e.detail)} 
                    />
                </td>
                <td class="rating-cell">
                    <StarRating 
                        value={review?.responsiveness} 
                        on:update={(e) => handleRatingUpdate(quote.id, 'responsiveness', e.detail)} 
                    />
                </td>
                 <td class="rating-cell">
                    <StarRating 
                        value={review?.deliveredOnTime} 
                        on:update={(e) => handleRatingUpdate(quote.id, 'deliveredOnTime', e.detail)} 
                    />
                </td>
                <td class="rating-cell">
                    <StarRating 
                        value={review?.overallReview} 
                        on:update={(e) => handleRatingUpdate(quote.id, 'overallReview', e.detail)} 
                    />
                </td>
                <td 
                  class="notes-cell clickable-notes {review?.notes ? 'has-notes' : 'no-notes'}" 
                  on:click={() => openNotesModal(quote)} 
                  title={review?.notes ? "Click to edit notes" : "Click to add notes"}
                  role="button"
                  tabindex="0"
                  on:keypress={(e) => { if (e.key === 'Enter' || e.key === ' ') openNotesModal(quote); }}
                >
                  {#if review?.notes}
                    <span>{review.notes}</span>
                  {:else}
                    <span class="placeholder">Add notes...</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <p class="no-data-message">No surveyors have been marked as instructed for this project yet.</p>
    {/if}
    
  {:else}
    <p>Please select a project to view reviews.</p>
  {/if}

  <!-- Notes Modal -->
  {#if showNotesModal && currentQuoteForNotes}
    <div class="modal-overlay" on:click|self={closeNotesModal}> 
      <div class="modal-content notes-modal-content">
        <div class="modal-header">
          <h2>Notes for {currentQuoteForNotes.organisation}</h2>
          <button class="close-btn" on:click={closeNotesModal}>×</button>
        </div>
        <div class="modal-body">
          <div class="form-group notes-group">
            <label for="notes">Notes</label>
            <textarea id="notes" rows="6" bind:value={currentNotes} placeholder="Enter review notes here..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" on:click={closeNotesModal}>Cancel</button>
          <button class="submit-btn" on:click={submitNotes}>Save Notes</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .reviews-container {
    padding: 1rem 0;
  }
  
  h1 {
    margin-bottom: 1.5rem;
    color: #333;
  }
  
  .reviews-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  h2 {
    font-size: 1.5rem;
    color: #555;
    margin: 0;
  }

  .reviews-table-container {
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    overflow-x: auto;
  }
  
  .reviews-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 900px;
  }
  
  .reviews-table th,
  .reviews-table td {
    padding: 0.8rem 1rem;
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
  }
  
  .reviews-table tr:last-child td {
    border-bottom: none;
  }
  
  .reviews-table tr:hover {
    background-color: #f8f9fa;
  }
  
  .reviews-table td.rating-cell {
      padding-top: 0.7rem;
      padding-bottom: 0.7rem;
  }
  
  .star-rating {
    color: #ffc107;
    letter-spacing: 0.1rem;
    font-size: 1.1rem;
  }
  
  .comment-cell {
    max-width: 300px; 
    white-space: normal;
  }
  
  .notes-cell {
    max-width: 300px; 
    white-space: normal;
  }
  
  .action-cell {
    
  }
  
  .action-btn {
    
  }
  
  .notes-btn {
    
  }
  
  .notes-btn:hover {
    
  }

  .no-data-message {
    text-align: center;
    padding: 2rem;
    color: #6c757d;
    background-color: #f8f9fa;
    border: 1px dashed #ced4da;
    border-radius: 5px;
    margin-top: 1rem;
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background-color: white;
    border-radius: 5px;
    width: 90%;
    max-width: 600px; 
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  }
  
  /* Specific smaller width for notes modal */
  .notes-modal-content {
      max-width: 500px; 
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e9ecef;
  }
  
  .modal-header h2 {
    font-size: 1.3rem; 
    margin: 0;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6c757d;
  }
  
  .modal-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem; 
  }
  
  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e9ecef;
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  label {
    font-weight: 500;
    color: #555;
  }
  
  textarea {
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 1rem;
    width: 100%; 
  }
  
  textarea:focus {
     outline: none;
     border-color: #80bdff;
     box-shadow: 0 0 0 0.1rem rgba(0, 123, 255, 0.25);
  }
  
  textarea {
    resize: vertical;
  }

  .cancel-btn {
    padding: 0.6rem 1.5rem;
    border: 1px solid #ced4da;
    background-color: white;
    border-radius: 4px;
    color: #495057;
    cursor: pointer;
    font-size: 1rem;
  }
  
  .submit-btn {
    padding: 0.6rem 1.5rem;
    border: none;
    background-color: #007bff;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
  }
  
  .cancel-btn:hover {
    background-color: #f8f9fa;
  }
  
  .submit-btn:hover {
    background-color: #0069d9;
  }

  .notes-cell span {
    display: block;
    max-width: 250px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0.2rem 0;
    min-height: 1.4em;
  }

  .notes-cell span.placeholder {
    color: #6c757d;
    font-style: italic;
  }

  /* Styling for the clickable notes cell */
  .clickable-notes {
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
  }

  .clickable-notes:hover {
    background-color: #f0f0f0;
  }

  .clickable-notes:focus {
      outline: 2px solid #007bff;
      outline-offset: -1px;
      background-color: #e7f3ff;
  }
</style> 