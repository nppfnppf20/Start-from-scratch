<script lang="ts">
  import KeyDatesHeader from './KeyDatesHeader.svelte';
  import SurveyorRow from './SurveyorRow.svelte';
  import type { ProgrammeEvent, Quote, InstructionLog } from '$lib/stores/projectStore';
  import type { TimelineItem } from '$lib/types/programme';
  import { format } from 'date-fns';

  export let weeks: Date[] = [];
  export let manualEventsByWeek: Record<string, ProgrammeEvent[]> = {};
  export let rows: Array<{ quote: Quote; log: InstructionLog | undefined; itemsByWeek: Record<string, TimelineItem[]>; isCompleted: boolean } > = [];

  const weekKey = (d: Date) => format(d, 'yyyy-MM-dd');
</script>

<div class="table-scroll-container">
  <table class="timeline-table">
    <thead>
      <tr>
        <th class="sticky-col header-cell surveyor-header"></th>
        {#each weeks as weekDate (weekKey(weekDate))}
          <th class="header-cell week-col">w/c {format(weekDate, 'd MMM')}</th>
        {/each}
        <th class="header-cell add-week-col">
          <slot name="extend"></slot>
        </th>
      </tr>
      <KeyDatesHeader {weeks} {manualEventsByWeek} />
    </thead>
    <tbody>
      {#each rows as row (row.quote.id)}
        <SurveyorRow {row} {weeks} />
      {/each}
    </tbody>
  </table>
</div>

<style>
  .table-scroll-container { overflow: auto; flex-grow: 1; border: 1px solid #dee2e6; border-radius: 4px; min-height: 300px; }
  .timeline-table { border-collapse: collapse; table-layout: auto; margin-bottom: 0; min-width: 800px; width: max-content; }
  .timeline-table th { border: 1px solid #dee2e6; padding: 0.5rem; text-align: left; font-size: 0.9rem; white-space: nowrap; }
  .timeline-table thead th { background-color: #f8f9fa; position: sticky; z-index: 2; }
  thead tr:first-child th { top: 0; }
  thead tr:nth-child(2) th { top: 38px; }
  .sticky-col { position: sticky; left: 0; background-color: #f8f9fa; z-index: 1; width: 200px; overflow: hidden; text-overflow: ellipsis; }
  thead .sticky-col { z-index: 3; }
  thead tr:first-child th.sticky-col, thead tr:nth-child(2) th.sticky-col { z-index: 4; }
  .header-cell { text-align: center; vertical-align: middle; font-weight: bold; }
  .week-col { min-width: 100px; width: 100px; }
  .add-week-col { width: 50px; padding: 0; }
</style>

