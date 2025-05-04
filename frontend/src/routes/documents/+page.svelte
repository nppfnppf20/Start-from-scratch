<script lang="ts">
  import { selectedProject, projectUploads, type Upload } from '$lib/stores/projectStore';
  import UploadDocumentModal from '$lib/components/UploadDocumentModal.svelte';
  import Icon from '@iconify/svelte';
  
  let showUploadModal = false;

  function handleDocumentUpload(event: CustomEvent<Upload>) {
    const newUpload = event.detail;
    console.log('Document uploaded event received:', newUpload);
    projectUploads.update(currentUploads => {
      if (!currentUploads.some(upload => upload.id === newUpload.id)) {
        return [newUpload, ...currentUploads];
      }
      return currentUploads;
    });
    showUploadModal = false;
  }

  function formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  }

  function formatSize(bytes: number | undefined): string {
    if (bytes === undefined || bytes === null || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  $: currentProjectId = $selectedProject?.id ?? null;
</script>

<div class="container mx-auto p-4 md:p-6 lg:p-8">
  {#if $selectedProject}
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl md:text-3xl font-semibold text-gray-800">
        Relevant Documents for {$selectedProject.name}
      </h1>
      <button
        on:click={() => showUploadModal = true}
        class="btn btn-primary"
        disabled={!currentProjectId} 
      >
        <Icon icon="mdi:upload" class="mr-2" />
        Upload New Document
      </button>
    </div>

    <div class="bg-white shadow-md rounded-lg overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title / Filename</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Uploaded</th>
            <th scope="col" class="relative px-6 py-3">
              <span class="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#if $projectUploads.length === 0}
            <tr>
              <td colspan="5" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                No documents uploaded for this project yet.
              </td>
            </tr>
          {/if}
          {#each $projectUploads as doc (doc.id)}
            <tr>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{doc.title || 'Untitled'}</div>
                <div class="text-xs text-gray-500">{doc.originalName}</div>
              </td>
              <td class="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs break-words">{doc.description || '-'}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatSize(doc.size)}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(doc.createdAt)}</td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button class="text-indigo-600 hover:text-indigo-900 mr-3 disabled:text-gray-400" title="Download (Not implemented)" disabled>
                  <Icon icon="mdi:download" />
                </button>
                <button class="text-red-600 hover:text-red-900 disabled:text-gray-400" title="Delete (Not implemented)" disabled>
                  <Icon icon="mdi:delete" />
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

  {:else}
    <p class="text-center text-gray-500 mt-10">Please select a project to view its documents.</p>
  {/if}
</div>

{#if showUploadModal && currentProjectId}
  <UploadDocumentModal
    projectId={currentProjectId} 
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