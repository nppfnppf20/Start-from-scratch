<script lang="ts">
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/authStore';
  
  // Define all available tabs
  const allTabs = [
    { id: 'general', label: 'General Project Information', path: '/', roles: ['admin', 'surveyor'] },

    { id: 'fee-submission', label: 'Fee Quote Submission', path: '/fee-quote-submission', roles: ['surveyor'] },
    { id: 'quotes', label: 'Surveyor Quotes', path: '/quotes', roles: ['admin'] },
    { id: 'instructed', label: 'Instructed Surveyors', path: '/instructed', roles: ['admin'] },
    { id: 'programme', label: 'Programme', path: '/programme', roles: ['admin'] },
    { id: 'reviews', label: 'Surveyor Reviews', path: '/reviews', roles: ['admin'] },
  ];

  // Filter tabs based on user role
  $: tabs = allTabs.filter(tab => {
    const userRole = $authStore.user?.role;
    return userRole && tab.roles.includes(userRole);
  });
</script>

<div class="tabs">
  <nav class="navigation-menu">
    <ul class="navigation-menu-list">
      {#each tabs as tab}
        <li class="navigation-menu-item">
          <a
            href={tab.path}
            class="navigation-menu-link"
            class:active={$page.url.pathname === tab.path}
          >
            {tab.label}
          </a>
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
    margin: 0;
    padding: 0;
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
</style> 