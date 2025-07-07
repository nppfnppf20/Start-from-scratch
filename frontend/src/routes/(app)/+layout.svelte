<script lang="ts">
    import "../../app.css";
    import { selectedProject } from "$lib/stores/projectStore";
    import { authStore } from '$lib/stores/authStore';
    import { page } from '$app/stores';
    import { projects, addProject as addProjectToStore, selectProjectById, loadProjects } from '$lib/stores/projectStore';
    import { writable, get, derived } from 'svelte/store';
    import { browser } from '$app/environment';
    import { onMount } from 'svelte';

    // Load projects when the component mounts
    onMount(() => {
        loadProjects();
    });

    function handleLogout() {
        authStore.logout();
    }

    // Project selection logic
    let selectedProjectId = '';
    let showAddProjectInput = writable(false);
    let newProjectName = '';
    let selectedClient = '';
    let selectedTeamMembers: string[] = [];
    let isAddingProject = false;
    let newTeamMemberInitial = ''; // For adding new team member initials

    $: if ($selectedProject) {
        selectedProjectId = $selectedProject.id;
    } else {
        selectedProjectId = '';
    }

    // Create unique, sorted list of clients from existing projects
    const uniqueClients = derived(projects, $projects => {
        if (!$projects) return [];
        const clients = new Set($projects.map(p => p.client).filter((c): c is string => !!c));
        return Array.from(clients).sort((a, b) => a.localeCompare(b));
    });

    // Dynamic team members management
    const allTeamMembers = writable<string[]>([]);

    // Update team members from existing projects
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

    function handleProjectChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        const projectId = target.value;
        if (projectId) {
            selectProjectById(projectId);
        }
    }

    async function handleAddProject() {
        if (isAddingProject) return;
        
        isAddingProject = true;
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
                // Select the newly added project
                selectProjectById(addedProject.id);
                console.log('Project added successfully via store:', addedProject);
            } else {
                console.error('Failed to add project (error likely shown in alert from store).');
            }
        } else {
            alert('Please enter a project name.');
        }
        isAddingProject = false;
    }

    function toggleAddProjectForm() {
        showAddProjectInput.update(value => !value);
        if (get(showAddProjectInput)) {
            newProjectName = '';
            selectedClient = '';
            selectedTeamMembers = [];
        }
    }

    function cancelAddProject() {
        newProjectName = '';
        selectedClient = '';
        selectedTeamMembers = [];
        showAddProjectInput.set(false);
    }

    // Navigation tabs with role-based filtering
    const allTabs = [
        { id: 'general', label: 'General Project Information', path: '/', roles: ['admin', 'surveyor'] },
        { id: 'fee-submission', label: 'Fee Quote Submission', path: '/fee-quote-submission', roles: ['surveyor'] },
        { id: 'quotes', label: 'Surveyor Quotes', path: '/quotes', roles: ['admin'] },
        { id: 'instructed', label: 'Instructed Surveyors', path: '/instructed', roles: ['admin'] },
        { id: 'programme', label: 'Programme', path: '/programme', roles: ['admin'] },
        { id: 'reviews', label: 'Surveyor Reviews', path: '/reviews', roles: ['admin'] },
    ];

    $: tabs = allTabs.filter(tab => {
        const userRole = $authStore.user?.role;
        return userRole && tab.roles.includes(userRole);
    });
</script>

<div class="app">
    <!-- Header -->
    <div class="header">
        <h1>TRP Project Management</h1>
        <div class="header-right">
            {#if $authStore.user}
                <a href="#" class="user-link">{$authStore.user.email}</a>
                <a href="#" class="role-badge">{$authStore.user.role?.toUpperCase()}</a>
                <button class="logout-btn" on:click={handleLogout}>Logout</button>
            {/if}
        </div>
    </div>

    <!-- Project Header -->
    <div class="project-header">
        <div class="project-selector">
            <select bind:value={selectedProjectId} on:change={handleProjectChange}>
                <option value="">Select a project...</option>
                {#if $projects.length === 0 && browser}
                    <option value="" disabled>Loading...</option>
                {:else if $projects.length === 0}
                    <option value="" disabled>No projects</option>
                {/if}
                {#each $projects as project (project.id)}
                    <option value={project.id}>{project.name}</option>
                {/each}
            </select>
            
            <div class="checkbox-container">
                {#if !$showAddProjectInput}
                    <input type="checkbox" id="add-project" class="checkbox" on:change={toggleAddProjectForm}>
                    <label for="add-project" class="checkbox-label">
                        <div class="checkbox-wrapper">
                            <div class="checkbox-flip">
                                <div class="checkbox-front">
                                    <svg width="24" height="24" viewBox="0 0 24 24">
                                        <path class="icon-path" d="M12 5v14M5 12h14"/>
                                    </svg>
                                </div>
                                <div class="checkbox-back">
                                    <svg width="24" height="24" viewBox="0 0 24 24">
                                        <path class="icon-path" d="m9 12 2 2 4-4"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </label>
                {:else}
                    <div class="add-project-form">
                        <div class="form-row">
                            <input 
                                type="text" 
                                bind:value={newProjectName} 
                                placeholder="Enter project name"
                                required
                            />
                        </div>
                        
                        <div class="form-row">
                            <input 
                                type="text" 
                                bind:value={selectedClient} 
                                placeholder="Enter or select client" 
                                list="client-list"
                            />
                            <datalist id="client-list">
                                {#each $uniqueClients as client (client)}
                                    <option value={client}></option>
                                {/each}
                            </datalist>
                        </div>
                        
                        <div class="form-row">
                            <div class="team-section">
                                <div class="team-header">Team Members:</div>
                                <div class="team-checkboxes">
                                    {#each $allTeamMembers as team (team)}
                                        <label class="team-checkbox">
                                            <input type="checkbox" bind:group={selectedTeamMembers} value={team} />
                                            <span>{team}</span>
                                        </label>
                                    {/each}
                                </div>
                                <div class="add-team-member">
                                    <input 
                                        type="text" 
                                        bind:value={newTeamMemberInitial} 
                                        placeholder="Add initials (1-3 chars)"
                                        maxlength="3"
                                    />
                                    <button type="button" on:click={addTeamMember} class="add-initial-btn">+</button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button on:click={handleAddProject} disabled={isAddingProject || !newProjectName.trim()}>
                                {isAddingProject ? '...' : 'Add Project'}
                            </button>
                            <button type="button" on:click={cancelAddProject}>Cancel</button>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
        
        {#if $selectedProject}
            <div class="current-project">Current Project: {$selectedProject.name}</div>
        {:else}
            <div class="current-project">No project selected</div>
        {/if}
    </div>

    <!-- Navigation Tabs -->
    <div class="tabs">
        <nav class="navigation-menu">
            <div class="navigation-menu-list">
                {#each tabs as tab}
                    <div class="navigation-menu-item">
                        <a 
                            href={tab.path} 
                            class="navigation-menu-link"
                            class:active={$page.url.pathname === tab.path}
                        >
                            {tab.label}
                        </a>
                    </div>
                {/each}
            </div>
        </nav>
    </div>

    <!-- Main Content -->
    <main>
        {#if $selectedProject}
            <slot />
        {:else}
            <div class="no-project-selected">
                <h2>No Project Selected</h2>
                <p>Please select a project from the dropdown above to continue.</p>
            </div>
        {/if}
    </main>
</div>

<style>
    .app {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    .header {
        background: var(--card);
        padding: 12px 20px;
        border-bottom: 1px solid var(--border);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .header h1 {
        font-size: 18px;
        font-weight: 600;
        color: var(--foreground);
        margin: 0;
    }

    .header-right {
        display: flex;
        align-items: center;
        gap: 15px;
    }

    .user-link,
    .role-badge {
        color: var(--muted-foreground);
        text-decoration: none;
        font-size: 14px;
    }

    .role-badge {
        font-weight: 600;
        text-transform: uppercase;
    }

    .logout-btn {
        background: var(--destructive);
        color: var(--primary-foreground) !important;
        padding: 6px 12px;
        border-radius: var(--radius);
        font-size: 12px;
        border: none;
        cursor: pointer;
    }

    .project-header {
        background: var(--card);
        padding: 15px 20px;
        border-bottom: 1px solid var(--border);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .project-selector {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .project-selector select {
        padding: 8px 12px;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: var(--background);
        color: var(--foreground);
        min-width: 200px;
    }

    .current-project {
        font-size: 14px;
        color: var(--muted-foreground);
        font-style: italic;
    }

    /* Animated flip checkbox styles */
    .checkbox-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        margin: 0;
    }

    .checkbox {
        display: none;
    }

    .checkbox-label {
        position: relative;
        display: inline-flex;
        align-items: center;
        cursor: pointer;
    }

    .checkbox-flip {
        width: 44px;
        height: 44px;
        perspective: 1000px;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        transition: transform 0.4s ease;
    }

    .checkbox-front,
    .checkbox-back {
        width: 100%;
        height: 100%;
        position: absolute;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: var(--radius);
        backface-visibility: hidden;
        transition: transform 0.3s ease;
    }

    .checkbox-front {
        background: var(--primary);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transform: rotateY(0deg);
    }

    .checkbox-back {
        background: var(--primary);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transform: rotateY(180deg);
    }

    .checkbox-wrapper:hover .checkbox-flip {
        transform: scale(1.1);
        transition: transform 0.4s ease-out;
    }

    .checkbox:checked + .checkbox-label .checkbox-front {
        transform: rotateY(180deg);
    }

    .checkbox:checked + .checkbox-label .checkbox-back {
        transform: rotateY(0deg);
    }

    .checkbox:focus + .checkbox-label .checkbox-flip {
        box-shadow: 0 0 15px var(--ring), 0 0 20px var(--ring);
        transition: box-shadow 0.3s ease;
    }

    .icon-path {
        stroke: white;
        stroke-width: 2;
        fill: transparent;
    }

    .add-project-form {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 15px;
        background: var(--background);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .form-row {
        display: flex;
        gap: 10px;
        align-items: center;
    }

    .form-row input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: var(--input-background);
        color: var(--foreground);
        font-size: 14px;
    }

    .form-row input[type="text"] {
        min-width: 200px;
    }

    .form-row input[type="number"] {
        width: 100px;
    }

    .form-row input:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 2px var(--primary), 0 0 0 4px var(--primary);
    }

    .team-section {
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 10px;
        margin-top: 10px;
        background: var(--input-background);
    }

    .team-header {
        font-size: 14px;
        font-weight: 600;
        color: var(--foreground);
        margin-bottom: 8px;
        padding-bottom: 5px;
        border-bottom: 1px solid var(--border);
    }

    .team-checkboxes {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 10px;
    }

    .team-checkbox {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 13px;
        color: var(--foreground);
    }

    .team-checkbox input[type="checkbox"] {
        width: 16px;
        height: 16px;
        accent-color: var(--primary);
    }

    .add-team-member {
        display: flex;
        gap: 8px;
        align-items: center;
    }

    .add-team-member input {
        flex: 1;
        padding: 6px 8px;
        font-size: 12px;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: var(--input-background);
        color: var(--foreground);
    }

    .add-team-member input:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 2px var(--primary), 0 0 0 4px var(--primary);
    }

    .add-initial-btn {
        background: var(--primary);
        color: var(--primary-foreground);
        border: none;
        border-radius: var(--radius);
        padding: 6px 10px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s ease;
    }

    .add-initial-btn:hover {
        background: var(--primary-hover);
    }

    .add-initial-btn:focus {
        outline: none;
        box-shadow: 0 0 0 2px var(--primary), 0 0 0 4px var(--primary);
    }

    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    }

    .form-actions button {
        padding: 8px 16px;
        font-size: 14px;
        border-radius: var(--radius);
        border: none;
        cursor: pointer;
        transition: background 0.2s ease;
    }

    .form-actions button:first-child {
        background: var(--primary);
        color: var(--primary-foreground);
    }

    .form-actions button:first-child:hover {
        background: var(--primary-hover);
    }

    .form-actions button:last-child {
        background: var(--destructive);
        color: var(--primary-foreground);
    }

    .form-actions button:last-child:hover {
        background: var(--destructive-hover);
    }

    .tabs {
        background: var(--card);
        padding: 16px 0;
        border-bottom: 1px solid var(--border);
        overflow-x: auto;
        overflow-y: hidden;
        width: 100%;
        scrollbar-width: thin;
        scrollbar-color: var(--muted) transparent;
    }

    .tabs::-webkit-scrollbar {
        height: 4px;
    }

    .tabs::-webkit-scrollbar-track {
        background: transparent;
    }

    .tabs::-webkit-scrollbar-thumb {
        background: var(--muted);
        border-radius: 2px;
    }

    .tabs::-webkit-scrollbar-thumb:hover {
        background: var(--muted-foreground);
    }

    .navigation-menu {
        position: relative;
        z-index: 10;
        display: flex;
        padding: 0 20px;
        min-width: max-content;
    }

    .navigation-menu-list {
        display: flex;
        list-style: none;
        gap: 4px;
        min-width: max-content;
    }

    .navigation-menu-item {
        position: relative;
        flex-shrink: 0;
    }

    .navigation-menu-link {
        display: inline-flex;
        height: 40px;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius);
        background: transparent;
        padding: 8px 16px;
        font-size: 14px;
        font-weight: 500;
        color: var(--foreground);
        border: none;
        cursor: pointer;
        transition: all 0.15s ease-in-out;
        text-decoration: none;
        white-space: nowrap;
    }

    .navigation-menu-link:hover {
        background: var(--accent);
        color: var(--accent-foreground);
    }

    .navigation-menu-link:focus {
        outline: none;
        background: var(--accent);
        color: var(--accent-foreground);
    }

    .navigation-menu-link.active {
        background: #e5e7eb;
        color: var(--foreground);
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }

    main {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 1rem;
        width: 100%;
        box-sizing: border-box;
        overflow-y: auto;
        background-color: var(--background);
    }

    .no-project-selected {
        text-align: center;
        margin: 2rem auto;
        padding: 2rem;
        background-color: var(--card);
        border-radius: var(--radius);
        border: 1px solid var(--border);
    }

    @media (max-width: 768px) {
        .header {
            padding: 8px 16px;
        }

        .header h1 {
            font-size: 16px;
        }

        .header-right {
            gap: 10px;
        }

        .project-header {
            padding: 12px 16px;
            flex-direction: column;
            gap: 12px;
        }

        .project-selector {
            width: 100%;
            justify-content: space-between;
        }

        .navigation-menu {
            padding: 0 16px;
        }

        .navigation-menu-link {
            padding: 8px 12px;
            font-size: 12px;
        }

        main {
            padding: 0.5rem;
        }
    }
</style> 