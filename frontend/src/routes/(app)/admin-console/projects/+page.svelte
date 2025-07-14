<script lang="ts">
  import ProjectBankTable from '$lib/components/ProjectBankTable.svelte';
</script>

<div class="projects-page-header">
  <h1>Projects</h1>
</div>

<ProjectBankTable />

<style>
  .projects-page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #eee;
  }

  .projects-page-header h1 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 600;
    color: #1a202c;
  }
</style> 