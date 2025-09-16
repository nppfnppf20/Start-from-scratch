<script lang="ts">
    console.log("🔥 APP LAYOUT LOADED WITH NEW CODE");
    import "../../app.css";
    import TopBar from "$lib/components/TopBar.svelte";
    import ProjectSelector from "$lib/components/ProjectSelector.svelte";
    import TabNav from "$lib/components/TabNav.svelte";
    import { selectedProject, loadProjects } from "$lib/stores/projectStore";
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { browser } from '$app/environment';

    onMount(async () => {
      if (browser) {
        console.log('=== APP LAYOUT ONMOUNT ===');
        console.log('✅ App layout: Loading projects');
        loadProjects();
      }
    });
  </script>
  
  <!-- Show the app layout (auth handled by +layout.ts) -->
  <div class="app">
    <TopBar />
    <header>
      <ProjectSelector />
      <TabNav />
    </header>
    <main>
      {#if $selectedProject || $page.url.pathname.startsWith('/fee-quote-submission') || $page.url.pathname.startsWith('/login') || $page.url.pathname.startsWith('/callback')}
        <slot />
      {:else}
        <div class="no-project-selected">
          <h2>No Project Selected</h2>
          <p>General project information is hidden until you select a project from the dropdown above.</p>
        </div>
      {/if}
    </main>
    <footer>
      <p>Projects Overview Dashboard</p>
    </footer>
  </div>
  
  <style>
    .app {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
  
    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 1rem;
      width: 100%;
      box-sizing: border-box;
      overflow-y: auto;
      background-color: var(--background-color);
      position: relative;
    }
  
    header {
      width: 100%;
      overflow: visible;
      position: relative;
    }
  
    footer {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 12px;
      background-color: #f0f0f0;
      border-top: 1px solid #ccc;
      margin-top: 2rem;
    }
  
    .no-project-selected {
      text-align: center;
      margin: 2rem auto;
      padding: 2rem;
      background-color: #f8f9fa;
      border-radius: 0.5rem;
      border: 1px solid #dee2e6;
    }
  
    /* Loading styles */
    .loading-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f8f9fa;
    }
  
    .loading-spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }
  
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  
    @media (min-width: 480px) {
      footer {
        padding: 12px 0;
      }
    }
  </style>