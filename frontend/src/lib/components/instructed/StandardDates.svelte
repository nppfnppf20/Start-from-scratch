<script lang="ts">
  import { upsertInstructionLog } from '$lib/stores/projectStore';
  import { browser } from '$app/environment';
  export let quoteId: string;
  export let siteVisitDate: string | undefined;
  export let reportDraftDate: string | undefined;

  function formatDateForInput(dateString: string | undefined | null): string {
    if (!dateString) return '';
    try { return dateString.split('T')[0]; } catch { return ''; }
  }

  async function update(field: 'siteVisitDate' | 'reportDraftDate', value: string) {
    if (!browser) return;
    await upsertInstructionLog(quoteId, { [field]: value || undefined });
  }
</script>

<div class="date-cell-group">
  <label for={`site-visit-${quoteId}`} class="date-label">Site Visit</label>
  <input id={`site-visit-${quoteId}`} type="date" class="date-input" value={formatDateForInput(siteVisitDate)} on:change={(e) => update('siteVisitDate', (e.currentTarget as HTMLInputElement).value)} />
</div>
<div class="date-cell-group">
  <label for={`report-draft-${quoteId}`} class="date-label">Draft Report Expected</label>
  <input id={`report-draft-${quoteId}`} type="date" class="date-input" value={formatDateForInput(reportDraftDate)} on:change={(e) => update('reportDraftDate', (e.currentTarget as HTMLInputElement).value)} />
</div>

<style>
  .date-label { display: block; font-size: 0.75rem; color: #4a5568; margin-bottom: 2px; font-weight: 500; }
  .date-input { padding: 0.25rem 0.4rem; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 0.85rem; background-color: #fff; width: 150px; min-width: 130px; }
</style>

