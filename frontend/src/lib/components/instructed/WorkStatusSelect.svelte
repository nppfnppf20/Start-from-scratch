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
    padding: 0.3rem 1.6rem 0.3rem 0.5rem; /* add right padding for chevron */
    border-radius: 5px; border: 1px solid #cbd5e0; font-size: 0.85rem; background-color: white; cursor: pointer;
    min-width: 140px; appearance: none; -webkit-appearance: none; -moz-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23718096'%3E%3Cpath fill-rule='evenodd' d='M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06z'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 0.5rem center; background-size: 1em 1em;
  }
  .work-status-dropdown.not-started { background-color: var(--status-not-started-bg); color: var(--status-not-started-color); border-color: var(--status-not-started-bg); }
  .work-status-dropdown.in-progress { background-color: var(--status-in-progress-bg); color: var(--status-in-progress-color); border-color: var(--status-in-progress-bg); }
  .work-status-dropdown.completed { background-color: var(--status-completed-bg); color: var(--status-completed-color); border-color: var(--status-completed-bg); }
  .work-status-dropdown.trp-reviewing { background-color: var(--status-trp-reviewing-bg); color: var(--status-trp-reviewing-color); border-color: var(--status-trp-reviewing-bg); }
  .work-status-dropdown.client-reviewing { background-color: var(--status-client-reviewing-bg); color: var(--status-client-reviewing-color); border-color: var(--status-client-reviewing-bg); }
</style>

