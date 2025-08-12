import { derived } from 'svelte/store';
import { currentProjectQuotes } from '$lib/stores/projectStore';
import type { Quote } from '$lib/stores/projectStore';

export type ProcessedQuote = Quote & { group: number };

export const processedQuotes = derived(currentProjectQuotes, ($quotes): ProcessedQuote[] => {
  const sorted = [...$quotes].sort((a, b) => (a.discipline || '').localeCompare(b.discipline || ''));
  let groupCounter = 0;
  let last: string | null = null;
  return sorted.map((quote) => {
    if (quote.discipline !== last) {
      groupCounter++;
      last = quote.discipline;
    }
    return { ...quote, group: groupCounter };
  });
});

