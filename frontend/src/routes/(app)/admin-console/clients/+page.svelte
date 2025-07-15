<script lang="ts">
  import ClientTable from '$lib/components/ClientTable.svelte';
  import AddClientOrganisationModal from '$lib/components/AddClientOrganisationModal.svelte';

  let showAddModal = false;

  function handleAddClient() {
    showAddModal = true;
  }
</script>

<div class="page-header">
  <h1>Clients</h1>
  <div class="header-actions">
    <button class="add-btn" on:click={handleAddClient}>
      + Add New Client
    </button>
  </div>
</div>

<ClientTable />

<AddClientOrganisationModal
  bind:isOpen={showAddModal}
  on:close={() => showAddModal = false}
/>

<style>
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #eee;
  }
  h1 {
    font-size: 1.8rem;
    font-weight: 600;
  }
  .header-actions .add-btn {
    background-color: #007bff;
    color: white;
    padding: 10px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
</style> 