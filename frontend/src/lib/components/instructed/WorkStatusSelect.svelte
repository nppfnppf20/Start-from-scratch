<script lang="ts">
  import { upsertInstructionLog, type WorkStatus } from '$lib/stores/projectStore';
  import { browser } from '$app/environment';
  export let quoteId: string;
  export let current: WorkStatus;

  const workStatuses: WorkStatus[] = ['not started', 'in progress', 'completed', 'TRP Reviewing', 'Client reviewing'];

  async function onChange(e: Event & { currentTarget: HTMLSelectElement }) {
    if (!browser) return;
    const newStatus = e.currentTarget.value as WorkStatus;
    await upsertInstructionLog(quoteId, { workStatus: newStatus });
  }
</script>

<select class="work-status-dropdown {current.toLowerCase().replace(/\s+/g, '-')}" value={current} on:change={onChange} title="Set work status">
  {#each workStatuses as status}
    <option value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
  {/each}
</select>

<style>
  .work-status-dropdown {
    padding: 0.3rem 0.5rem; border-radius: 5px; border: 1px solid #cbd5e0; font-size: 0.85rem; background-color: white; cursor: pointer;
    min-width: 120px; appearance: none; -webkit-appearance: none; -moz-appearance: none;
  }
  .work-status-dropdown.not-started { background-color: var(--status-not-started-bg); color: var(--status-not-started-color); border-color: var(--status-not-started-bg); }
  .work-status-dropdown.in-progress { background-color: var(--status-in-progress-bg); color: var(--status-in-progress-color); border-color: var(--status-in-progress-bg); }
  .work-status-dropdown.completed { background-color: var(--status-completed-bg); color: var(--status-completed-color); border-color: var(--status-completed-bg); }
  .work-status-dropdown.trp-reviewing { background-color: var(--status-trp-reviewing-bg); color: var(--status-trp-reviewing-color); border-color: var(--status-trp-reviewing-bg); }
  .work-status-dropdown.client-reviewing { background-color: var(--status-client-reviewing-bg); color: var(--status-client-reviewing-color); border-color: var(--status-client-reviewing-bg); }
</style>

