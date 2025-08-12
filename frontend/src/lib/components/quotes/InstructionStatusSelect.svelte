<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { InstructionStatus } from '$lib/stores/projectStore';

  export let value: InstructionStatus;
  const dispatch = createEventDispatcher<{ change: InstructionStatus }>();

  function onChange(e: Event & { currentTarget: HTMLSelectElement }) {
    dispatch('change', e.currentTarget.value as InstructionStatus);
  }

  const statuses: InstructionStatus[] = ['pending', 'will not be instructed', 'partially instructed', 'instructed'];

  function valueClass(v: InstructionStatus): string {
    if (v === 'instructed') return 'status-instructed';
    if (v === 'partially instructed') return 'status-partially-instructed';
    if (v === 'pending') return 'status-pending';
    return 'status-will-not-be-instructed';
  }
</script>

<select
  class="status-select {valueClass(value)}"
  value={value}
  on:change={onChange}
  aria-label="Instruction status"
>
  {#each statuses as status}
    <option value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
  {/each}
</select>


<style>
  .status-select {
    padding: 0.3rem 0.5rem;
    border-radius: 5px;
    border: 1px solid #cbd5e0;
    font-size: 0.85rem;
    background-color: white;
    cursor: pointer;
    text-align: left;
    min-width: 140px;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23718096'%3E%3Cpath fill-rule='evenodd' d='M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.5rem center;
    background-size: 1em 1em;
  }

  .status-select:focus {
    border-color: #4299e1;
    box-shadow: 0 0 0 1px #4299e1;
    outline: none;
  }

  /* Pill coloring similar to work status dropdown */
  .status-select.status-instructed {
    background-color: #d4edda;
    color: #155724;
    border-color: #d4edda;
    font-weight: 500;
  }
  .status-select.status-partially-instructed {
    background-color: #d4edda;
    color: #155724;
    border-color: #d4edda;
    font-weight: 500;
  }
  .status-select.status-pending {
    background-color: #e2e8f0;
    color: #4a5568;
    border-color: #e2e8f0;
    font-weight: 500;
  }
  .status-select.status-will-not-be-instructed {
    background-color: #fff5f5;
    color: #c53030;
    border-color: #fff5f5;
    font-weight: 500;
  }
</style>

