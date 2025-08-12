<script lang="ts">
  export let saving = false;
  export let justSaved = false;
  export let disabled = false;
  export let onClick: () => void;
  $: buttonText = saving ? 'Saving...' : justSaved ? 'Saved ✓' : 'Save Project Information';
</script>

<div class="savebar">
  <button type="button" class="save-button-header" class:saving={saving} class:saved={justSaved} on:click={onClick} disabled={disabled || saving}>
    {buttonText}
  </button>
</div>

<style>
  .savebar { text-align: center; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; }
  .save-button-header {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 500;
    background-color: #2f855a;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  .save-button-header:hover:not(:disabled) {
    background-color: #276749;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
  .save-button-header:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.5);
  }
  .save-button-header:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  .save-button-header.saving { background-color: #4a5568; }
  .save-button-header.saved { background-color: #38a169; }
</style>

