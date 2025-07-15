<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let showModal = false;

  const dispatch = createEventDispatcher();

  function closeModal() {
    dispatch('close');
  }
</script>

<div class="modal-backdrop" class:show={showModal}>
  <div class="modal-content">
    <h2>Confirm Fee Quote Request Sent</h2>
    <p>This is the placeholder for the confirmation modal.</p>
    <button on:click={closeModal}>Close</button>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s, visibility 0.3s;
  }
  .modal-backdrop.show {
    opacity: 1;
    visibility: visible;
  }
  .modal-content {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    min-width: 300px;
  }
</style> 