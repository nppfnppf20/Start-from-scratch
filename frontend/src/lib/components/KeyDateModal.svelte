<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let selectedDate: string; // YYYY-MM-DD format

  let title: string = '';
  let color: string = '#007bff'; // Default color (e.g., blue)

  const dispatch = createEventDispatcher<{ save: { title: string; date: string; color: string }, cancel: void }>();

  function handleSave() {
    if (title.trim()) {
      dispatch('save', {
        title: title.trim(),
        date: selectedDate,
        color: color
      });
    } else {
      alert('Please enter a title for the key date.');
    }
  }

  function handleCancel() {
    dispatch('cancel');
  }

  // Predefined color options
  const colors = [
    { name: 'Blue', value: '#007bff' },
    { name: 'Green', value: '#28a745' },
    { name: 'Red', value: '#dc3545' },
    { name: 'Yellow', value: '#ffc107' },
    { name: 'Teal', value: '#20c997' },
    { name: 'Orange', value: '#fd7e14' },
    { name: 'Purple', value: '#6f42c1' },
    { name: 'Gray', value: '#6c757d' }
  ];
</script>

<div class="modal-overlay" on:click|self={handleCancel}> 
  <div class="modal-content">
    <div class="modal-header">
      <h2>Add Key Date for {selectedDate}</h2>
      <button class="close-btn" on:click={handleCancel}>×</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label for="keyDateTitle">Title</label>
        <input type="text" id="keyDateTitle" bind:value={title} placeholder="Enter key date description..." required />
      </div>
      <div class="form-group">
        <label>Color</label>
        <div class="color-selector">
          {#each colors as colorOption}
            <button 
              class="color-swatch" 
              style="background-color: {colorOption.value}" 
              title={colorOption.name}
              class:selected={color === colorOption.value}
              on:click={() => color = colorOption.value}
            >
              {#if color === colorOption.value}✓{/if}
            </button>
          {/each}
          <!-- Optional: Allow custom color input -->
          <!-- <input type="color" bind:value={color} /> -->
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="cancel-btn" on:click={handleCancel}>Cancel</button>
      <button class="submit-btn" on:click={handleSave}>Save Key Date</button>
    </div>
  </div>
</div>

<style>
  /* Reusing some modal styles from reviews, adjust as needed */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background-color: white;
    border-radius: 5px;
    width: 90%;
    max-width: 500px; /* Suitable width */
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    overflow: hidden; /* Prevent content overflow */
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e9ecef;
  }
  
  .modal-header h2 {
    font-size: 1.3rem; 
    margin: 0;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6c757d;
    line-height: 1;
  }
  
  .modal-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.2rem; 
  }
  
  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e9ecef;
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  label {
    font-weight: 500;
    color: #555;
  }
  
  input[type="text"] {
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 1rem;
    width: 100%; 
  }
  
  input[type="text"]:focus {
     outline: none;
     border-color: #80bdff;
     box-shadow: 0 0 0 0.1rem rgba(0, 123, 255, 0.25);
  }

  .color-selector {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
  }

  .color-swatch {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid #fff; /* White border to separate */
      cursor: pointer;
      box-shadow: 0 0 0 1px rgba(0,0,0,0.1); /* Subtle outline */
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 0.9rem;
  }
  
  .color-swatch.selected {
      border-color: #333; /* Darker border when selected */
      box-shadow: 0 0 0 2px rgba(0,0,0,0.3);
  }

  .cancel-btn {
    padding: 0.6rem 1.5rem;
    border: 1px solid #ced4da;
    background-color: white;
    border-radius: 4px;
    color: #495057;
    cursor: pointer;
    font-size: 1rem;
  }
  
  .submit-btn {
    padding: 0.6rem 1.5rem;
    border: none;
    background-color: #007bff;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
  }
  
  .cancel-btn:hover {
    background-color: #f8f9fa;
  }
  
  .submit-btn:hover {
    background-color: #0069d9;
  }
</style> 