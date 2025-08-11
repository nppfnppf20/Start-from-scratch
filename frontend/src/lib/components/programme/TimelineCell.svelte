<script lang="ts">
  import { parseISO, format } from 'date-fns';
  import type { TimelineItem } from '$lib/types/programme';
  import { createEventDispatcher } from 'svelte';

  export let items: TimelineItem[] = [];
  export const weekDate: Date = undefined as any; // unused; keep signature if needed

  function isCustom(item: TimelineItem) { return item.type === 'log-custom'; }
  function classFor(item: TimelineItem) {
    if (item.type === 'log-custom') return 'timeline-item custom-date clickable-custom-date';
    return `timeline-item ${item.title.toLowerCase().includes('site visit') ? 'site-visit' : 'report-draft'}`;
  }

  const dispatch = createEventDispatcher<{ editCustomDate: { quoteId: string; customDateId: string } }>();
</script>

{#each items as item (item.id)}
  <div class={classFor(item)} style={`background-color: ${item.color}1A; border-left: 3px solid ${item.color}; color: ${item.color};`} title={`${isCustom(item) ? 'Click to edit: ' : ''}${item.title} (${format(parseISO(item.date), 'd MMM')})`} on:click={() => { if (isCustom(item) && item.quoteId && item.customDateId) dispatch('editCustomDate', { quoteId: item.quoteId, customDateId: item.customDateId }); }} role={isCustom(item) ? 'button' : undefined}>
    {item.title}
  </div>
{/each}

<style>
  .timeline-item { display: block; padding: 2px 5px; margin-bottom: 3px; border-radius: 4px; font-size: 0.8rem; line-height: 1.3; border: 1px solid transparent; white-space: normal; word-wrap: break-word; cursor: default; }
  .timeline-item.site-visit { background-color: #fff3cd; border-color: #ffeeba; color: #664d03; }
  .timeline-item.report-draft { background-color: #cfe2ff; border-color: #b6d4fe; color: #0a58ca; }
  .timeline-item.custom-date { background-color: #ffe5d0; border-color: #fed8b1; color: #854404; }
  .clickable-custom-date { cursor: pointer; transition: transform 0.1s ease, box-shadow 0.1s ease; }
  .clickable-custom-date:hover { transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0,0,0,0.1); opacity: 0.9; }
  .clickable-custom-date:focus { outline: 2px solid #007bff; outline-offset: 2px; }
</style>

