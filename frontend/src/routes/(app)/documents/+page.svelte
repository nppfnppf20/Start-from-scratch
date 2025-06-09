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

  // --- New: Reference to the scrollable table container ---
  let tableContainerElement: HTMLDivElement;

  // --- New: Scroll functions ---
  function scrollLeft() {
    if (tableContainerElement) {
      tableContainerElement.scrollBy({ left: -150, behavior: 'smooth' }); // Scroll 150px left
    }
  }

  function scrollRight() {
    if (tableContainerElement) {
      tableContainerElement.scrollBy({ left: 150, behavior: 'smooth' }); // Scroll 150px right
    }
  }
  // ---------

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
      <div class="table-scroll-wrapper">
          <button class="scroll-btn scroll-btn-left" on:click={scrollLeft} aria-label="Scroll table left">←</button>
          <div class="documents-table-container" bind:this={tableContainerElement}>
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
          <button class="scroll-btn scroll-btn-right" on:click={scrollRight} aria-label="Scroll table right">→</button>
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
  /* General page styling (applied globally from +page.svelte) */
  /* :global(body) ... */ /* Assuming global styles are already applied */

  .documents-container {
    padding: 2rem 1rem; /* Match general-info padding */
  }
  
  /* Headings */
  h1 {
    font-size: 1.8rem; 
    font-weight: 600; 
    margin-bottom: 1.5rem; /* Slightly less margin for header below */
    color: #1a202c; 
  }
  
  h2 {
    font-size: 1.3rem; 
    font-weight: 500; 
    color: #2d3748; 
    margin: 0; /* Remove default margins */
  }

  /* Header section */
  .documents-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  /* Upload Button (in header) */
  .upload-btn {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 500;
    background-color: #3182ce; /* Blue accent */
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }
  .upload-btn:hover {
    background-color: #2b6cb0; /* Darker blue */
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  .upload-btn:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.5); 
  }
  .upload-btn:disabled {
    background-color: #a0aec0;
    cursor: not-allowed;
    box-shadow: none;
  }
  
  /* Filter Bar */
  .filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap; /* Allow wrapping on smaller screens */
    gap: 1rem;
    margin-bottom: 2rem;
    padding: 1rem 1.5rem;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    border: 1px solid #e2e8f0;
  }
  
  .category-filter {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  
  .filter-label {
    font-weight: 500;
    color: #4a5568;
    font-size: 0.9rem;
  }
  
  .category-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .category-btn {
    padding: 0.4rem 0.9rem;
    font-size: 0.85rem;
    border: 1px solid #cbd5e0;
    border-radius: 15px; /* Pill shape */
    background-color: #fff;
    color: #4a5568;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out, border-color 0.2s ease-in-out;
  }
  
  .category-btn:hover {
    background-color: #edf2f7;
    border-color: #a0aec0;
  }
  
  .category-btn.active {
    background-color: #3182ce;
    color: white;
    border-color: #3182ce;
    font-weight: 500;
  }

  /* Search Box */
  .search-box input[type="text"] {
    padding: 0.6rem 1rem; /* Slightly smaller padding */
    border: 1px solid #cbd5e0;
    border-radius: 6px;
    font-size: 0.9rem;
    min-width: 250px; /* Ensure it has some width */
    transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  }

  .search-box input[type="text"]:focus {
      border-color: #4299e1; 
      box-shadow: 0 0 0 1px #4299e1; 
      outline: none;
  }
  
  /* Table Styling */
  .documents-table-container {
    overflow-x: auto; /* Ensure horizontal scrolling is enabled */
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border: 1px solid #e2e8f0;
  }
  
  .documents-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }
  
  .documents-table th,
  .documents-table td {
    padding: 0.9rem 1.2rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: middle;
  }
  
  .documents-table th {
    background-color: #f7fafc; /* Very light grey header */
    font-weight: 600;
    color: #4a5568;
    text-transform: uppercase;
    font-size: 0.8rem;
    letter-spacing: 0.05em;
    white-space: nowrap; /* Keep headers from wrapping */
  }

  .documents-table tbody tr:last-child td {
    border-bottom: none; /* Remove border from last row */
  }

  .documents-table tbody tr:hover {
    background-color: #f7fafc; /* Subtle hover effect */
  }
  
  .file-name {
    /* display: flex; Remove flex if icon is removed */
    /* align-items: center; */
    /* gap: 0.75rem; */
    font-weight: 500;
    color: #2d3748;
  }

  .file-icon {
    /* font-size: 1.2rem; Style removed as icon is removed */
  }
  
  .category-badge {
    display: inline-block;
    padding: 0.25rem 0.6rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 10px;
    background-color: #e2e8f0;
    color: #4a5568;
    white-space: nowrap;
  }
  
  /* Action Buttons in Table */
  .action-cell {
    white-space: nowrap; /* Prevent buttons wrapping */
    text-align: right; /* Align actions to the right */
  }
  
  .action-btn {
    display: inline-block;
    padding: 0.3rem 0.7rem;
    margin-left: 0.4rem;
    font-size: 0.8rem;
    font-weight: 500;
    border-radius: 4px;
    text-decoration: none;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    border: 1px solid transparent;
  }

  .action-btn:first-child {
      margin-left: 0;
  }

  /* Specific Button Styles */
  .view-btn {
    background-color: #ebf4ff; /* Light blue */
    color: #3182ce;
    border-color: #bee3f8;
  }
  .view-btn:hover {
    background-color: #bee3f8;
  }

  .download-btn {
    background-color: #f0fff4; /* Light green */
    color: #38a169;
    border-color: #c6f6d5;
  }
  .download-btn:hover {
    background-color: #c6f6d5;
  }

  .delete-btn {
    background-color: #fff5f5; /* Light red */
    color: #e53e3e;
    border-color: #fed7d7;
  }
  .delete-btn:hover {
    background-color: #fed7d7;
  }

  /* Loading and No Project/Documents States */
  p[style*="text-align: center"] /* Targeting the 'No documents found' row */,
  .documents-container > p /* Targeting the 'Loading...' message */ {
    text-align: center;
    padding: 2rem;
    color: #718096;
    font-style: italic;
  }

  /* Reuse no-project style from general page */
  .no-project-selected {
    text-align: center;
    margin: 3rem auto;
    padding: 2.5rem;
    background-color: #ffffff;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    color: #718096;
  }

  /* --- New: Table Scroll Wrapper and Buttons --- */
  .table-scroll-wrapper {
    position: relative; /* Context for absolute positioning of buttons */
    margin-bottom: 2rem; /* Keep space below */
  }

  .scroll-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%); /* Center vertically */
    z-index: 10;
    background-color: rgba(255, 255, 255, 0.8); /* Slightly transparent white */
    border: 1px solid #cbd5e0;
    border-radius: 50%; /* Circle */
    width: 36px;
    height: 36px;
    font-size: 1.2rem; /* Slightly adjusted arrow size for better fit */
    cursor: pointer;
    color: #4a5568;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    display: inline-flex; /* Use inline-flex */
    align-items: center;    /* Flexbox: Vertically center content */
    justify-content: center; /* Flexbox: Horizontally center content */
    padding: 0; /* Remove padding if flex is centering */
  }

  .scroll-btn:hover {
    background-color: #fff;
    box-shadow: 0 4px 6px rgba(0,0,0,0.15);
  }

  .scroll-btn-left {
    left: -18px; /* Position halfway outside the container */
  }

  .scroll-btn-right {
    right: -18px; /* Position halfway outside the container */
  }
  /* ------------------------------------------- */
</style> 