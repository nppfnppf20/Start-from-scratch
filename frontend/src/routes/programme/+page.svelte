<script lang="ts">
  import {
    selectedProject, 
    currentProjectQuotes,
    currentInstructionLogs,
    allProgrammeEvents, 
    addProgrammeEvent,
    updateProgrammeEvent,
    deleteProgrammeEvent,
    type ProgrammeEvent,
    type Quote,
    type InstructionLog,
    getReviewForQuote,
    type SurveyorReview,
    type CustomDate
  } from "$lib/stores/projectStore";
  import { onMount } from 'svelte';
  // import { Calendar } from '@fullcalendar/core'; // Removed
  // import dayGridPlugin from '@fullcalendar/daygrid'; // Removed
  // import interactionPlugin from '@fullcalendar/interaction'; // Removed
  // import KeyDateModal from '$lib/components/KeyDateModal.svelte'; // Removed
  import { derived } from 'svelte/store';
  import { startOfWeek, addMonths, addWeeks, format, isBefore, min, parseISO, isWithinInterval, endOfWeek, compareAsc } from 'date-fns';
  import TimelineKeyDateModal from '$lib/components/TimelineKeyDateModal.svelte'; // Import the modal
  
  // CSS imports removed from here

  // let calendarEl: HTMLElement; // Removed
  // let calendar: Calendar; // Removed

  // Modal State - Removed
  // let showKeyDateModal = false; 
  // let selectedDateStr: string | null = null; 

  // --- Define a common interface for all timeline items ---
  interface TimelineItem {
    id: string; // Unique ID for the item (e.g., event ID, log-sv-id, log-cd-id)
    date: string; // ISO Date string
    title: string;
    color: string;
    type: 'manual' | 'log' | 'log-custom'; // Type to distinguish source
    projectId: string; // Ensure projectId is present
    quoteId?: string; // Optional: Link back to quote if from log
    customDateId?: string; // Optional: Link back to custom date if applicable
  }

  // Filter programme events for the current project
  const currentProjectManualEvents = derived(
    [allProgrammeEvents, selectedProject],
    ([$allProgrammeEvents, $selectedProject]): ProgrammeEvent[] => {
      if (!$selectedProject) return [];
      return $allProgrammeEvents
        .filter(event => event.projectId === $selectedProject.id)
    }
  );

  // Filter instructed/partially instructed surveyors (quotes) for the current project
  const instructedSurveyors = derived(
    [currentProjectQuotes, selectedProject],
    ([$currentProjectQuotes, $selectedProject]): Quote[] => {
      if (!$selectedProject) return [];
      return $currentProjectQuotes.filter(quote => 
        quote.projectId === $selectedProject.id &&
        (quote.instructionStatus === 'instructed' || quote.instructionStatus === 'partially instructed')
      );
    }
  );

  // onMount block related to calendar removed
  /*
  onMount(() => {
    calendar = new Calendar(calendarEl, {
      // ... calendar config ...
    });

    calendar.render();

    const unsubscribe = currentProjectEvents.subscribe(events => {
      // ... update calendar ...
    });

    return () => {
      calendar.destroy();
      unsubscribe(); 
    };
  });
  */

  // Calendar/Modal related functions removed
  /*
  function handleDateSelect(selectInfo: { startStr: string, endStr: string, allDay: boolean }) {
      // ... logic ...
  }

  function handleEventClick(clickInfo: { event: any }) {
    // ... logic ...
  }
  
  function handleModalSave(event: CustomEvent<{ title: string; date: string; color: string }>) {
     // ... logic ...
  }

  function handleModalCancel() {
      // ... logic ...
  }
  */

  // *** Create the new derived store for ALL timeline items ***
  const timelineItems = derived(
    [currentProjectManualEvents, currentInstructionLogs, currentProjectQuotes, selectedProject],
    ([$manualEvents, $logs, $quotes, $project]): TimelineItem[] => {
      if (!$project) return [];

      const items: TimelineItem[] = [];
      const projectId = $project.id;

      // 1. Add Manual Programme Events
      $manualEvents.forEach(event => {
        items.push({ ...event, type: 'manual' });
      });

      // 2. Add Instruction Log Dates
      $logs.forEach(log => {
        // Find the corresponding quote for context (e.g., organisation name)
        const quote = $quotes.find(q => q.id === log.quoteId);
        const orgName = quote?.organisation || 'Unknown Org';

        // Site Visit Date
        if (log.siteVisitDate) {
          items.push({
            id: `log-${log.id}-sv`,
            date: log.siteVisitDate,
            title: `Site Visit - ${orgName}`,
            color: '#ED7D31', // Example color (Orange)
            type: 'log',
            projectId,
            quoteId: log.quoteId
          });
        }

        // Report Draft Date
        if (log.reportDraftDate) {
          items.push({
            id: `log-${log.id}-rd`,
            date: log.reportDraftDate,
            title: `Report Draft - ${orgName}`,
            color: '#4472C4', // Example color (Blue)
            type: 'log',
            projectId,
            quoteId: log.quoteId
          });
        }

        // Custom Dates from Log
        if (log.customDates) {
          log.customDates.forEach(cd => {
            // Basic check for valid date string before adding
            if (cd.date && typeof cd.date === 'string') { 
              items.push({
                id: `log-${log.id}-cd-${cd.id}`,
                date: cd.date,
                title: `${cd.title} - ${orgName}`,
                color: '#7030A0', // Example color (Purple)
                type: 'log-custom',
                projectId,
                quoteId: log.quoteId,
                customDateId: cd.id
              });
            }
          });
        }
      });

      // 3. Sort all items by date
      items.sort((a, b) => compareAsc(parseISO(a.date), parseISO(b.date)));

      return items;
    }
  );

  // --- Timeline Calculation ---
  let timelineStartDate: Date = new Date(); // Default to today
  let timelineEndDate: Date = addMonths(timelineStartDate, 4); // Initial 4 months
  let weeks: Date[] = [];

  // Reactive calculation for dates and weeks
  $: {
    const today = new Date();
    // let earliestEventDate: Date | null = null; // No longer needed for start date

    // Keep this logic if needed elsewhere, but not for start date calculation
    /*
    if ($currentProjectEvents.length > 0) {
      const eventDates = $currentProjectEvents.map(event => parseISO(event.date));
      earliestEventDate = min(eventDates);
    }
    */

    // Determine start date: Always use today's date
    // const potentialStartDate = earliestEventDate ? min([today, earliestEventDate]) : today; // Old logic
    const potentialStartDate = today; // New logic: always start from today
    
    // Ensure start date isn't recalculated when extending range, only on project/event changes
    // We only calculate the *initial* start date reactively based on events/today.
    // If timelineStartDate is already set (e.g., by initial load), don't change it unless project changes.
    if (weeks.length === 0 || !$selectedProject) { // Initialize or reset on project change
         timelineStartDate = startOfWeek(potentialStartDate, { weekStartsOn: 1 }); 
         timelineEndDate = addMonths(timelineStartDate, 4); // Reset range on project change
    }

    // Generate weeks based on current timelineStartDate and timelineEndDate
    const generatedWeeks: Date[] = [];
    let currentWeek = timelineStartDate;
    while (isBefore(currentWeek, timelineEndDate)) {
      generatedWeeks.push(currentWeek);
      currentWeek = addWeeks(currentWeek, 1);
    }
    weeks = generatedWeeks;
  }

  // Function to format week date for display
  function formatWeekHeader(date: Date): string {
    return `w/c ${format(date, 'd MMM')}`; 
  }

  // Function to extend timeline by one month
  function extendTimeline() {
    timelineEndDate = addMonths(timelineEndDate, 1);
    // The reactive block `$: { ... }` will automatically update the `weeks` array
  }

  // Function to check if a date string falls within a given week
  function isDateInWeek(dateStr: string | undefined | null, weekStartDate: Date): boolean {
      if (!dateStr) return false;
      try {
          const date = parseISO(dateStr);
          const weekInterval = { 
              start: weekStartDate, 
              // Get the end of the week (Sunday) based on the week starting Monday
              end: endOfWeek(weekStartDate, { weekStartsOn: 1 }) 
          };
          return isWithinInterval(date, weekInterval);
      } catch (e) {
          console.error("Error parsing date:", dateStr, e);
          return false;
      }
  }

  // --- Component State ---
  let showTimelineKeyDateModal = false;
  let selectedWeekStartDateForModal: Date | null = null;
  let eventBeingEdited: ProgrammeEvent | null = null;

  // --- Modal Handlers ---
  function handleOpenKeyDateModal(weekDate: Date) {
    selectedWeekStartDateForModal = weekDate;
    eventBeingEdited = null;
    showTimelineKeyDateModal = true;
  }

  function handleEditKeyDate(event: ProgrammeEvent) {
    eventBeingEdited = event;
    selectedWeekStartDateForModal = null;
    showTimelineKeyDateModal = true;
  }

  function handleKeyDateCancel() {
    showTimelineKeyDateModal = false;
    selectedWeekStartDateForModal = null;
    eventBeingEdited = null;
  }

  function handleKeyDateSave(event: CustomEvent<{ title: string; date: string; color: string; id?: string }>) {
    if (!$selectedProject) return;
    const { title, date, color, id } = event.detail;

    if (id && eventBeingEdited) {
        updateProgrammeEvent({ 
            ...eventBeingEdited,
            title, 
            date, 
            color 
        });
    } else {
        addProgrammeEvent({
            projectId: $selectedProject.id,
            title,
            date, 
            color
        });
    }

    showTimelineKeyDateModal = false;
    selectedWeekStartDateForModal = null;
    eventBeingEdited = null;
  }

  function handleKeyDateDelete(event: CustomEvent<{ id: string }>) {
    if (!$selectedProject) return;
    const { id } = event.detail;
    deleteProgrammeEvent(id);

    showTimelineKeyDateModal = false;
    selectedWeekStartDateForModal = null;
    eventBeingEdited = null;
  }

  // Reactive calculation for quotes belonging to the selected project
  $: projectQuotes = $selectedProject && $currentProjectQuotes
      ? $currentProjectQuotes.filter(quote => quote.projectId === $selectedProject?.id)
      : [];

  // Combine standard dates from project/quotes with custom programme events
  // ... existing code ...

</script>

<div class="programme-container">
  <h1>Programme</h1>
  
  {#if $selectedProject}
    <div class="programme-header">
      <h2>Timeline for {$selectedProject.name}</h2>
    </div>
    
    <div class="programme-content timeline-view">
      {#if $instructedSurveyors.length > 0 || $currentProjectManualEvents.length > 0}
        <table class="timeline-table">
          <thead>
             <!-- Week Header Row -->
             <tr>
              <th class="sticky-col header-cell surveyor-header"></th>
              {#each weeks as weekDate (format(weekDate, 'yyyy-MM-dd'))}
                <th class="header-cell week-col">{formatWeekHeader(weekDate)}</th>
              {/each}
              <th class="header-cell add-week-col">
                  <button on:click={extendTimeline} title="Add one month">+</button>
              </th>
            </tr>
            <!-- Key Dates Header Row -->
            <tr>
                <th class="sticky-col header-cell key-dates-header">Key Dates</th>
                {#each weeks as weekDate (format(weekDate, 'yyyy-MM-dd'))}
                    <th class="header-cell key-date-cell">
                       <!-- Display existing key dates for this week -->
                       <div class="key-dates-container">
                           {#each $currentProjectManualEvents as event (event.id)}
                               {#if isDateInWeek(event.date, weekDate)}
                                   <div 
                                       class="timeline-key-event"
                                       style="background-color: {event.color}; border-left: 3px solid {event.color === '#ffffff' ? '#ccc' : event.color};" 
                                       title="{event.title} ({format(parseISO(event.date), 'd MMM')}) - Click to edit" 
                                       on:click={() => handleEditKeyDate(event)}
                                       role="button"
                                       tabindex="0"
                                       on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleEditKeyDate(event); }}
                                    >
                                       {event.title}
                                   </div>
                               {/if}
                           {/each}
                       </div>
                       <!-- Add button -->
                       <button 
                           class="add-key-date-btn"
                           title="Add key date for {formatWeekHeader(weekDate)}"
                           on:click={() => handleOpenKeyDateModal(weekDate)}
                        >
                           +
                       </button>
                    </th>
                {/each}
                <th class="header-cell add-week-col"></th> 
            </tr>
          </thead>
          <tbody>
            {#each $instructedSurveyors as quote (quote.id)}
               <!-- Determine row completion status (using InstructionLog now if available) -->
               {@const log = $currentInstructionLogs.find(l => l.quoteId === quote.id)}
               {@const isCompleted = log?.workStatus === 'completed'}
               
               <!-- Calculate relevant items for *this specific quote* just before use -->
               {@const relevantLogItems = $timelineItems.filter(item => 
                   (item.type === 'log' || item.type === 'log-custom') && item.quoteId === quote.id
               )}

               <tr class="surveyor-row" class:row-completed={isCompleted}>
                <td class="sticky-col data-cell surveyor-name">
                    <div>{quote.organisation}</div>
                    <div class="discipline">{quote.discipline} - {quote.surveyType || 'N/A'}</div>
                </td>
                {#each weeks as weekDate (format(weekDate, 'yyyy-MM-dd'))}
                  <td class="data-cell week-col">
                      <div class="cell-content">
                        <!-- Iterate through items relevant to this quote -->
                        {#each relevantLogItems as item (item.id)}
                            {#if isDateInWeek(item.date, weekDate)}
                                <div 
                                    class="timeline-item {item.type === 'log-custom' ? 'custom-date' : (item.title.toLowerCase().includes('site visit') ? 'site-visit' : 'report-draft')}" 
                                    style="background-color: {item.color}1A; border-left: 3px solid {item.color}; color: {item.color};" 
                                    title="{item.title} ({format(parseISO(item.date), 'd MMM')})"
                                >
                                    {item.title}
                                </div>
                            {/if}
                        {/each}
                      </div>
                  </td>
                {/each}
                <td class="data-cell add-week-col"></td>
               </tr>
            {/each}
          </tbody>
        </table>
      {:else}
         <p>No instructed surveyors or key dates found for this project.</p>
      {/if}
       
       <!-- Removed original event list placeholder -->

    </div>
  {:else}
    <p>Please select a project to view the programme.</p>
  {/if}

  <!-- Render Key Date Modal -->
  {#if showTimelineKeyDateModal}
    <TimelineKeyDateModal 
      bind:showModal={showTimelineKeyDateModal}
      initialDate={selectedWeekStartDateForModal} 
      eventToEdit={eventBeingEdited}
      on:save={handleKeyDateSave} 
      on:cancel={handleKeyDateCancel} 
      on:delete={handleKeyDateDelete}
    />
  {/if}
</div>

<style>
  /* CSS Imports moved to app.html or +layout.svelte */

  /* Styles adjusted for better height without calendar */
   .programme-container {
    padding: 1rem 0;
    display: flex;
    flex-direction: column;
    flex-grow: 1; 
    height: calc(100vh - 150px); /* Adjust as needed */
    overflow: hidden; 
  }
  
  h1, .programme-header {
    padding: 0 1rem; /* Add padding to match content */
    margin-bottom: 1rem;
    flex-shrink: 0; 
  }
  
  h2 {
    font-size: 1.5rem;
    color: #555;
    margin: 0;
  }
  
  .programme-content {
    flex-grow: 1; 
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    overflow: auto; /* Allow scrolling for the table */
    min-height: 0; 
    padding: 0; /* Remove padding here, add to inner elements if needed */
  }

  .timeline-view {
     padding: 1rem; /* Add padding back */
  }

  .timeline-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed; /* Helps with column widths */
    margin-bottom: 1rem;
  }

  .timeline-table th, .timeline-table td {
    border: 1px solid #dee2e6;
    padding: 0.5rem;
    text-align: left;
    font-size: 0.9rem;
    white-space: nowrap; /* Prevent wrapping initially */
  }
  
  .timeline-table thead th {
    background-color: #f8f9fa;
    position: sticky; 
    /* top: 0; */ /* Removed static top: 0 */
    z-index: 2; 
  }

  /* Style specific header rows for top positioning */
  thead tr:first-child th {
      top: 0; /* First header row sticks to the very top */
  }
  thead tr:nth-child(2) th {
      top: 38px; /* Second header row sticks below the first (adjust height as needed) */
      /* Assuming default padding/height, might need adjustment */
  }

  .sticky-col {
    position: sticky;
    left: 0;
    background-color: #f8f9fa; 
    z-index: 1; 
    width: 200px; 
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  /* Ensure sticky headers are above sticky column body */
  thead .sticky-col {
     z-index: 3; 
  }
  /* Ensure the corner cells have highest z-index */
  thead tr:first-child th.sticky-col {
      z-index: 4;
  }
   thead tr:nth-child(2) th.sticky-col {
      z-index: 4;
  }

  .header-cell {
     text-align: center;
     vertical-align: middle; 
     font-weight: bold;
  }
  .surveyor-header {
     /* specific styles if needed */
  }
  .key-dates-header {
     font-size: 0.9em;
     /* Ensure it aligns vertically with button if needed */
     vertical-align: bottom;
     padding-bottom: 0.5rem; /* Add space below text */
  }

  .week-col {
     width: 100px; 
  }

  .add-week-col {
     width: 50px; 
     padding: 0; 
  }
  
  .key-date-cell {
      padding: 0.1rem;
      vertical-align: top; /* Align content to top */
      position: relative; /* For positioning button */
      min-height: 40px; /* Ensure cell has some height */
  }

  .key-dates-container {
      /* Container for the event divs */
      margin-bottom: 2px; /* Space above button */
      min-height: 20px; /* Ensure space even if no events */
  }

  .timeline-key-event {
      font-size: 0.75em;
      padding: 1px 4px;
      border-radius: 3px;
      margin-bottom: 2px;
      white-space: normal; /* Explicitly allow wrapping */
      color: #333; 
      border: 1px solid rgba(0,0,0,0.1);
      line-height: 1.3;
      display: block; /* Ensure it takes block space for wrapping */
      cursor: pointer;
  }

  .timeline-key-event:hover,
  .timeline-key-event:focus {
      border-color: #333;
      outline: 1px solid #333;
  }

  .add-key-date-btn {
      width: 20px; /* Slightly smaller */
      height: 20px;
      border-radius: 50%;
      border: 1px solid #adb5bd;
      background: #e9ecef;
      cursor: pointer;
      font-size: 0.9rem; /* Slightly smaller */
      font-weight: bold;
      color: #495057;
      display: inline-flex; 
      align-items: center;
      justify-content: center;
      padding: 0;
      line-height: 1;
      margin-top: 2px; /* Add some space if inline */
  }
  .add-key-date-btn:hover {
      background: #ced4da;
      border-color: #6c757d;
  }

  .surveyor-name-cell {
      font-weight: bold;
      white-space: normal; /* Allow surveyor name to wrap */
  }
  .discipline {
      font-size: 0.8em;
      color: #6c757d;
      display: block; /* Put discipline on new line */
  }

  .week-cell {
    min-height: 30px; 
    border-right: 1px solid #dee2e6; 
    vertical-align: top; /* Align content to top */
    padding: 0.3rem; /* Adjust padding slightly */
  }

  .timeline-event {
      font-size: 0.8em;
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
      margin-bottom: 0.2rem;
      white-space: normal; /* Allow text wrap */
      line-height: 1.2;
  }
  
  .site-visit {
      background-color: #cfe2ff; /* Light blue */
      border: 1px solid #9ec5fe;
      color: #052c65;
  }

  .draft-due {
      background-color: #f8d7da; /* Light red */
      border: 1px solid #f1aeb5;
      color: #58151a;
  }

  /* Add specific style for the last cell in body rows */
  tbody tr td:last-child {
      /* Match background or keep it plain? */
      /* background-color: #f8f9fa; */ 
      border-right: 1px solid #dee2e6; 
  }

  /* Placeholder text style remains */
  .placeholder-text {
    color: #6c757d;
    font-style: italic;
    margin-bottom: 1rem; 
  }

  /* Style for completed rows */
  tbody tr.row-completed td {
      background-color: #e6f7ec; /* Light green background */
  }

  /* Ensure sticky column also gets the completed background */
  tbody tr.row-completed td.sticky-col {
      background-color: #e6f7ec; /* Match the light green */
      /* Optionally add a border or other distinction */
      /* border-left: 3px solid #28a745; */
  }
   tbody tr.row-completed:hover td {
      background-color: #d4edda; /* Slightly darker green on hover */
  }
  tbody tr.row-completed:hover td.sticky-col {
      background-color: #d4edda; /* Match hover background */
  }

  /* Base style for timeline items in surveyor rows */
  .timeline-item {
      display: block; /* Ensure it takes full width for truncation */
      padding: 2px 5px; /* Reduced padding */
      margin-bottom: 3px; /* Space between items */
      border-radius: 4px; 
      font-size: 0.8rem; /* Slightly smaller font */
      line-height: 1.3; 
      border: 1px solid transparent; /* Base border */
      white-space: nowrap; /* Prevent wrapping */
      overflow: hidden; /* Hide overflow */
      text-overflow: ellipsis; /* Show ellipsis */
      cursor: default; /* Indicate non-interactive unless specifically made so */
  }

  .timeline-item.site-visit {
      background-color: #fff3cd; /* Softer yellow background */
      border-color: #ffeeba; /* Matching border */
      color: #664d03; /* Darker text for contrast */
  }

  .timeline-item.report-draft {
      background-color: #cfe2ff; /* Softer blue background */
      border-color: #b6d4fe; /* Matching border */
      color: #0a58ca; /* Darker blue text */
  }

  .timeline-item.custom-date {
      background-color: #ffe5d0; /* Softer orange background */
      border-color: #fed8b1; /* Matching border */
      color: #854404; /* Darker orange text */
  }

  /* Ensure items stack within a cell if multiple occur */
  .cell-content {
      display: flex;
      flex-direction: column;
      gap: 2px; /* Control spacing between stacked items */
      /* min-height: 20px; /* Ensure space even if no events - might not be needed */
  }
</style> 