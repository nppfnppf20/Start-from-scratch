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
  
  // Modal state for Notes
  let showNotesModal = false;
  let currentQuoteForNotes: Quote | null = null;
  let currentOperationalNotes: string | undefined = ''; // Renamed for clarity

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
  const workStatuses: WorkStatus[] = ['not started', 'in progress', 'completed'];

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

</script>

<div class="instructed-container">
  <h1>Instructed Surveyors</h1>
  
  {#if $selectedProject}
    <div class="instructed-header">
      <h2>Surveyors for {$selectedProject.name}</h2>
      <p>Tracking operational progress for instructed quotes.</p>
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
                        class="work-status-select {currentWorkStatus.replace(/\s+/g, '-')}"
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
                    <label for="report-draft-{quote.id}" class="date-label standard-date-label">Report Draft</label>
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
                   <button class="notes-button" on:click={() => openNotesModal(quote)} title="Edit operational notes">
                        {getNotesPreview(log?.operationalNotes)} <!-- Use log -->
                   </button>
                </td>
                <td>
                    <button class="upload-button" on:click={() => openDocumentUploadModal(quote)} title="Manage uploaded documents">
                        Manage Uploads ({log?.uploadedWorks?.length || 0})
                    </button>
                    <!-- Display uploaded works preview (optional but helpful) -->
                    {#if log?.uploadedWorks && log.uploadedWorks.length > 0}
                      <ul class="uploaded-works-preview">
                        {#each log.uploadedWorks as work (work.fileName + work.dateUploaded)} <!-- Use unique combo as key -->
                          <li title="{work.fileName} - {work.description || 'No description'}">
                            {work.title || work.fileName} - v{work.version}
                            {#if work.url}
                                <a href={work.url} target="_blank" rel="noopener noreferrer" title="Open file">🔗</a>
                            {/if}
                          </li>
                        {/each}
                      </ul>
                    {/if}
                </td>
                 <td>
                   <div class="custom-dates-cell">
                     {#if log?.customDates && log.customDates.length > 0}
                       {#each log.customDates as customDate (customDate.id)} <!-- Keyed by ID -->
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
                             &times; <!-- Multiplication sign as delete icon -->
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
/* Styles are important for layout and usability */

  .instructed-container {
  padding: 25px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 1600px; /* Limit max width */
  margin: 0 auto; /* Center */
  }
  
  .instructed-header {
  margin-bottom: 25px;
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
}
.instructed-header h2 {
    margin-bottom: 5px;
}
.instructed-header p {
    color: #555;
    font-size: 0.95em;
  }
  

  .table-container {
  overflow-x: auto; /* Allow horizontal scrolling on small screens */
  border: 1px solid #ddd;
  border-radius: 5px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  table {
    width: 100%;
    border-collapse: collapse;
  font-size: 0.9em;
  }

  th, td {
  border: 1px solid #e0e0e0;
  padding: 12px 15px; /* Slightly more padding */
    text-align: left;
  vertical-align: top; /* Align content to top */
  white-space: nowrap; /* Prevent headers/simple cells from wrapping */
  }

  th {
    background-color: #f8f9fa;
  font-weight: 600; /* Slightly bolder */
  color: #333;
  position: sticky; /* Make headers sticky if table scrolls vertically */
  top: 0;
  z-index: 1;
}

tr:nth-child(even) {
  background-color: #fdfdfd;
}

tr:hover {
  background-color: #f1f7ff; /* Light blue hover */
}

/* Class for completed rows */
.row-completed {
    /* Use a subtle indicator instead of full background color */
    /* background-color: #e6f4e6; */
    border-left: 3px solid #28a745; /* Green left border */
}
.row-completed:hover {
    background-color: #e6f4e6; /* Add light green on hover */
}


a {
  color: #0056b3;
    text-decoration: none;
  }

a:hover {
    text-decoration: underline;
  }
a[href^="mailto:"] {
    word-break: break-all; /* Break long emails */
    white-space: normal;
}

/* --- Buttons --- */
button {
    font-family: inherit;
    cursor: pointer;
    border-radius: 4px;
    border: 1px solid transparent;
    transition: all 0.2s ease;
    font-size: 0.9em;
}

.notes-button, .upload-button, .add-custom-date-button, .delete-custom-date-button {
  color: white;
  padding: 6px 12px;
  margin-right: 5px;
}
.notes-button:hover, .upload-button:hover, .add-custom-date-button:hover, .delete-custom-date-button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.notes-button {
    background-color: white;
    border-color: #6c757d;
color: black;
    display: block; /* Keep as block or change if layout needs */
    white-space: nowrap; /* Prevent text from wrapping */
    text-align: left;
    min-height: 40px; /* Match input height */
    overflow: hidden; /* Required for text-overflow */
    text-overflow: ellipsis; /* Show ... for overflow */
    max-width: 100px; /* Updated maximum width */
    /* width: 100%; */ /* Removed width: 100% */
    box-sizing: border-box; /* Include padding in width */
}


.upload-button {
    background-color: #17a2b8; /* Teal */
    border-color: #17a2b8;
}

.add-custom-date-button {
    background-color: #28a745; /* Green */
    border-color: #28a745;
    margin-top: 8px;
    display: inline-block; /* Don't take full width */
    width: auto;
}


.delete-custom-date-button {
    background-color: #dc3545; /* Red */
    border-color: #dc3545;
    padding: 3px 8px;
    font-size: 1em;
      line-height: 1;
    margin-left: 5px;
    width: auto;
}


/* --- Inputs and Selects --- */
select, input[type="date"], input[type="text"] {
    padding: 6px 10px;
    border-radius: 4px;
      border: 1px solid #ced4da;
    font-size: 0.9em;
    font-family: inherit;
    box-sizing: border-box; /* Include padding */
    transition: border-color 0.2s ease;
    min-height: 34px; /* Consistent height */
}
select:focus, input:focus {
    border-color: #80bdff;
    outline: 0;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}


  .status-dropdown-container {
    min-width: 130px;
  }

  .work-status-select {
    width: 100%; /* Make select fill container */
    font-weight: bold;
    
    /* Remove default browser appearance */
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    
    /* Add padding to the right for the arrow */
    padding-right: 30px; /* Increased padding for arrow */
    
    /* Add background arrow (SVG URL encoded) */
    /* Default arrow color (e.g., for base state or if no status class matches) */
    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236c757d%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
    background-repeat: no-repeat;
    background-position: right 10px center; /* Position arrow */
    background-size: 10px 10px; /* Size of the arrow */
}

/* Style dropdown based on status, ensuring arrow is visible */
  .work-status-select.not-started {
    background-color: #f8d7da;
    border-color: #f5c6cb;
    color: #721c24;
    /* Arrow color matches text */
    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23721c24%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
  }
  .work-status-select.in-progress {
    background-color: #fff3cd;
    border-color: #ffeeba;
    color: #856404;
    /* Arrow color matches text */
    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23856404%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
  }
  .work-status-select.completed {
    background-color: #d4edda;
    border-color: #c3e6cb;
    color: #155724;
    /* Arrow color matches text */
    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23155724%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
}

.date-cell-group {
    margin-bottom: 8px;
    display: flex;
    flex-direction: column;
}
.date-cell-group:last-child {
    margin-bottom: 0;
}

.date-label {
    font-size: 0.8em; /* Smaller label */
    color: #495057;
    margin-bottom: 3px;
    display: block;
    font-weight: 500;
}

.standard-date-label {
    font-weight: 600; /* Slightly bolder for standard dates */
}


.date-input {
    max-width: 160px;
}

/* --- Custom Dates --- */
.custom-dates-cell {
    min-width: 300px; /* Provide enough space */
    white-space: normal; /* Allow wrapping within this cell */
}

.custom-date-entry {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
    gap: 8px; /* Space between elements */
    flex-wrap: nowrap; /* Keep inputs on one line */
}

.custom-date-title-input {
    flex-grow: 1; /* Allow title to take available space */
    min-width: 100px; /* Minimum width before shrinking */
}

.custom-date-input {
     min-width: 130px; /* Ensure date input is wide enough */
}

/* --- Misc --- */
.no-instructed-info, .loading-info {
  color: #6c757d;
  font-style: italic;
  padding: 20px;
  text-align: center;
}

.uploaded-works-preview {
    list-style: none;
    padding-left: 0;
    margin-top: 8px;
    font-size: 0.85em;
    color: #555;
    white-space: normal; /* Allow wrapping for previews */
}
.uploaded-works-preview li {
    margin-bottom: 4px;
    /* white-space: nowrap; */ /* Remove nowrap */
    overflow: hidden;
    text-overflow: ellipsis;
    /* max-width: 180px; Removed max-width */
    display: flex; /* Use flex for icon alignment */
    align-items: center;
}
.uploaded-works-preview a {
    margin-left: 5px;
    font-size: 0.9em;
}

td:nth-child(1), /* Org */
td:nth-child(2) { /* Contact */
    white-space: normal; /* Allow wrapping */
}
td:nth-child(6), /* Status */
td:nth-child(7), /* Dates */
td:nth-child(8), /* Notes */
td:nth-child(9), /* Works */
td:nth-child(10) { /* Custom Dates */
    white-space: normal; /* Allow wrapping in complex cells */
}


</style> 
