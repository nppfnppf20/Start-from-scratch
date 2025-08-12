<script lang="ts">
  import InstructedRow from './InstructedRow.svelte';
  import type { Quote, InstructionLog } from '$lib/stores/projectStore';

  export let quotes: Quote[] = [];
  export let logsByQuoteId: Record<string, InstructionLog> = {};

  // local scroll ref
  let tableContainerElement: HTMLDivElement;

  function scrollLeft() {
    tableContainerElement?.scrollBy({ left: -150, behavior: 'smooth' });
  }

  function scrollRight() {
    tableContainerElement?.scrollBy({ left: 150, behavior: 'smooth' });
  }
</script>

<div class="table-scroll-wrapper">
  <button class="scroll-btn scroll-btn-left" on:click={scrollLeft} aria-label="Scroll table left">←</button>
  <div class="table-container" bind:this={tableContainerElement}>
    <table>
      <thead>
        <tr>
          <th>Organisation</th>
          <th>Contact</th>
          <th>Line Items</th>
          <th>Quote Amt.</th>
          <th>Work Status</th>
          <th>Dependencies</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        {#each quotes as quote (quote.id)}
          <InstructedRow {quote} log={logsByQuoteId[quote.id]} />
        {/each}
      </tbody>
    </table>
  </div>
  <button class="scroll-btn scroll-btn-right" on:click={scrollRight} aria-label="Scroll table right">→</button>
</div>

<style>
  .table-scroll-wrapper { position: relative; margin-bottom: 2rem; }
  .table-container {
    overflow-x: auto;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border: 1px solid #e2e8f0;
  }
  table { width: 100%; border-collapse: collapse; font-size: 0.9rem; white-space: nowrap; }
  th { padding: 0.6rem 0.8rem; text-align: left; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
  th { background-color: #f8f9fa; font-weight: 600; color: #4a5568; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.75rem; }
  .scroll-btn {
    position: absolute; top: 50%; transform: translateY(-50%); z-index: 10;
    background-color: rgba(255, 255, 255, 0.8); border: 1px solid #cbd5e0; border-radius: 50%; width: 36px; height: 36px;
    font-size: 1.2rem; cursor: pointer; color: #4a5568; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  .scroll-btn-left { left: -18px; }
  .scroll-btn-right { right: -18px; }
</style>

