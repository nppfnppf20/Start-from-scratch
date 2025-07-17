<script lang="ts">
  import { projects, selectedProject, selectProjectById } from '$lib/stores/projectStore';
  import { writable, get } from 'svelte/store';
  import { browser } from '$app/environment';

  let selectedProjectId = '';

  $: if ($selectedProject) {
    selectedProjectId = $selectedProject.id;
  } else {
    selectedProjectId = '';
  }

  function handleSelectionChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const projectId = target.value;
    if (projectId) {
        selectProjectById(projectId);
    }
  }
</script>

<div class="project-selector-container">
  <div class="selector-row">
    <div class="dropdown-container">
      <select
        aria-label="Select Project"
        bind:value={selectedProjectId}
        on:change={handleSelectionChange}
      >
        <option value="" disabled selected>Select a project</option>
        {#if $projects.length === 0 && browser}<option value="" disabled>Loading...</option>{:else if $projects.length === 0}<option value="" disabled>No projects</option>{/if}
        {#each $projects as project (project.id)}
          <option value={project.id}>{project.name}</option>
        {/each}
      </select>
    </div>
  </div>

  {#if $selectedProject}
    <p class="current-project">Current Project: {$selectedProject.name}</p>
  {:else if !browser}
    <p class="current-project">Initializing...</p>
  {:else if $projects === null}
    <p class="current-project">Initializing...</p>
  {:else if $projects.length > 0}
    <p class="current-project">Select a project</p>
  {/if}
</div>

<style>
  .project-selector-container {
    padding: 1rem;
    background-color: white;
    border-bottom: 1px solid #ccc;
    display: flex;
    align-items: center;
    gap: 1rem;
    position: relative;
  }

  .selector-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .dropdown-container {
    position: relative;
  }

  select {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
    min-width: 200px;
    border-radius: 10px;
    text-align: center;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url('data:image/svg+xml;utf8,<svg fill="black" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>');
    background-repeat: no-repeat;
    background-position: right 0.5rem center;
    padding-right: 2rem;
  }

  .current-project {
    margin: 0;
    font-style: italic;
    color: #555;
  }
</style> 