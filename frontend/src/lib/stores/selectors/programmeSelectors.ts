import { derived } from 'svelte/store';
import { allProgrammeEvents, currentInstructionLogs, currentProjectQuotes, selectedProject, type ProgrammeEvent } from '$lib/stores/projectStore';
import { parseISO, compareAsc } from 'date-fns';
import type { TimelineItem } from '$lib/types/programme';

// All timeline items (manual events + instruction log dates + log custom dates)
export const timelineItems = derived(
  [allProgrammeEvents, currentInstructionLogs, currentProjectQuotes, selectedProject],
  ([$manualEvents, $logs, $quotes, $project]): TimelineItem[] => {
    if (!$project) return [];
    const items: TimelineItem[] = [];
    const projectId = $project.id;

    // Manual
    for (const event of $manualEvents) items.push({ ...event, type: 'manual' } as TimelineItem);

    // Logs
    for (const log of $logs) {
      const quote = $quotes.find(q => q.id === log.quoteId);
      const orgName = quote?.organisation || 'Unknown Org';
      if (log.siteVisitDate) items.push({ id: `log-${log.id}-sv`, date: log.siteVisitDate, title: `Site Visit - ${orgName}`, color: '#ED7D31', type: 'log', projectId, quoteId: log.quoteId });
      if (log.reportDraftDate) items.push({ id: `log-${log.id}-rd`, date: log.reportDraftDate, title: `Report Draft - ${orgName}`, color: '#4472C4', type: 'log', projectId, quoteId: log.quoteId });
      if (log.customDates) {
        for (const cd of log.customDates) {
          if (cd.date) items.push({ id: `log-${log.id}-cd-${cd.id}`, date: cd.date, title: cd.title, color: cd.color || '#6c757d', type: 'log-custom', projectId, quoteId: log.quoteId, customDateId: cd.id });
        }
      }
    }

    items.sort((a, b) => compareAsc(parseISO(a.date), parseISO(b.date)));
    return items;
  }
);

// Index by quoteId
export const timelineItemsByQuoteId = derived(timelineItems, ($items) => {
  const map: Record<string, TimelineItem[]> = Object.create(null);
  for (const item of $items) {
    if (!item.quoteId) continue;
    (map[item.quoteId] ||= []).push(item);
  }
  return map;
});

