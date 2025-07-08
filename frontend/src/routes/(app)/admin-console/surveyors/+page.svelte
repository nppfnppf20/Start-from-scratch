<script lang="ts">
  import { authStore } from '$lib/stores/authStore';
</script>

<div class="surveyors-page">
  <div class="page-header">
    <h1>Surveyors</h1>
    <p>Manage surveyor accounts and information</p>
  </div>

  <div class="content">
    <p>Surveyor management functionality will be added here.</p>
  </div>
</div>

<style>
  .surveyors-page {
    padding: 1.5rem;
    max-width: 1200px;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-header h1 {
    font-size: 2rem;
    font-weight: 600;
    color: #1a202c;
    margin: 0 0 0.5rem 0;
  }

  .page-header p {
    font-size: 1.1rem;
    color: #4a5568;
    margin: 0;
  }

  .content {
    padding: 1rem;
    background-color: #f7fafc;
    border: 1px dashed #cbd5e0;
    border-radius: 6px;
    text-align: center;
  }

  .content p {
    color: #a0aec0;
    font-style: italic;
    margin: 0;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .surveyors-page {
      padding: 1rem;
    }

    .page-header h1 {
      font-size: 1.75rem;
    }
  }
</style> 