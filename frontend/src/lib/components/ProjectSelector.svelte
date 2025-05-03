<script lang="ts">
  import { projects, selectedProject, addProject as addProjectToStore } from '$lib/stores/projectStore';
  import { writable } from 'svelte/store';

  let showAddProjectInput = writable(false);
  let newProjectName = '';
  let selectedClient = ''; // Added state for client dropdown
  let selectedTeam = ''; // Added state for team dropdown
  let isCollectionsOpen = writable(false); // Track if collections menu is open

  // Mock data for dropdowns (replace with actual data fetching later)
  const clients = ['Client A', 'Client B', 'Client C'];
  const teams = ['JR', 'RM', 'PE', 'AD', 'SS']; // Updated team names to initials

  function toggleAddProjectForm() {
    showAddProjectInput.update(value => !value);
    selectedClient = ''; // Reset dropdowns when toggling
    selectedTeam = '';
  }

  function toggleCollections() {
    isCollectionsOpen.update(value => !value);
  }

  function handleSelectionChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const projectId = target.value;
    const project = $projects.find(p => p.id === projectId);
    if (project) {
      selectedProject.set(project);
    }
  }

  function groupProjects(groupBy: string) {
    // Just close the collections menu for now
    // In a real app, this would filter/group projects
    isCollectionsOpen.set(false);
    // Would also set some state to indicate the current grouping
    console.log(`Group projects by: ${groupBy}`);
  }

  function addNewProject() {
    if (newProjectName.trim()) {
      // Add project to the store (currently only uses name)
      // In a real app, you'd likely pass client and team info too
      console.log(`Adding project: ${newProjectName}, Client: ${selectedClient || 'None'}, Team: ${selectedTeam || 'None'}`);
      addProjectToStore(newProjectName.trim());
      newProjectName = '';
      selectedClient = '';
      selectedTeam = '';
      showAddProjectInput.set(false);
    }
  }

  function cancelAddProject() {
    newProjectName = '';
    selectedClient = '';
    selectedTeam = '';
    showAddProjectInput.set(false);
  }
</script>

<div class="project-selector-container">
  {#if !$showAddProjectInput}
    <div class="selector-row">
      <div class="dropdown-container">
        <select
          aria-label="Select Project"
          on:change={handleSelectionChange}
          value={$selectedProject?.id ?? ''}
        >
          <optgroup label="Collections">
            <option value="collections" on:click|preventDefault={toggleCollections}>
              Group By...
            </option>
          </optgroup>
          
          <optgroup label="Projects">
            {#each $projects as project}
              <option value={project.id}>{project.name}</option>
            {/each}
          </optgroup>
        </select>
        
        {#if $isCollectionsOpen}
          <div class="collections-menu">
            <div class="menu-header">Group Projects By:</div>
            <button on:click={() => groupProjects('client')}>Client</button>
            <button on:click={() => groupProjects('employee')}>TRP Employee</button>
            <button on:click={() => groupProjects('surveyor')}>Surveyors</button>
          </div>
        {/if}
      </div>
      <button class="add-button" on:click={toggleAddProjectForm} aria-label="Add new project">+</button>
    </div>
  {:else}
    <div class="add-project-form">
      <input
        type="text"
        bind:value={newProjectName}
        placeholder="Enter new project name"
        aria-label="New project name"
      />
      <select bind:value={selectedClient} aria-label="Select Client">
        <option value="" disabled>Select Client</option>
        {#each clients as client}
          <option value={client}>{client}</option>
        {/each}
      </select>
      <!-- Replace select multiple with checkbox group -->
      <div class="checkbox-group-container" aria-label="Select Team Members">
          <div class="checkbox-group-header">Select Team Members</div>
          <div class="checkbox-list">
            {#each teams as team (team)}
              <div class="checkbox-item">
                <input type="checkbox" id="team-{team}" bind:group={selectedTeam} value={team} />
                <label for="team-{team}">{team}</label>
              </div>
            {/each}
          </div>
      </div>
      <button on:click={addNewProject}>Add</button>
      <button on:click={cancelAddProject}>Cancel</button>
    </div>
  {/if}

  {#if $selectedProject}
    <p class="current-project">Current Project: {$selectedProject.name}</p>
  {/if}
</div>

<style>
  .project-selector-container {
    padding: 1rem;
    background-color: #f0f0f0;
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

  select, input[type="text"] {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
    min-width: 200px;
  }

  /* Add dropdown arrow styles */
  select {
    appearance: none; /* Hide default arrow */
    -webkit-appearance: none; /* Safari and Chrome */
    -moz-appearance: none; /* Firefox */
    background-image: url('data:image/svg+xml;utf8,<svg fill="black" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>');
    background-repeat: no-repeat;
    background-position: right 0.5rem center;
    padding-right: 2rem; /* Make space for the arrow */
  }

  .collections-menu {
    position: absolute;
    top: 100%;
    left: 0;
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    width: 200px;
    z-index: 10;
  }

  .collections-menu .menu-header {
    padding: 0.75rem;
    border-bottom: 1px solid #eee;
    font-weight: bold;
    color: #555;
  }

  .collections-menu button {
    display: block;
    width: 100%;
    text-align: left;
    padding: 0.75rem;
    border: none;
    background: none;
    cursor: pointer;
    transition: background-color 0.2s;
    margin: 0;
    color: #333;
  }

  .collections-menu button:hover {
    background-color: #f5f5f5;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    background-color: #007bff;
    color: white;
    cursor: pointer;
    font-size: 1rem;
    margin-left: 0.5rem;
  }

  /* Adjust add button styling */
  .add-button {
    padding: 0; /* Remove default padding */
    font-size: 1.2rem;
    font-weight: bold;
    border-radius: 50%;
    margin-left: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem; /* Set fixed width */
    height: 2rem; /* Set fixed height */
    line-height: 1; /* Adjust line-height for better centering */
    flex-shrink: 0; /* Prevent shrinking */
  }

  button:last-of-type {
     background-color: #6c757d;
  }

  button:hover {
    opacity: 0.9;
  }

  .add-project-form {
    display: flex;
    align-items: center;
    gap: 0.5rem; /* Add gap between elements */
  }

  .add-project-form input[type="text"] {
     flex-grow: 1; /* Allow input to take available space */
  }

  .add-project-form select {
      min-width: 150px; /* Adjust width as needed */
  }

  .current-project {
      font-weight: bold;
      margin-left: auto;
  }

  /* Styling for the checkbox group */
  .checkbox-group-container {
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: white;
    min-width: 150px; /* Match dropdown width */
    display: flex;
    flex-direction: column;
  }

  .checkbox-group-header {
    padding: 0.5rem;
    font-size: 0.9rem;
    color: #555;
    border-bottom: 1px solid #eee;
    background-color: #f8f8f8;
  }

  .checkbox-list {
    max-height: 100px; /* Make list scrollable */
    overflow-y: auto;
    padding: 0.5rem;
  }

  .checkbox-item {
    display: flex;
    align-items: center;
    margin-bottom: 0.3rem;
  }

  .checkbox-item label {
    margin-left: 0.5rem;
    cursor: pointer;
  }

  .checkbox-item input[type="checkbox"] {
    cursor: pointer;
  }
</style> 