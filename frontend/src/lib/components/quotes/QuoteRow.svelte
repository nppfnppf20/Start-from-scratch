<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ProcessedQuote } from '$lib/stores/selectors/quotesSelectors';
  import InstructionStatusSelect from './InstructionStatusSelect.svelte';
  import LineItemsButton from '$lib/components/instructed/LineItemsButton.svelte';

  export let quote: ProcessedQuote;
  const dispatch = createEventDispatcher<{ statusChange: string; viewLineItems: void; edit: void; delete: void }>();

  const handleStatusChange = (e: Event & { currentTarget: HTMLSelectElement }) => {
    dispatch('statusChange', e.currentTarget.value);
  };
</script>

<tr class:group-odd={quote.group % 2 !== 0}>
  <td>{quote.discipline}</td>
  <td>{quote.organisation}</td>
  <td>{quote.contactName}</td>
  <td><a href={`mailto:${quote.email}`}>{quote.email}</a></td>
  <td class="text-center">
    <LineItemsButton items={quote.lineItems} organisationName={quote.organisation} />
  </td>
  <td class="text-right">£{quote.total.toFixed(2)}</td>
  <td>
    <InstructionStatusSelect value={quote.instructionStatus} on:change={(e: CustomEvent<string>) => dispatch('statusChange', e.detail)} />
  </td>
  <td class="action-cell">
    <button class="action-btn delete-btn" title="Delete Quote" on:click={() => dispatch('delete')}>Delete</button>
    <button class="action-btn edit-btn" title="Edit Quote" on:click={() => dispatch('edit')}>Edit</button>
  </td>
</tr>

<style>
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  /* line items button styling provided by shared component */
  /* status select styles live in InstructionStatusSelect */
  .action-cell { text-align: right; white-space: nowrap; }
  .action-btn { padding: 0.25rem 0.5rem; margin-left: 0.3rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem; }
  .edit-btn { background-color: #3182ce; color: white; }
  .delete-btn { background-color: #e53e3e; color: white; }
</style>

