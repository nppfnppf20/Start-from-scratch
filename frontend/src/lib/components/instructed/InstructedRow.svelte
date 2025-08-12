<script lang="ts">
  import type { Quote, InstructionLog, WorkStatus } from '$lib/stores/projectStore';
  import WorkStatusSelect from './WorkStatusSelect.svelte';
  // Dates temporarily managed in Programme view. Keeping imports commented for future reuse.
  // import StandardDates from './StandardDates.svelte';
  // import CustomDatesEditor from './CustomDatesEditor.svelte';
  import NotesButtonWithModal from './NotesButtonWithModal.svelte';
  import LineItemsButton from './LineItemsButton.svelte';

  export let quote: Quote;
  export let log: InstructionLog | undefined;

  $: currentWorkStatus = (log?.workStatus || 'not started') as WorkStatus;
</script>

<tr class:row-completed={currentWorkStatus === 'completed'}>
  <td>{quote.organisation}</td>
  <td>
    <div class="contact-name">{quote.contactName}</div>
    {#if quote.email}
      <a href={`mailto:${quote.email}`} class="contact-email">{quote.email}</a>
    {/if}
  </td>
  <td class="text-center">
    <LineItemsButton items={quote.lineItems} organisationName={quote.organisation} />
  </td>
  <td>
    {#if quote.instructionStatus === 'partially instructed' && quote.partiallyInstructedTotal !== undefined}
      £{quote.partiallyInstructedTotal.toFixed(2)} (Partial)
    {:else}
      £{quote.total.toFixed(2)}
    {/if}
  </td>
  <td>
    <WorkStatusSelect quoteId={quote.id} current={currentWorkStatus} />
  </td>
  <td>
    <NotesButtonWithModal quote={quote} field="dependencies" value={log?.dependencies} />
  </td>
  <td>
    <NotesButtonWithModal quote={quote} field="operationalNotes" value={log?.operationalNotes} />
  </td>
</tr>

<style>
  .row-completed { background-color: #f0fff4; }
  .row-completed td { color: #38a169; }
  .contact-name { font-weight: 500; color: #1a202c; }
  .contact-email { font-size: 0.9em; color: #718096; text-decoration: none; }
  .contact-email:hover { text-decoration: underline; }
  .text-center { text-align: center; }
  /* .date-cell-group { margin-bottom: 0.75rem; } */
</style>

