<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import SurveyorBankModal from '$lib/components/SurveyorBankModal.svelte';
  import AddSurveyorOrganisationModal from '$lib/components/AddSurveyorOrganisationModal.svelte';
  import PendingSurveyorsModal from '../../../../lib/components/PendingSurveyorsModal.svelte';

  // Modal states
  let showAddModal = false;
  let showPendingModal = false;

  function handleAddClick() {
    showAddModal = true;
  }

  function handlePendingClick() {
    showPendingModal = true;
  }
</script>

<div class="admin-surveyors-container">
  <PageHeader 
    title="Surveyor Organisations"
    subtitle="View, add, and manage surveyor organisations across all projects."
  >
    <div slot="actions" class="header-actions">
      <button class="pending-btn" on:click={handlePendingClick}>
        Manage Pending
      </button>
      <button class="add-organisation-btn" on:click={handleAddClick}>
        + Add New Organisation
      </button>
    </div>
  </PageHeader>
</div>

<!-- Main Table -->
<SurveyorBankModal />

<!-- Add Organisation Modal -->
<AddSurveyorOrganisationModal
  bind:isOpen={showAddModal}
  on:close={() => showAddModal = false}
/>

<!-- Pending Surveyors Modal -->
<PendingSurveyorsModal 
  bind:isOpen={showPendingModal} 
  on:close={() => showPendingModal = false} 
/>


<style>
  .admin-surveyors-container {
    padding: 1rem 2rem;
  }

  .surveyor-page-header h1 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 600;
    color: #1a202c;
  }
  
  .header-actions {
    display: flex;
    gap: 10px;
  }

  .add-organisation-btn, .pending-btn {
    color: white;
    padding: 10px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.95em;
    transition: background-color 0.2s ease;
  }

  .add-organisation-btn {
    background-color: #007bff;
  }

  .add-organisation-btn:hover {
    background-color: #0069d9;
  }

  .pending-btn {
    background-color: #6c757d;
  }
  
  .pending-btn:hover {
    background-color: #5a6268;
  }
</style>