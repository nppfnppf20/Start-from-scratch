<script lang="ts">
  import { selectedProject } from "$lib/stores/projectStore";
  import UploadDocumentModal from '$lib/components/UploadDocumentModal.svelte';
  
  // Document categories
  const categories = ['All', 'Drawing', 'Surveyor Report', 'Other'];
  let selectedCategory = 'All';

  // State for modal visibility
  let showUploadModal = false;

  // Document data - starts empty
  let documents: any[] = [];

  // Filtering function
  $: filteredDocuments = selectedCategory === 'All' 
    ? documents 
    : documents.filter(doc => doc.category === selectedCategory);

  // Function to handle the uploaded document from the modal
  function handleDocumentUpload(event: CustomEvent) {
    const newDocument = event.detail;
    documents = [...documents, newDocument]; // Add the new document to the main list
    // Optionally, you might want to switch the category filter to show the new item
    // selectedCategory = newDocument.category;
  }

  // Function to get icon based on file type
  function getFileIcon(type: string) {
    switch(type.toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'docx':
        return '📝';
      case 'xlsx':
        return '📊';
      case 'pptx':
        return '📑';
      case 'jpg':
      case 'png':
        return '🖼️';
      default:
        return '📁';
    }
  }
</script>

<div class="documents-container">
  <h1>Relevant Documents</h1>
  
  {#if $selectedProject}
    <div class="documents-header">
      <h2>Documents for {$selectedProject.name}</h2>
      <button class="upload-btn" on:click={() => showUploadModal = true}>+ Upload New Document</button>
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
          {#each filteredDocuments as document (document.id)}
            <tr>
              <td class="file-name">
                <span class="file-icon">{getFileIcon(document.type)}</span>
                {document.name}
              </td>
              <td>{document.type}</td>
              <td>{document.size}</td>
              <td>{new Date(document.uploadDate).toLocaleDateString()}</td>
              <td>
                <span class="category-badge">{document.category}</span>
              </td>
              <td class="action-cell">
                <button class="action-btn view-btn">View</button>
                <button class="action-btn download-btn">Download</button>
                <button class="action-btn delete-btn">Delete</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    
  {:else}
    <p>Please select a project to view documents.</p>
  {/if}
</div>

{#if showUploadModal}
  <UploadDocumentModal 
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
</style> 