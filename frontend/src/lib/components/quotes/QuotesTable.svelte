<script lang="ts">
  import QuoteRow from './QuoteRow.svelte';
  import type { ProcessedQuote } from '$lib/stores/selectors/quotesSelectors';

  export let rows: ProcessedQuote[] = [];
  export let onStatusChange: (quote: ProcessedQuote, newStatus: string) => void;
  export let onEdit: (quote: ProcessedQuote) => void;
  export let onDelete: (quote: ProcessedQuote) => void;
  export let onViewLineItems: (quote: ProcessedQuote) => void;

  let tableContainerElement: HTMLDivElement;
  const scrollLeft = () => tableContainerElement?.scrollBy({ left: -150, behavior: 'smooth' });
  const scrollRight = () => tableContainerElement?.scrollBy({ left: 150, behavior: 'smooth' });
</script>

<div class="table-scroll-wrapper">
  <button class="scroll-btn scroll-btn-left" on:click={scrollLeft} aria-label="Scroll table left">←</button>
  <div class="quotes-table-container" bind:this={tableContainerElement}>
    <table class="quotes-table">
      <thead>
        <tr>
          <th>Discipline</th>
          <th>Organisation</th>
          <th>Contact Name</th>
          <th>Email</th>
          <th>Line Items</th>
          <th>Total (excl. VAT)</th>
          <th>Instruction Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as quote (quote.id)}
          <QuoteRow {quote}
            on:statusChange={(e) => onStatusChange(quote, e.detail)}
            on:viewLineItems={() => onViewLineItems(quote)}
            on:edit={() => onEdit(quote)}
            on:delete={() => onDelete(quote)}
          />
        {/each}
      </tbody>
    </table>
  </div>
  <button class="scroll-btn scroll-btn-right" on:click={scrollRight} aria-label="Scroll table right">→</button>
</div>

<style>
  .table-scroll-wrapper { position: relative; margin-bottom: 2rem; }
  .quotes-table-container { overflow-x: auto; background-color: #fff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
  .quotes-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; white-space: nowrap; }
  .quotes-table th { padding: 0.6rem 0.8rem; text-align: left; border-bottom: 1px solid #e2e8f0; vertical-align: middle; white-space: nowrap; background-color: #f8f9fa; font-weight: 600; color: #4a5568; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
  .scroll-btn { position: absolute; top: 50%; transform: translateY(-50%); z-index: 10; background-color: rgba(255,255,255,0.8); border: 1px solid #cbd5e0; border-radius: 50%; width: 36px; height: 36px; font-size: 1.2rem; cursor: pointer; color: #4a5568; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  .scroll-btn-left { left: -18px; }
  .scroll-btn-right { right: -18px; }
</style>

