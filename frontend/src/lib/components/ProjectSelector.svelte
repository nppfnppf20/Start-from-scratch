<script lang="ts">
  import { projects, selectedProject, addProject as addProjectToStore, selectProjectById } from '$lib/stores/projectStore';
  import { writable, get, derived } from 'svelte/store';
  import { browser } from '$app/environment';

  let showAddProjectInput = writable(false);
  let newProjectName = '';
  let selectedClient = '';
  let selectedTeamMembers: string[] = [];
  let isCollectionsOpen = writable(false);
  let selectedProjectId = '';
  let newTeamMemberInitial = ''; // For the new team member input

  $: if ($selectedProject) {
    selectedProjectId = $selectedProject.id;
  } else {
    selectedProjectId = '';
  }

  // This automatically creates a unique, sorted list of clients from your projects.
  const uniqueClients = derived(projects, $projects => {
    if (!$projects) return [];
    // Use a Set to get unique client names that are not null or empty
    // The type guard `(c): c is string` tells TypeScript that the filter ensures the result is a string.
    const clients = new Set($projects.map(p => p.client).filter((c): c is string => !!c));
    // Convert the Set to an array and sort it
    return Array.from(clients).sort((a, b) => a.localeCompare(b));
  });

  // --- DYNAMIC TEAM MEMBERS ---
  const allTeamMembers = writable<string[]>([]);

  // This derived store reads team members from projects and updates the writable store
  derived(projects, $projects => {
    if (!$projects || $projects.length === 0) return [];
    const fromProjects = new Set($projects.flatMap(p => p.teamMembers || []));
    return Array.from(fromProjects);
  }).subscribe(projectTeams => {
    allTeamMembers.update(currentTeams => {
        const combined = new Set([...currentTeams, ...projectTeams]);
        return Array.from(combined).sort();
    });
  });

  function addTeamMember() {
    const initial = newTeamMemberInitial.trim().toUpperCase();
    if (initial && initial.length > 0 && initial.length <= 3) {
        allTeamMembers.update(current => {
            const newSet = new Set(current);
            if (newSet.has(initial)) {
                alert(`Team member '${initial}' already exists.`);
                return Array.from(newSet).sort();
            }
            newSet.add(initial);
            return Array.from(newSet).sort();
        });
        newTeamMemberInitial = ''; // Clear input
    } else {
        alert('Please enter a valid initial (1-3 characters).');
    }
  }

  function toggleAddProjectForm() {
    showAddProjectInput.update(value => !value);
    if (get(showAddProjectInput)) {
        newProjectName = '';
        selectedClient = '';
        selectedTeamMembers = [];
    }
  }

  function toggleCollections() {
    isCollectionsOpen.update(value => !value);
  }

  function handleSelectionChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const projectId = target.value;
    if (projectId && projectId !== 'collections') {
        selectProjectById(projectId);
    } else if (projectId === 'collections') {
        toggleCollections();
        selectedProjectId = $selectedProject?.id ?? '';
    }
  }

  function groupProjects(groupBy: string) {
    isCollectionsOpen.set(false);
    console.log(`Group projects by: ${groupBy}`);
  }

  async function addNewProject() {
    const name = newProjectName.trim();
    if (name) {
      const projectData = {
        name: name,
        client: selectedClient || undefined,
        teamMembers: selectedTeamMembers.length > 0 ? selectedTeamMembers : undefined
      };

      console.log('Attempting to add project with data:', projectData);

      const addedProject = await addProjectToStore(projectData);

      if (addedProject) {
        newProjectName = '';
        selectedClient = '';
        selectedTeamMembers = [];
        showAddProjectInput.set(false);
        console.log('Project added successfully via store:', addedProject);
      } else {
        console.error('Failed to add project (error likely shown in alert from store).');
      }
    } else {
        alert('Please enter a project name.');
    }
  }

  function cancelAddProject() {
    newProjectName = '';
    selectedClient = '';
    selectedTeamMembers = [];
    showAddProjectInput.set(false);
  }
</script>

<div class="project-selector-container">
  {#if !$showAddProjectInput}
    <div class="selector-row">
      <div class="dropdown-container">
        <select
          aria-label="Select Project"
          bind:value={selectedProjectId}
          on:change={handleSelectionChange}
        >
          <option value="collections" disabled={$isCollectionsOpen}>Group By...</option>
          {#if $projects.length === 0 && browser}<option value="" disabled>Loading...</option>{:else if $projects.length === 0}<option value="" disabled>No projects</option>{/if}
          {#each $projects as project (project.id)}
            <option value={project.id}>{project.name}</option>
          {/each}
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
        required
        aria-label="New project name"
      />
      <input 
        type="text" 
        bind:value={selectedClient} 
        placeholder="Enter or select client" 
        aria-label="Client Name"
        list="client-list"
      />
      <datalist id="client-list">
        {#each $uniqueClients as client (client)}
          <option value={client}></option>
        {/each}
      </datalist>
      <div class="checkbox-group-container" aria-label="Select Team Members">
          <div class="checkbox-group-header">Team</div>
          <div class="checkbox-list">
            {#each $allTeamMembers as team (team)}
              <div class="checkbox-item">
                <input type="checkbox" id="team-{team}" bind:group={selectedTeamMembers} value={team} />
                <label for="team-{team}" title={team}>{team}</label>
              </div>
            {/each}
          </div>
          <div class="add-team-member-form">
            <input 
              type="text" 
              bind:value={newTeamMemberInitial} 
              placeholder="Add Initial"
              maxlength="3"
              aria-label="New team member initial"
            />
            <button on:click|preventDefault={addTeamMember} type="button" class="add-initial-btn">+</button>
          </div>
      </div>
      <button on:click={addNewProject}>Add</button>
      <button on:click={cancelAddProject}>Cancel</button>
    </div>
  {/if}

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

  select, input[type="text"] {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
    min-width: 200px;
  }

  select {
    border-radius: 10px;
    text-align: center;
  }

  select {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url('data:image/svg+xml;utf8,<svg fill="black" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>');
    background-repeat: no-repeat;
    background-position: right 0.5rem center;
    padding-right: 2rem;
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

  .add-button {
    padding: 0;
    font-size: 1.2rem;
    font-weight: bold;
    border-radius: 5px;
    margin-left: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    flex-shrink: 0;
    background-color: #038998 !important;
    padding-bottom: 3px;
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
    gap: 0.5rem;
    width: 100%;
  }

  .add-project-form input[type="text"] {
     flex-grow: 1;
  }

  .add-project-form select {
      min-width: 150px;
  }

  .current-project {
      font-size: 0.9rem;
      color: #4a5568;
      font-weight: 500;
      margin-left: auto;
      white-space: nowrap;
  }

  .checkbox-group-container {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 0.5rem;
    background-color: #fff;
    display: flex;
    flex-direction: column;
  }

  .checkbox-group-header {
    font-weight: bold;
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #eee;
    font-size: 0.9rem;
    color: #555;
  }

  .checkbox-list {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .checkbox-item label {
    cursor: pointer;
  }

  .checkbox-item input[type="checkbox"] {
    cursor: pointer;
  }

  .add-team-member-form {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid #eee;
  }

  .add-team-member-form input {
    flex-grow: 1;
    min-width: 50px;
    width: 80px;
  }

  .add-initial-btn {
    padding: 0;
    font-size: 1.2rem;
    font-weight: bold;
    border-radius: 50%;
    margin-left: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.8rem;
    height: 1.8rem;
    flex-shrink: 0;
  }

  select:disabled { background-color: #eee; cursor: not-allowed; }
  option[disabled] { color: #999; }
</style> 