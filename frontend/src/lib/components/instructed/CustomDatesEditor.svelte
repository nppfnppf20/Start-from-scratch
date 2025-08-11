<script lang="ts">
  import type { CustomDate } from '$lib/stores/projectStore';
  import { upsertInstructionLog } from '$lib/stores/projectStore';
  import { browser } from '$app/environment';

  export let quoteId: string;
  export let customDates: CustomDate[] | undefined = [];

  function formatDateForInput(dateString: string | undefined | null): string {
    if (!dateString) return '';
    try { return dateString.split('T')[0]; } catch { return ''; }
  }

  async function add() {
    if (!browser) return;
    const newDate: CustomDate = { id: `temp-${Date.now()}`, title: 'New Date', date: new Date().toISOString().split('T')[0] };
    const next = [ ...(customDates || []), newDate ];
    await upsertInstructionLog(quoteId, { customDates: next });
  }

  async function update(customDateId: string, field: 'title' | 'date', value: string) {
    if (!browser || !customDates) return;
    const next = customDates.map(cd => cd.id === customDateId ? { ...cd, [field]: value } : cd);
    await upsertInstructionLog(quoteId, { customDates: next });
  }

  async function remove(customDateId: string) {
    if (!browser || !customDates) return;
    const next = customDates.filter(cd => cd.id !== customDateId);
    await upsertInstructionLog(quoteId, { customDates: next });
  }

  // expose add for parent optional call
  export { add };
</script>

{#if customDates && customDates.length > 0}
  {#each customDates as cd (cd.id)}
    <div class="date-cell-group custom-date-group">
      <div class="custom-date-title-row">
        <input type="text" placeholder="Date Title" class="custom-date-title-input" value={cd.title} on:change={(e) => update(cd.id, 'title', (e.currentTarget as HTMLInputElement).value)} />
      </div>
      <div class="custom-date-input-row">
        <input type="date" class="date-input" value={formatDateForInput(cd.date)} on:change={(e) => update(cd.id, 'date', (e.currentTarget as HTMLInputElement).value)} />
        <button class="delete-custom-date-button" title="Delete custom date" on:click={() => remove(cd.id)}>&times;</button>
      </div>
    </div>
  {/each}
{/if}

<button class="add-custom-date-button" on:click={add} title="Add a new custom date entry">+ Add Date</button>

<style>
  .custom-date-group { border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.5rem; background-color: #f8fafc; }
  .custom-date-title-row { margin-bottom: 0.5rem; }
  .custom-date-title-input { width: 100%; padding: 0.4rem 0.6rem; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 0.85rem; background-color: #fff; }
  .custom-date-input-row { display: flex; align-items: center; gap: 0.5rem; }
  .delete-custom-date-button { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; border-radius: 4px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1.1rem; font-weight: bold; }
  .add-custom-date-button { background-color: #3182ce; color: white; border: none; padding: 0.5rem 0.6rem; font-size: 0.85rem; font-weight: 500; border-radius: 6px; cursor: pointer; margin-top: 0.75rem; }
</style>

