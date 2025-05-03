<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let selectedFile: File | null = null;
  let documentName = '';
  let selectedCategory = 'Drawing'; // Default category
  const categories = ['Drawing', 'Surveyor Report', 'Other']; // Match categories from main page (excluding 'All')

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      selectedFile = input.files[0];
      documentName = selectedFile.name; // Pre-fill name
    } else {
      selectedFile = null;
      documentName = '';
    }
  }

  function handleSubmit() {
    if (!selectedFile || !documentName || !selectedCategory) {
      alert('Please select a file, enter a name, and choose a category.');
      return;
    }

    // Simulate upload - create a document object
    const newDocument = {
      id: `temp-${Date.now()}`, // Temporary unique ID
      name: documentName,
      type: selectedFile.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
      size: formatBytes(selectedFile.size),
      uploadDate: new Date().toISOString().split('T')[0], // Today's date
      category: selectedCategory,
      file: selectedFile // Keep the actual file object if needed later
    };

    dispatch('uploaddocument', newDocument);
    closeModal();
  }

  function closeModal() {
    // Reset state
    selectedFile = null;
    documentName = '';
    selectedCategory = 'Drawing';
    dispatch('close');
  }

  function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

</script>

<div class="modal-backdrop" on:click|self={closeModal}>
  <div class="modal-content">
    <h2>Upload New Document</h2>

    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label for="file-upload">Select File:</label>
        <input type="file" id="file-upload" on:change={handleFileSelect} required />
      </div>

      {#if selectedFile}
        <div class="file-preview">
          <p>Selected: {selectedFile.name} ({formatBytes(selectedFile.size)})</p>
        </div>
      {/if}

      <div class="form-group">
        <label for="document-name">Document Name:</label>
        <input type="text" id="document-name" bind:value={documentName} required />
      </div>

      <div class="form-group">
        <label for="document-category">Category:</label>
        <select id="document-category" bind:value={selectedCategory} required>
          {#each categories as category}
            <option value={category}>{category}</option>
          {/each}
        </select>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" on:click={closeModal}>Cancel</button>
        <button type="submit" class="btn btn-primary">Upload</button>
      </div>
    </form>

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
    z-index: 1000;
  }

  .modal-content {
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    width: 90%;
    max-width: 500px;
  }

  h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    color: #333;
    text-align: center;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #555;
  }

  .form-group input[type="file"],
  .form-group input[type="text"],
  .form-group select {
    width: 100%;
    padding: 0.6rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box; /* Include padding and border in element's total width and height */
  }

  /* Apply dropdown arrow styling ONLY to the select element */
  .form-group select {
    padding: 0.6rem 2.5rem 0.6rem 0.6rem; /* Adjust right padding for arrow */
    appearance: none; /* Remove default appearance */
    -webkit-appearance: none; /* Safari/Chrome */
    -moz-appearance: none; /* Firefox */
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='currentColor' class='bi bi-chevron-down' viewBox='0 0 16 16'%3E%3Cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E"); /* Add dropdown arrow */
    background-repeat: no-repeat;
    background-position: right 0.75rem center; /* Position the arrow */
    background-size: 1em; /* Size the arrow */
    cursor: pointer; /* Indicate it's clickable */
  }

  /* Style for Firefox / Hide default arrow in IE/Edge */
  .form-group select::-ms-expand {
    display: none;
  }

  .file-preview {
    font-size: 0.9rem;
    color: #666;
    margin-top: -0.5rem; /* Adjust spacing */
    margin-bottom: 1rem;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  .btn {
    padding: 0.6rem 1.2rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }

  .btn-primary {
    background-color: #007bff;
    color: white;
  }
  .btn-primary:hover {
    background-color: #0056b3;
  }

  .btn-secondary {
    background-color: #6c757d;
    color: white;
  }
  .btn-secondary:hover {
    background-color: #5a6268;
  }

</style> 