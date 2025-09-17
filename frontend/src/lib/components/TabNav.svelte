<script lang="ts">
  import { page } from '$app/stores';
  import { auth0Store } from '$lib/stores/auth0Store';
  import { goto } from '$app/navigation';
  import { getUserRole, userRole } from '$lib/utils/auth';
  
  // Define all available tabs
  const allTabs = [
    { id: 'general', label: 'General Project Information', path: '/', roles: ['admin', 'surveyor', 'client'] },
    { id: 'surveyor-briefings', label: 'Surveyor Briefings', path: '/surveyor-briefings', roles: ['admin'] },
    { id: 'fee-submission', label: 'Fee Quote Submission', path: '/fee-quote-submission', roles: ['surveyor'] },
    { id: 'quotes', label: 'Surveyor Quotes', path: '/quotes', roles: ['admin', 'client'] },
    { id: 'instructed', label: 'Instructed Surveyors', path: '/instructed', roles: ['admin', 'client'] },
    { id: 'programme', label: 'Programme', path: '/programme', roles: ['admin', 'client'] },
    { id: 'file-upload', label: 'File Upload (Beta)', path: '/file-upload', roles: ['admin', 'client', 'surveyor'] },
    { id: 'reviews', label: 'Surveyor Reviews', path: '/reviews', roles: ['admin'] },
    { 
      id: 'admin', 
      label: 'Admin (all projects)', 
      roles: ['admin'],
      dropdown: [
        { id: 'surveyors', label: 'Surveyors', path: '/admin-console/surveyors' },
        { id: 'clients', label: 'Clients', path: '/admin-console/clients' },
        { id: 'projects', label: 'Projects', path: '/admin-console/projects' }
      ]
    }
  ];


  // Filter tabs based on user role
  $: tabs = allTabs.filter(tab => {
    if (!$auth0Store.isAuthenticated) return false;
    
    // Trigger role fetch if user is authenticated
    if ($auth0Store.user) {
      getUserRole($auth0Store.user);
    }
    
    // Use reactive role store for filtering
    return $userRole && tab.roles.includes($userRole);
  });

  // Dropdown state
  let openDropdownId: string | null = null;

  // Toggle dropdown
  function toggleDropdown(tabId: string, event: MouseEvent) {
    if (openDropdownId === tabId) {
      openDropdownId = null;
    } else {
      openDropdownId = tabId;
      // No need to calculate position since we're using absolute positioning
      // The dropdown will position itself relative to the parent menu item
    }
  }

  // Close dropdown when clicking outside
  function closeDropdowns() {
    openDropdownId = null;
  }

  // Handle dropdown navigation
  function handleDropdownNavigation(path: string) {
    closeDropdowns();
    goto(path);
  }

  // Check if tab or its dropdown items are active
  function isTabActive(tab: any): boolean {
    if (tab.path && $page.url.pathname === tab.path) {
      return true;
    }
    if (tab.dropdown) {
      return tab.dropdown.some((item: any) => $page.url.pathname === item.path);
    }
    return false;
  }
</script>

<div class="tabs" on:click={closeDropdowns}>
  <nav class="navigation-menu">
    <ul class="navigation-menu-list">
      {#each tabs as tab}
        <li class="navigation-menu-item">
          {#if tab.dropdown}
            <!-- Dropdown tab -->
            <button
              class="navigation-menu-link dropdown-trigger"
              class:active={isTabActive(tab)}
              on:click|stopPropagation={(event) => toggleDropdown(tab.id, event)}
            >
              {tab.label}
              <svg 
                class="dropdown-arrow" 
                class:open={openDropdownId === tab.id}
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2" 
                stroke-linecap="round" 
                stroke-linejoin="round"
              >
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </button>
            
            {#if openDropdownId === tab.id}
              <div class="dropdown-menu" on:click|stopPropagation>
                {#each tab.dropdown as item}
                  <button
                    class="dropdown-item"
                    class:active={$page.url.pathname === item.path}
                    on:click={() => handleDropdownNavigation(item.path)}
                  >
                    {item.label}
                  </button>
                {/each}
              </div>
            {/if}
          {:else}
            <!-- Regular tab -->
            <a
              href={tab.path}
              class="navigation-menu-link"
              class:active={$page.url.pathname === tab.path}
            >
              {tab.label}
            </a>
          {/if}
        </li>
      {/each}
    </ul>
  </nav>
</div>

<style>
  /* CSS */
  .tabs {
    background: var(--card);
    padding: 16px 0;
    border-bottom: 1px solid var(--border);
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
    display: flex;
    padding: 0 20px;
    min-width: max-content;
    overflow: visible;
  }

  .navigation-menu-list {
    display: flex;
    list-style: none;
    gap: 4px;
    flex-wrap: wrap;
    margin: 0;
    padding: 0;
    overflow: visible;
  }

  .navigation-menu-item {
    position: relative;
    overflow: visible;
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
    background: var(--background);
    color: var(--foreground);
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    background-color: #e0eaff; /* Light blue shading for active link */
    border-radius: 20px; /* Pill shape */
  }

  .navigation-menu-link:disabled {
    pointer-events: none;
    opacity: 0.5;
  }

  /* Dropdown styles */
  .dropdown-trigger {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .dropdown-arrow {
    transition: transform 0.2s ease-in-out;
    margin-left: 4px;
  }

  .dropdown-arrow.open {
    transform: rotate(180deg);
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 1000;
    min-width: 180px;
    background: var(--card, white);
    border: 1px solid var(--border, #e2e8f0);
    border-radius: var(--radius, 6px);
    box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15);
    padding: 4px;
    margin-top: 4px;
  }

  .dropdown-item {
    display: block;
    width: 100%;
    padding: 8px 12px;
    font-size: 14px;
    font-weight: 500;
    color: var(--foreground, #1a202c);
    text-decoration: none;
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    border-radius: calc(var(--radius, 6px) - 2px);
    transition: all 0.15s ease-in-out;
    white-space: nowrap;
  }

  .dropdown-item:hover {
    background: var(--accent, #f7fafc);
    color: var(--accent-foreground, #1a202c);
  }

  .dropdown-item.active {
    background: #e0eaff;
    color: var(--foreground, #1a202c);
  }
</style> 