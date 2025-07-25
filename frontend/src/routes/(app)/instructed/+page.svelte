<script lang="ts">
  import {
    selectedProject, 
    currentProjectQuotes,
    currentInstructionLogs, // Use the new store
    upsertInstructionLog, // Use the new upsert function
    type Quote, 
    type InstructionLog, // Import the new interface
    type WorkStatus,
    type UploadedWork,
    type CustomDate
  } from "$lib/stores/projectStore";
  import NotesModal from "$lib/components/NotesModal.svelte";
  import InstructedDocumentUploadModal from "$lib/components/InstructedDocumentUploadModal.svelte";
  import { browser } from '$app/environment'; // Ensure browser check is available
  
  // --- New: Reference to the scrollable table container ---
  let tableContainerElement: HTMLDivElement; // UNCOMMENTED

  // --- New: Scroll functions ---
  function scrollLeft() { // UNCOMMENTED
    if (tableContainerElement) {
      tableContainerElement.scrollBy({ left: -150, behavior: 'smooth' });
    }
  }

  function scrollRight() { // UNCOMMENTED
    if (tableContainerElement) {
      tableContainerElement.scrollBy({ left: 150, behavior: 'smooth' });
    }
  }
  // ---------

  // Modal state for Notes
  let showNotesModal = false;
  let currentQuoteForNotes: Quote | null = null;
  let currentOperationalNotes: string | undefined = ''; // Renamed for clarity

  // Modal state for Hold Ups Notes
  let showHoldUpNotesModal = false;
  let currentQuoteForHoldUpNotes: Quote | null = null;
  let currentHoldUpNotes: string | undefined = '';

  // Modal state for Document Upload
  let showDocumentUploadModal = false;
  let currentQuoteForUpload: Quote | null = null;

  // Filter for instructed quotes based on selected project
  $: instructedQuotes = $currentProjectQuotes.filter(quote =>
      quote.instructionStatus === 'instructed' || quote.instructionStatus === 'partially instructed'
  );

  // Helper to find instruction log for a quote reactively
  function findLog(quoteId: string): InstructionLog | undefined {
      // Ensure store is accessed reactively
      const logs = $currentInstructionLogs;
      return logs.find(log => log.quoteId === quoteId);
  }

  // --- Event Handlers ---

  // Function to handle date updates directly from the table
  async function handleDateUpdate(quoteId: string, field: 'siteVisitDate' | 'reportDraftDate', value: string) {
    if (!$selectedProject || !browser) return; // Added browser check

    const updateData: Partial<Omit<InstructionLog, 'id' | 'quoteId' | 'projectId'>> = {
      [field]: value || undefined // Send undefined if value is empty to potentially clear the date
    };

    console.log(`Updating date for quote ${quoteId}:`, updateData);
    await upsertInstructionLog(quoteId, updateData);
    // Store update will trigger reactivity automatically
  }
  
  // Function to handle work status change from dropdown
  async function handleWorkStatusChange(quoteId: string, newStatus: WorkStatus) {
      if (!$selectedProject || !browser) return;
      console.log(`Updating work status for quote ${quoteId} to ${newStatus}`);
      await upsertInstructionLog(quoteId, { workStatus: newStatus });
  }
  
  // Work status options for dropdown
  const workStatuses: WorkStatus[] = ['not started', 'in progress', 'completed', 'TRP Reviewing', 'Client reviewing'];

  // --- Notes Modal Functions ---
  function openNotesModal(quote: Quote) {
    const log = findLog(quote.id);
    currentQuoteForNotes = quote;
    currentOperationalNotes = log?.operationalNotes; // Use log's operationalNotes
    showNotesModal = true;
  }

  function closeNotesModal() {
    showNotesModal = false;
    currentQuoteForNotes = null;
    currentOperationalNotes = '';
  }

  async function handleSaveNotes(event: CustomEvent<{ notes: string }>) {
    if (!$selectedProject || !currentQuoteForNotes || !browser) return;
    
    const newNotes = event.detail.notes;
    console.log(`Saving notes for quote ${currentQuoteForNotes.id}`);
    await upsertInstructionLog(currentQuoteForNotes.id, { operationalNotes: newNotes });
    closeNotesModal();
  }

  // --- Hold Up Notes Modal Functions ---
  function openHoldUpNotesModal(quote: Quote) {
    const log = findLog(quote.id);
    currentQuoteForHoldUpNotes = quote;
    currentHoldUpNotes = log?.holdUpNotes;
    showHoldUpNotesModal = true;
  }

  function closeHoldUpNotesModal() {
    showHoldUpNotesModal = false;
    currentQuoteForHoldUpNotes = null;
    currentHoldUpNotes = '';
  }

  async function handleSaveHoldUpNotes(event: CustomEvent<{ notes: string }>) {
    if (!$selectedProject || !currentQuoteForHoldUpNotes || !browser) return;
    
    const newNotes = event.detail.notes;
    console.log(`Saving hold up notes for quote ${currentQuoteForHoldUpNotes.id}`);
    await upsertInstructionLog(currentQuoteForHoldUpNotes.id, { holdUpNotes: newNotes });
    closeHoldUpNotesModal();
  }

  // --- Document Upload Modal Functions ---
  function openDocumentUploadModal(quote: Quote) {
    console.log("openDocumentUploadModal called for quote:", quote.id);
    currentQuoteForUpload = quote;
    showDocumentUploadModal = true;
    console.log("currentQuoteForUpload set:", currentQuoteForUpload);
    console.log("showDocumentUploadModal set to:", showDocumentUploadModal);
  }

  function closeDocumentUploadModal() {
    showDocumentUploadModal = false;
    currentQuoteForUpload = null;
  }

  async function handleDocumentUploadComplete(event: CustomEvent<UploadedWork>) {
    // Note: The event detail from InstructedDocumentUploadModal might need adjustment
    // Assuming it just sends the UploadedWork object and we use currentQuoteForUpload
    if (!$selectedProject || !currentQuoteForUpload || !browser) return;

    const workDetails = event.detail; // The new UploadedWork object
    const quoteId = currentQuoteForUpload.id;

    console.log(`Adding uploaded work for quote ${quoteId}:`, workDetails);

    // Find the existing log
    const existingLog = findLog(quoteId);
    const existingWorks = existingLog?.uploadedWorks || [];

    // Add the new work item
    // Consider adding logic here to prevent duplicates or update existing ones if needed
    const updatedWorksArray = [...existingWorks, workDetails];

    // Call the store function to update the log
    await upsertInstructionLog(quoteId, { uploadedWorks: updatedWorksArray });

    closeDocumentUploadModal(); // Close modal on successful upload
  }

  // Helper function to get notes preview
  function getNotesPreview(notes: string | undefined): string {
    if (!notes || notes.trim() === '') {
      return "Add notes...";
    }
    // Simple preview for now, can be enhanced
    const firstLine = notes.split('\n')[0];
    return firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine; // Truncate long lines
  }

  // --- Custom Date Functions ---
  async function handleAddCustomDate(quoteId: string) {
    if (!$selectedProject || !browser) return;
    console.log(`Adding custom date for quote ${quoteId}`);

    const existingLog = findLog(quoteId);
    const existingDates = existingLog?.customDates || [];

    // Create a new date entry
    // The backend assigns the final ID (_id), we use a temporary one for the key
    const newDateEntry: CustomDate = {
        id: `temp-${Date.now()}`, // Temporary ID for reactivity key
        title: 'New Date',
        date: new Date().toISOString().split('T')[0] // Default to today
    };

    const updatedDatesArray = [...existingDates, newDateEntry];

    await upsertInstructionLog(quoteId, { customDates: updatedDatesArray });
  }

 async function handleCustomDateChange(quoteId: string, customDateId: string, field: 'title' | 'date', value: string) {
    if (!browser) return;

    const existingLog = findLog(quoteId);
    if (!existingLog || !existingLog.customDates) return;

    console.log(`Changing custom date ${customDateId} field ${field} for quote ${quoteId}`);

    const updatedDatesArray = existingLog.customDates.map(date => {
        // Match using the ID (could be temp ID or backend ID)
        if (date.id === customDateId) {
            return { ...date, [field]: value };
        }
        return date;
    });

    // Debounce this potentially? For now, update on every change.
    await upsertInstructionLog(quoteId, { customDates: updatedDatesArray });
}

  async function handleDeleteCustomDate(quoteId: string, customDateId: string) {
    console.log('X button clicked! Attempting to delete custom date:', { quoteId, customDateId });
    
    if (!browser) {
      console.log('Browser check failed');
      return;
    }

    const existingLog = findLog(quoteId);
    if (!existingLog || !existingLog.customDates) {
      console.log('No log or custom dates found');
      return;
    }

    console.log(`Deleting custom date ${customDateId} for quote ${quoteId}`);

    try {
    const updatedDatesArray = existingLog.customDates.filter(date => date.id !== customDateId);
    await upsertInstructionLog(quoteId, { customDates: updatedDatesArray });
      console.log(`Successfully deleted custom date ${customDateId}`);
    } catch (error) {
      console.error(`Error deleting custom date ${customDateId}:`, error);
    }
  }

  // Helper to safely format date strings (YYYY-MM-DD)
  function formatDateForInput(dateString: string | undefined | null): string {
      if (!dateString) return '';
      try {
          // Handles both 'YYYY-MM-DD' and ISO strings like '2023-10-27T00:00:00.000Z'
          return dateString.split('T')[0];
      } catch (e) {
          console.error("Error formatting date:", dateString, e);
          return ''; // Return empty string on error
      }
  }

  // Reactive logging (add this within the <script> tag but outside any function)
  $: console.log("Checking modal condition:", { show: showDocumentUploadModal, quote: !!currentQuoteForUpload });
</script>

<div class="instructed-container">
  <h1>Instructed Surveyors</h1>
  
  {#if $selectedProject}
    <div class="instructed-header">
      <h2>Surveyors for {$selectedProject.name}</h2>
      <p>Tracking operational progress for instructed quotes.</p>
    </div>
    
    {#if instructedQuotes.length > 0}
      <div class="table-scroll-wrapper">
          <button class="scroll-btn scroll-btn-left" on:click={scrollLeft} aria-label="Scroll table left">←</button>
          <div class="table-container" bind:this={tableContainerElement}>
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
              <th>Hold Ups</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {#each instructedQuotes as quote (quote.id)}
              {@const log = findLog(quote.id)} 
              {@const currentWorkStatus = log?.workStatus || 'not started'}
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
                        class="work-status-dropdown {currentWorkStatus.toLowerCase().replace(/\s+/g, '-')}"
                        value={currentWorkStatus}
                        on:change={(e) => handleWorkStatusChange(quote.id, e.currentTarget.value as WorkStatus)}
                        title="Set work status"
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
                        value={formatDateForInput(log?.siteVisitDate)}
                        on:change={(e: Event & { currentTarget: HTMLInputElement }) => handleDateUpdate(quote.id, 'siteVisitDate', e.currentTarget.value)}
                        title="Set site visit date"
                    />
                  </div>
                  <div class="date-cell-group">
                    <label for="report-draft-{quote.id}" class="date-label standard-date-label">Draft Report Expected</label>
                    <input
                        id="report-draft-{quote.id}"
                        type="date"
                        class="date-input"
                        value={formatDateForInput(log?.reportDraftDate)}
                        on:change={(e: Event & { currentTarget: HTMLInputElement }) => handleDateUpdate(quote.id, 'reportDraftDate', e.currentTarget.value)}
                        title="Set report draft date"
                    />
                  </div>
                  <!-- Show new custom date inputs when adding -->
                  {#if log?.customDates && log.customDates.length > 0}
                    {#each log.customDates as customDate (customDate.id)}
                                             <div class="date-cell-group custom-date-group">
                         <div class="custom-date-title-row">
                           <input
                             type="text"
                             placeholder="Date Title"
                             class="custom-date-title-input"
                             value={customDate.title}
                             on:change={(e) => handleCustomDateChange(quote.id, customDate.id, 'title', e.currentTarget.value)}
                             title="Edit custom date title"
                           />
                         </div>
                         <div class="custom-date-input-row">
                           <input
                             type="date"
                             class="date-input"
                             value={formatDateForInput(customDate.date)}
                             on:change={(e) => handleCustomDateChange(quote.id, customDate.id, 'date', e.currentTarget.value)}
                             title="Edit custom date"
                           />
                           <button
                             class="delete-custom-date-button"
                             title="Delete custom date"
                             on:click={() => handleDeleteCustomDate(quote.id, customDate.id)}
                           >
                             &times;
                           </button>
                         </div>
                       </div>
                    {/each}
                  {/if}
                  
                  <button 
                      class="add-custom-date-button"
                      on:click={() => handleAddCustomDate(quote.id)}
                      title="Add a new custom date entry"
                   >
                     + Add Date
                  </button>
                </td>
                <td>
                  <button class="notes-button" on:click={() => openHoldUpNotesModal(quote)} title="Edit hold up notes">
                    {getNotesPreview(log?.holdUpNotes)}
                  </button>
                </td>
                <td>
                   <button class="notes-button" on:click={() => openNotesModal(quote)} title="Edit operational notes">
                        {getNotesPreview(log?.operationalNotes)}
                   </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
          </div>
          <button class="scroll-btn scroll-btn-right" on:click={scrollRight} aria-label="Scroll table right">→</button>
      </div>
    {:else}
      <p>No instructed surveyors found for this project.</p>
    {/if}
  {:else}
    <p class="loading-info">Loading project details...</p>
    <!-- Could add a loading spinner here -->
  {/if}
</div>

<!-- Modals -->
{#if showNotesModal && currentQuoteForNotes}
  <NotesModal
    initialNotes={currentOperationalNotes}
    organisationName={currentQuoteForNotes.organisation}
    on:save={handleSaveNotes}
    on:cancel={closeNotesModal}
  />
{/if}

{#if showHoldUpNotesModal && currentQuoteForHoldUpNotes}
  <NotesModal
    initialNotes={currentHoldUpNotes}
    organisationName={currentQuoteForHoldUpNotes.organisation}
    on:save={handleSaveHoldUpNotes}
    on:cancel={closeHoldUpNotesModal}
  />
{/if}

<!-- Add log before the check -->
{console.log("Rendering check for Document Upload Modal:", showDocumentUploadModal, currentQuoteForUpload)} 
{#if showDocumentUploadModal && currentQuoteForUpload}
  {@const logForModal = findLog(currentQuoteForUpload.id)}
  <InstructedDocumentUploadModal
    bind:showModal={showDocumentUploadModal}
    quoteId={currentQuoteForUpload.id}
     documentType='instruction'
    on:uploadComplete={handleDocumentUploadComplete}
    on:close={closeDocumentUploadModal}
     on:deleteFile={(event: CustomEvent<any>) => { /* TODO: Implement delete file logic */ console.warn('Delete file event received, implementation needed', event.detail); }}
  />
{/if}


<style>
  /* CSS Variables for status colors */
  :root {
    --status-not-started-bg: #fff5f5;
    --status-not-started-color: #c53030;
    --status-in-progress-bg: #fff3cd;
    --status-in-progress-color: #856404;
    --status-completed-bg: #d4edda;
    --status-completed-color: #155724;
    --status-trp-reviewing-bg: #cce5ff;
    --status-trp-reviewing-color: #004085;
    --status-client-reviewing-bg: #e2d9f3;
    --status-client-reviewing-color: #493267;
  }

  /* General page styling (assumed globally applied) */

  .instructed-container {
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
  .instructed-header {
    margin-bottom: 1.5rem;
    /* Removed flex as it only contained h2 and p */
}
.instructed-header p {
      margin-top: 0.5rem;
      color: #718096; /* Softer text for description */
      font-size: 0.95rem;
  }
  
  /* Table Styling */
  .table-container { /* Renamed from quotes-table-container */
    overflow-x: auto; 
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border: 1px solid #e2e8f0;
    margin-bottom: 2rem; 
  }
  
  .table-container table { /* Target table within container */
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem; /* MATCHING QUOTES */
    white-space: nowrap; 
  }
  
  .table-container th,
  .table-container td {
    padding: 0.9rem 1.2rem; /* MATCHING QUOTES */
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: middle;
    white-space: nowrap; 
  }

  .table-container td {
    color: #4a5568; 
  }
  
  .table-container th {
    background-color: #f7fafc; 
    font-weight: 600;
    color: #4a5568;
    text-transform: uppercase;
    font-size: 0.8rem; /* MATCHING QUOTES */
    letter-spacing: 0.05em;
  }

  .table-container tbody tr:last-child td {
    border-bottom: none; 
  }

  .table-container tbody tr:hover {
    background-color: #f7fafc; 
  }

  /* Completed Row Styling */
.row-completed {
    background-color: #f0fff4; /* Light green background */
  }
  .row-completed td {
    color: #38a169; /* Darker green text */
}
.row-completed:hover {
      background-color: #e6fffa; /* Slightly different green on hover */
  }

  /* Email Link */
  td a[href^="mailto:"] {
      color: #3182ce;
    text-decoration: none;
      transition: color 0.2s ease-in-out;
  }
  td a[href^="mailto:"]:hover {
      color: #2b6cb0;
    text-decoration: underline;
  }

  /* Work Status Select Styling */
  .status-dropdown-container {
      /* Optional: Add specific container styles if needed */
  }

  .work-status-dropdown {
    padding: 8px 12px;
    border: 1px solid #cbd5e0;
    border-radius: 15px; /* Pill shape */
    font-size: 0.85rem; /* MATCHING QUOTES (like instruction-status-select) */
    background-color: #fff;
    cursor: pointer;
    transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out, background-color 0.2s ease-in-out;
    min-width: 120px; 
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23718096'%3E%3Cpath fill-rule='evenodd' d='M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06z'/%3E%3C/svg%3E"); 
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 1em 1em;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  .work-status-dropdown:focus {
      border-color: #4299e1; 
      box-shadow: 0 0 0 1px #4299e1; 
      outline: none;
  }

  /* Status-specific Select Styling */
  .work-status-dropdown.not-started {
    background-color: var(--status-not-started-bg);
    color: var(--status-not-started-color);
    border-color: var(--status-not-started-bg);
  }
  .work-status-dropdown.in-progress {
    background-color: var(--status-in-progress-bg);
    color: var(--status-in-progress-color);
    border-color: var(--status-in-progress-bg);
  }
  .work-status-dropdown.completed {
    background-color: var(--status-completed-bg);
    color: var(--status-completed-color);
    border-color: var(--status-completed-bg);
  }
.work-status-dropdown.trp-reviewing {
  background-color: var(--status-trp-reviewing-bg);
  color: var(--status-trp-reviewing-color);
  border-color: var(--status-trp-reviewing-bg);
}
.work-status-dropdown.client-reviewing {
  background-color: var(--status-client-reviewing-bg);
  color: var(--status-client-reviewing-color);
  border-color: var(--status-client-reviewing-bg);
}

  /* Date Inputs Styling */
  td > .date-cell-group { /* Targeting the div directly inside td for dates */
    margin-bottom: 0.75rem;
  }
  td > .date-cell-group:last-child {
    margin-bottom: 0;
}
  .date-label { /* Styling for labels like 'Site Visit' */
    display: block;
    font-size: 0.8rem;
    color: #718096;
    margin-bottom: 0.25rem;
    font-weight: 500;
}
  /* .standard-date-label can inherit from .date-label or have specific styles */

  input.date-input { /* Styling for the date input fields */
    padding: 0.4rem 0.6rem;
    border: 1px solid #cbd5e0;
    border-radius: 4px;
    font-size: 0.85rem; /* MATCHING QUOTES (input-like elements) */
    background-color: #fff;
    width: auto; /* Don't force full width */
    min-width: 130px; /* Ensure a reasonable minimum width */
  }
  input.date-input:focus {
      border-color: #4299e1; 
      box-shadow: 0 0 0 1px #4299e1; 
      outline: none;
  }
  /* Remove previous .date-cell, .date-entry styles if they are no longer used or conflicting */
  /* .date-cell { ... } */
  /* .date-entry { ... } */
  /* .date-entry label { ... } */
  /* .date-entry input[type="date"] { ... } */


  /* Notes Button Styling */
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
  /* Works Upload Button Styling (Button style) */
  .upload-button { /* Renamed from .works-upload-button for consistency? No, keep class, just change style */
    background-color: #3182ce; /* Blue background */
    color: white;
    border: none; /* Remove border */
    padding: 0.5rem 1rem; 
    font-size: 0.85rem; /* Adjusted for consistency with other smaller buttons */
    font-weight: 500;
    border-radius: 6px; /* Standard button radius */
    cursor: pointer;
    transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    white-space: nowrap;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* Subtle shadow */
    display: inline-block; /* Make it behave like a button */
  }
  .upload-button:hover {
    background-color: #2b6cb0; /* Darker blue on hover */
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  .uploaded-works-preview {
    list-style: none;
    padding: 0;
    margin: 0.75rem 0 0 0; 
    font-size: 0.8rem; /* MATCHING QUOTES (action buttons in table) */
    color: #718096;
    display: flex; /* Use flex for vertical stacking */
    flex-direction: column;
    gap: 0.5rem; /* Space between list items */
  }
  .uploaded-works-preview li {
    /* margin-bottom: 0.25rem; Removed, using gap on parent */
    /* white-space: nowrap; Let flex handle wrapping if needed, but items will try not to */
    /* overflow: hidden; Let individual items handle their overflow */
    /* text-overflow: ellipsis; */
    /* max-width: 150px; Remove fixed max-width from li */
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3rem 0.5rem;
    background-color: #f8f9fa; /* Light background for each item */
    border-radius: 4px;
    border: 1px solid #e9ecef;
  }
.work-title {
  font-weight: 500;
    color: #4a5568;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 1; /* Allow title to shrink if needed */
  }
.work-version {
    font-size: 0.8em; /* Relative to parent (0.8rem * 0.8) */
    color: #718096;
    flex-shrink: 0; /* Don't let version shrink easily */
  }
.work-description {
    font-size: 0.8em; /* Relative to parent (0.8rem * 0.8) */
    color: #718096;
  font-style: italic;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-grow: 1; /* Allow description to take space */
    display: none; /* Hide by default, too much info for summary */
  }
.work-link {
    color: #3182ce;
    font-size: 1rem; /* Link icon size */
  text-decoration: none;
    flex-shrink: 0;
  }
  .work-link:hover {
    color: #2b6cb0;
}
.delete-work-btn {
  background: none;
  border: none;
    color: #e53e3e;
  cursor: pointer;
    font-size: 1rem; /* Icon size */
    padding: 0 0.2rem;
    line-height: 1;
    flex-shrink: 0;
  }
.delete-work-btn:hover {
    color: #c53030;
  }

  /* Custom Dates Styling */
  .custom-dates-cell {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-width: 250px; /* Ensure enough width */
  }
  .custom-date-entry {
      display: flex;
      align-items: center;
      gap: 0.5rem;
  }
  .custom-date-entry input[type="text"] {
      flex-grow: 1; 
      padding: 0.4rem 0.6rem; 
      border: 1px solid #cbd5e0;
      border-radius: 4px;
      font-size: 0.85rem; /* MATCHING QUOTES (input-like elements) */
      background-color: #fff;
      min-width: 100px; /* Min width for title */
  }
  .custom-date-entry input[type="date"] {
      padding: 0.4rem 0.6rem; 
      border: 1px solid #cbd5e0;
      border-radius: 4px;
      font-size: 0.85rem; /* MATCHING QUOTES (input-like elements) */
      background-color: #fff;
      min-width: 130px; /* Min width for date */
  }
  .custom-date-entry input:focus {
      border-color: #4299e1; 
      box-shadow: 0 0 0 1px #4299e1; 
      outline: none;
  }
  .add-custom-date-button { /* Apply standard button style */
      background-color: #3182ce; /* Blue background */
      color: white;
      border: none; /* Remove border */
      padding: 0.5rem 0.6rem; 
      font-size: 0.85rem; /* Adjusted for consistency */
      font-weight: 500;
      border-radius: 6px; /* Standard button radius */
      cursor: pointer;
      transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
      margin-top: 0.75rem; /* Adjust spacing */
      display: inline-block; 
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* Subtle shadow */
      width: auto; /* Allow button to size to content */
      max-width: 150px; /* Changed max-width back to 150px */
      text-align: center; /* Center text */
  }
  .add-custom-date-button:hover {
      background-color: #2b6cb0; /* Darker blue on hover */
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  /* Custom Date Groups in Dates Column */
  .custom-date-group {
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 0.5rem;
    background-color: #f8fafc;
  }

  .custom-date-title-row {
    margin-bottom: 0.5rem;
  }

  .custom-date-title-input {
    width: 100%;
    padding: 0.4rem 0.6rem;
    border: 1px solid #cbd5e0;
    border-radius: 4px;
    font-size: 0.85rem;
    background-color: #fff;
  }

  .custom-date-input-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .custom-date-input-row .date-input {
    flex-grow: 1;
  }

  .delete-custom-date-button {
    background: #fee2e2;
    color: #dc2626;
    border: 1px solid #fecaca;
    border-radius: 4px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1.1rem;
    font-weight: bold;
    transition: all 0.2s ease-in-out;
  }

  .delete-custom-date-button:hover {
    background: #fecaca;
    color: #b91c1c;
  }

  /* Style for the info text in Custom Dates column */
  .custom-dates-info {
    color: #9ca3af;
    font-style: italic;
    font-size: 0.8rem;
  }

  .delete-custom-date-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem; /* Keep icon size reasonable, was 1.1rem */
      padding: 0 0.3rem;
  }
  .delete-custom-date-btn:hover {
      color: #c53030;
  }

  /* No Instructed Quotes State */
  .instructed-container > p {
    text-align: center;
    margin: 3rem auto;
    padding: 2.5rem;
    background-color: #ffffff;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    color: #718096;
  }



  .date-input-group {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
  }

  .date-input-group label {
    font-size: 0.9em;
    font-weight: 500;
    color: #333;
    min-width: 100px;
  }

  .date-input-group input[type="date"],
  .date-input-group input[type="text"] {
    padding: 6px 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.9em;
    flex-grow: 1;
  }
  

  .delete-custom-date-btn, .add-custom-date-btn {
    padding: 4px 8px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9em;
  }

  .delete-custom-date-btn {
    background-color: #f8d7da;
    color: #721c24;
  }
  .add-custom-date-btn {
     background-color: #e2e8f0;
     align-self: flex-start;
     margin-top: 4px;
  }

  /* Notes & Works Section */
  .works-cell {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .uploaded-works-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .upload-work-btn {
     padding: 2px 6px;
     font-size: 1.2em;
     line-height: 1;
     background-color: #e2e8f0;
     border: 1px solid #cbd5e0;
     border-radius: 50%;
  }

  .view-switcher {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 1.5rem;
    gap: 0.5rem;
  }

  .view-switcher button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    background-color: #ffffff;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    transition: all 0.2s ease-in-out;
  }

  .view-switcher button:hover {
    background-color: #f3f4f6;
  }

  .view-switcher button.active {
    background-color: #e5e7eb;
    border-color: #9ca3af;
    color: #111827;
  }
  .view-switcher button svg {
    stroke: #6b7280;
  }
  .view-switcher button.active svg {
    stroke: #111827;
  }

  /* Tile View Styles */
  .tile-view-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 1.5rem;
  }

  .surveyor-tile {
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
    transition: all 0.2s ease-in-out;
  }

   .surveyor-tile:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.07);
  }

  .tile-header {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .tile-header h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }

  .tile-header .survey-type {
    font-size: 0.8rem;
    font-weight: 500;
    color: #4b5563;
    background-color: #f3f4f6;
    padding: 0.2rem 0.5rem;
    border-radius: 12px;
  }
  
  .tile-body {
    padding: 0.75rem 1.25rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex-grow: 1;
  }

  .tile-section {
    border-top: 1px solid #f3f4f6;
    padding-top: 1rem;
  }
  
  .tile-section:first-child {
    border-top: none;
    padding-top: 0;
  }
  
  .tile-section strong {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #374151;
  }

  .tile-section p {
    margin: 0.25rem 0;
    color: #4b5563;
  }
  
  .tile-section a {
      color: #2563eb;
      text-decoration: none;
  }
  .tile-section a:hover {
      text-decoration: underline;
  }

  .work-status-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .work-status-section label {
      font-weight: 500;
      color: #374151;
  }

  .tile-actions {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
  }

  .completed {
    background-color: var(--status-completed-bg);
    color: var(--status-completed-color);
  }
  .trp-reviewing {
    background-color: var(--status-trp-reviewing-bg);
    color: var(--status-trp-reviewing-color);
  }
  .client-reviewing {
    background-color: var(--status-client-reviewing-bg);
    color: var(--status-client-reviewing-color);
  }

  .date-inputs {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  /* Tile View Status Classes */
  .not-started {
    background-color: var(--status-not-started-bg);
    color: var(--status-not-started-color);
  }
  .in-progress {
    background-color: var(--status-in-progress-bg);
    color: var(--status-in-progress-color);
  }
  .completed {
    background-color: var(--status-completed-bg);
    color: var(--status-completed-color);
  }
  .trp-reviewing {
    background-color: var(--status-trp-reviewing-bg);
    color: var(--status-trp-reviewing-color);
  }
  .client-reviewing {
    background-color: var(--status-client-reviewing-bg);
    color: var(--status-client-reviewing-color);
  }

  /* --- Table Scroll Wrapper and Buttons --- */
  .table-scroll-wrapper {
    position: relative; /* Context for absolute positioning of buttons */
    margin-bottom: 2rem; /* Keep space below */
  }

  .scroll-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%); /* Center vertically */
    z-index: 10;
    background-color: rgba(255, 255, 255, 0.8); /* Slightly transparent white */
    border: 1px solid #cbd5e0;
    border-radius: 50%; /* Circle */
    width: 36px;
    height: 36px;
    font-size: 1.2rem; /* Slightly adjusted arrow size for better fit */
    cursor: pointer;
    color: #4a5568;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    display: inline-flex; /* Use inline-flex */
    align-items: center;    /* Flexbox: Vertically center content */
    justify-content: center; /* Flexbox: Horizontally center content */
    padding: 0; /* Remove padding if flex is centering */
  }

  .scroll-btn:hover {
    background-color: #fff;
    box-shadow: 0 4px 6px rgba(0,0,0,0.15);
  }

  .scroll-btn-left {
    left: -18px; /* Position halfway outside the container */
  }

  .scroll-btn-right {
    right: -18px; /* Position halfway outside the container */
  }
  /* ------------------------------------------- */

</style> 
