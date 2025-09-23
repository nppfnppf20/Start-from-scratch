<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Props for table configuration
  export let data: any[] = [];
  export let columns: TableColumn[] = [];
  export let isLoading: boolean = false;
  export let error: string | null = null;
  export let searchPlaceholder: string = "Search...";
  export let emptyMessage: string = "No data available";
  export let showSearch: boolean = true;
  export let showActions: boolean = true;
  export let minWidth: string = "800px";

  // Table column interface
  export interface TableColumn {
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
    align?: 'left' | 'center' | 'right';
    className?: string;
    render?: (value: any, item: any) => string;
    colspan?: number;
    rowspan?: number;
    subHeaders?: TableColumn[];
  }

  // State
  let searchText = '';
  let sortKey: string = '';
  let sortDirection: 'asc' | 'desc' = 'asc';
  let displayData: any[] = [];

  const dispatch = createEventDispatcher();

  // Helper function to get nested property value
  function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Sorting function
  function setSortKey(key: string) {
    if (sortKey === key) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = key;
      sortDirection = 'asc';
    }
  }

  // Reactive data processing
  $: displayData = (() => {
    let result = [...data];

    // Apply search filter
    if (searchText.trim() !== '') {
      const lowercasedFilter = searchText.toLowerCase();
      result = result.filter(item =>
        columns.some(column => {
          const value = getNestedValue(item, column.key);
          return value && String(value).toLowerCase().includes(lowercasedFilter);
        })
      );
    }

    // Apply sorting
    if (sortKey) {
      result.sort((a, b) => {
        const valA = getNestedValue(a, sortKey);
        const valB = getNestedValue(b, sortKey);

        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        let comparison = 0;
        const numA = Number(valA);
        const numB = Number(valB);

        if (!isNaN(numA) && !isNaN(numB)) {
          comparison = numA - numB;
        } else if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = valA.localeCompare(valB);
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  })();

  // Event handlers
  function handleRowClick(item: any, index: number) {
    dispatch('rowClick', { item, index });
  }

  function handleAction(action: string, item: any) {
    dispatch('action', { action, item });
  }

  function handleRetry() {
    dispatch('retry');
  }
</script>

<div class="data-table-container">
  {#if error}
    <div class="error-message">
      <p>{error}</p>
      <button on:click={handleRetry} class="retry-btn">Retry</button>
    </div>
  {:else if isLoading}
    <div class="loading-message">
      <p>Loading data...</p>
    </div>
  {:else}
    {#if showSearch}
      <div class="controls-container">
        <input
          type="text"
          bind:value={searchText}
          placeholder={searchPlaceholder}
          class="filter-input"
        />
        <slot name="controls" />
      </div>
    {/if}

    {#if displayData.length === 0 && searchText}
      <div class="empty-state">
        <p>No data matches your search "{searchText}".</p>
      </div>
    {:else if displayData.length === 0}
      <div class="empty-state">
        <p>{emptyMessage}</p>
      </div>
    {:else}
      <div class="table-container">
        <table class="data-table" style="min-width: {minWidth}">
          <thead>
            <!-- Main headers row -->
            <tr>
              {#each columns as column}
                <th
                  rowspan={column.rowspan || (column.subHeaders ? 1 : 2)}
                  colspan={column.colspan || 1}
                  class={column.className || ''}
                  class:text-center={column.align === 'center'}
                  class:text-right={column.align === 'right'}
                >
                  {#if column.sortable}
                    <button on:click={() => setSortKey(column.key)} class="sort-button">
                      {column.label}
                      {#if sortKey === column.key}
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      {/if}
                    </button>
                  {:else}
                    {column.label}
                  {/if}
                </th>
              {/each}
            </tr>

            <!-- Sub-headers row if any column has subHeaders -->
            {#if columns.some(col => col.subHeaders)}
              <tr>
                {#each columns as column}
                  {#if column.subHeaders}
                    {#each column.subHeaders as subHeader}
                      <th
                        class="sub-header {subHeader.className || ''}"
                        class:text-center={subHeader.align === 'center'}
                        class:text-right={subHeader.align === 'right'}
                      >
                        {#if subHeader.sortable}
                          <button on:click={() => setSortKey(subHeader.key)} class="sort-button">
                            {subHeader.label}
                            {#if sortKey === subHeader.key}
                              {sortDirection === 'asc' ? '▲' : '▼'}
                            {/if}
                          </button>
                        {:else}
                          {subHeader.label}
                        {/if}
                      </th>
                    {/each}
                  {/if}
                {/each}
              </tr>
            {/if}
          </thead>
          <tbody>
            {#each displayData as item, index}
              <tr on:click={() => handleRowClick(item, index)}>
                {#each columns as column}
                  {#if !column.subHeaders}
                    <td
                      class={column.className || ''}
                      class:text-center={column.align === 'center'}
                      class:text-right={column.align === 'right'}
                      style={column.width ? `width: ${column.width}` : ''}
                    >
                      <slot name="cell" {column} {item} {index}>
                        {#if column.render}
                          {@html column.render(getNestedValue(item, column.key), item)}
                        {:else}
                          {getNestedValue(item, column.key) ?? '-'}
                        {/if}
                      </slot>
                    </td>
                  {:else}
                    {#each column.subHeaders as subColumn}
                      <td
                        class="{subColumn.className || ''}"
                        class:text-center={subColumn.align === 'center'}
                        class:text-right={subColumn.align === 'right'}
                        style={subColumn.width ? `width: ${subColumn.width}` : ''}
                      >
                        <slot name="cell" column={subColumn} {item} {index}>
                          {#if subColumn.render}
                            {@html subColumn.render(getNestedValue(item, subColumn.key), item)}
                          {:else}
                            {getNestedValue(item, subColumn.key) ?? '-'}
                          {/if}
                        </slot>
                      </td>
                    {/each}
                  {/if}
                {/each}

                {#if showActions}
                  <td class="actions-cell">
                    <slot name="actions" {item} {index} {handleAction}>
                      <button class="action-btn" on:click|stopPropagation={() => handleAction('edit', item)}>
                        Edit
                      </button>
                      <button class="action-btn delete" on:click|stopPropagation={() => handleAction('delete', item)}>
                        Delete
                      </button>
                    </slot>
                  </td>
                {/if}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
</div>

<style>
  .data-table-container {
    padding: 0;
  }

  .error-message, .loading-message {
    padding: 1rem;
    border-radius: 6px;
    text-align: center;
    margin-bottom: 1rem;
  }

  .error-message {
    background-color: #fed7d7;
    border: 1px solid #feb2b2;
    color: #c53030;
  }

  .loading-message {
    background-color: #e6fffa;
    border: 1px solid #81e6d9;
    color: #285e61;
  }

  .retry-btn {
    margin-left: 1rem;
    padding: 0.5rem 1rem;
    background: #c53030;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .controls-container {
    margin-bottom: 1.5rem;
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .filter-input {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    border-radius: 6px;
    border: 1px solid #cbd5e0;
    width: 100%;
    max-width: 400px;
  }

  .empty-state {
    padding: 2rem;
    background-color: #f7fafc;
    border: 1px dashed #cbd5e0;
    border-radius: 6px;
    text-align: center;
    color: #a0aec0;
  }

  .table-container {
    overflow: auto;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: white;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
  }

  .data-table th,
  .data-table td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
    white-space: nowrap;
    vertical-align: top;
    font-size: 0.85rem;
  }

  .data-table th {
    background-color: #f7fafc;
    font-size: 0.75rem;
    font-weight: 600;
    color: #4a5568;
    vertical-align: middle;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .sort-button {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    font: inherit;
    color: inherit;
    cursor: pointer;
    text-align: left;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .sort-button:hover {
    color: #000;
  }

  .sub-header {
    font-size: 0.7rem !important;
    font-weight: 500 !important;
    border-top: 1px solid #e2e8f0;
    text-align: center;
  }

  .sub-header .sort-button {
    justify-content: center;
  }

  .data-table tbody tr:last-child td {
    border-bottom: none;
  }

  .data-table tbody tr:hover {
    background-color: #f7fafc;
  }

  .text-center {
    text-align: center;
  }

  .text-right {
    text-align: right;
  }

  .divider-left {
    border-left: 1px solid #e2e8f0;
  }

  .divider-right {
    border-right: 1px solid #e2e8f0;
  }

  .actions-cell {
    white-space: nowrap;
  }

  .action-btn {
    padding: 6px 12px;
    font-size: 0.875rem;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    border: 1px solid transparent;
    background-color: transparent;
    margin-right: 5px;
    border-color: #007bff;
    color: #007bff;
  }

  .action-btn:hover {
    background-color: #007bff;
    color: white;
  }

  .action-btn.delete {
    border-color: #dc3545;
    color: #dc3545;
  }

  .action-btn.delete:hover {
    background-color: #dc3545;
    color: white;
  }
</style>