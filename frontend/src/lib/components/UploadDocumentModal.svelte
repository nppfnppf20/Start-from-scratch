<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  // --- Props --- 
  export let projectId: string; // *** ADDED: Need projectId to link upload ***

  // --- State --- 
  let selectedFile: File | null = null;
  let documentName = ''; // User-provided title/name
  let documentDescription = ''; // *** ADDED: For optional description ***
  // Category removed
  let isUploading = false; // For loading state
  let errorMessage = ''; // For displaying errors
  let fileInputRef: HTMLInputElement; // To reset file input

  function handleFileSelect(event: Event) {
    errorMessage = ''; // Clear error on new selection
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      selectedFile = input.files[0];
      // Pre-fill name, but allow user override if field is empty
      if (!documentName) {
          documentName = selectedFile.name;
      }
    } else {
      selectedFile = null;
      // Don't clear documentName automatically if user typed something
    }
  }

  // *** REFACTORED handleSubmit for real upload ***
  async function handleSubmit() {
    if (!selectedFile || !documentName || !projectId) {
      errorMessage = 'Please select a file, enter a title, and ensure a project context exists.';
      return;
    }
    if (isUploading) return; // Prevent double submission

    isUploading = true;
    errorMessage = '';

    // Create FormData
    const formData = new FormData();
    formData.append('file', selectedFile); // Key must match upload.single('file')
    formData.append('projectId', projectId);
    formData.append('title', documentName); // Map documentName to title
    formData.append('description', documentDescription); // Send description

    console.log('Uploading file with data:', { 
        fileName: selectedFile.name,
        projectId,
        title: documentName,
        description: documentDescription
     });

    try {
        // Use API_BASE_URL which should be imported below
        const response = await fetch(`${API_BASE_URL}/api/uploads`, { 
            method: 'POST',
            body: formData,
            // ** IMPORTANT: Do NOT set Content-Type header for FormData **
        });

        const responseData = await response.json();

        if (!response.ok) {
             // Use error message from backend if available
            const errorMsg = responseData.msg || `Upload failed with status: ${response.status}`;
            const validationErrors = responseData.errors ? ` (${responseData.errors.join(', ')})` : '';
            throw new Error(errorMsg + validationErrors);
        }

        console.log('Upload successful, response:', responseData);

        // Dispatch event with the actual saved metadata from the backend
        // Use mapMongoId which should be imported below
        dispatch('uploaddocument', mapMongoId(responseData)); 
        closeModalAndReset(); // Close and reset state on success

    } catch (error) {
        console.error('Upload error:', error);
        errorMessage = error instanceof Error ? error.message : 'An unknown upload error occurred.';
    } finally {
        isUploading = false; // Ensure loading state is turned off
    }
  }

  // Renamed for clarity
  function closeModalAndReset() {
    // Reset state
    selectedFile = null;
    documentName = '';
    documentDescription = '';
    errorMessage = '';
    isUploading = false;
    // Reset the actual file input element
    if (fileInputRef) {
        fileInputRef.value = '';
    }
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
  
  // Import required utilities from store
  // NOTE: Make sure projectStore EXPORTS these!
  import { API_BASE_URL, mapMongoId } from "$lib/stores/projectStore"; 

</script>

<div class="modal-backdrop" on:click|self={closeModalAndReset}>
  <div class="modal-content">
    <h2>Upload New Document</h2>

    <form on:submit|preventDefault={handleSubmit}>
      {#if errorMessage}
        <p class="error-message">Error: {errorMessage}</p>
      {/if}
      
      <div class="form-group">
        <label for="file-upload">Select File:</label>
        <!-- Add bind:this to get input element reference -->
        <input type="file" id="file-upload" on:change={handleFileSelect} required bind:this={fileInputRef} disabled={isUploading}/>
      </div>

      {#if selectedFile}
        <div class="file-preview">
          <p>Selected: {selectedFile.name} ({formatBytes(selectedFile.size)})</p>
        </div>
      {/if}

      <div class="form-group">
        <label for="document-name">Document Title:</label> <!-- Changed label -->
        <input type="text" id="document-name" bind:value={documentName} required disabled={isUploading}/>
      </div>

       <!-- Added Description Field -->
       <div class="form-group">
        <label for="document-description">Description (Optional):</label>
        <textarea id="document-description" rows="3" bind:value={documentDescription} disabled={isUploading}></textarea>
      </div>

      <!-- Removed Category Section -->

      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" on:click={closeModalAndReset} disabled={isUploading}>Cancel</button>
        <button type="submit" class="btn btn-primary" disabled={!selectedFile || isUploading}>
            {#if isUploading}Uploading...{:else}Upload{/if}
        </button>
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

  .error-message {
      color: #dc3545; /* Red */
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      padding: 0.75rem 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      font-size: 0.9em;
  }

    textarea {
      width: 100%;
      padding: 0.6rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-sizing: border-box; 
      font-family: inherit;
      resize: vertical;
      min-height: 60px;
  }
</style> 