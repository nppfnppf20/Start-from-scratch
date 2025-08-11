<script lang="ts">
  import NotesModal from '$lib/components/NotesModal.svelte';
  import { upsertInstructionLog, type Quote } from '$lib/stores/projectStore';
  import { browser } from '$app/environment';

  export let quote: Quote;
  export let field: 'operationalNotes' | 'dependencies';
  export let value: string | undefined = '';

  let open = false;
  let draft = value || '';

  $: if (value !== undefined) draft = value || '';

  function openModal() { open = true; }
  function closeModal() { open = false; }

  async function save(e: CustomEvent<{ notes: string }>) {
    if (!browser) return;
    await upsertInstructionLog(quote.id, { [field]: e.detail.notes } as any);
    closeModal();
  }

  function getPreview(notes: string | undefined) {
    if (!notes || notes.trim() === '') return 'Add notes...';
    const firstLine = notes.split('\n')[0];
    return firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine;
  }
</script>

<button class="notes-button" on:click={openModal} title="Edit notes">{getPreview(value)}</button>

{#if open}
  <NotesModal initialNotes={draft} organisationName={quote.organisation} on:save={save} on:cancel={closeModal} />
{/if}

<style>
  .notes-button { padding: 0.3rem 0.6rem; font-size: 0.8rem; border-radius: 5px; border: 1px solid #cbd5e0; text-align: left; cursor: pointer; font-style: italic; color: #555; min-height: 40px; }
</style>

