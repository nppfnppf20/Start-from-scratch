<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import ProjectBankTable from '$lib/components/ProjectBankTable.svelte';
</script>

<div class="admin-projects-container">
  <PageHeader 
    title="Projects"
    subtitle="View and manage all projects in the system."
  />
</div>

<ProjectBankTable />

<style>
  .admin-projects-container {
    padding: 1rem 2rem;
  }
</style> 