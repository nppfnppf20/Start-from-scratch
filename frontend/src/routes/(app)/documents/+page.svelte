<script lang="ts">
  import { selectedProject, updateProject } from "$lib/stores/projectStore";
  import { authStore } from '$lib/stores/authStore';

  // Check if user is a surveyor for read-only restrictions
  $: isSurveyor = $authStore.user?.role === 'surveyor';

  // Handle form submission
  async function handleSubmit(event: Event) {
    event.preventDefault();
    if (!$selectedProject || isSurveyor) return;

    try {
      await updateProject($selectedProject.id, { sharepointLink: $selectedProject.sharepointLink });
      console.log('SharePoint link updated successfully');
    } catch (error) {
      console.error('Failed to update SharePoint link:', error);
      alert('Failed to update SharePoint link. Please try again.');
    }
  }
</script>

<div class="documents-container">
  <h1>Relevant Documents</h1>
  
  {#if $selectedProject}
    <div class="documents-header">
      <h2>Documents for {$selectedProject.name}</h2>
      {#if isSurveyor}
        <p class="read-only-notice">Read only</p>
      {/if}
    </div>
    
    <form on:submit={handleSubmit} class="sharepoint-form">
      <div class="form-section">
        <h3>Document download and upload available via Sharepoint at the following link:</h3>
        
        <div class="form-group">
          <label for="sharepointLink">SharePoint Link:</label>
          {#if isSurveyor && $selectedProject.sharepointLink}
            <!-- Show clickable link for surveyors when link exists -->
            <div class="sharepoint-link-container">
              <span 
                class="sharepoint-link-text"
                on:click={() => window.open($selectedProject.sharepointLink, '_blank')}
                title="Click to open SharePoint link"
              >
                {$selectedProject.sharepointLink}
              </span>
            </div>
          {:else if isSurveyor}
            <!-- Show no link message for surveyors when no link -->
            <div class="sharepoint-link-container">
              <span class="no-link-text">No upload link configured</span>
            </div>
          {:else}
            <!-- Show editable input for admins -->
            <input 
              type="url" 
              id="sharepointLink" 
              name="sharepointLink" 
              bind:value={$selectedProject.sharepointLink} 
              placeholder="https://example.sharepoint.com/..."
            />
          {/if}
        </div>
      </div>
      
      {#if !isSurveyor}
        <button type="submit" class="submit-btn">Update SharePoint Link</button>
      {/if}
    </form>
    
  {:else}
    <p class="no-project-selected">Please select a project to manage documents.</p> 
  {/if}
</div>

<style>
  .documents-container {
    padding: 2rem 1rem;
  }
  
  h1 {
    font-size: 1.8rem; 
    font-weight: 600; 
    margin-bottom: 1.5rem;
    color: #1a202c; 
  }
  
  h2 {
    font-size: 1.3rem; 
    font-weight: 500; 
    color: #2d3748; 
    margin: 0;
  }

  h3 {
    font-size: 1.1rem;
    font-weight: 500;
    color: #2d3748;
    margin-bottom: 1.5rem;
  }

  .documents-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .read-only-notice {
    background-color: #fed7d7;
    color: #c53030;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    margin: 0;
  }

  .sharepoint-form {
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border: 1px solid #e2e8f0;
    padding: 2rem;
  }

  .form-section {
    margin-bottom: 2rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: block;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }

  .form-group input[type="url"] {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.9rem;
    transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    background-color: #ffffff;
  }

  .form-group input[type="url"]:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
    outline: none;
  }

  .form-group input[type="url"][readonly] {
    background-color: #f9fafb;
    color: #6b7280;
  }

  .sharepoint-link-container {
    position: relative;
    display: inline-block;
  }

  .sharepoint-link-text {
    color: #007bff;
    text-decoration: none;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .sharepoint-link-text:hover {
    text-decoration: underline;
  }

  .no-link-text {
    color: #6c757d;
    font-style: italic;
    font-size: 0.9rem;
  }

  .submit-btn {
    padding: 0.75rem 2rem;
    font-size: 1rem;
    font-weight: 500;
    background-color: #3182ce;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }

  .submit-btn:hover {
    background-color: #2b6cb0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .submit-btn:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.5);
  }

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
</style> 