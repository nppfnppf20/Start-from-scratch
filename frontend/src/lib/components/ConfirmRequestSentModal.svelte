<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let showModal = false;
  let confirmed = false;

  const dispatch = createEventDispatcher();

  function closeModal() {
    dispatch('close');
    // Reset confirmed state when closing manually
    setTimeout(() => {
        confirmed = false;
    }, 300); // delay to allow fade out animation
  }

  function handleConfirm() {
    confirmed = true;
    dispatch('confirmed');
    setTimeout(() => {
      closeModal();
    }, 1500);
  }
</script>

<div class="modal-backdrop" class:show={showModal} on:click={closeModal}>
  <div class="modal-content" on:click|stopPropagation>
    {#if confirmed}
      <div class="confirmed-message">
        <svg class="tick" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
          <circle class="tick-circle" cx="26" cy="26" r="25" fill="none"/>
          <path class="tick-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
        </svg>
        <h2>Confirmed</h2>
      </div>
    {:else}
      <h2>Confirm Request Sent and Grant Permission</h2>
      <p>Please confirm that you have sent the fee quote request email.</p>
      <div class="modal-actions">
        <button class="confirm" on:click={handleConfirm}>Confirm</button>
        <button on:click={closeModal}>Cancel</button>
      </div>
    {/if}
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
    z-index: 1000;
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
    text-align: center;
  }

  .modal-actions {
    margin-top: 1.5rem;
    display: flex;
    justify-content: center;
    gap: 1rem;
  }

  button {
    padding: 0.6rem 1.2rem;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-size: 1rem;
  }

  button.confirm {
    background-color: #4CAF50;
    color: white;
  }

  .confirmed-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .tick {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: block;
    stroke-width: 2;
    stroke: #4CAF50;
    stroke-miterlimit: 10;
    margin: 10% auto;
    box-shadow: inset 0px 0px 0px #4CAF50;
    animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
  }

  .tick-circle {
    stroke-dasharray: 166;
    stroke-dashoffset: 166;
    stroke-width: 2;
    stroke-miterlimit: 10;
    stroke: #4CAF50;
    fill: none;
    animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
  }

  .tick-check {
    transform-origin: 50% 50%;
    stroke-dasharray: 48;
    stroke-dashoffset: 48;
    animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
  }

  @keyframes stroke {
    100% {
      stroke-dashoffset: 0;
    }
  }

  @keyframes scale {
    0%, 100% {
      transform: none;
    }
    50% {
      transform: scale3d(1.1, 1.1, 1);
    }
  }

  @keyframes fill {
    100% {
      box-shadow: inset 0px 0px 0px 40px #4CAF50;
    }
  }
</style> 