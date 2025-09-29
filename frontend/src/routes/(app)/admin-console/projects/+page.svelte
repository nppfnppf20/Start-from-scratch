<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import ProjectBankTable from '$lib/components/ProjectBankTable.svelte';
  import AddProjectModal from '$lib/components/AddProjectModal.svelte';

  let showAddProjectModal = false;
</script>

<div class="admin-projects-container">
  <PageHeader 
    title="Projects"
    subtitle="View and manage all projects in the system."
  >
    <div slot="actions">
      <button on:click={() => (showAddProjectModal = true)}>+ Add New Project</button>
    </div>
  </PageHeader>
</div>

<ProjectBankTable />

<AddProjectModal bind:isOpen={showAddProjectModal} on:close={() => (showAddProjectModal = false)} />

<style>
  .admin-projects-container {
    padding: 1rem 2rem;
  }

  button {
    background-color: #007bff;
    color: white;
    padding: 10px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.95em;
    transition: background-color 0.2s ease;
  }

  button:hover {
    background-color: #0069d9;
  }
</style> 