<script lang="ts">
  import { format, parseISO } from 'date-fns';
  import TimelineCell from './TimelineCell.svelte';
  import SurveyorDateModal from '$lib/components/SurveyorDateModal.svelte';
  import NotesDisplayModal from '$lib/components/NotesDisplayModal.svelte';
  import { upsertInstructionLog, currentInstructionLogs } from '$lib/stores/projectStore';
  import { get } from 'svelte/store';
  import type { Quote, InstructionLog } from '$lib/stores/projectStore';
  import type { TimelineItem } from '$lib/types/programme';

  export let row!: { quote: Quote; log: InstructionLog | undefined; itemsByWeek: Record<string, TimelineItem[]>; isCompleted: boolean };
  export let weeks: Date[] = [];

  let showSurveyorDateModal = false;
  let selectedWeekDate: Date | null = null;
  let customDateToEdit: any = null;
  let showNotesModal = false;
  let notesModalContent = '';
  let notesModalTitle = '';
  let notesModalPrefix = '';

  function openAdd(weekDate: Date) { selectedWeekDate = weekDate; customDateToEdit = null; showSurveyorDateModal = true; }
  function openEdit(quoteId: string, customDateId: string) {
    const customDate = row.log?.customDates?.find(cd => cd.id === customDateId);
    if (customDate) { selectedWeekDate = null; customDateToEdit = customDate; showSurveyorDateModal = true; }
  }

  async function handleSaveCustomDate(e: CustomEvent<{ title: string; date: string; color: string; quoteId: string; id?: string }>) {
    const { title, date, color, quoteId, id } = e.detail;
    const logs = get(currentInstructionLogs);
    const existingLog = logs.find(l => l.quoteId === quoteId);
    const existingDates = existingLog?.customDates || [];
    let updatedDates;
    if (id) {
      updatedDates = existingDates.map(cd => cd.id === id ? { ...cd, title, date, color } : cd);
    } else {
      const newId = `cd-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
      updatedDates = [...existingDates, { id: newId, title, date, color }];
    }
    await upsertInstructionLog(quoteId, { customDates: updatedDates });
    showSurveyorDateModal = false;
    selectedWeekDate = null;
    customDateToEdit = null;
  }

  async function handleDeleteCustomDate(e: CustomEvent<{ id: string; quoteId: string }>) {
    const { id, quoteId } = e.detail;
    const logs = get(currentInstructionLogs);
    const existingLog = logs.find(l => l.quoteId === quoteId);
    if (!existingLog?.customDates) { showSurveyorDateModal = false; return; }
    const updatedDates = existingLog.customDates.filter(cd => cd.id !== id);
    await upsertInstructionLog(quoteId, { customDates: updatedDates });
    showSurveyorDateModal = false;
    selectedWeekDate = null;
    customDateToEdit = null;
  }
</script>

<tr class:row-completed={row.isCompleted}>
  <td class="sticky-col data-cell surveyor-name">
    <div style="font-weight: bold; font-size: 0.9em; margin-bottom: 2px; display: flex; align-items: center;">
      <span>{row.quote.discipline}</span>
      {#if row.log && row.log.operationalNotes && row.log.operationalNotes.trim() !== ''}
        <button type="button" class="icon-btn" aria-label="View notes" title={`Surveyor Notes: ${row.log.operationalNotes}`} on:click={() => { notesModalContent = row.log!.operationalNotes || ''; notesModalTitle = `Notes for ${row.quote.organisation}`; notesModalPrefix = 'Notes:'; showNotesModal = true; }}>📝</button>
      {/if}
      {#if row.log && row.log.dependencies && row.log.dependencies.trim() !== ''}
        <button type="button" class="icon-btn" aria-label="View dependencies" title={`Dependencies: ${row.log.dependencies}`} on:click={() => { notesModalContent = row.log!.dependencies || ''; notesModalTitle = `Dependencies for ${row.quote.organisation}`; notesModalPrefix = 'Dependencies:'; showNotesModal = true; }}>⚠️</button>
      {/if}
    </div>
    <div style="font-size: 0.85em;">
      <span>{row.quote.organisation} - {row.log?.workStatus || 'Not Started'}</span>
    </div>
    {#if row.quote.email}
      <div style="margin-top: 2px; font-size: 0.85em;"><a href={`mailto:${row.quote.email}`} style="color: inherit; text-decoration: none; font-style: italic;">{row.quote.email}</a></div>
    {/if}
  </td>
  {#each weeks as weekDate (format(weekDate, 'yyyy-MM-dd'))}
    <td class="data-cell week-col surveyor-cell-clickable" on:click={() => openAdd(weekDate)} title="Click to add date for this week">
      <div class="cell-content">
        <TimelineCell items={row.itemsByWeek[format(weekDate, 'yyyy-MM-dd')] || []} {weekDate} on:editCustomDate={(e) => openEdit(e.detail.quoteId, e.detail.customDateId)} />
      </div>
    </td>
  {/each}
  <td class="data-cell add-week-col"></td>
</tr>

{#if showSurveyorDateModal}
  <SurveyorDateModal
    bind:showModal={showSurveyorDateModal}
    initialDate={selectedWeekDate}
    quoteId={row.quote.id}
    surveyorName={`${row.quote.discipline} - ${row.quote.organisation}`}
    customDateToEdit={customDateToEdit}
    on:save={handleSaveCustomDate}
    on:delete={handleDeleteCustomDate}
    on:cancel={() => (showSurveyorDateModal = false)}
  />
{/if}

{#if showNotesModal}
  <NotesDisplayModal
    modalTitle={notesModalTitle}
    notesPrefix={notesModalPrefix}
    notes={notesModalContent}
    organisationName={row.quote.organisation}
    quoteId={row.quote.id}
    on:close={() => (showNotesModal = false)}
    on:save={async (e) => { await upsertInstructionLog(row.quote.id, { dependencies: e.detail.notes }); showNotesModal = false; }}
  />
{/if}

<style>
  .row-completed td { background-color: #e6f7ec; }
  .sticky-col { position: sticky; left: 0; background: #f8f9fa; }
  .data-cell { vertical-align: top; border: 1px solid #dee2e6; }
  .week-col { min-width: 100px; width: 100px; }
  .cell-content { display: flex; flex-direction: column; gap: 2px; }
  .surveyor-cell-clickable { cursor: pointer; transition: background-color 0.2s ease; }
  .surveyor-cell-clickable:hover { background-color: #f8f9fa; }
  .icon-btn { margin-left: 6px; cursor: pointer; background: transparent; border: none; padding: 0; }
</style>

