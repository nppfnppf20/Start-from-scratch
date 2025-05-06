<script lang="ts">
  import { selectedProject } from "$lib/stores/projectStore";
  import UploadDocumentModal from '$lib/components/UploadDocumentModal.svelte';
  import { formatBytes } from '$lib/utils/formatters';

  // Document categories
  const categories = ['All', 'Drawing', 'Surveyor Report', 'Other'];
  let selectedCategory = 'All';

  // State for modal visibility
  let showUploadModal = false;

  // --- Define interface for document data ---
  interface DocumentData {
      _id: string; 
      name: string;
      mimetype: string;
      size: number; 
      uploadDate: string; 
      category: string;
      url: string;
  }
  // --- Use interface for documents array ---
  let documents: DocumentData[] = []; 
  let isLoading = false; // Add loading state

  // Filtering function
  $: filteredDocuments = selectedCategory === 'All' 
    ? documents 
    : documents.filter(doc => doc.category === selectedCategory);

  // --- Add function to fetch documents (placeholder) ---
  async function fetchDocuments(projectId: string | undefined) {
      if (!projectId) {
          documents = []; 
          return;
      }
      isLoading = true;
      console.log(`Fetching documents for project: ${projectId}`);
            try {
          // --- Actual Fetch Call ---
          const response = await fetch(`/api/documents?projectId=${projectId}`); 
          
          if (!response.ok) {
             // Handle non-2xx responses
             let errorMsg = `HTTP error! status: ${response.status}`;
             try {
                 const errBody = await response.json();
                 errorMsg = errBody.msg || errBody.message || errorMsg;
             } catch(e) { /* Ignore if body isn't JSON */ }
             throw new Error(errorMsg);
          }
          
          // Parse the JSON response (which should be an array of documents)
          const fetchedDocs: DocumentData[] = await response.json(); 
          
          // Update the local documents state
          documents = fetchedDocs; 
          console.log('Fetched documents:', documents);
          // --- End Fetch Call ---

      } catch (error) {
          console.error("Failed to fetch documents:", error);
          documents = []; 
      } finally {
          isLoading = false;
      }
  }

  // --- Fetch documents when the selected project changes ---
  $: fetchDocuments($selectedProject?.id);

  // Function to handle the uploaded document from the modal
  function handleDocumentUpload(event: CustomEvent) {
    const newDocument: DocumentData = event.detail;
    console.log("Received new document from modal:", newDocument);
    documents = [...documents, newDocument];
  }

        // --- NEW: handleDeleteDocument function ---
      async function handleDeleteDocument(docId: string, docName: string) {
        if (!confirm(`Are you sure you want to delete the document "${docName}"? This action cannot be undone.`)) {
          return; // User cancelled
        }

        console.log(`Attempting to delete document with ID: ${docId}`);
        // Optional: Add a specific loading state for this item or a general 'isDeleting' flag

        try {
          const response = await fetch(`/api/documents/${docId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            let errorMsg = `Failed to delete document. Status: ${response.status}`;
            try {
                const errBody = await response.json();
                errorMsg = errBody.msg || errBody.message || errorMsg;
            } catch (e) { /* Ignore if body isn't JSON */ }
            throw new Error(errorMsg);
          }

          // Deletion successful, remove from local list
          documents = documents.filter(doc => doc._id !== docId);
          console.log(`Document ${docId} deleted successfully from frontend list.`);
          // Optional: Show a success notification

        } catch (error) {
          console.error("Error deleting document:", error);
          alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
          // Optional: Show a more user-friendly error message in the UI
        }
      }
      // ---

  // Function to get icon based on file type
  function getFileIcon(mimetype: string | undefined): string {
    if (!mimetype) return '📁';
    const type = mimetype.toLowerCase();
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('vnd.openxmlformats-officedocument.wordprocessingml.document')) return '📝';
    if (type.includes('excel') || type.includes('vnd.openxmlformats-officedocument.spreadsheetml.sheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('vnd.openxmlformats-officedocument.presentationml.presentation')) return '📑';
    if (type.includes('image')) return '🖼️';
    return '📁'; // Default
  }
</script>

<div class="documents-container">
  <h1>Relevant Documents</h1>
  
  {#if $selectedProject}
    <div class="documents-header">
      <h2>Documents for {$selectedProject.name}</h2>
      <button class="upload-btn" on:click={() => showUploadModal = true} disabled={isLoading}>+ Upload New Document</button>
    </div>
    
    <div class="filter-bar">
      <div class="category-filter">
        <span class="filter-label">Filter by category:</span>
        <div class="category-buttons">
          {#each categories as category}
            <button 
              class="category-btn" 
              class:active={selectedCategory === category}
              on:click={() => selectedCategory = category}
            >
              {category}
            </button>
          {/each}
        </div>
      </div>
      
      <div class="search-box">
        <input type="text" placeholder="Search documents..." />
      </div>
    </div>
    
    {#if isLoading}
      <p>Loading documents...</p> 
    {:else}
      <div class="documents-table-container">
        <table class="documents-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Size</th>
              <th>Upload Date</th>
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredDocuments as doc (doc._id)}
              <tr>
                <td class="file-name">
                  <span class="file-icon">{getFileIcon(doc.mimetype)}</span>
                  {doc.name}
                </td>
                <td>{doc.mimetype || 'N/A'}</td>
                <td>{formatBytes(doc.size || 0)}</td>
                <td>{new Date(doc.uploadDate).toLocaleDateString()}</td>
                <td>
                  <span class="category-badge">{doc.category}</span>
                </td>
                <td class="action-cell">
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" class="action-btn view-btn" title="View/Open file">View</a>
                  <a href={doc.url} download={doc.name} class="action-btn download-btn" title="Download file">Download</a>
                                    <button 
                    class="action-btn delete-btn" 
                    on:click={() => handleDeleteDocument(doc._id, doc.name)}
                    title="Delete this document"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            {:else}
               <tr>
                   <td colspan="6" style="text-align: center; padding: 2rem;">No documents found for this category or project.</td>
               </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
    
  {:else}
    <p class="no-project-selected">Please select a project to view documents.</p> 
  {/if}
</div>

    {#if showUploadModal && $selectedProject}
      <UploadDocumentModal
        projectId={$selectedProject.id}
        on:close={() => showUploadModal = false}
        on:uploaddocument={handleDocumentUpload}
      />
    {/if}

<style>
  .documents-container {
    padding: 1rem 0;
  }
  
  h1 {
    margin-bottom: 1.5rem;
    color: #333;
  }
  
  .documents-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  h2 {
    font-size: 1.5rem;
    color: #555;
    margin: 0;
  }
  
  .upload-btn {
    background-color: #28a745;
    color: white;
    padding: 0.6rem 1.2rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }
  
  .upload-btn:hover {
    background-color: #218838;
  }
  
  .filter-bar {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    background-color: #f8f9fa;
    padding: 1rem;
    border-radius: 5px;
    border: 1px solid #e9ecef;
  }
  
  .category-filter {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .filter-label {
    font-weight: 500;
    color: #555;
  }
  
  .category-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .category-btn {
    padding: 0.4rem 0.8rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: #fff;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }
  
  .category-btn.active {
    background-color: #007bff;
    color: white;
    border-color: #007bff;
  }
  
  .search-box input {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    min-width: 250px;
  }
  
  .documents-table-container {
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    overflow: hidden;
  }
  
  .documents-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .documents-table th,
  .documents-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  
  .documents-table th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #495057;
  }
  
  .documents-table tr:last-child td {
    border-bottom: none;
  }
  
  .documents-table tr:hover {
    background-color: #f8f9fa;
  }
  
  .file-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .file-icon {
    font-size: 1.2rem;
  }
  
  .category-badge {
    display: inline-block;
    padding: 0.3rem 0.6rem;
    border-radius: 20px;
    font-size: 0.85rem;
    background-color: #e9ecef;
    color: #495057;
  }
  
  .action-cell {
    white-space: nowrap;
    display: flex;
    gap: 0.5rem;
  }
  
  .action-btn {
    padding: 0.4rem 0.75rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
  }
  
  .view-btn {
    background-color: #6c757d;
    color: white;
  }
  
  .download-btn {
    background-color: #007bff;
    color: white;
  }
  
  .delete-btn {
    background-color: #dc3545;
    color: white;
  }
  
  .action-btn:hover {
    opacity: 0.9;
  }
  
  .no-project-selected {
    text-align: center;
    margin: 2rem auto;
    padding: 2rem;
    background-color: #f8f9fa;
    border-radius: 0.5rem;
    border: 1px solid #dee2e6;
  }
  
  .action-btn {
    display: inline-block;
    text-align: center;
    text-decoration: none;
  }
</style> 