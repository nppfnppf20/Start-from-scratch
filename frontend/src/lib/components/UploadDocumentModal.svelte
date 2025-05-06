<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let selectedFile: File | null = null;
  let documentName = '';
  let selectedCategory = 'Drawing'; // Default category
  const categories = ['Drawing', 'Surveyor Report', 'Other']; 

  // --- New state variables ---
  let isUploading = false;
  let errorMessage = '';
  // ---

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      selectedFile = input.files[0];
      // Don't pre-fill name automatically? Or maybe keep it? Keeping it for now.
      if (!documentName) { // Only pre-fill if name is empty
          documentName = selectedFile.name; 
      }
    } else {
      selectedFile = null;
      // documentName = ''; // Don't clear name if file is deselected? User might have typed one.
    }
  }

  // --- Modified handleSubmit ---
  async function handleSubmit() { 
    if (!selectedFile || !documentName || !selectedCategory) {
      errorMessage = 'Please select a file, enter a name, and choose a category.';
      alert(errorMessage); // Use alert or display errorMessage in the modal
      return;
    }
    if (isUploading) return;

    isUploading = true;
    errorMessage = '';

    const formData = new FormData();
    formData.append('file', selectedFile);
    // Add other relevant data - backend ignores now, but good practice
    formData.append('name', documentName); 
    formData.append('category', selectedCategory);

    console.log('Uploading document:', { name: documentName, category: selectedCategory, file: selectedFile.name });

    try {
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
            const errBody = await response.json();
            errorMsg = errBody.msg || errBody.message || errorMsg;
        } catch (e) { /* Ignore */ }
        throw new Error(errorMsg);
      }

      const result = await response.json();
      console.log('Upload successful, backend response:', result);

      // Construct the payload for the event using backend result + form data
      const uploadedDocumentData = {
        id: `doc-${Date.now()}`, // Still generate a temporary unique ID for the list key? Or use backend ID if available? Using temp for now.
        name: documentName, // Use the name entered by the user
        type: result.mimetype || selectedFile.type, // Get type from backend response or file
        size: formatBytes(result.size || selectedFile.size), // Get size from backend response or file
        uploadDate: new Date().toISOString().split('T')[0], // Use today's date for now
        category: selectedCategory, // Use the category selected by the user
        url: result.url, // *** Use the URL from the backend ***
        originalFilename: result.originalName // Store original filename if needed
      };

      dispatch('uploaddocument', uploadedDocumentData);
      closeModal(); // Close on success

    } catch (error) {
      console.error('Upload error:', error);
      errorMessage = `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      // Display errorMessage in the modal is better than alert
    } finally {
      isUploading = false; // Reset loading state regardless of success/failure
    }
  }

  function closeModal() {
    // Reset state
    selectedFile = null;
    documentName = '';
    selectedCategory = 'Drawing';
    isUploading = false; // Ensure reset here too
    errorMessage = '';
    // TODO: Clear file input visually if possible/needed
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

    <!-- Display Error Message -->
    {#if errorMessage}
        <p class="error-message">{errorMessage}</p>
    {/if}

    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label for="file-upload">Select File:</label>
        <!-- Disable input while uploading -->
        <input type="file" id="file-upload" on:change={handleFileSelect} required disabled={isUploading} />
      </div>

      {#if selectedFile}
        <div class="file-preview">
          <p>Selected: {selectedFile.name} ({formatBytes(selectedFile.size)})</p>
        </div>
      {/if}

      <div class="form-group">
        <label for="document-name">Document Name:</label>
        <!-- Disable input while uploading -->
        <input type="text" id="document-name" bind:value={documentName} required disabled={isUploading} />
      </div>

      <div class="form-group">
        <label for="document-category">Category:</label>
        <!-- Disable select while uploading -->
        <select id="document-category" bind:value={selectedCategory} required disabled={isUploading}>
          {#each categories as category}
            <option value={category}>{category}</option>
          {/each}
        </select>
      </div>

      <div class="modal-actions">
        <!-- Disable button while uploading -->
        <button type="button" class="btn btn-secondary" on:click={closeModal} disabled={isUploading}>Cancel</button>
        <!-- Disable button while uploading or if no file/name/category -->
        <button 
          type="submit" 
          class="btn btn-primary" 
          disabled={isUploading || !selectedFile || !documentName || !selectedCategory}
        >
          {#if isUploading}
            Uploading...
          {:else}
            Upload
          {/if}
        </button>
      </div>
    </form>

  </div>
</div>

<style>
  /* --- Add style for error message --- */
  .error-message {
      color: #dc3545; /* Red */
      background-color: #f8d7da; /* Light red background */
      border: 1px solid #f5c6cb; /* Reddish border */
      padding: 0.75rem 1.25rem;
      margin-bottom: 1rem;
      border-radius: 0.25rem;
      text-align: center;
  }

  /* --- Existing styles --- */
  /* Styles for the full-screen semi-transparent overlay */
  .modal-backdrop {
    position: fixed; 
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent dark background */
    display: flex; 
    justify-content: center; /* Center the content horizontally */
    align-items: center; /* Center the content vertically */
    z-index: 1000; /* High z-index to appear on top */
  }

  /* Styles for the white box containing the form */
  .modal-content {
    background-color: white; /* White background for the box */
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); /* Optional shadow */
    width: 90%; /* Responsive width */
    max-width: 500px; /* Maximum width of the box */
    /* Optional: Add max-height and scroll for long content */
    max-height: 90vh; /* Limit height to 90% of viewport height */
    overflow-y: auto; /* Add scrollbar if content exceeds max-height */
  }

  /* --- Add style for error message --- */
  .error-message {
      color: #dc3545; 
      background-color: #f8d7da; 
      border: 1px solid #f5c6cb; 
      padding: 0.75rem 1.25rem;
      margin-bottom: 1rem; /* Space below the error */
      border-radius: 0.25rem;
      text-align: center;
  }

  /* --- Styles for form elements within the modal --- */
  .form-group {
     margin-bottom: 1rem; /* Consistent spacing */
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
     box-sizing: border-box; 
  }

  /* Styles for disabled elements */
  .form-group input:disabled,
  .form-group select:disabled {
      background-color: #e9ecef; 
      cursor: not-allowed;
  }

  /* Styles for buttons */
   .modal-actions {
      display: flex;
      justify-content: flex-end; /* Align buttons to the right */
      gap: 0.75rem;
      margin-top: 1.5rem; /* Space above buttons */
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

   .btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
   }

   /* Other specific styles if needed */
   .file-preview {
      font-size: 0.9rem;
      color: #666;
      margin-top: -0.5rem; 
      margin-bottom: 1rem;
   }

    /* Specific select styling if you had it before */
    .form-group select {
        padding-right: 2.5rem; /* Adjust right padding for arrow */
        appearance: none; 
        -webkit-appearance: none;
        -moz-appearance: none; 
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='currentColor' class='bi bi-chevron-down' viewBox='0 0 16 16'%3E%3Cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.75rem center; 
        background-size: 1em; 
        cursor: pointer;
    }
    .form-group select::-ms-expand {
        display: none;
    }

  /* ... */
  .form-group input:disabled,
  .form-group select:disabled {
      background-color: #e9ecef; /* Indicate disabled state */
      cursor: not-allowed;
  }
  /* ... */
  .btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
  }
  /* ... rest of styles ... */
</style>