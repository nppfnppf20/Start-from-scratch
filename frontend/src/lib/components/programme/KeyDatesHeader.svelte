<script lang="ts">
  import { format, parseISO } from 'date-fns';
  import { selectedProject, addProgrammeEvent, updateProgrammeEvent, deleteProgrammeEvent, type ProgrammeEvent } from '$lib/stores/projectStore';
  import TimelineKeyDateModal from '$lib/components/TimelineKeyDateModal.svelte';

  export let weeks: Date[] = [];
  export let manualEventsByWeek: Record<string, ProgrammeEvent[]> = {};

  let showModal = false;
  let selectedWeek: Date | null = null;
  let eventBeingEdited: ProgrammeEvent | null = null;

  function openAdd(week: Date) { selectedWeek = week; eventBeingEdited = null; showModal = true; }
  function openEdit(event: ProgrammeEvent) { selectedWeek = null; eventBeingEdited = event; showModal = true; }
  function close() { showModal = false; selectedWeek = null; eventBeingEdited = null; }
</script>

<tr>
  <th class="sticky-col header-cell key-dates-header">Key Dates</th>
  {#each weeks as weekDate (format(weekDate, 'yyyy-MM-dd'))}
    <th class="header-cell key-date-cell">
      <div class="key-dates-container">
        {#each manualEventsByWeek[format(weekDate, 'yyyy-MM-dd')] || [] as event (event.id)}
          <div class="timeline-key-event" style="background-color: {event.color}; border-left: 3px solid {event.color === '#ffffff' ? '#ccc' : event.color};" title="{event.title} ({format(parseISO(event.date), 'd MMM')}) - Click to edit" on:click={() => openEdit(event)} role="button" tabindex="0" on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') openEdit(event); }}>{event.title}</div>
        {/each}
      </div>
      <button class="add-key-date-btn" title={`Add key date for w/c ${format(weekDate, 'd MMM')}`} on:click={() => openAdd(weekDate)}>+</button>
    </th>
  {/each}
  <th class="header-cell add-week-col"></th>
</tr>

{#if showModal}
  <TimelineKeyDateModal 
    bind:showModal={showModal} 
    initialDate={selectedWeek} 
    eventToEdit={eventBeingEdited}
    on:save={(e) => {
      const { title, date, color, id } = e.detail;
      if (!$selectedProject) return;
      if (id && eventBeingEdited) {
        updateProgrammeEvent({ ...eventBeingEdited, title, date, color });
      } else {
        addProgrammeEvent({ projectId: $selectedProject.id, title, date, color });
      }
      showModal = false; selectedWeek = null; eventBeingEdited = null;
    }}
    on:delete={(e) => {
      const { id } = e.detail;
      if (id) deleteProgrammeEvent(id);
      showModal = false; selectedWeek = null; eventBeingEdited = null;
    }}
    on:cancel={() => { showModal = false; selectedWeek = null; eventBeingEdited = null; }}
  />
{/if}

<style>
  .key-date-cell { padding: 0.1rem; vertical-align: top; position: relative; min-height: 40px; }
  .key-dates-container { margin-bottom: 2px; min-height: 20px; }
  .timeline-key-event { font-size: 0.75em; padding: 1px 4px; border-radius: 3px; margin-bottom: 2px; white-space: normal; color: #333; border: 1px solid rgba(0,0,0,0.1); line-height: 1.3; display: block; cursor: pointer; }
  .add-key-date-btn { width: 20px; height: 20px; border-radius: 50%; border: 1px solid #adb5bd; background: #e9ecef; cursor: pointer; font-size: 0.9rem; font-weight: bold; color: #495057; display: inline-flex; align-items: center; justify-content: center; padding: 0; line-height: 1; margin-top: 2px; }
  .add-key-date-btn:hover { background: #ced4da; border-color: #6c757d; }
</style>

