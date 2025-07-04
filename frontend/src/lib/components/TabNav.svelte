<script lang="ts">
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/authStore';
  
  // Define all available tabs
  const allTabs = [
    { id: 'general', label: 'General Project Information', path: '/', roles: ['admin', 'surveyor'] },
    { id: 'documents', label: 'Relevant Documents', path: '/documents', roles: ['admin', 'surveyor'] },
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

<nav class="tab-navigation">
  <ul>
    {#each tabs as tab}
      <li class:active={$page.url.pathname === tab.path}>
        <a href={tab.path}>{tab.label}</a>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .tab-navigation {
    background-color: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    margin-bottom: 1rem;
  }

  ul {
    display: flex;
    list-style-type: none;
    margin: 0;
    padding: 0;
    gap: 0.25rem;
  }

  li {
    padding: 0;
  }

  a {
    display: flex;
    align-items: center;
    min-height: 4em;
    padding: 0.75rem 1.25rem;
    text-decoration: none;
    color: #495057;
    border-bottom: 3px solid transparent;
    transition: all 0.2s ease;
    box-sizing: border-box;
  }

  a:hover {
    color: #212529;
    border-bottom: 3px solid #ced4da;
  }

  li.active a {
    color: #007bff;
    border-bottom: 3px solid #007bff;
    font-weight: 500;
  }
</style> 