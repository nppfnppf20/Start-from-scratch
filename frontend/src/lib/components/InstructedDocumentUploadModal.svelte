<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let showModal = false;
  export let title = 'Upload Document';
  export let quoteId: string;
  export let documentType: 'quote' | 'instruction'; // To differentiate the upload type

  let files: FileList | null = null;
  let documentTitle = ''; // State for the document title
  let version = ''; // State for the version
  let dateUploaded = new Date().toISOString().split('T')[0]; // State for date uploaded, default today
  let description = ''; // State for the description input
  let isUploading = false;
  let errorMessage = '';
  let fileInput: HTMLInputElement; // Variable to bind to the input element

  const dispatch = createEventDispatcher();

  // Function to reset the internal state of the modal
  function resetState() {
    files = null;
    documentTitle = '';
    version = '';
    dateUploaded = new Date().toISOString().split('T')[0];
    description = '';
    errorMessage = '';
    // Explicitly clear the file input element
    if (fileInput) {
      fileInput.value = '';
    }
    // Note: isUploading is now reset reliably within handleUpload
  }

  function close() {
    showModal = false; // This will trigger the reactive statement below
    dispatch('close');
  }

  // Reactive statement to reset state when modal is hidden
  $: if (!showModal) {
    resetState();
  }

  async function handleUpload() {
    if (!files || files.length === 0) {
      errorMessage = 'Please select a file to upload.';
      return;
    }
    if (isUploading) return;

    isUploading = true;
    errorMessage = '';
    const file = files[0];

    // Simulate upload process
    console.log(`Uploading ${documentType} document for quote ${quoteId}:`, 
      `File: ${file.name}`, 
      `Title: ${documentTitle}`, 
      `Version: ${version}`, 
      `Date Uploaded: ${dateUploaded}`, 
      `Description: ${description}`
    );
    try {
      // --- Placeholder for actual upload logic ---
      // Example: You would typically use fetch() here to send the file
      // to your backend endpoint.
      // const formData = new FormData();
      // formData.append('file', file);
      // formData.append('quoteId', quoteId);
      // formData.append('documentType', documentType);
      // formData.append('title', documentTitle);
      // formData.append('version', version);
      // formData.append('dateUploaded', dateUploaded);
      // formData.append('description', description); // Add description to form data
      // const response = await fetch('/api/upload', { method: 'POST', body: formData });
      // if (!response.ok) throw new Error('Upload failed');
      // --- End Placeholder ---

      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

      console.log('Upload successful');

      // Reset isUploading *before* dispatching
      isUploading = false; 

      // Add new fields to the dispatched event
      dispatch('uploadComplete', { 
        quoteId, 
        documentType, 
        fileName: file.name, 
        title: documentTitle, 
        version, 
        dateUploaded, 
        description, 
        url: `/uploads/${file.name}` // Placeholder URL using filename
      });

    } catch (error) {
      console.error('Upload error:', error);
      errorMessage = `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      // Ensure isUploading is reset even on error
      isUploading = false;
    } finally {
       // isUploading is now handled within try/catch blocks for better timing control
       // finally block might still be useful for other cleanup if needed later
    }
  }
</script>

{#if showModal}
<div class="modal-overlay" on:click={close}>
  <div class="modal-content" on:click|stopPropagation>
    <div class="modal-header">
      <h2>{title}</h2>
      <button class="close-btn" on:click={close} disabled={isUploading}>×</button>
    </div>

    <div class="modal-body">
      {#if errorMessage}
        <p class="error-message">{errorMessage}</p>
      {/if}
      <div class="form-group">
        <label for="file-upload">Select File:</label>
        <!-- Bind the input element itself -->
        <input type="file" id="file-upload" bind:files bind:this={fileInput} disabled={isUploading} />
      </div>
       {#if files && files.length > 0}
        <p>Selected file: {files[0].name}</p>
       {/if}
       <!-- New Title Field -->
       <div class="form-group">
         <label for="file-title">Title:</label>
         <input 
            type="text" 
            id="file-title" 
            bind:value={documentTitle} 
            placeholder="E.g. Final Report"
            disabled={isUploading} 
          />
       </div>
       <!-- New Version Field -->
       <div class="form-group">
         <label for="file-version">Version:</label>
         <input 
            type="text" 
            id="file-version" 
            bind:value={version} 
            placeholder="E.g. v1.0"
            disabled={isUploading} 
          />
       </div>
       <!-- New Date Uploaded Field -->
       <div class="form-group">
         <label for="file-date-uploaded">Date Uploaded:</label>
         <input 
            type="date" 
            id="file-date-uploaded" 
            bind:value={dateUploaded} 
            disabled={isUploading} 
          />
       </div>
       <!-- Description Field -->
       <div class="form-group">
         <label for="file-description">Description (Optional):</label>
         <input 
            type="text" 
            id="file-description" 
            bind:value={description} 
            placeholder="E.g. TRP/Client Comments"
            disabled={isUploading} 
          />
       </div>
    </div>

    <div class="modal-footer">
      <button class="cancel-btn" on:click={close} disabled={isUploading}>Cancel</button>
      <button class="submit-btn" on:click={handleUpload} disabled={isUploading || !files || files.length === 0}>
        {#if isUploading}
          Uploading...
        {:else}
          Upload
        {/if}
      </button>
    </div>
  </div>
</div>
{/if}

<style>
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
    z-index: 1050; /* Ensure it's above other modals */
  }

  .modal-content {
    background-color: white;
    border-radius: 5px;
    width: 90%;
    max-width: 500px; /* Smaller max-width for upload */
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
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
  }
   .close-btn:disabled {
     cursor: not-allowed;
     opacity: 0.5;
   }

  .modal-body {
    padding: 1.5rem;
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
    margin-bottom: 1rem;
  }

  label {
    font-weight: 500;
    color: #555;
  }

  input[type="file"],
  input[type="text"], /* Apply styling to text input as well */
  input[type="date"] { /* Apply styling to date input */
    border: 1px solid #ced4da;
    padding: 0.5rem;
    border-radius: 4px;
    width: 100%; /* Make text input full width */
    box-sizing: border-box; /* Include padding and border in element's total width and height */
  }

   input[type="file"]:disabled,
   input[type="text"]:disabled, /* Apply disabled styling to text input */
   input[type="date"]:disabled { /* Apply disabled styling to date input */
     background-color: #e9ecef;
     cursor: not-allowed;
   }

  .cancel-btn {
    padding: 0.6rem 1.2rem;
    border: 1px solid #ced4da;
    background-color: white;
    border-radius: 4px;
    color: #495057;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .submit-btn {
    padding: 0.6rem 1.2rem;
    border: none;
    background-color: #007bff;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
  }

   .submit-btn:disabled,
   .cancel-btn:disabled {
     cursor: not-allowed;
     opacity: 0.65;
   }

  .cancel-btn:hover:not(:disabled) {
    background-color: #f8f9fa;
  }

  .submit-btn:hover:not(:disabled) {
    background-color: #0069d9;
  }

  .error-message {
      color: #dc3545;
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      padding: 0.75rem 1.25rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      font-size: 0.9rem;
  }
</style> 