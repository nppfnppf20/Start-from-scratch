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
  import { derived } from 'svelte/store';
  import { startOfWeek, addMonths, addWeeks, format, isBefore, parseISO, endOfWeek } from 'date-fns';
  import ProgrammeTimeline from '$lib/components/programme/ProgrammeTimeline.svelte';
  import { timelineItems, timelineItemsByQuoteId } from '$lib/stores/selectors/programmeSelectors';
  import { isDateInWeek } from '$lib/utils/date';
  
  // CSS imports removed from here

  // let calendarEl: HTMLElement; // Removed
  // let calendar: Calendar; // Removed

  // Modal State - Removed
  // let showKeyDateModal = false; 
  // let selectedDateStr: string | null = null; 

  const DEBUG = false;

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

  // timelineItems and timelineItemsByQuoteId imported from selectors

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

  // Manual events bucketed by week key
  $: manualEventsByWeek = Object.fromEntries(
    weeks.map((w) => [format(w, 'yyyy-MM-dd'), ($currentProjectManualEvents || []).filter((e) => isDateInWeek(e.date, w))])
  );

  // Rows data: per quote, build itemsByWeek from indexed items
  $: rows = ($instructedSurveyors || []).map((quote) => {
    const log = $currentInstructionLogs.find((l) => l.quoteId === quote.id);
    const isCompleted = log?.workStatus === 'completed';
    const itemsForQuote = ($timelineItemsByQuoteId?.[quote.id] || []).filter((i) => i.type === 'log' || i.type === 'log-custom');
    const itemsByWeek: Record<string, any[]> = {};
    for (const w of weeks) {
      const key = format(w, 'yyyy-MM-dd');
      itemsByWeek[key] = itemsForQuote.filter((i) => isDateInWeek(i.date, w));
    }
    return { quote, log, itemsByWeek, isCompleted };
  });

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
  // isDateInWeek imported from utils/date

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
        <ProgrammeTimeline {weeks} rows={rows} manualEventsByWeek={manualEventsByWeek}>
          <button slot="extend" on:click={extendTimeline} title="Add one month">+</button>
        </ProgrammeTimeline>
      {:else}
         <p>No instructed surveyors or key dates found for this project.</p>
      {/if}
    </div>
  {:else}
    <p>Please select a project to view the programme.</p>
  {/if}

  <!-- Modals moved into components (KeyDatesHeader / SurveyorRow) to reduce page coupling -->
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
  /* Table/row/item styles moved into ProgrammeTimeline component and children */
</style> 