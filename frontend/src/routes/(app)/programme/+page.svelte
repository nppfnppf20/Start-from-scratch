<script lang="ts">
  import { browser } from '$app/environment';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import {
    selectedProject, 
    currentProjectQuotes,
    currentInstructionLogs,
    allProgrammeEvents, 
    addProgrammeEvent,
    updateProgrammeEvent,
    deleteProgrammeEvent,
    upsertInstructionLog,
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
  import SurveyorDateModal from '$lib/components/SurveyorDateModal.svelte';
  import NotesDisplayModal from '$lib/components/NotesDisplayModal.svelte';
  
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
                title: cd.title, // Just use the title without organization name
                color: cd.color || '#6c757d', // Use saved color or default to grey
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
    
    // Determine start date: Always use today's date
    const potentialStartDate = today;
    
    // Initialize or reset on project change
    if (weeks.length === 0 || !$selectedProject) {
         timelineStartDate = startOfWeek(potentialStartDate, { weekStartsOn: 1 }); 
         timelineEndDate = addMonths(timelineStartDate, 4); // Default 4 months
    }

    // Auto-extend timeline based on manual programme events
    if ($currentProjectManualEvents.length > 0) {
      // Find the latest manual event date
      const eventDates = $currentProjectManualEvents.map(event => parseISO(event.date));
      const latestEventDate = eventDates.reduce((latest, current) => 
        current > latest ? current : latest
      );
      
      // If latest event is beyond current timeline end, extend timeline
      if (latestEventDate > timelineEndDate) {
        // Add 2 weeks buffer past the latest event
        timelineEndDate = addWeeks(latestEventDate, 2);
      }
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

  // State for surveyor date modal
  let showSurveyorDateModal = false;
  let selectedSurveyorQuoteId: string = '';
  let selectedSurveyorWeekDate: Date | null = null;
  let selectedSurveyorName: string = '';
  let customDateBeingEdited: any = null;

  // State for the hold-up notes display modal
  let showDependenciesNotesDisplayModal = false;
  let currentNotesContent = '';
  let currentNotesOrgName = '';
  let currentNotesQuoteId = '';

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
    console.log('handleKeyDateSave CALLED in +page.svelte. Event detail:', event.detail);
    if (!$selectedProject) {
      console.error('No selected project in handleKeyDateSave');
      return;
    }
    const { title, date, color, id } = event.detail;

    if (id && eventBeingEdited) {
        console.log('Attempting to UPDATE programme event:', eventBeingEdited);
        updateProgrammeEvent({
            ...eventBeingEdited,
            title,
            date,
            color
        });
    } else {
        console.log('Attempting to ADD programme event for project:', $selectedProject.id);
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

  // --- Surveyor Date Modal Handlers ---
  function handleSurveyorCellClick(quoteId: string, weekDate: Date, surveyorName: string) {
    selectedSurveyorQuoteId = quoteId;
    selectedSurveyorWeekDate = weekDate;
    selectedSurveyorName = surveyorName;
    showSurveyorDateModal = true;
  }

  function handleEditCustomDate(customDate: any, quoteId: string, surveyorName: string) {
    selectedSurveyorQuoteId = quoteId;
    selectedSurveyorName = surveyorName;
    customDateBeingEdited = customDate;
    selectedSurveyorWeekDate = null; // Not used when editing
    showSurveyorDateModal = true;
  }

  function handleSurveyorDateCancel() {
    showSurveyorDateModal = false;
    selectedSurveyorQuoteId = '';
    selectedSurveyorWeekDate = null;
    selectedSurveyorName = '';
    customDateBeingEdited = null;
  }

  async function handleSurveyorDateSave(event: CustomEvent<{ title: string; date: string; color: string; quoteId: string; id?: string }>) {
    if (!browser || !$selectedProject) return;
    
    const { title, date, color, quoteId, id } = event.detail;
    
    // Get existing custom dates for this quote
    const existingLog = $currentInstructionLogs.find(log => log.quoteId === quoteId);
    const existingDates = existingLog?.customDates || [];
    
    let updatedDatesArray;
    
    if (id) {
      // Editing existing custom date
      updatedDatesArray = existingDates.map(cd => 
        cd.id === id 
          ? { ...cd, title, date, color }
          : cd
      );
    } else {
      // Adding new custom date
      const newDateId = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
      const newCustomDate = {
        id: newDateId,
        title,
        date,
        color
      };
      updatedDatesArray = [...existingDates, newCustomDate];
    }
    
    // Save to instruction log
    await upsertInstructionLog(quoteId, { customDates: updatedDatesArray });
    
    // Close modal
    showSurveyorDateModal = false;
    selectedSurveyorQuoteId = '';
    selectedSurveyorWeekDate = null;
    selectedSurveyorName = '';
    customDateBeingEdited = null;
  }

  async function handleSurveyorDateDelete(event: CustomEvent<{ id: string; quoteId: string }>) {
    if (!browser || !$selectedProject) return;
    
    const { id, quoteId } = event.detail;
    
    // Get existing custom dates for this quote
    const existingLog = $currentInstructionLogs.find(log => log.quoteId === quoteId);
    if (!existingLog || !existingLog.customDates) return;
    
    // Remove the custom date with the matching ID
    const updatedDatesArray = existingLog.customDates.filter(cd => cd.id !== id);
    
    // Save to instruction log
    await upsertInstructionLog(quoteId, { customDates: updatedDatesArray });
    
    // Close modal
    showSurveyorDateModal = false;
    selectedSurveyorQuoteId = '';
    selectedSurveyorWeekDate = null;
    selectedSurveyorName = '';
    customDateBeingEdited = null;
  }

  function openDependenciesNotesDisplayModal(notes: string, orgName: string, quoteId: string) {
    currentNotesContent = notes;
    currentNotesOrgName = orgName;
    currentNotesQuoteId = quoteId;
    showDependenciesNotesDisplayModal = true;
  }

  async function handleSaveFromDisplay(event: CustomEvent<{ notes: string; quoteId: string }>) {
    const { notes, quoteId } = event.detail;
    if (!browser) return;
    
    // Use the new upsert function
    await upsertInstructionLog(quoteId, { dependencies: notes });
    
    // Close the modal
    showDependenciesNotesDisplayModal = false;
  }

  // Reactive calculation for quotes belonging to the selected project
  $: projectQuotes = $selectedProject && $currentProjectQuotes
      ? $currentProjectQuotes.filter(quote => quote.projectId === $selectedProject?.id)
      : [];

  // Combine standard dates from project/quotes with custom programme events
  // ... existing code ...

</script>

<div class="programme-container">
  <PageHeader 
    title="Programme"
    subtitle={$selectedProject ? `Timeline for ${$selectedProject.name}` : 'Please select a project'}
  />
  
  {#if $selectedProject}
    <div class="programme-content timeline-view">
      {#if $instructedSurveyors.length > 0 || $currentProjectManualEvents.length > 0}
        <div class="table-scroll-container">
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
                    <div style="font-weight: bold; font-size: 0.9em; margin-bottom: 2px; display: flex; align-items: center;">
                      <span>{quote.discipline}</span>
                      <!-- Surveyor Notes Icon -->
                      {#if log && log.operationalNotes && log.operationalNotes.trim() !== ''}
                        <svg on:click={() => openDependenciesNotesDisplayModal(log.operationalNotes || '', quote.organisation, quote.id)} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#007bff" viewBox="0 0 16 16" class="notes-icon" style="display: inline-block; vertical-align: middle; margin-left: 5px; cursor: pointer;">
                          <title>Surveyor Notes: {log.operationalNotes}</title>
                          <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z"/>
                          <path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0 3v-.5a.5.5 0 0 1 1 0V11h.5a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5z"/>
                          <path d="M6 4h6v1H6V4zm0 3h6v1H6V7zm0 3h6v1H6v-1z"/>
                        </svg>
                      {/if}
                      <!-- Dependencies Icon -->
                      {#if log && log.dependencies && log.dependencies.trim() !== ''}
                        <svg on:click={() => openDependenciesNotesDisplayModal(log.dependencies || '', quote.organisation, quote.id)} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="orange" viewBox="0 0 16 16" class="hold-up-icon" style="display: inline-block; vertical-align: middle; margin-left: 5px; cursor: pointer;">
                          <title>Dependencies: {log.dependencies}</title>
                          <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zM8 4a.905.905 0 0 1 .9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995A.905.905 0 0 1 8 4zm.002 6.022a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                        </svg>
                      {/if}
                    </div>
                    <div style="font-size: 0.85em;">
                      <span>{quote.organisation} - {log?.workStatus || 'Not Started'}</span>
                    </div>
                     {#if quote.email}
                        <div style="margin-top: 2px; font-size: 0.85em;">
                            <a href="mailto:{quote.email}" style="color: inherit; text-decoration: none; font-style: italic;">{quote.email}</a>
                        </div>
                    {/if}
                </td>
                {#each weeks as weekDate (format(weekDate, 'yyyy-MM-dd'))}
                  <td class="data-cell week-col surveyor-cell-clickable" 
                      on:click={() => handleSurveyorCellClick(quote.id, weekDate, `${quote.discipline} - ${quote.organisation}`)}
                      title="Click to add date for this week">
                      <div class="cell-content">
                        <!-- Iterate through items relevant to this quote -->
                        {#each relevantLogItems as item (item.id)}
                            {#if isDateInWeek(item.date, weekDate)}
                                <div 
                                    class="timeline-item {item.type === 'log-custom' ? 'custom-date clickable-custom-date' : (item.title.toLowerCase().includes('site visit') ? 'site-visit' : 'report-draft')}" 
                                    style="background-color: {item.color}1A; border-left: 3px solid {item.color}; color: {item.color};" 
                                    title="{item.type === 'log-custom' ? 'Click to edit: ' : ''}{item.title} ({format(parseISO(item.date), 'd MMM')})"
                                    on:click={item.type === 'log-custom' ? (e) => {
                                      e.stopPropagation();
                                      const log = $currentInstructionLogs.find(l => l.quoteId === item.quoteId);
                                      const customDate = log?.customDates?.find(cd => cd.id === item.customDateId);
                                      if (customDate && item.quoteId) {
                                        handleEditCustomDate(customDate, item.quoteId, `${quote.discipline} - ${quote.organisation}`);
                                      }
                                    } : undefined}
                                    role={item.type === 'log-custom' ? 'button' : undefined}
                                    tabindex={item.type === 'log-custom' ? 0 : undefined}
                                    on:keydown={item.type === 'log-custom' ? (e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.stopPropagation();
                                        const log = $currentInstructionLogs.find(l => l.quoteId === item.quoteId);
                                        const customDate = log?.customDates?.find(cd => cd.id === item.customDateId);
                                        if (customDate && item.quoteId) {
                                          handleEditCustomDate(customDate, item.quoteId, `${quote.discipline} - ${quote.organisation}`);
                                        }
                                      }
                                    } : undefined}
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
        </div>
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

  <!-- Render Surveyor Date Modal -->
  {#if showSurveyorDateModal}
    <SurveyorDateModal
      bind:showModal={showSurveyorDateModal}
      initialDate={selectedSurveyorWeekDate}
      quoteId={selectedSurveyorQuoteId}
      surveyorName={selectedSurveyorName}
      customDateToEdit={customDateBeingEdited}
      on:save={handleSurveyorDateSave}
      on:cancel={handleSurveyorDateCancel}
      on:delete={handleSurveyorDateDelete}
    />
  {/if}

  <!-- Display/Edit Modal for Dependencies Notes -->
  {#if showDependenciesNotesDisplayModal}
    <NotesDisplayModal 
        modalTitle="Dependencies for {currentNotesOrgName}"
        notesPrefix="Dependencies:"
        notes={currentNotesContent}
        organisationName={currentNotesOrgName}
        quoteId={currentNotesQuoteId}
        on:close={() => showDependenciesNotesDisplayModal = false}
        on:save={handleSaveFromDisplay}
    />
  {/if}
</div>

<style>
  /* CSS Imports moved to app.html or +layout.svelte */

  /* Styles adjusted for better height without calendar */
   .programme-container {
    padding: 1rem 2rem; /* Consistent padding */
    display: flex;
    flex-direction: column;
    flex-grow: 1; 
    height: calc(100vh - 150px); /* Adjust as needed */
    overflow: hidden; 
  }
  
  .programme-content {
    flex-grow: 1; 
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    overflow: hidden; /* Change from 'auto' to 'hidden' */
    min-height: 0; 
    padding: 0; /* Remove padding here, add to inner elements if needed */
  }

  .timeline-view {
     padding: 1rem; /* Add padding back */
     height: 100%; /* Make it fill the container */
     display: flex;
     flex-direction: column;
  }

  /* Add the new table scroll container */
  .table-scroll-container {
    overflow: auto; /* This becomes the scrolling element */
    flex-grow: 1;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    min-height: 300px; /* Ensure container has minimum height */
  }

  .timeline-table {
    border-collapse: collapse;
    table-layout: auto; /* Change from fixed to auto for flexible columns */
    margin-bottom: 0; /* Remove margin since container handles spacing */
    min-width: 800px; /* Ensure table has minimum width for columns to be visible */
    width: max-content; /* Let table size to its content */
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
     min-width: 100px; /* Ensure minimum width */
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
      display: block; /* Ensure it takes full width */
      padding: 2px 5px; /* Reduced padding */
      margin-bottom: 3px; /* Space between items */
      border-radius: 4px; 
      font-size: 0.8rem; /* Slightly smaller font */
      line-height: 1.3; 
      border: 1px solid transparent; /* Base border */
      white-space: normal; /* Allow text wrapping */
      word-wrap: break-word; /* Break long words if needed */
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

  .label-content > span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .surveyor-label {
    display: flex;
    align-items: center;
    gap: 0.5rem; /* 8px */
    overflow: hidden; /* To make text-overflow work on the span inside */
  }

  .surveyor-label span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hold-up-icon {
    flex-shrink: 0; /* Prevents the icon from shrinking */
    color: #f59e0b; /* A nice orange color */
    cursor: pointer; /* Make it look clickable */
  }

  .notes-icon {
    flex-shrink: 0; /* Prevents the icon from shrinking */
    color: #007bff; /* A nice blue color for surveyor notes */
    cursor: pointer; /* Make it look clickable */
  }

  .add-event-btn {
    background-color: #dbeafe;
    color: #2563eb;
  }

  /* Clickable surveyor cells */
  .surveyor-cell-clickable {
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .surveyor-cell-clickable:hover {
    background-color: #f8f9fa !important; /* Light grey hover effect */
  }

  /* Ensure completed rows still show hover effect but maintain their green background */
  tbody tr.row-completed .surveyor-cell-clickable:hover {
    background-color: #d4edda !important; /* Slightly darker green on hover for completed rows */
  }

  /* Clickable custom date styling */
  .clickable-custom-date {
    cursor: pointer;
    transition: transform 0.1s ease, box-shadow 0.1s ease;
  }

  .clickable-custom-date:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    opacity: 0.9;
  }

  .clickable-custom-date:focus {
    outline: 2px solid #007bff;
    outline-offset: 2px;
  }
</style> 