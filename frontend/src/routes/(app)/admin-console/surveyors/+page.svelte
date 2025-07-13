<script lang="ts">
  import SurveyorBankModal from '$lib/components/SurveyorBankModal.svelte';
  import AddSurveyorOrganisationModal from '$lib/components/AddSurveyorOrganisationModal.svelte';

  // Modal states
  let showAddModal = false;
</script>

<!-- Page Header with Title and Button -->
<div class="page-header">
  <h1>Surveyor Organisations</h1>
  <button 
    class="add-organisation-btn" 
    on:click={() => showAddModal = true}
  >
    + Add New Organisation
  </button>
</div>

<!-- Main Table -->
<SurveyorBankModal />

<!-- Add Organisation Modal -->
<AddSurveyorOrganisationModal
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

  .page-header h1 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 600;
    color: #1a202c;
  }

  .add-organisation-btn {
    background-color: #007bff;
    color: white;
    padding: 10px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.95em;
  }

  .add-organisation-btn:hover {
    background-color: #0069d9;
  }
</style>