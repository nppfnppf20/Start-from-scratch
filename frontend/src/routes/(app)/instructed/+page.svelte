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
    if (!browser) return;

    const existingLog = findLog(quoteId);
    if (!existingLog || !existingLog.customDates) return;

    // Optional: Add confirmation dialog here
    if (!confirm('Are you sure you want to delete this custom date?')) {
      return;
    }
    console.log(`Deleting custom date ${customDateId} for quote ${quoteId}`);

    const updatedDatesArray = existingLog.customDates.filter(date => date.id !== customDateId);

    await upsertInstructionLog(quoteId, { customDates: updatedDatesArray });
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

  let viewMode: 'table' | 'tile' = 'table'; // Default to table view
</script>

<div class="instructed-container">
  <h1>Instructed Surveyors</h1>
  
  {#if $selectedProject}
    <div class="instructed-header">
      <h2>Surveyors for {$selectedProject.name}</h2>
      <p>Tracking operational progress for instructed quotes.</p>
    </div>
    
    <div class="view-switcher">
      <button class:active={viewMode === 'table'} on:click={() => viewMode = 'table'} title="Table View">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
        <span>Table</span>
      </button>
      <button class:active={viewMode === 'tile'} on:click={() => viewMode = 'tile'} title="Tile View">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
        <span>Tiles</span>
      </button>
    </div>
    
    {#if instructedQuotes.length > 0}
       {#if viewMode === 'table'}
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
              <th>Works</th>
              <th>Custom Dates</th>
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
                <td>
                    <button class="upload-button" on:click={() => openDocumentUploadModal(quote)} title="Manage uploaded documents">
                        Manage Uploads ({log?.uploadedWorks?.length || 0})
                    </button>
                    {#if log?.uploadedWorks && log.uploadedWorks.length > 0}
                      <ul class="uploaded-works-preview">
                        {#each log.uploadedWorks as work (work.fileName + work.dateUploaded + work.version)}
                          <li>
                            <span class="work-title">{work.title || work.fileName}</span> 
                            <span class="work-version">(v{work.version || 'N/A'})</span>
                            {#if work.description}
                              <span class="work-description"> - {work.description}</span>
                            {/if}
                            {#if work.url}
                                <a href={work.url} target="_blank" rel="noopener noreferrer" title="Open file" class="work-link">🔗</a>
                            {/if}
                            <button 
                              class="delete-work-btn" 
                              title="Delete this upload"
                              on:click={() => { /* TODO: Implement delete logic */ console.warn('Delete button clicked for:', work); }}
                            >
                              🗑️
                            </button>
                          </li>
                        {/each}
                      </ul>
                    {/if}
                </td>
                 <td>
                   <div class="custom-dates-cell">
                     {#if log?.customDates && log.customDates.length > 0}
                       {#each log.customDates as customDate (customDate.id)}
                         <div class="custom-date-entry">
                           <input
                             type="text"
                             placeholder="Date Title"
                             class="custom-date-title-input"
                             value={customDate.title}
                             on:change={(e) => handleCustomDateChange(quote.id, customDate.id, 'title', e.currentTarget.value)}
                             title="Edit custom date title"
                           />
                           <input
                             type="date"
                             class="custom-date-input"
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
                       {/each}
                    {/if}
                    <button 
                        class="add-custom-date-button"
                        on:click={() => handleAddCustomDate(quote.id)}
                        title="Add a new custom date entry"
                     >
                       + Add Date
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
          </div>
          <button class="scroll-btn scroll-btn-right" on:click={scrollRight} aria-label="Scroll table right">→</button>
      </div>
      {:else if viewMode === 'tile'}
        <div class="tile-view-container">
          {#each instructedQuotes as quote (quote.id)}
            {@const log = findLog(quote.id)}
            <div class="surveyor-tile">
              <div class="tile-header">
                <h3>{quote.organisation}</h3>
                <span class="survey-type">{quote.surveyType}</span>
              </div>
              <div class="tile-body">
                <div class="tile-section">
                  <p><strong>Contact:</strong> {quote.contactName}</p>
                  <p><strong>Email:</strong> <a href="mailto:{quote.email}">{quote.email}</a></p>
                  <p><strong>Quote:</strong> £{quote.partiallyInstructedTotal?.toFixed(2) ?? quote.total.toFixed(2)}</p>
                </div>

                <div class="tile-section work-status-section">
                  <label for={`work-status-tile-${quote.id}`}>Work Status:</label>
                  <select
                    id={`work-status-tile-${quote.id}`}
                    class="work-status-dropdown {log?.workStatus?.toLowerCase().replace(/\s+/g, '-') || 'not-started'}"
                    on:change={(e) => handleWorkStatusChange(quote.id, e.currentTarget.value as WorkStatus)}
                  >
                    <option value="" disabled selected>{log?.workStatus || 'Select...'}</option>
                    {#each workStatuses as status}
                      <option value={status} selected={log?.workStatus === status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    {/each}
                  </select>
                </div>
                
                <div class="tile-section">
                  <strong>Dates:</strong>
                  <div class="date-inputs">
                    <div class="date-input-group">
                      <label for={`tile-site-visit-${quote.id}`}>Site Visit:</label>
                      <input type="date" id={`tile-site-visit-${quote.id}`} value={formatDateForInput(log?.siteVisitDate)} on:change={(e) => handleDateUpdate(quote.id, 'siteVisitDate', e.currentTarget.value)} />
                    </div>
                    <div class="date-input-group">
                      <label for={`tile-report-draft-${quote.id}`}>Report Draft:</label>
                      <input type="date" id={`tile-report-draft-${quote.id}`} value={formatDateForInput(log?.reportDraftDate)} on:change={(e) => handleDateUpdate(quote.id, 'reportDraftDate', e.currentTarget.value)} />
                    </div>
                    {#if log?.customDates}
                      {#each log.customDates as customDate (customDate.id)}
                        <div class="date-input-group custom-date-group">
                          <input type="text" class="custom-date-title-input" value={customDate.title} on:change={(e) => handleCustomDateChange(quote.id, customDate.id, 'title', e.currentTarget.value)} placeholder="Custom Title" />
                          <input type="date" class="custom-date-input" value={formatDateForInput(customDate.date)} on:change={(e) => handleCustomDateChange(quote.id, customDate.id, 'date', e.currentTarget.value)} />
                          <button class="delete-custom-date-btn" on:click={() => handleDeleteCustomDate(quote.id, customDate.id)}>&times;</button>
                        </div>
                      {/each}
                    {/if}
                    <button class="add-custom-date-btn" on:click={() => handleAddCustomDate(quote.id)}>+ Add Date</button>
                  </div>
                </div>

                <div class="tile-section tile-actions">
                   <button class="notes-button" on:click={() => openHoldUpNotesModal(quote)}>
                    {getNotesPreview(log?.holdUpNotes)}
                  </button>
                </div>
                 <div class="tile-section tile-actions">
                   <strong>Works:</strong>
                  <div class="works-cell">
                     {#if log?.uploadedWorks && log.uploadedWorks.length > 0}
                          <ul class="uploaded-works-list">
                              {#each log.uploadedWorks as work, i}
                                  <li>
                                      <a href={work.url || '#'} target="_blank" rel="noopener noreferrer">
                                        {work.title || `File ${i+1}`} (v{work.version})
                                      </a>
                                  </li>
                              {/each}
                          </ul>
                      {:else}
                          <span class="no-works">No works uploaded</span>
                      {/if}
                      <button class="upload-work-btn" on:click={() => openDocumentUploadModal(quote)}>+</button>
                  </div>
                </div>

              </div>
            </div>
          {/each}
        </div>
      {/if}
    {:else}
      <p class="no-instructed-info">No quotes have been marked as instructed for this project yet, or instruction logs haven't loaded.</p>
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
    padding: 10px;
    background-color: #f1f1f1;
    border: 1px solid #ddd;
    border-radius: 4px;
    text-align: left;
    cursor: pointer;
    font-style: italic;
    color: #555;
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

  /* --- Scroll Buttons CSS (Copied from quotes page) --- */
  /* .table-scroll-wrapper { ... } */ 
  /* .scroll-btn { ... } */
  /* .scroll-btn-left { ... } */
  /* .scroll-btn-right { ... } */
  /* --- Keeping these commented out as HTML was not added --- */

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
  
  .custom-date-group {
    display: flex;
    gap: 4px;
  }

  .custom-date-title-input {
    flex-basis: 50%;
  }
  .custom-date-input {
    flex-basis: 50%;
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
  .notes-button {
    width: 100%;
    padding: 10px;
    background-color: #f1f1f1;
    border: 1px solid #ddd;
    border-radius: 4px;
    text-align: left;
    cursor: pointer;
    font-style: italic;
    color: #555;
  }
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

</style> 
