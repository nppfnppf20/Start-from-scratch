<script lang="ts">
  import {
    selectedProject, 
    currentProjectQuotes, 
    allReviews, 
    addOrUpdateReview, // Use this to update dates
    updateWorkStatus, // Import the new function
    addUploadedWork, // Import the new function for adding work details
    addCustomDateToReview, // Import function for adding custom dates
    updateCustomDateInReview, // Import function for updating custom dates
    deleteCustomDateFromReview, // Import function for deleting custom dates
    type Quote, 
    type SurveyorReview, 
    type WorkStatus, // Import the status type
    type UploadedWork, // Import the UploadedWork type
    type CustomDate // Import the CustomDate type
  } from "$lib/stores/projectStore";
  import NotesModal from "$lib/components/NotesModal.svelte"; // Import the new modal
  import InstructedDocumentUploadModal from "$lib/components/InstructedDocumentUploadModal.svelte"; // Import the document upload modal
  
  // Modal state for Notes
  let showNotesModal = false;
  let currentQuoteForNotes: Quote | null = null;
  let currentNotes: string | undefined = '';

  // Modal state for Document Upload
  let showDocumentUploadModal = false;
  let currentQuoteForUpload: Quote | null = null;

  // Filter for instructed quotes based on selected project
  $: instructedQuotes = $currentProjectQuotes.filter(quote => 
      quote.instructionStatus === 'instructed' || quote.instructionStatus === 'partially instructed'
  );

  // Helper to find review for a quote reactively
  function findReview(quoteId: string): SurveyorReview | undefined {
      return $allReviews.find(r => r.quoteId === quoteId);
  }

  // Function to handle date updates directly from the table
  function handleDateUpdate(quoteId: string, field: 'siteVisitDate' | 'reportDraftDate', value: string) {
    if (!$selectedProject) return;

    const existingReview = findReview(quoteId);

    // Prepare data for the update/add function
    // Ensures we don't overwrite other review fields if they exist
    const reviewData: Omit<SurveyorReview, 'id'> & { id?: string } = {
      projectId: $selectedProject.id,
      quoteId: quoteId,
      // Include existing values or defaults
      quality: existingReview?.quality,
      responsiveness: existingReview?.responsiveness,
      deliveredOnTime: existingReview?.deliveredOnTime,
      overallReview: existingReview?.overallReview || 0, // Default 0 if no review yet
      notes: existingReview?.notes,
      reviewDate: existingReview?.reviewDate || new Date().toISOString().split('T')[0],
      siteVisitDate: existingReview?.siteVisitDate,
      reportDraftDate: existingReview?.reportDraftDate,
      // Add existing ID if updating
      ...(existingReview?.id ? { id: existingReview.id } : {}),
      // Update the specific date field that was changed
      [field]: value 
    };

    addOrUpdateReview(reviewData);
    // Trigger reactivity for the table (though store update should suffice)
    instructedQuotes = [...instructedQuotes]; 
  }
  
  // Function to handle work status change from dropdown
  function handleWorkStatusChange(quoteId: string, newStatus: WorkStatus) {
      if (!$selectedProject) return;
      updateWorkStatus(quoteId, $selectedProject.id, newStatus);
  }
  
  // Work status options for dropdown
  const workStatuses: WorkStatus[] = ['not started', 'in progress', 'completed'];

  // --- Notes Modal Functions ---
  function openNotesModal(quote: Quote, review: SurveyorReview | undefined) {
    currentQuoteForNotes = quote;
    currentNotes = review?.operationalNotes;
    showNotesModal = true;
  }

  function closeNotesModal() {
    showNotesModal = false;
    currentQuoteForNotes = null;
    currentNotes = '';
  }

  function handleSaveNotes(event: CustomEvent<{ notes: string }>) {
    if (!$selectedProject || !currentQuoteForNotes) return;
    
    const newNotes = event.detail.notes;
    const existingReview = findReview(currentQuoteForNotes.id);
    
    const reviewData: Omit<SurveyorReview, 'id'> & { id?: string } = {
      projectId: $selectedProject.id,
      quoteId: currentQuoteForNotes.id,
      quality: existingReview?.quality,
      responsiveness: existingReview?.responsiveness,
      deliveredOnTime: existingReview?.deliveredOnTime,
      overallReview: existingReview?.overallReview ?? 1,
      reviewDate: existingReview?.reviewDate ?? new Date().toISOString().split('T')[0],
      siteVisitDate: existingReview?.siteVisitDate,
      reportDraftDate: existingReview?.reportDraftDate,
      workStatus: existingReview?.workStatus,
      uploadedWorks: existingReview?.uploadedWorks,
      notes: existingReview?.notes,
      operationalNotes: newNotes,
      ...(existingReview?.id ? { id: existingReview.id } : {}),
    };

    addOrUpdateReview(reviewData);
    closeNotesModal();
  }

  // --- Document Upload Modal Functions ---
  function openDocumentUploadModal(quote: Quote) {
    currentQuoteForUpload = quote;
    showDocumentUploadModal = true;
  }

  function closeDocumentUploadModal() {
    showDocumentUploadModal = false;
    currentQuoteForUpload = null;
  }

  function handleDocumentUploadComplete(event: CustomEvent<UploadedWork & { quoteId: string, documentType: string }>) {
    if (!$selectedProject) return;
    console.log('Upload complete details:', event.detail);
    
    // Extract details needed for the store function
    const { quoteId, fileName, title, version, dateUploaded, description, url } = event.detail;
    
    // Prepare the UploadedWork object
    const workDetails: UploadedWork = {
        fileName,
        title,
        version,
        dateUploaded,
        description,
        url // Include the URL
    };

    // Call the store function to add the work details
    addUploadedWork(quoteId, $selectedProject.id, workDetails);

    closeDocumentUploadModal(); // Close modal on successful upload
  }

  // Helper function to get the first line of notes or a placeholder
  function getNotesPreview(notes: string | undefined): string {
    if (!notes || notes.trim() === '') {
      return "Add notes...";
    }
    return notes;
  }

  // --- Custom Date Functions ---
  function handleAddCustomDate(quoteId: string) {
    if (!$selectedProject) return;
    // Add an empty custom date to trigger UI rendering
    addCustomDateToReview(quoteId, $selectedProject.id, { title: '', date: '' });
  }

  function handleCustomDateChange(quoteId: string, customDateId: string, field: 'title' | 'date', value: string) {
    updateCustomDateInReview(quoteId, customDateId, { [field]: value });
  }

  function handleDeleteCustomDate(quoteId: string, customDateId: string) {
    // Optional: Add confirmation dialog here
    deleteCustomDateFromReview(quoteId, customDateId);
  }
</script>

<div class="instructed-container">
  <h1>Instructed Surveyors</h1>
  
  {#if $selectedProject}
    <div class="instructed-header">
      <h2>Surveyors for {$selectedProject.name}</h2>
    </div>
    
    {#if instructedQuotes.length > 0}
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Organisation</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Survey Type</th>
              <th>Quote Amt.</th>
              <th>Work Status</th>
              <th>Dates</th>
              <th>Notes</th>
              <th>Works</th>
            </tr>
          </thead>
          <tbody>
            {#each instructedQuotes as quote (quote.id)}
              {@const review = findReview(quote.id)}
              {@const currentWorkStatus = review?.workStatus || 'not started'}
              <tr class:row-completed={currentWorkStatus === 'completed'}>
                <td>{quote.organisation}</td>
                <td>{quote.contactName}</td>
                <td>
                  {#if quote.email}
                    <a href="mailto:{quote.email}">{quote.email}</a>
                  {:else}
                    N/A
                  {/if}
                </td>
                <td>{quote.surveyType || 'N/A'}</td>
                <td>
                  {#if quote.instructionStatus === 'partially instructed' && quote.partiallyInstructedTotal !== undefined}
                    £{quote.partiallyInstructedTotal.toFixed(2)} (Partial)
                  {:else}
                    £{quote.total.toFixed(2)}
                  {/if}
                </td>
                <td>
                  <div class="status-dropdown-container">
                     <select
                        class="work-status-select {currentWorkStatus.replace(/\s+/g, '-')}"
                        value={currentWorkStatus}
                        on:change={(e) => handleWorkStatusChange(quote.id, e.currentTarget.value as WorkStatus)}
                      >
                        {#each workStatuses as status}
                          <option value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        {/each}
                     </select>
                  </div>
                </td>
                <td>
                  <div class="date-cell-group">
                    <label for="site-visit-{quote.id}" class="date-label standard-date-label">Site Visit</label>
                    <input
                        id="site-visit-{quote.id}"
                        type="date"
                        class="date-input"
                        value={review?.siteVisitDate || ''}
                        on:change={(e) => handleDateUpdate(quote.id, 'siteVisitDate', e.currentTarget.value)}
                    />
                  </div>
                  <div class="date-cell-group">
                    <label for="report-draft-{quote.id}" class="date-label standard-date-label">Draft Report Due</label>
                    <input
                        id="report-draft-{quote.id}"
                        type="date"
                        class="date-input"
                        value={review?.reportDraftDate || ''}
                        on:change={(e) => handleDateUpdate(quote.id, 'reportDraftDate', e.currentTarget.value)}
                    />
                  </div>

                  {#if review?.customDates && review.customDates.length > 0}
                    <hr class="date-divider" />
                    {#each review.customDates as customDate (customDate.id)}
                      <div class="date-cell-group custom-date-group">
                        <div class="custom-date-header">
                           <input
                              type="text"
                              class="custom-date-title-input"
                              placeholder="Date Title"
                              value={customDate.title}
                              on:change={(e) => handleCustomDateChange(quote.id, customDate.id, 'title', e.currentTarget.value)}
                           />
                           <button 
                              class="delete-custom-date-btn" 
                              title="Delete this date"
                              on:click={() => handleDeleteCustomDate(quote.id, customDate.id)}
                           >
                              &times; 
                           </button>
                        </div>
                        <input
                            type="date"
                            class="date-input custom-date-input"
                            value={customDate.date}
                            on:change={(e) => handleCustomDateChange(quote.id, customDate.id, 'date', e.currentTarget.value)}
                        />
                      </div>
                    {/each}
                  {/if}

                  <button 
                    class="action-btn small add-date-btn" 
                    on:click={() => handleAddCustomDate(quote.id)}
                  >
                    + Add Date
                  </button>
                </td>
                <td>
                  <!-- Notes Cell - Clickable area -->
                  <div 
                    class="notes-preview {review?.operationalNotes ? 'has-notes' : 'no-notes'}"
                    on:click={() => openNotesModal(quote, review)}
                    role="button"
                    tabindex="0"
                    title={review?.operationalNotes ? "Click to edit notes" : "Click to add notes"}
                    on:keypress={(e) => { if (e.key === 'Enter') openNotesModal(quote, review); }}
                  >
                    {getNotesPreview(review?.operationalNotes)}
                  </div>
                </td>
                <td>
                  <!-- Works Cell - Display list and upload button -->
                  <div class="works-cell-content">
                    {#if review?.uploadedWorks && review.uploadedWorks.length > 0}
                      <ul class="uploaded-works-list">
                        {#each review.uploadedWorks as work (work.fileName + work.dateUploaded)} 
                          <li>
                            <!-- Display details inline -->
                            <span class="work-title">{work.title || 'No Title'}</span> 
                            <span class="work-version">(v{work.version || 'N/A'})</span> - 
                            <span class="work-date">{work.dateUploaded}</span>
                            {#if work.description}
                              <span class="work-description"> - {work.description}</span>
                            {/if}
                            {#if work.url}
                              <!-- Add View link -->
                              <a href={work.url} target="_blank" rel="noopener noreferrer" class="action-link view-link" title={`View ${work.fileName}`}>
                                View
                              </a>
                              <!-- Add Download link/button -->
                              <a href={work.url} download={work.fileName} class="action-link download-link" title={`Download ${work.fileName}`}>
                                Download
                              </a>
                            {/if}
                          </li>
                        {/each}
                      </ul>
                    {/if}
                    <button 
                      class="action-btn small upload-btn" 
                      title="Upload Completed Work"
                      on:click={() => openDocumentUploadModal(quote)}
                    >
                      📎 Upload New Work
                    </button>
                  </div>
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
    <p>Please select a project to view instructed surveyors.</p>
  {/if}
</div>

<!-- Notes Modal Instance -->
{#if showNotesModal && currentQuoteForNotes}
  <NotesModal 
    initialNotes={currentNotes} 
    organisationName={currentQuoteForNotes.organisation}
    on:save={handleSaveNotes}
    on:cancel={closeNotesModal}
  />
{/if}

<!-- Document Upload Modal Instance -->
{#if showDocumentUploadModal && currentQuoteForUpload}
  <InstructedDocumentUploadModal
    bind:showModal={showDocumentUploadModal}
    title={`Upload Completed Work for ${currentQuoteForUpload.organisation}`}
    quoteId={currentQuoteForUpload.id}
    documentType="instruction"
    on:uploadComplete={handleDocumentUploadComplete}
    on:close={closeDocumentUploadModal}
  />
{/if}

<style>
  .instructed-container {
    padding: 1rem 0;
  }
  
  h1 {
    margin-bottom: 1.5rem;
    color: #333;
  }
  
  .instructed-header {
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
  
  /* Table Styles */
  .table-container {
      overflow-x: auto; /* Add horizontal scroll for smaller screens */
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
    background-color: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    border-radius: 5px;
    overflow: hidden; /* Ensures border-radius applies to table */
  }

  th, td {
    padding: 0.8rem 1rem;
    text-align: left;
    border-bottom: 1px solid #eee;
    font-size: 0.9rem;
    vertical-align: middle; /* Align content vertically */
  }

  th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #495057;
    white-space: nowrap; /* Prevent headers from wrapping */
  }

  tbody tr:hover {
    background-color: #f1f3f5;
  }

  tbody tr.row-completed {
      background-color: #e6f7ec; /* Light green for completed rows */
      border-left: 4px solid #28a745;
  }

  tbody tr.row-completed:hover {
      background-color: #d4edda; /* Slightly darker green on hover */
  }

  td {
    color: #333;
  }

  td a {
    color: #007bff;
    text-decoration: none;
  }

  td a:hover {
    text-decoration: underline;
  }

  /* Input/Select Styling within Table */
  .date-input {
      padding: 0.3rem 0.5rem;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 0.9rem;
      /* width: 120px; /* Let width be more flexible */
      display: block; /* Make input take full width of its container */
      width: 100%;
      box-sizing: border-box; /* Include padding and border in the element's total width and height */
  }

  .date-cell-group {
    margin-bottom: 0.65rem; /* Increased space between date groups */
    position: relative; /* For positioning delete button */
  }
  
  .date-label { /* Combined label styles */
    display: block; /* Make label appear on its own line */
    font-size: 0.8rem; /* Smaller label text */
    margin-bottom: 0.2rem; /* Space between label and input */
    color: #555;
    font-weight: 500;
  }

  .standard-date-label { 
    /* Specific styles for standard labels if needed */
  }

  .date-cell-group:last-of-type { /* Target last group before button */
      margin-bottom: 0.75rem; /* Add margin before the button */
  }

  /* Custom Date Styles */
  .custom-date-group {
    /* Specific styling if needed */
  }

  .custom-date-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.2rem;
  }

  .custom-date-title-input {
      flex-grow: 1;
      border: none;
      border-bottom: 1px dashed #ced4da;
      font-size: 0.8rem;
      padding: 0.1rem 0;
      font-weight: 500;
      color: #555;
      margin-right: 0.5rem;
      background: transparent;
  }
  .custom-date-title-input:focus {
      outline: none;
      border-bottom: 1px solid #007bff;
  }

  .delete-custom-date-btn {
      background: none;
      border: none;
      color: #dc3545;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0 0.2rem;
      line-height: 1;
  }
  .delete-custom-date-btn:hover {
      color: #a71d2a;
  }

  .custom-date-input {
    /* Specific styles for custom date inputs if needed */
  }

  .date-divider {
      border: none;
      border-top: 1px solid #eee;
      margin: 0.75rem 0; /* Space around the divider */
  }

  .add-date-btn {
      margin-top: 0.5rem; /* Space above the button */
      width: 100%; /* Make button fill width */
      background-color: #e9ecef;
      color: #495057;
      border: 1px solid #ced4da;
  }
  .add-date-btn:hover {
      background-color: #dee2e6;
  }

  .status-dropdown-container {
    /* Container doesn't need special styling now */
  }

  .work-status-select {
      /* Appearance reset */
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      /* Pill styling */
      display: inline-block;
      padding: 0.3rem 1.5rem 0.3rem 0.8rem; /* Extra padding right for arrow space */
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: capitalize;
      border: none;
      cursor: pointer;
      line-height: 1.2;
      /* Default state */
      background-color: #6c757d; /* Default grey */
      color: white;
      min-width: 110px; /* Ensure minimum width */
      text-align: center;
      background-image: url('data:image/svg+xml;utf8,<svg fill="white" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>');
      background-repeat: no-repeat;
      background-position: right 0.3rem center;
      background-size: 1.1em;
  }

  /* Color overrides based on status */
  .work-status-select.not-started {
      background-color: #6c757d; /* Grey */
  }
  .work-status-select.in-progress {
      background-color: #007bff; /* Blue */
  }
  .work-status-select.completed {
      background-color: #28a745; /* Green */
  }

  .work-status-select:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.5);
  }

  /* Action Buttons in Table */
  .action-buttons {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-start; /* Align buttons left in the cell */
  }

  .action-btn {
    padding: 0.4rem 0.75rem;
    border: none;
    border-radius: 4px;
    background-color: #6c757d;
    color: white;
    cursor: pointer;
    font-size: 0.875rem;
    white-space: nowrap; /* Prevent button text wrapping */
  }

  .action-btn.small {
      font-size: 0.8rem;
      padding: 0.3rem 0.6rem;
  }

  .action-btn:hover {
    background-color: #5a6268;
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

  /* Remove old card styles */
  .survey-cards, .surveyor-card, .card-header, .card-content, .card-footer, .surveyor-detail, .icon, .divider, .dates-section, .date-input-group {
      /* These styles are no longer needed */
      display: none; /* Or simply remove these rules */
  }

  /* Notes Cell Styling */
  .notes-preview {
    cursor: pointer;
    padding: 0.4rem 0.6rem;
    border-radius: 4px;
    transition: background-color 0.2s;
    display: inline-block; /* Or block, depending on desired layout */
    max-width: 250px; /* Adjust width as needed */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle; /* Align with other cell content */
    line-height: 1.4; /* Adjust for better vertical alignment if needed */
  }

  .notes-preview.no-notes {
    color: #6c757d;
    font-style: italic;
  }

  .notes-preview.has-notes {
     background-color: #e9ecef; /* Subtle background for cells with notes */
     border: 1px solid #ced4da;
  }

  .notes-preview:hover,
  .notes-preview:focus {
      background-color: #ced4da; /* Darker hover */
      outline: none;
  }

  .submit-btn:hover:not(:disabled) {
    background-color: #0069d9;
  }

  .error-message {
      color: #dc3545;
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      padding: 0.75rem 1.25rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      font-size: 0.9rem;
  }

  /* Styles for Works column */
  .works-cell-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .uploaded-works-list {
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 150px; /* Limit height and make scrollable if needed */
    overflow-y: auto;
    font-size: 0.85rem;
  }

  .uploaded-works-list li {
    padding: 0.3rem 0; /* Reduced padding */
    border-bottom: 1px solid #f1f1f1;
    white-space: nowrap; /* Prevent wrapping within the list item */
    overflow: hidden; /* Hide overflow within the list item itself */
    text-overflow: ellipsis; /* Show ellipsis if content still overflows li */
  }

  .uploaded-works-list li:last-child {
    border-bottom: none;
  }

  /* Remove block display and adjust styles for inline elements */
  .uploaded-works-list strong, /* Target old strong if still present */
  .uploaded-works-list .work-title,
  .uploaded-works-list .work-version,
  .uploaded-works-list .work-date,
  .uploaded-works-list .work-description,
  .uploaded-works-list .work-filename { 
    display: inline; /* Ensure elements are inline */
    margin: 0 0.2em; /* Small horizontal spacing */
    padding: 0;
    color: #333; /* Consistent color */
  }

  .uploaded-works-list .work-title {
      font-weight: 600; /* Make title bold */
  }

  /* Make description slightly less prominent */
  .uploaded-works-list .work-description {
    font-size: 0.8rem;
    color: #666;
    margin-top: 0; /* Reset margin */
    margin-bottom: 0;
    white-space: nowrap; /* Explicitly keep description on same line */
    margin-right: 0.5em; /* Add space before the View link */
  }

  .uploaded-works-list .work-filename {
    display: inline;
    margin: 0 0.2em;
    padding: 0;
    color: #666;
  }

  .upload-btn {
      align-self: flex-start; /* Align button to the start */
      background-color: #6c757d; /* Consistent button style */
  }

  .upload-btn:hover {
      background-color: #5a6268;
  }

  /* Style for the View/Download links */
  .action-link {
      font-size: 0.8rem;
      margin-left: 0.5em;
      padding: 0.1rem 0.4rem;
      border-radius: 3px;
      text-decoration: none;
      border: 1px solid #ced4da;
      display: inline-block; /* Ensure links behave consistently */
  }
  
  .view-link,
  .download-link {
      background-color: #e9ecef;
      color: #007bff;
      border-color: #ced4da; /* Explicitly set border color */
  }
  
  .action-link:hover {
      text-decoration: none;
      opacity: 0.9;
  }
  
  .view-link:hover,
  .download-link:hover {
      background-color: #dee2e6;
      border-color: #adb5bd;
      /* Ensure hover color is consistent if needed, though default is fine */
      /* color: #0056b3; */ 
  }
  
  /* Remove specific download-link hover styles */
  /*
  .download-link:hover {
      background-color: #c3e6cb;
      border-color: #b1dfbb;
  }
  */

</style> 