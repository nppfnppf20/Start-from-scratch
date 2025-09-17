<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { selectedProject } from "$lib/stores/projectStore";
  import { userRole } from '$lib/utils/auth';
  
  // --- Reference to the scrollable table container ---
  let tableContainerElement: HTMLDivElement;

  // --- Scroll functions ---
  function scrollLeft() {
    if (tableContainerElement) {
      tableContainerElement.scrollBy({ left: -150, behavior: 'smooth' });
    }
  }

  function scrollRight() {
    if (tableContainerElement) {
      tableContainerElement.scrollBy({ left: 150, behavior: 'smooth' });
    }
  }

  // Role-based access control
  $: canViewFiles = $userRole === 'admin' || $userRole === 'client';
  $: canUploadFiles = true; // all roles can upload

  // Placeholder data - will be replaced with actual file upload functionality
  const placeholderFiles = [
    {
      id: '1',
      name: 'Project_Drawings_v1.pdf',
      type: 'PDF',
      size: '2.4 MB',
      uploadDate: '2025-01-15',
      uploadedBy: 'John Smith',
      category: 'Drawings'
    },
    {
      id: '2', 
      name: 'Site_Photos.zip',
      type: 'ZIP',
      size: '15.2 MB',
      uploadDate: '2025-01-14',
      uploadedBy: 'Sarah Johnson',
      category: 'Photos'
    }
  ];
</script>

<div class="file-upload-container">
  <PageHeader 
    title="File Upload (Beta)" 
    subtitle={$selectedProject ? 
      (canViewFiles ? `File management for ${$selectedProject.name}` : `Upload files for ${$selectedProject.name}`) : 
      'Please select a project to manage files.'}
  >
    <div slot="actions">
      {#if $selectedProject && canUploadFiles}
        <button class="upload-btn">
          + Upload Files
        </button>
      {/if}
    </div>
  </PageHeader>
  
  {#if $selectedProject}
    <div class="upload-section">
      <div class="upload-area">
        <div class="upload-dropzone">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17,8 12,3 7,8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <h3>Drag and drop files here</h3>
          <p>or click to browse</p>
          <button class="browse-btn">Browse Files</button>
        </div>
      </div>
    </div>

    {#if canViewFiles}
      {#if placeholderFiles.length > 0}
        <div class="table-scroll-wrapper">
          <button class="scroll-btn scroll-btn-left" on:click={scrollLeft} aria-label="Scroll table left">←</button>
          <div class="files-table-container" bind:this={tableContainerElement}>
            <table class="files-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Category</th>
                  <th>Upload Date</th>
                  <th>Uploaded By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each placeholderFiles as file (file.id)}
                  <tr>
                    <td class="file-name">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
                      </svg>
                      {file.name}
                    </td>
                    <td>{file.type}</td>
                    <td>{file.size}</td>
                    <td>
                      <span class="category-badge category-{file.category.toLowerCase()}">
                        {file.category}
                      </span>
                    </td>
                    <td>{file.uploadDate}</td>
                    <td>{file.uploadedBy}</td>
                    <td class="action-cell">
                      <button class="action-btn download-btn" title="Download File">
                        Download
                      </button>
                      {#if $userRole === 'admin'}
                        <button class="action-btn delete-btn" title="Delete File">
                          Delete
                        </button>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          <button class="scroll-btn scroll-btn-right" on:click={scrollRight} aria-label="Scroll table right">→</button>
        </div>
      {:else}
        <div class="no-files">
          <p>No files uploaded yet for this project.</p>
        </div>
      {/if}
    {/if}
  {:else}
    <!-- Message is shown in the subtitle -->
  {/if}
</div>

<style>
  /* CSS Variables for status colors */
  :root {
    --category-drawings-bg: #e0f2fe;
    --category-drawings-color: #0369a1;
    --category-photos-bg: #f0fdf4;
    --category-photos-color: #15803d;
    --category-documents-bg: #fef3c7;
    --category-documents-color: #d97706;
  }

  .file-upload-container {
    padding: 1rem 2rem;
  }

  .upload-section {
    margin-bottom: 2rem;
  }

  .upload-area {
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border: 1px solid #e2e8f0;
    padding: 2rem;
  }

  .upload-dropzone {
    border: 2px dashed #cbd5e0;
    border-radius: 8px;
    padding: 3rem 2rem;
    text-align: center;
    transition: border-color 0.2s ease-in-out, background-color 0.2s ease-in-out;
    cursor: pointer;
  }

  .upload-dropzone:hover {
    border-color: #3182ce;
    background-color: #f7fafc;
  }

  .upload-dropzone svg {
    color: #718096;
    margin-bottom: 1rem;
  }

  .upload-dropzone h3 {
    font-size: 1.2rem;
    font-weight: 600;
    color: #4a5568;
    margin-bottom: 0.5rem;
  }

  .upload-dropzone p {
    color: #718096;
    margin-bottom: 1.5rem;
  }

  .browse-btn {
    background-color: #3182ce;
    color: white;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 500;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }

  .browse-btn:hover {
    background-color: #2b6cb0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .upload-btn {
    background-color: #3182ce;
    color: white;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 500;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }

  .upload-btn:hover {
    background-color: #2b6cb0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  /* Table Styling - following the same pattern as other pages */
  .table-scroll-wrapper {
    position: relative;
    margin-bottom: 2rem;
  }

  .scroll-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    background-color: rgba(255, 255, 255, 0.8);
    border: 1px solid #cbd5e0;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    font-size: 1.2rem;
    cursor: pointer;
    color: #4a5568;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .scroll-btn:hover {
    background-color: #fff;
    box-shadow: 0 4px 6px rgba(0,0,0,0.15);
  }

  .scroll-btn-left {
    left: -18px;
  }

  .scroll-btn-right {
    right: -18px;
  }

  .files-table-container {
    overflow-x: auto;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border: 1px solid #e2e8f0;
    margin-bottom: 2rem;
  }
  
  .files-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
    white-space: nowrap;
  }
  
  .files-table th,
  .files-table td {
    padding: 0.6rem 0.8rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: middle;
    white-space: nowrap;
  }

  .files-table td {
    color: #4a5568;
  }
  
  .files-table th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #4a5568;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
  }

  .files-table tbody tr:last-child td {
    border-bottom: none;
  }

  .files-table tbody tr:hover {
    background-color: #f7fafc;
  }

  .file-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
  }

  .file-name svg {
    color: #718096;
    flex-shrink: 0;
  }

  .category-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .category-drawings {
    background-color: var(--category-drawings-bg);
    color: var(--category-drawings-color);
  }

  .category-photos {
    background-color: var(--category-photos-bg);
    color: var(--category-photos-color);
  }

  .category-documents {
    background-color: var(--category-documents-bg);
    color: var(--category-documents-color);
  }

  .action-cell {
    text-align: right;
    white-space: nowrap;
  }
  
  .action-btn {
    padding: 0.25rem 0.5rem;
    margin-left: 0.3rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.75rem;
    transition: background-color 0.2s;
  }

  .download-btn {
    background-color: #3182ce;
    color: white;
  }

  .download-btn:hover {
    background-color: #2b6cb0;
  }

  .delete-btn {
    background-color: #e53e3e;
    color: white;
  }

  .delete-btn:hover {
    background-color: #c53030;
  }

  .no-files {
    text-align: center;
    margin: 3rem auto;
    padding: 2.5rem;
    background-color: #ffffff;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    color: #718096;
  }

</style>
